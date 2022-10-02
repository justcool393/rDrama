from copy import deepcopy

class CasinoSelectors():
    # Selectors
    @staticmethod
    def select_available_games(from_state):
        return from_state['games']['all']

    @staticmethod
    def select_user_in_game(from_state, game, user_id):
        return user_id in CasinoSelectors.select_users_in_game(from_state, game)

    @staticmethod
    def select_users_in_game(from_state, game):
        return from_state['games']['by_id'][game]['user_ids']

    @staticmethod
    def select_user(from_state, user_id):
        return from_state['users']['by_id'].get(user_id)

    @staticmethod
    def select_message(from_state, message_id):
        return from_state['messages']['by_id'].get(message_id)

    @staticmethod
    def select_conversation(from_state, conversation_key):
        return from_state['conversations']['by_id'].get(conversation_key)

    @staticmethod
    def select_client_state(from_state):
        client_state = deepcopy(from_state)
        users = client_state['users']

        for user_id in users['all']:
            user = users['by_id'][user_id]
            del user['request_id']

        return client_state
