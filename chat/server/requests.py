from flask_socketio import emit
from files.routes.chat import socketio
from files.helpers.alerts import *
from files.helpers.const import *
from files.helpers.regex import *
from files.helpers.wrappers import *
from files.helpers.slots import casino_slot_pull
from files.helpers.roulette import gambler_placed_roulette_bet, get_roulette_bets
from .config import MESSAGE_MAX_LENGTH
from .enums import CasinoActions, CasinoEvents
from .helpers import meets_minimum_wager, can_user_afford
from .manager import CasinoManager
from .selectors import CasinoSelectors


@socketio.on(CasinoEvents.Connect)
@is_not_permabanned
def connect_to_casino(v):
    payload = {'user_id': v.id, 'request_id': request.sid}
    CasinoManager.instance.dispatch(CasinoActions.USER_CONNECTED, payload)
    return '', 200


@socketio.on(CasinoEvents.Disconnect)
@is_not_permabanned
def disconnect_from_casino(v):
    payload = {'user_id': v.id}
    CasinoManager.instance.dispatch(CasinoActions.USER_DISCONNECTED, payload)
    return '', 200


@socketio.on(CasinoEvents.UserSentMessage)
@is_not_permabanned
def user_sent_message(data, v):
    # TODO: Formatting helper to implement sanitization.
    text = data['message'][:MESSAGE_MAX_LENGTH].strip()
    recipient = data.get('recipient')
    payload = {'user_id': v.id, 'text': text, 'recipient': recipient}
    CasinoManager.instance.dispatch(CasinoActions.USER_SENT_MESSAGE, payload)
    return '', 200


@socketio.on(CasinoEvents.UserDeletedMessage)
@is_not_permabanned
def user_deleted_message(data, v):
    message_id = data
    message = CasinoSelectors.select_message(
        CasinoManager.instance.state, message_id)

    if not message:
        emit(CasinoEvents.ErrorOccurred, "That message does not exist.")
        return '', 404

    if message['user_id'] != v.id and v.admin_level < 2:
        emit(CasinoEvents.ErrorOccurred,
             "You do not have permission to delete that message.")
        return '', 403

    payload = {'message_id': message_id}
    CasinoManager.instance.dispatch(
        CasinoActions.USER_DELETED_MESSAGE, payload)
    emit(CasinoEvents.ConfirmationReceived, "Successfully deleted a message.")
    return '', 200


@socketio.on(CasinoEvents.UserStartedGame)
@is_not_permabanned
def user_started_game(data, v):
    game = data

    if not game in CasinoSelectors.select_available_games(CasinoManager.instance.state):
        emit(CasinoEvents.ErrorOccurred, "That game does not exist.")
        return '', 400

    payload = {'user_id': v.id, 'game': game}
    CasinoManager.instance.dispatch(CasinoActions.USER_STARTED_GAME, payload)
    return '', 200


@socketio.on(CasinoEvents.UserPulledSlots)
@is_not_permabanned
def user_pulled_slots(data, v):
    currency = data['currency']
    wager = int(data['wager'])

    if not meets_minimum_wager(wager):
        emit(CasinoEvents.ErrorOccurred, "You must bet at least 5 {currency}.")
        return '', 400

    if not can_user_afford(v, currency, wager):
        emit(CasinoEvents.ErrorOccurred, "You cannot afford that bet.")
        return '', 400

    success, game_state = casino_slot_pull(v, wager, currency)

    if success:
        balances = {'coins': v.coins, 'procoins': v.procoins}
        payload = {'user_id': v.id, 'balances': balances,
                   'game_state': game_state}
        CasinoManager.instance.dispatch(
            CasinoActions.USER_PULLED_SLOTS, payload)
        return '', 200
    else:
        emit(CasinoEvents.ErrorOccurred, "Unable to pull the lever.")
        return '', 400


@socketio.on(CasinoEvents.UserPlayedRoulette)
@is_not_permabanned
def user_played_roulette(data, v):
    bet = data['bet']
    which = data['which']
    currency = data['currency']
    wager = int(data['wager'])

    if not meets_minimum_wager(wager):
        emit(CasinoEvents.ErrorOccurred, "You must bet at least 5 {currency}.")
        return '', 400

    if not can_user_afford(v, currency, wager):
        emit(CasinoEvents.ErrorOccurred, "You cannot afford that bet.")
        return '', 400

    try:
        gambler_placed_roulette_bet(v, bet, which, wager, currency)

        game_state = json.dumps({
            'bets': get_roulette_bets()
        })
        balances = {
            'coins': v.coins,
            'procoins': v.procoins
        }
        placed_bet = {
            'bet': bet,
            'which': which,
            'currency': currency,
            'wager': wager
        }
        payload = {
            'user_id': v.id,
            'balances': balances,
            'game_state': game_state,
            'placed_bet': placed_bet
        }
        CasinoManager.instance.dispatch(
            CasinoActions.USER_PLAYED_ROULETTE, payload)
        return '', 200
    except:
        emit(CasinoEvents.ErrorOccurred, "Unable to place bet.")
        return '', 400
