from json import dumps
from copy import deepcopy
from .builders import CasinoBuilders
from .config import IN_DEVELOPMENT_MODE, STATE_LOG_PATH
from .handlers import CasinoHandlers
from .middleware import CasinoMiddleware


class CasinoManager():
    instance = None
    racing_manager = None
    state = CasinoBuilders.build_initial_state()
    action_history = []
    middleware = [
        CasinoMiddleware.stringify_user_id_middleware,
        CasinoMiddleware.update_balance_middleware,
        CasinoMiddleware.update_user_last_active_middleware,
        CasinoMiddleware.load_game_state_middleware
    ]

    def __init__(self):
        if IN_DEVELOPMENT_MODE:
            self.middleware.append(CasinoMiddleware.log_middleware)

    def _log_state(self):
        logfile = open(STATE_LOG_PATH, "w+", encoding="utf-8")
        logfile.write(dumps({
            'state': self.state,
            'action_history': self.action_history,
        }, indent=2))
        logfile.close()

    def dispatch(self, action, payload):
        handler = CasinoHandlers.get_handler_for_action(action)

        if not handler:
            raise Exception(
                f"Invalid action {action} passed to CasinoManager#dispatch")

        if not type(payload) is dict:
            raise Exception(
                f"Invalid payload {payload} passed to CasinoManager#dispatch (must be dict)")

        next_state = deepcopy(self.state)

        for middleware in self.middleware:
            next_state, action, payload = middleware(
                next_state,
                action,
                payload
            )

        self.state = handler(next_state, payload)
        self.action_history.append({'action': action, 'payload': payload})

        if IN_DEVELOPMENT_MODE:
            self._log_state()


CasinoManager.instance = CasinoManager()
