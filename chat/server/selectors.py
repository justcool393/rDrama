from copy import deepcopy
from files.helpers.roulette import format_roulette_bet_feed_item
from .helpers import grab


class CasinoSelectors():
    # Games
    @staticmethod
    def select_game_names(state):
        return grab(state, 'games/all')

    @staticmethod
    def select_game_lookup(state):
        return grab(state, 'games/by_id')

    @staticmethod
    def select_game(state, game_name):
        return CasinoSelectors.select_game_lookup(state).get(game_name)

    @staticmethod
    def select_game_users(state, game_name):
        return grab(CasinoSelectors.select_game(state, game_name), 'user_ids')

    @staticmethod
    def select_user_in_game(state, game_name, user_id):
        return user_id in CasinoSelectors.select_game_users(state, game_name)

    @staticmethod
    def select_game_sessions(state, game_name):
        return grab(CasinoSelectors.select_game(state, game_name), 'session_ids')

    @staticmethod
    def select_session_in_game(state, game_name, session_id):
        return session_id in CasinoSelectors.select_game_sessions(state, game_name)

    # User
    @staticmethod
    def select_user_ids(state):
        return grab(state, 'users/all')

    @staticmethod
    def select_user_lookup(state):
        return grab(state, 'users/by_id')

    @staticmethod
    def select_user(state, user_id):
        return CasinoSelectors.select_user_lookup(state).get(user_id)

    @staticmethod
    def select_user_username(state, user_id):
        return grab(CasinoSelectors.select_user(state, user_id), 'account/username')

    @staticmethod
    def select_user_is_online(state, user_id):
        return grab(CasinoSelectors.select_user(state, user_id), 'online')

    @staticmethod
    def select_user_request_id(state, user_id):
        return grab(CasinoSelectors.select_user(state, user_id), 'request_id')

    # Message
    @staticmethod
    def select_message_ids(state):
        return grab(state, 'messages/all')

    @staticmethod
    def select_message_lookup(state):
        return grab(state, 'messages/by_id')

    @staticmethod
    def select_message(state, message_id):
        return CasinoSelectors.select_message_lookup(state).get(message_id)

    @staticmethod
    def select_newest_message(state):
        message_id = CasinoSelectors.select_message_ids(state)[-1]
        return CasinoSelectors.select_message(state, message_id)

    # Conversation
    @staticmethod
    def select_conversation_keys(state):
        return grab(state, 'conversations/all')

    @staticmethod
    def select_conversation_lookup(state):
        return grab(state, 'conversations/by_id')

    @staticmethod
    def select_conversation(state, conversation_key):
        return CasinoSelectors.select_conversation_lookup(state).get(conversation_key)

    @staticmethod
    def select_conversation_message_ids(state, conversation_key):
        return grab(CasinoSelectors.select_conversation(state, conversation_key), 'messages/all')

    @staticmethod
    def select_conversation_message_lookup(state, conversation_key):
        return grab(CasinoSelectors.select_conversation(state, conversation_key), 'messages/by_id')

    @staticmethod
    def select_conversation_message(state, conversation_key, message_id):
        return CasinoSelectors.select_conversation_message_lookup(state, conversation_key).get(message_id)

    # Feed
    @staticmethod
    def select_feed_ids(state):
        return grab(state, 'feed/all')

    @staticmethod
    def select_feed_lookup(state):
        return grab(state, 'feed/by_id')

    @staticmethod
    def select_feed(state, feed_id):
        return CasinoSelectors.select_feed_lookup(state).get(feed_id)

    @staticmethod
    def select_newest_feed(state):
        feed_id = CasinoSelectors.select_feed_ids(state)[-1]
        return CasinoSelectors.select_feed(state, feed_id)

    @staticmethod
    def select_roulette_bet_feed_item(state, user_id, bet, which, currency, wager):
        username = CasinoSelectors.select_user_username(state, user_id)

        return format_roulette_bet_feed_item(
            username=username,
            bet=bet,
            which=which,
            currency=currency,
            amount=wager
        )

    # Session
    @staticmethod
    def select_session_ids(state):
        return grab(state, 'sessions/all')

    @staticmethod
    def select_session_lookup(state):
        return grab(state, 'sessions/by_id')

    @staticmethod
    def select_session(state, session_id):
        return CasinoSelectors.select_session_lookup(state).get(session_id)

    @staticmethod
    def select_client_state(state):
        client_state = deepcopy(state)

        try:
            users = client_state['users']

            for user_id in users['all']:
                user = users['by_id'][user_id]
                del user['request_id']
        except:
            pass

        return client_state
