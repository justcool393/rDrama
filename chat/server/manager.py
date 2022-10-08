from uuid import uuid4
from json import dumps
from copy import deepcopy
from flask_socketio import emit
from .builders import CasinoBuilders
from .config import IN_DEVELOPMENT_MODE, STATE_LOG_PATH
from .enums import CasinoActions, CasinoEvents
from .handlers import CasinoHandlers
from .middleware import CasinoMiddleware
from .scheduler import CasinoScheduler
from .selectors import CasinoSelectors


class CasinoManager():
    instance = None
    scheduler = CasinoScheduler.instance
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

    def add_feed(self, channels, text):
        feed_id = str(uuid4())
        payload = {'id': feed_id, 'channels': channels, 'text': text}

        self.dispatch(CasinoActions.FEED_ADDED, payload)

        return payload

    def send_user_update(self, user_id):
        user = CasinoSelectors.select_user(self.state, user_id)
        emit(CasinoEvents.UserUpdated, user, broadcast=True)

    def send_session_update(self, user_id, game):
        session_key = CasinoBuilders.build_session_key(user_id, game)
        session = CasinoSelectors.select_session(self.state, session_key)
        emit(CasinoEvents.SessionUpdated, session, broadcast=True)

    def send_game_update(self, game):
        game_entity = CasinoSelectors.select_game(self.state, game)
        emit(CasinoEvents.GameUpdated, game_entity, broadcast=True)

    def send_feed_update(self, text, channels):
        feed = self.add_feed(channels, text)

        for channel in channels:
            emit(CasinoEvents.FeedUpdated, feed, to=channel)


CasinoManager.instance = CasinoManager()
