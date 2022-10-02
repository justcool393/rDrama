from copy import copy
from files.helpers.roulette import format_roulette_bet_feed_item
from .builders import CasinoBuilders
from .enums import CasinoActions, CasinoGames
from .helpers import grab
from .selectors import CasinoSelectors


class CasinoHandlers():
    @staticmethod
    def get_handler_for_action(action):
        return {
            CasinoActions.USER_CONNECTED: CasinoHandlers.handle_user_connected,
            CasinoActions.USER_DISCONNECTED: CasinoHandlers.handle_user_disconnected,
            CasinoActions.USER_SENT_MESSAGE: CasinoHandlers.handle_user_sent_message,
            CasinoActions.USER_DELETED_MESSAGE: CasinoHandlers.handle_user_deleted_message,
            CasinoActions.USER_STARTED_GAME: CasinoHandlers.handle_user_started_game,
            CasinoActions.USER_PULLED_SLOTS: CasinoHandlers.handle_user_pulled_slots,
            CasinoActions.USER_PLAYED_ROULETTE: CasinoHandlers.handle_user_played_roulette,
        }[action] or None

    # == "Private"
    @staticmethod
    def _handle_user_conversed(next_state, payload):
        user_id = payload['user_id']
        recipient = payload['recipient']
        text = payload['text']
        message = CasinoBuilders.build_message_entity(user_id, text)
        conversation_key = CasinoBuilders.build_conversation_key(
            user_id, recipient)
        conversation = CasinoSelectors.select_conversation(
            next_state, conversation_key)

        if not conversation:
            conversation = CasinoBuilders.build_conversation_entity(
                conversation_key, user_id, recipient)
            next_state['conversations']['all'].append(conversation['id'])
            next_state['conversations']['by_id'][conversation['id']
                                                 ] = conversation

        grab(conversation, 'messages/all').append(message['id'])
        grab(conversation, 'messages/by_id')[message['id']] = message

        return next_state

    @staticmethod
    def _handle_feed_updated(next_state, payload):
        feed = payload['feed']
        feed_id = feed['id']
        grab(next_state, 'feed/all').append(feed_id)
        grab(next_state, 'feed/by_id')[feed_id] = feed

        return next_state

    @staticmethod
    def _handle_user_session_updated(next_state, payload):
        game = payload['game']
        session = payload['session']

        # Update the main session entities.
        all_sessions = grab(next_state, 'sessions/all')
        session_id = session['id']

        if not session_id in all_sessions:
            all_sessions.append(session_id)

        grab(next_state, 'sessions/by_id')[session_id] = session

        # Update the game to show the user is playing.
        game_sessions = grab(
            next_state, f'games/by_id/{game}/session_ids')
        if not session_id in game_sessions:
            game_sessions.append(session_id)

        return next_state

    # == "Public"
    @staticmethod
    def handle_user_connected(next_state, payload):
        user_id = payload['user_id']
        request_id = payload['request_id']
        existing_user = CasinoSelectors.select_user(next_state, user_id)

        if existing_user:
            existing_user['request_id'] = request_id
            existing_user['online'] = True
        else:
            user = CasinoBuilders.build_user_entity(user_id, request_id)
            grab(next_state, 'users/all').append(user_id)
            grab(next_state, 'users/by_id')[user_id] = user

        return next_state

    @staticmethod
    def handle_user_disconnected(next_state, payload):
        user_id = payload['user_id']
        user = grab(next_state, 'users/by_id').get(user_id)

        if user:
            user['online'] = False

            for game in CasinoSelectors.select_available_games(next_state):
                users_in_game = grab(
                    next_state, f'games/by_id/{game}/user_ids')

                if user_id in users_in_game:
                    users_in_game.remove(user_id)

        return next_state

    @staticmethod
    def handle_user_sent_message(next_state, payload):
        recipient = payload['recipient']

        if recipient:
            # Direct Message
            return CasinoHandlers._handle_user_conversed(next_state, payload)
        else:
            user_id = payload['user_id']
            text = payload['text']
            message = CasinoBuilders.build_message_entity(user_id, text)
            grab(next_state, 'messages/all').append(message['id'])
            grab(next_state, 'messages/by_id')[message['id']] = message

        return next_state

    @staticmethod
    def handle_user_deleted_message(next_state, payload):
        message_id = payload['message_id']

        try:
            grab(next_state, 'messages/all').remove(message_id)
            del grab(next_state, 'messages/by_id')[message_id]
        except:
            pass  # The message did not exist.

        return next_state

    @staticmethod
    def handle_user_started_game(next_state, payload):
        user_id = payload['user_id']
        game = payload['game']
        existing_user_in_game = CasinoSelectors.select_user_in_game(
            next_state, game, user_id)

        if not existing_user_in_game:
            grab(next_state, f'games/by_id/{game}/user_ids').append(user_id)

        remaining_games = list(copy(grab(next_state, 'games/all')))
        remaining_games.remove(game)

        for remaining_game in remaining_games:
            users_in_game = CasinoSelectors.select_users_in_game(
                next_state, remaining_game)

            if user_id in users_in_game:
                users_in_game.remove(user_id)

        return next_state

    @staticmethod
    def handle_user_pulled_slots(next_state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']

        # Feed
        feed = CasinoBuilders.build_feed_entity(user_id, game_state['text'])
        feed_update_payload = {'feed': feed}
        next_state = CasinoHandlers._handle_feed_updated(
            next_state, feed_update_payload)

        # Session
        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Slots, game_state)
        session_update_payload = {
            'game': CasinoGames.Slots,
            'session': session
        }
        next_state = CasinoHandlers._handle_user_session_updated(
            next_state, session_update_payload)

        return next_state

    @staticmethod
    def handle_user_played_roulette(next_state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']
        placed_bet = payload['placed_bet']

        grab(next_state,
             f'games/by_id/{CasinoGames.Roulette}')['state'] = game_state

        # Feed
        bet = placed_bet['bet']
        which = placed_bet['which']
        currency = placed_bet['currency']
        wager = placed_bet['wager']
        user = CasinoSelectors.select_user(next_state, user_id)
        username = grab(user, 'account/username')
        text = format_roulette_bet_feed_item(
            username=username,
            bet=bet,
            which=which,
            currency=currency,
            amount=wager
        )
        feed = CasinoBuilders.build_feed_entity(user_id, text)
        feed_update_payload = {'feed': feed}
        next_state = CasinoHandlers._handle_feed_updated(
            next_state, feed_update_payload)

        # Session
        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Roulette, None)
        session_update_payload = {
            'game': CasinoGames.Roulette,
            'session': session
        }
        next_state = CasinoHandlers._handle_user_session_updated(
            next_state, session_update_payload)

        return next_state
