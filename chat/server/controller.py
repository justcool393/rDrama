from copy import copy, deepcopy
from json import dumps
from files.helpers.wrappers import app
from files.helpers.const import request
from flask import copy_current_request_context
from flask_socketio import emit, join_room, leave_room
from gevent import sleep, spawn
from .builders import CasinoBuilders
from .config import CASINO_LOGGER_PREFIX, ERROR_LOG_PATH, SLOTS_PULL_DURATION
from .enums import CasinoActions, CasinoEvents, CasinoGames, CasinoMessages, CasinoRooms
from .exceptions import *
from .games.blackjack import BlackjackActions, BlackjackManager
from .games.racing import RacingManager
from .games.roulette import gambler_placed_roulette_bet, get_roulette_bets
from .games.slots import SlotsManager
from .helpers import get_balances, validate_bet, sanitize_chat_message
from .logger import CasinoLogger
from .manager import CasinoManager
from .scheduler import CasinoScheduler
from .selectors import CasinoSelectors


class BaseController():
    def __init__(self):
        self.logger = CasinoLogger(CASINO_LOGGER_PREFIX, ERROR_LOG_PATH)
        self.manager = CasinoManager()
        self.scheduler = CasinoScheduler()
        self.racing_manager = None

    @property
    def state(self):
        return self.manager.state

    def _initialize_racing_manager(self):
        self.racing_manager = RacingManager()
        self.manager.dispatch(CasinoActions.RACING_STATE_INITIALIZED, {
            "game_state": dumps(self.racing_manager.state)
        })

    def _join_user_conversation_rooms(self, user_id):
        request_id = CasinoSelectors.select_user_request_id(
            self.state, user_id)
        conversation_keys = CasinoSelectors.select_user_conversation_keys(
            self.state, user_id)
        rooms = [user_id, *conversation_keys]

        for room in rooms:
            join_room(room, request_id)

    def _join_user_game_room(self, user_id, game):
        request_id = CasinoSelectors.select_user_request_id(
            self.state, user_id)

        join_room(game, request_id)

        remaining_games = list(
            copy(CasinoSelectors.select_game_names(self.state)))
        remaining_games.remove(game)

        for remaining_game in remaining_games:
            leave_room(remaining_game, request_id)

    def _send_initial_state_update(self, user_id):
        safe_state = deepcopy(self.state)
        initial_client_state = CasinoSelectors.select_initial_client_state(
            safe_state, user_id)
        emit(CasinoEvents.InitialStateProvided,
             initial_client_state, to=user_id)

    def _send_user_update(self, user_id):
        user = CasinoSelectors.select_user(self.state, user_id)
        emit(CasinoEvents.UserUpdated, user, broadcast=True)

    def _send_session_update(self, user_id, game):
        session_key = CasinoBuilders.build_session_key(user_id, game)
        session = CasinoSelectors.select_session(self.state, session_key)
        emit(CasinoEvents.SessionUpdated, session, broadcast=True)

    def _send_game_update(self, game):
        game_entity = CasinoSelectors.select_game(self.state, game)
        emit(CasinoEvents.GameUpdated, game_entity, broadcast=True)

    def _send_games_update(self):
        emit(CasinoEvents.GamesUpdated, self.state['games'], broadcast=True)

    def _send_feed_update(self, text, channels):
        feed = self.manager.add_feed(channels, text)

        emit(CasinoEvents.FeedUpdated, feed, broadcast=True)

    def _send_message_update(self):
        latest_message = CasinoSelectors.select_newest_message(self.state)
        emit(CasinoEvents.MessageUpdated, latest_message, broadcast=True)

    def _send_conversation_update(self, user_id_a, user_id_b):
        conversation_key = CasinoBuilders.build_conversation_key(
            user_id_a, user_id_b)
        conversation = CasinoSelectors.select_conversation(
            self.state, conversation_key)
        emit(CasinoEvents.ConversationUpdated,
             conversation, to=conversation_key)


