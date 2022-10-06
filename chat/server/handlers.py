from copy import copy
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
            CasinoActions.USER_CONVERSED: CasinoHandlers.handle_user_conversed,
            CasinoActions.USER_STARTED_GAME: CasinoHandlers.handle_user_started_game,
            CasinoActions.USER_PLAYED_SLOTS: CasinoHandlers.handle_user_played_slots,
            CasinoActions.USER_PLAYED_ROULETTE: CasinoHandlers.handle_user_played_roulette,
            CasinoActions.USER_PLAYED_BLACKJACK: CasinoHandlers.handle_user_played_blackjack,
            CasinoActions.USER_PLAYED_RACING: CasinoHandlers.handle_user_played_racing,
            CasinoActions.RACING_STATE_INITIALIZED: CasinoHandlers.handle_racing_state_initialized,
        }[action] or None

    # == "Private"
    @staticmethod
    def _handle_feed_updated(state, payload):
        user_id = payload['user_id']
        text = payload['text']
        feed = CasinoBuilders.build_feed_entity(user_id, text)
        feed_id = feed['id']

        CasinoSelectors.select_feed_ids(state).append(feed_id)
        CasinoSelectors.select_feed_lookup(state)[feed_id] = feed

        return state

    @staticmethod
    def _handle_user_session_updated(state, payload):
        game = payload['game']
        session = payload['session']
        session_id = session['id']

        all_sessions = CasinoSelectors.select_session_ids(state)

        if not session_id in all_sessions:
            all_sessions.append(session_id)

        CasinoSelectors.select_session_lookup(state)[session_id] = session

        game_sessions = CasinoSelectors.select_game_sessions(state, game)

        if not session_id in game_sessions:
            game_sessions.append(session_id)

        return state

    # == "Public"
    @staticmethod
    def handle_user_connected(state, payload):
        user_id = payload['user_id']
        request_id = payload['request_id']
        existing_user = CasinoSelectors.select_user(state, user_id)

        if existing_user:
            existing_user['request_id'] = request_id
            existing_user['online'] = True
            user = existing_user
        else:
            all_user_ids = CasinoSelectors.select_user_ids(state)

            if not user_id in all_user_ids:
                all_user_ids.append(user_id)

            user = CasinoBuilders.build_user_entity(user_id, request_id)
            CasinoSelectors.select_user_lookup(state)[user_id] = user

        username = grab(user, 'account/username')
        feed_update_payload = {'user_id': user_id,
                               'text': f'{username} has entered the casino.'}
        state = CasinoHandlers._handle_feed_updated(
            state, feed_update_payload)

        return state

    @staticmethod
    def handle_user_disconnected(state, payload):
        user_id = payload['user_id']
        user = CasinoSelectors.select_user(state, user_id)

        if user:
            user['online'] = False

            for game in CasinoSelectors.select_game_names(state):
                users_in_game = CasinoSelectors.select_game_users(state, game)

                if user_id in users_in_game:
                    users_in_game.remove(user_id)

        return state

    @staticmethod
    def handle_user_sent_message(state, payload):
        user_id = payload['user_id']
        text = payload['text']
        message = CasinoBuilders.build_message_entity(user_id, text)
        message_id = message['id']

        CasinoSelectors.select_message_ids(state).append(message_id)
        CasinoSelectors.select_message_lookup(state)[message_id] = message

        return state

    @staticmethod
    def handle_user_deleted_message(state, payload):
        message_id = payload['message_id']
        all_messages = CasinoSelectors.select_message_ids(state)
        message_lookup = CasinoSelectors.select_message_lookup(state)

        if message_id in all_messages:
            all_messages.remove(message_id)

        if message_lookup.get(message_id):
            del message_lookup[message_id]

        return state

    @staticmethod
    def handle_user_conversed(state, payload):
        user_id = payload['user_id']
        recipient = payload['recipient']
        text = payload['text']
        conversation_key = CasinoBuilders.build_conversation_key(
            user_id, recipient)
        conversation = CasinoSelectors.select_conversation(
            state, conversation_key)

        if not conversation:
            conversation = CasinoBuilders.build_conversation_entity(
                conversation_key,
                user_id,
                recipient
            )
            conversation_key = conversation['id']
            CasinoSelectors.select_conversation_keys(
                state).append(conversation_key)
            CasinoSelectors.select_conversation_lookup(
                state)[conversation_key] = conversation

        message = CasinoBuilders.build_message_entity(user_id, text)
        message_id = message['id']
        CasinoSelectors.select_conversation_message_ids(
            state, conversation_key).append(message_id)
        CasinoSelectors.select_conversation_message_lookup(
            state, conversation_key)[message_id] = message

        return state

    @staticmethod
    def handle_user_started_game(state, payload):
        user_id = payload['user_id']
        game = payload['game']
        users_in_game = CasinoSelectors.select_game_users(state, game)

        if not user_id in users_in_game:
            users_in_game.append(user_id)

        remaining_games = list(copy(CasinoSelectors.select_game_names(state)))
        remaining_games.remove(game)

        for remaining_game in remaining_games:
            users_in_game = CasinoSelectors.select_game_users(
                state, remaining_game)

            if user_id in users_in_game:
                users_in_game.remove(user_id)

        username = CasinoSelectors.select_user_username(state, user_id)
        feed_update_payload = {'user_id': user_id,
                               'text': f'{username} started playing {game}.'}
        state = CasinoHandlers._handle_feed_updated(
            state, feed_update_payload)

        return state

    @staticmethod
    def handle_user_played_slots(state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']

        # Feed
        feed_update_payload = {'user_id': user_id, 'text': game_state['text']}
        state = CasinoHandlers._handle_feed_updated(
            state, feed_update_payload)

        # Session
        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Slots, game_state)
        session_update_payload = {
            'game': CasinoGames.Slots,
            'session': session
        }
        state = CasinoHandlers._handle_user_session_updated(
            state, session_update_payload)

        return state

    @staticmethod
    def handle_user_played_roulette(state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']
        placed_bet = payload['placed_bet']

        CasinoSelectors.select_game(state, CasinoGames.Roulette)[
            'state'] = game_state

        # Feed
        bet = placed_bet['bet']
        which = placed_bet['which']
        currency = placed_bet['currency']
        wager = placed_bet['wager']
        text = CasinoSelectors.select_roulette_bet_feed_item(
            state,
            user_id,
            bet,
            which,
            currency,
            wager
        )
        feed_update_payload = {'user_id': user_id, 'text': text}
        state = CasinoHandlers._handle_feed_updated(state, feed_update_payload)

        # Session
        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Roulette, None)
        session_update_payload = {
            'game': CasinoGames.Roulette,
            'session': session
        }
        state = CasinoHandlers._handle_user_session_updated(
            state, session_update_payload)

        return state

    @staticmethod
    def handle_user_played_blackjack(state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']

        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Blackjack, game_state)
        session_update_payload = {
            'game': CasinoGames.Blackjack,
            'session': session
        }
        state = CasinoHandlers._handle_user_session_updated(
            state, session_update_payload)

        return state

    @staticmethod
    def handle_user_played_racing(state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']
        placed_bet = payload['placed_bet']

        CasinoSelectors.select_game(state, CasinoGames.Racing)[
            'state'] = game_state

        # Feed
        kind = placed_bet['kind']
        selection = placed_bet['selection']
        currency = placed_bet['currency']
        wager = placed_bet['wager']
        text = CasinoSelectors.select_racing_bet_feed_item(
            state,
            user_id,
            kind,
            selection,
            currency,
            wager
        )
        feed_update_payload = {'user_id': user_id, 'text': text}
        state = CasinoHandlers._handle_feed_updated(state, feed_update_payload)

        # Session
        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Racing, None)
        session_update_payload = {
            'game': CasinoGames.Racing,
            'session': session
        }
        state = CasinoHandlers._handle_user_session_updated(
            state, session_update_payload)

        return state

    @staticmethod
    def handle_racing_state_initialized(state, payload):
        game_state = payload['game_state']

        CasinoSelectors.select_game(state, CasinoGames.Racing)[
            'state'] = game_state

        return state
