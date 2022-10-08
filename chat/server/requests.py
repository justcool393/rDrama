from files.routes.chat import socketio
from files.helpers.wrappers import is_not_permabanned
from .config import CASINO_NAMESPACE
from .controller import CasinoController
from .enums import CasinoEvents, CasinoMessages
from .exceptions import *

CONTROLLER = CasinoController()
SUCCESS_RESPONSE = '', 200
ERROR_RESPONSE = '', 400


@socketio.on_error(CASINO_NAMESPACE)
def casino_error(error):
    CONTROLLER.logger.log(str(error))


@socketio.on(CasinoEvents.Connect, CASINO_NAMESPACE)
@is_not_permabanned
def connect_to_casino(v):
    try:
        CONTROLLER.user_connected(v)
        return SUCCESS_RESPONSE
    except UserAlreadyOnlineException:
        CONTROLLER.send_error(CasinoMessages.AlreadyInside)
        return ERROR_RESPONSE


@socketio.on(CasinoEvents.Disconnect, CASINO_NAMESPACE)
@is_not_permabanned
def disconnect_from_casino(v):
    try:
        CONTROLLER.user_disconnected(v)
        return SUCCESS_RESPONSE
    except UserNotOnlineException:
        CONTROLLER.send_error(CasinoMessages.NotInsideYet)
        return ERROR_RESPONSE


@socketio.on(CasinoEvents.UserSentMessage, CASINO_NAMESPACE)
@is_not_permabanned
def user_sent_message(data, v):
    CONTROLLER.user_sent_message(v, data)
    return SUCCESS_RESPONSE


@socketio.on(CasinoEvents.UserDeletedMessage, CASINO_NAMESPACE)
@is_not_permabanned
def user_deleted_message(data, v):
    try:
        CONTROLLER.user_deleted_message(v, data)
        return SUCCESS_RESPONSE
    except NotFoundException:
        CONTROLLER.send_error(CasinoMessages.MessageNotFound)
        return ERROR_RESPONSE
    except NotAllowedException:
        CONTROLLER.send_error(CasinoMessages.InsufficientPermissions)
        return ERROR_RESPONSE


@socketio.on(CasinoEvents.UserConversed, CASINO_NAMESPACE)
@is_not_permabanned
def user_conversed(data, v):
    try:
        CONTROLLER.user_conversed(v, data)
        return SUCCESS_RESPONSE
    except UserSentEmptyMessageException:
        CONTROLLER.send_error(CasinoMessages.CannotSendEmptyMessage)
        return ERROR_RESPONSE
    except NotFoundException:
        CONTROLLER.send_error(CasinoMessages.UserNotFound)
        return ERROR_RESPONSE


@socketio.on(CasinoEvents.UserStartedGame, CASINO_NAMESPACE)
@is_not_permabanned
def user_started_game(data, v):
    try:
        CONTROLLER.user_started_game(v, data)
        return SUCCESS_RESPONSE
    except InvalidGameException:
        CONTROLLER.send_error(CasinoMessages.GameNotFound)
        return ERROR_RESPONSE


@socketio.on(CasinoEvents.UserPlayedSlots, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_slots(data, v):
    try:
        CONTROLLER.user_played_slots(v, data)
        return SUCCESS_RESPONSE
    except UserInRehabException:
        CONTROLLER.send_error(CasinoMessages.UserInRehab)
        return ERROR_RESPONSE
    except UnderMinimumBetException:
        CONTROLLER.send_error(CasinoMessages.MinimumWagerNotMet)
        return ERROR_RESPONSE
    except CannotAffordBetException:
        CONTROLLER.send_error(CasinoMessages.CannotAffordBet)
        return ERROR_RESPONSE


@socketio.on(CasinoEvents.UserPlayedBlackjack, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_blackjack(data, v):
    try:
        CONTROLLER.user_played_blackjack(v, data)
        return SUCCESS_RESPONSE
    except UserInRehabException:
        CONTROLLER.send_error(CasinoMessages.UserInRehab)
        return ERROR_RESPONSE
    except UnderMinimumBetException:
        CONTROLLER.send_error(CasinoMessages.MinimumWagerNotMet)
        return ERROR_RESPONSE
    except CannotAffordBetException:
        CONTROLLER.send_error(CasinoMessages.CannotAffordBet)
        return ERROR_RESPONSE


@socketio.on(CasinoEvents.UserPlayedRoulette, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_roulette(data, v):
    try:
        CONTROLLER.user_played_roulette(v, data)
        return SUCCESS_RESPONSE
    except GameInProgressException:
        CONTROLLER.send_error(CasinoMessages.BlackjackGameInProgress)
        return ERROR_RESPONSE
    except NoGameInProgressException:
        CONTROLLER.send_error(CasinoMessages.BlackjackNoGameInProgress)
        return ERROR_RESPONSE
    except UserInRehabException:
        CONTROLLER.send_error(CasinoMessages.UserInRehab)
        return ERROR_RESPONSE
    except UnderMinimumBetException:
        CONTROLLER.send_error(CasinoMessages.MinimumWagerNotMet)
        return ERROR_RESPONSE
    except CannotAffordBetException:
        CONTROLLER.send_error(CasinoMessages.CannotAffordBet)
        return ERROR_RESPONSE


@socketio.on(CasinoEvents.UserPlayedRacing, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_racing(data, v):
    try:
        CONTROLLER.user_played_racing(v, data)
        return SUCCESS_RESPONSE
    except UserInRehabException:
        CONTROLLER.send_error(CasinoMessages.UserInRehab)
        return ERROR_RESPONSE
    except UnderMinimumBetException:
        CONTROLLER.send_error(CasinoMessages.MinimumWagerNotMet)
        return ERROR_RESPONSE
    except CannotAffordBetException:
        CONTROLLER.send_error(CasinoMessages.CannotAffordBet)
        return ERROR_RESPONSE
    except BadBetException:
        CONTROLLER.send_error(CasinoMessages.CannotPlaceBet)
        return ERROR_RESPONSE
