from json import dumps
from flask_socketio import emit, disconnect
from files.routes.chat import socketio
from files.helpers.wrappers import *
from .builders import CasinoBuilders as B
from .enums import CasinoActions as A, CasinoEvents as E, CasinoGames, CasinoMessages as M
from .games import casino_slot_pull, gambler_placed_roulette_bet, get_roulette_bets
from .helpers import meets_minimum_wager, can_user_afford, sanitize_chat_message
from .manager import CasinoManager
from .selectors import CasinoSelectors as S

C = CasinoManager.instance

@socketio.on(E.Connect)
@is_not_permabanned
def connect_to_casino(v):
    payload = {'user_id': v.id, 'request_id': request.sid}

    if S.select_user_is_online(C.state, str(v.id)):
        emit(E.ErrorOccurred, M.AlreadyInside)
        emit(E.JoinedAgain)
        return '', 403

    C.dispatch(A.USER_CONNECTED, payload)

    user = S.select_user(C.state, str(v.id))
    emit(E.UserUpdated, user, broadcast=True)
    emit(E.InitialStateProvided, C.state)
    return '', 200


@socketio.on(E.Disconnect)
@is_not_permabanned
def disconnect_from_casino(v):
    payload = {'user_id': v.id}

    C.dispatch(A.USER_DISCONNECTED, payload)

    user = S.select_user(C.state, str(v.id))
    emit(E.UserUpdated, user, broadcast=True)
    return '', 200


@socketio.on(E.UserKickedOwnClient)
@is_not_permabanned
def user_kicked_own_client(v):
    try:
        request_id = S.select_user_request_id(C.state, str(v.id))
        disconnect(request_id)
        emit(E.Refresh)
        return '', 200
    except:
        return '', 400


@socketio.on(E.UserSentMessage)
@is_not_permabanned
def user_sent_message(data, v):
    text = sanitize_chat_message(data['message'])
    payload = {'user_id': v.id, 'text': text}

    C.dispatch(A.USER_SENT_MESSAGE, payload)

    message = S.select_newest_message(C.state)
    emit(E.MessageUpdated, message, broadcast=True)
    return '', 200


@socketio.on(E.UserDeletedMessage)
@is_not_permabanned
def user_deleted_message(data, v):
    message_id = data
    message = S.select_message(C.state, message_id)
    own_message = message['user_id'] == v.id
    payload = {'message_id': message_id}

    if not message:
        emit(E.ErrorOccurred, M.MessageNotFound)
        return '', 404

    if not own_message and v.admin_level < 2:
        emit(E.ErrorOccurred, M.InsufficientPermissions)
        return '', 403

    C.dispatch(A.USER_DELETED_MESSAGE, payload)

    emit(E.MessageDeleted, message_id, broadcast=True)
    emit(E.ConfirmationReceived, M.MessageDeleteSuccess)
    return '', 200


@socketio.on(E.UserConversed)
@is_not_permabanned
def user_conversed(data, v):
    text = sanitize_chat_message(data['message'])
    recipient = data['recipient']
    payload = {'user_id': v.id, 'text': text, 'recipient': recipient}

    C.dispatch(A.USER_CONVERSED, payload)

    conversation_key = B.build_conversation_key(str(v.id), recipient)
    conversation = S.select_conversation(C.state, conversation_key)
    emit(E.ConversationUpdated, conversation)
    # TODO: Also emit to the recipient.
    return '', 200


@socketio.on(E.UserStartedGame)
@is_not_permabanned
def user_started_game(data, v):
    game = data
    payload = {'user_id': v.id, 'game': game}

    if not game in S.select_game_names(C.state):
        emit(E.ErrorOccurred, M.GameNotFound)
        return '', 400

    C.dispatch(A.USER_STARTED_GAME, payload)

    game = S.select_game(C.state, game)
    emit(E.GameUpdated, game)
    return '', 200


@socketio.on(E.UserPulledSlots)
@is_not_permabanned
def user_pulled_slots(data, v):
    currency = data['currency']
    wager = int(data['wager'])

    if not meets_minimum_wager(wager):
        emit(E.ErrorOccurred, M.MinimumWagerNotMet)
        return '', 400

    if not can_user_afford(v, currency, wager):
        emit(E.ErrorOccurred, M.CannotAffordBet)
        return '', 400

    success, game_state = casino_slot_pull(v, wager, currency)

    if success:
        balances = {
            'coins': v.coins,
            'procoins': v.procoins
        }
        payload = {
            'user_id': v.id,
            'balances': balances,
            'game_state': game_state
        }

        C.dispatch(A.USER_PULLED_SLOTS, payload)
        session_key = B.build_session_key(str(v.id), CasinoGames.Slots)
        session = S.select_session(C.state, session_key)
        feed = S.select_newest_feed(C.state)
        emit(E.SessionUpdated, session)
        emit(E.FeedUpdated, feed)
        return '', 200
    else:
        emit(E.ErrorOccurred, M.CannotPullLever)
        return '', 400


@socketio.on(E.UserPlayedRoulette)
@is_not_permabanned
def user_played_roulette(data, v):
    bet = data['bet']
    which = data['which']
    currency = data['currency']
    wager = int(data['wager'])

    if not meets_minimum_wager(wager):
        emit(E.ErrorOccurred, M.MinimumWagerNotMet)
        return '', 400

    if not can_user_afford(v, currency, wager):
        emit(E.ErrorOccurred, M.CannotAffordBet)
        return '', 400

    try:
        gambler_placed_roulette_bet(v, bet, which, wager, currency)

        game_state = dumps({
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

        C.dispatch(A.USER_PLAYED_ROULETTE, payload)

        game = S.select_game(C.state, CasinoGames.Roulette)
        session_key = B.build_session_key(str(v.id), CasinoGames.Roulette)
        session = S.select_session(C.state, session_key)
        feed = S.select_newest_feed(C.state)
        emit(E.GameUpdated, game, broadcast=True)
        emit(E.SessionUpdated, session, broadcast=True)
        emit(E.FeedUpdated, feed, broadcast=True)
        return '', 200
    except:
        emit(E.ErrorOccurred, M.CannotPlaceBet)
        return '', 400
