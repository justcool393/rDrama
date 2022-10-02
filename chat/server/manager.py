from copy import deepcopy
from files.__main__ import app
from flask_socketio import emit
from .builders import CasinoBuilders
from .enums import CasinoEvents
from .handlers import CasinoHandlers
from .middleware import CasinoMiddleware
from .selectors import CasinoSelectors


class CasinoManager():
    instance = None
    state = CasinoBuilders.build_initial_state()
    state_history = []
    middleware = [
        CasinoMiddleware.stringify_user_id_middleware,
        CasinoMiddleware.update_balance_middleware,
        CasinoMiddleware.update_user_last_active_middleware,
        CasinoMiddleware.load_game_state_middleware,
    ]

    def __init__(self):
        if app.config["SERVER_NAME"] == 'localhost':
            self.middleware.append(CasinoMiddleware.log_middleware)

    def dispatch(self, action, payload):
        handler = CasinoHandlers.get_handler_for_action(action)

        if not handler:
            raise Exception(
                f"Invalid action {action} passed to CasinoManager#dispatch")

        if not type(payload) is dict:
            raise Exception(
                f"Invalid payload {payload} passed to CasinoManager#dispatch (must be dict)")

        self.state_history.append(deepcopy(self.state))
        next_state = deepcopy(self.state)

        for middleware in self.middleware:
            next_state, action, payload = middleware(
                next_state,
                action,
                payload
            )

        self.state = handler(next_state, payload)

        emit(CasinoEvents.StateChanged, CasinoSelectors.select_client_state(
            self.state), broadcast=True)

CasinoManager.instance = CasinoManager()