class CasinoController(BaseController):
    def send_confirmation(self, message):
        emit(CasinoEvents.ConfirmationReceived, message)

    def send_error(self, error):
        emit(CasinoEvents.ErrorOccurred, error)

    def user_connected(self, user):
        if not self.racing_manager:
            self._initialize_racing_manager()

        user_id = str(user.id)
        user_already_online = CasinoSelectors.select_user_is_online(
            self.state, user_id)

        if user_already_online:
            raise UserAlreadyOnlineException(user)

        self.manager.dispatch(CasinoActions.USER_CONNECTED, {
            'user_id': user_id,
            'request_id': request.sid
        })

        self._join_user_conversation_rooms(user_id)
        self._send_initial_state_update(user_id)
        self._send_user_update(user_id)
        self._send_feed_update(
            f'{user.username} has entered the casino.', [CasinoRooms.Lobby])

    def user_disconnected(self, user):
        user_id = str(user.id)
        user_already_online = CasinoSelectors.select_user_is_online(
            self.state, user_id)

        if not user_already_online:
            raise UserNotOnlineException(user)

        self.manager.dispatch(CasinoActions.USER_DISCONNECTED, {
            'user_id': user_id
        })

        self._send_user_update(user_id)
        self._send_feed_update(
            f'{user.username} has exited the casino.', [CasinoRooms.Lobby])

    def user_sent_message(self, user, data):
        user_id = str(user.id)
        text = sanitize_chat_message(data['message'])

        if len(text) == 0:
            raise UserSentEmptyMessageException(user)

        self.manager.dispatch(CasinoActions.USER_SENT_MESSAGE, {
            'user_id': user_id,
            'text': text
        })

        self._send_message_update()

    def user_deleted_message(self, user, data):
        user_id = str(user.id)
        message_id = data['id']
        message = CasinoSelectors.select_message(self.state, message_id)

        if not message:
            raise NotFoundException('message')

        is_own_message = message['user_id'] == user_id
        is_allowed_anyway = user.admin_level >= 2

        if not is_own_message and not is_allowed_anyway:
            raise NotAllowedException(user, f'delete message#{message_id}')

        self.manager.dispatch(CasinoActions.USER_DELETED_MESSAGE, {
            'user_id': user_id,
            'message_id': message_id
        })

        emit(CasinoEvents.MessageDeleted, message_id, broadcast=True)

        self.send_confirmation(CasinoMessages.MessageDeleteSuccess)

    def user_conversed(self, user, data):
        user_id = str(user.id)
        text = sanitize_chat_message(data['message'])

        if len(text) == 0:
            raise UserSentEmptyMessageException(user)

        recipient = data['recipient']
        receiving_user = CasinoSelectors.select_user(self.state, recipient)

        if not receiving_user:
            raise NotFoundException('user')

        self.manager.dispatch(CasinoActions.USER_CONVERSED, {
            'user_id': user_id,
            'text': text,
            'recipient': recipient
        })

        self._join_user_conversation_rooms(user_id)
        self._join_user_conversation_rooms(recipient)
        self._send_conversation_update(user_id, recipient)

    def user_started_game(self, user, data):
        user_id = str(user.id)
        game = data['game']
        valid_games = CasinoSelectors.select_game_names(self.state)

        if not game in valid_games:
            raise InvalidGameException(user, game)

        self.manager.dispatch(CasinoActions.USER_STARTED_GAME, {
            'user_id': user_id,
            'game': game
        })

        self._join_user_game_room(user_id, game)
        self._send_feed_update(
            f'{user.username} started playing {game}.', [game])
        self._send_games_update()

        if game == CasinoGames.Slots:
            state = dumps(SlotsManager.wait())
            self.manager.dispatch(CasinoActions.USER_PLAYED_SLOTS, {
                'user_id': user_id,
                'game_state': state,
            })
            self._send_session_update(user_id, CasinoGames.Slots)
        elif game == CasinoGames.Blackjack:
            saved_game = BlackjackManager.load(user) or BlackjackManager.wait()
            self.manager.dispatch(CasinoActions.USER_PLAYED_BLACKJACK, {
                'user_id': user_id,
                'game_state': dumps(saved_game),
            })
            self._send_session_update(user_id, CasinoGames.Blackjack)

    def user_quit_game(self, user):
        user_id = str(user.id)
        game = CasinoSelectors.select_user_active_game(self.state, user_id)

        if not game:
            raise NoGameInProgressException(user, None)

        self.manager.dispatch(CasinoActions.USER_QUIT_GAME, {
            'user_id': user_id,
        })

        leave_room(game)

        self._send_feed_update(
            f'{user.username} quit playing {game}.', [game])
        self._send_games_update()

    def user_played_slots(self, user, data):
        user_id = str(user.id)
        currency = data['currency']
        wager = int(data['wager'])

        validate_bet(user, currency, wager)

        @copy_current_request_context
        def play_slots():
            with app.app_context():
                state = dumps(SlotsManager.start(currency, wager))
                self.manager.dispatch(CasinoActions.USER_PLAYED_SLOTS, {
                    'user_id': user_id,
                    'game_state': state
                })
                self._send_session_update(user_id, CasinoGames.Slots)

                sleep(SLOTS_PULL_DURATION)

                state = SlotsManager.play(user, currency, wager)
                self.manager.dispatch(CasinoActions.USER_PLAYED_SLOTS, {
                    'user_id': user_id,
                    'game_state': dumps(state),
                    'balances': get_balances(user)
                })

                self._send_user_update(user_id)
                self._send_session_update(user_id, CasinoGames.Slots)
                self._send_feed_update(
                    CasinoBuilders.build_slots_feed_entity(user.username, state), [CasinoGames.Slots])

        spawn(play_slots)
    
    def user_played_blackjack(self, user, data):
        user_id = str(user.id)
        action = data['action']
        active_game = BlackjackManager.load(user)

        if action == BlackjackActions.DEAL:
            if active_game:
                raise GameInProgressException(user, CasinoGames.Blackjack)

            currency = data['currency']
            wager = int(data['wager'])

            validate_bet(user, currency, wager)

            state = dumps(BlackjackManager.start(user, currency, wager))
        else:
            if not active_game:
                raise NoGameInProgressException(user, CasinoGames.Blackjack)

            state = dumps(BlackjackManager.play(user, action))

        self.manager.dispatch(CasinoActions.USER_PLAYED_BLACKJACK, {
            'user_id': user_id,
            'game_state': state,
            'balances': get_balances(user)
        })

        self._send_user_update(user_id)
        self._send_session_update(user_id, CasinoGames.Blackjack)
        self._send_feed_update(f'{user.username} <change me>', [
                               CasinoGames.Blackjack])

    def user_played_roulette(self, user, data):
        user_id = str(user.id)
        currency = data['currency']
        wager = int(data['wager'])

        validate_bet(user, currency, wager)

        bet = data['bet']
        which = data['which']

        gambler_placed_roulette_bet(user, bet, which, wager, currency)

        state = dumps({
            'bets': get_roulette_bets()
        })
        self.manager.dispatch(CasinoActions.USER_PLAYED_ROULETTE, {
            'user_id': user_id,
            'game_state': state,
            'balances': get_balances(user),
            'placed_bet': {
                'bet': bet,
                'which': which,
                'currency': currency,
                'wager': wager
            }
        })

        self._send_user_update(user_id)
        self._send_session_update(user_id, CasinoGames.Roulette)
        self._send_feed_update(f'{user.username} <change me>', [
                               CasinoGames.Roulette])

    def user_played_racing(self, user, data):
        user_id = str(user.id)
        currency = data['currency']
        wager = int(data['wager'])

        validate_bet(user, currency, wager)

        kind = data['kind']
        selection = data['selection']
        placed_bet = {
            'kind': kind,
            'selection': selection,
            'currency': currency,
            'wager': wager,
        }
        self.racing_manager.handle_player_bet(user, placed_bet)

        state = dumps(self.racing_manager.state)
        self.manager.dispatch(CasinoActions.USER_PLAYED_RACING, {
            'user_id': user_id,
            'game_state': state,
            'balances': get_balances(user),
            'placed_bet': placed_bet
        })

        self._send_user_update(user_id)
        self._send_session_update(user_id, CasinoGames.Racing)

        text = CasinoBuilders.build_racing_feed_entity(
            user.username,
            kind,
            selection,
            currency,
            wager
        )
        self._send_feed_update(text, [CasinoGames.Roulette])
        self.send_confirmation(CasinoMessages.RacingBetPlacedSuccessfully)


CASINO_CONTROLLER = CasinoController()
CASINO_CONTROLLER.logger.log("Initialized.")