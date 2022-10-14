from copy import copy
from .builders import CasinoBuilders
from .enums import CasinoActions, CasinoGames
from .helpers import now
from .selectors import CasinoSelectors


class CasinoHandlers():
    @staticmethod
    def get_handler_for_action(action):
        return {
            CasinoActions.FEED_ADDED: CasinoHandlers.handle_feed_added,
            CasinoActions.USER_CONNECTED: CasinoHandlers.handle_user_connected,
            CasinoActions.USER_DISCONNECTED: CasinoHandlers.handle_user_disconnected,
            CasinoActions.USER_SENT_MESSAGE: CasinoHandlers.handle_user_sent_message,
            CasinoActions.USER_REACTED_TO_MESSAGE: CasinoHandlers.handle_user_reacted_to_message,
            CasinoActions.USER_EDITED_MESSAGE: CasinoHandlers.handle_user_edited_message,
            CasinoActions.USER_DELETED_MESSAGE: CasinoHandlers.handle_user_deleted_message,
            CasinoActions.USER_CONVERSED: CasinoHandlers.handle_user_conversed,
            CasinoActions.USER_STARTED_GAME: CasinoHandlers.handle_user_started_game,
            CasinoActions.USER_QUIT_GAME: CasinoHandlers.handle_user_quit_game,
            CasinoActions.USER_PLAYED_SLOTS: CasinoHandlers.handle_user_played_slots,
            CasinoActions.USER_PLAYED_ROULETTE: CasinoHandlers.handle_user_played_roulette,
            CasinoActions.USER_PLAYED_BLACKJACK: CasinoHandlers.handle_user_played_blackjack,
            CasinoActions.USER_PLAYED_RACING: CasinoHandlers.handle_user_played_racing,
            CasinoActions.RACING_STATE_INITIALIZED: CasinoHandlers.handle_racing_state_initialized,
            CasinoActions.ROULETTE_STATE_INITIALIZED: CasinoHandlers.handle_roulette_state_initialized,
        }.get(action)

    @staticmethod
    def handle_user_session_updated(state, payload):
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

    @staticmethod
    def handle_feed_added(state, payload):
        feed_id = payload['id']
        channels = payload['channels']
        text = payload['text']
        feed = CasinoBuilders.build_feed_entity(feed_id, channels, text)

        CasinoSelectors.select_feed_ids(state).append(feed_id)
        CasinoSelectors.select_feed_lookup(state)[feed_id] = feed

        return state

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
        content = payload['content']
        message = CasinoBuilders.build_message_entity(user_id, content)

        message_id = message['id']
        CasinoSelectors.select_message_ids(state).append(message_id)
        CasinoSelectors.select_message_lookup(state)[message_id] = message

        return state

    @staticmethod
    def handle_user_reacted_to_message(state, payload):
        user_id = payload['user_id']
        message_id = payload['message_id']
        reaction = payload['reaction']
        message_reactions = CasinoSelectors.select_reactions_for_entity(
            state, message_id)

        if not message_reactions:
            message_reactions = CasinoBuilders.build_reaction_entity(
                message_id)

        reaction_user_ids = message_reactions['user_ids']
        reaction_emojis = message_reactions['reactions']

        if not user_id in reaction_user_ids:
            reaction_user_ids.append(user_id)

        current_reaction = reaction_emojis.get(user_id)

        if current_reaction and current_reaction == reaction:
            if user_id in reaction_user_ids:
                reaction_user_ids.remove(user_id)

            del reaction_emojis[user_id]
        else:
            if not user_id in reaction_user_ids:
                reaction_user_ids.append(user_id)

            reaction_emojis[user_id] = reaction

        all_reactions = CasinoSelectors.select_reaction_ids(state)
        reaction_lookup = CasinoSelectors.select_reaction_lookup(state)

        if not message_id in all_reactions:
            all_reactions.append(message_id)

        reaction_lookup[message_id] = message_reactions

        return state

    @staticmethod
    def handle_user_edited_message(state, payload):
        message_id = payload['message_id']
        content = payload['content']
        message = CasinoSelectors.select_message(state, message_id)

        message['content'] = content
        message['edited'] = now()

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
        content = payload['content']
        recipient = payload['recipient']
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

        message = CasinoBuilders.build_message_entity(user_id, content)
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

        return state

    @staticmethod
    def handle_user_quit_game(state, payload):
        user_id = payload['user_id']
        games = CasinoSelectors.select_game_names(state)

        for game in games:
            users_in_game = CasinoSelectors.select_game_users(
                state, game)

            if user_id in users_in_game:
                users_in_game.remove(user_id)

        return state

    @staticmethod
    def handle_user_played_slots(state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']

        # Session
        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Slots, game_state)
        session_update_payload = {
            'game': CasinoGames.Slots,
            'session': session
        }
        state = CasinoHandlers.handle_user_session_updated(
            state, session_update_payload)

        return state

    @staticmethod
    def handle_user_played_roulette(state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']

        CasinoSelectors.select_game(state, CasinoGames.Roulette)[
            'state'] = game_state

        # Session
        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Roulette, None)
        session_update_payload = {
            'game': CasinoGames.Roulette,
            'session': session
        }
        state = CasinoHandlers.handle_user_session_updated(
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
        state = CasinoHandlers.handle_user_session_updated(
            state, session_update_payload)

        return state

    @staticmethod
    def handle_user_played_racing(state, payload):
        user_id = payload['user_id']
        game_state = payload['game_state']

        CasinoSelectors.select_game(state, CasinoGames.Racing)[
            'state'] = game_state

        # Session
        session = CasinoBuilders.build_session_entity(
            user_id, CasinoGames.Racing, None)
        session_update_payload = {
            'game': CasinoGames.Racing,
            'session': session
        }
        state = CasinoHandlers.handle_user_session_updated(
            state, session_update_payload)

        return state

    @staticmethod
    def handle_racing_state_initialized(state, payload):
        game_state = payload['game_state']

        CasinoSelectors.select_game(state, CasinoGames.Racing)[
            'state'] = game_state

        return state

    @staticmethod
    def handle_roulette_state_initialized(state, payload):
        game_state = payload['game_state']

        CasinoSelectors.select_game(state, CasinoGames.Roulette)[
            'state'] = game_state

        return state
