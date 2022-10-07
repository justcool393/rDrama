from time import time
from json import dumps, loads
from .enums import CasinoActions
from .helpers import grab
from .selectors import CasinoSelectors

recent_state = None
next_action = {'action': None, 'payload': None}
action_history = []

class CasinoMiddleware():
    @staticmethod
    def log_middleware(next_state, action, payload):
        print(
            f'Casino Manager) {action} dispatched.')
        return next_state, action, payload

    @staticmethod
    def stringify_user_id_middleware(next_state, action, payload):
        if payload.get('user_id'):
            payload['user_id'] = str(payload['user_id'])

        return next_state, action, payload

    @staticmethod
    def update_balance_middleware(next_state, action, payload):
        if payload.get('user_id') and payload.get('balances'):
            user_id = payload['user_id']
            balances = payload['balances']

            grab(next_state, f'users/by_id/{user_id}')['balances'] = balances

        return next_state, action, payload

    @staticmethod
    def update_user_last_active_middleware(next_state, action, payload):
        requires_interaction = [
            CasinoActions.USER_SENT_MESSAGE,
            CasinoActions.USER_DELETED_MESSAGE,
            CasinoActions.USER_STARTED_GAME,
            CasinoActions.USER_PLAYED_SLOTS,
            CasinoActions.USER_PLAYED_ROULETTE
        ]

        if action in requires_interaction:
            user_id = payload['user_id']
            user = CasinoSelectors.select_user(next_state, user_id)

            if user:
                user['last_active'] = int(time())

        return next_state, action, payload

    @staticmethod
    def load_game_state_middleware(next_state, action, payload):
        if payload.get('game_state'):
            payload['game_state'] = loads(payload['game_state'])

        return next_state, action, payload