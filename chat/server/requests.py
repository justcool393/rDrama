from json import dumps
from copy import copy
from flask import copy_current_request_context
from flask_socketio import emit, disconnect, join_room, leave_room
from chat.server.games.racing import RacingManager
from files.helpers.twentyone import BlackjackAction
from files.routes.chat import socketio
from files.helpers.wrappers import *
from files.helpers.const import *
from files.helpers.alerts import *
from files.helpers.regex import *
from gevent import sleep
from .builders import CasinoBuilders as B
from .config import CASINO_NAMESPACE, SLOTS_PULL_DURATION
from .enums import CasinoActions as A, CasinoEvents as E, CasinoGames, CasinoMessages as M
from .games.slots import SlotsManager
from .games.blackjack import BlackjackManager
from .games.racing import RacingManager
from .games.roulette import gambler_placed_roulette_bet, get_roulette_bets
from .helpers import *
from .manager import CasinoManager
from .selectors import CasinoSelectors as S

C = CasinoManager.instance


@socketio.on_error(CASINO_NAMESPACE)
def casino_error(error):
    # TODO: This.
    print("\n\n")
    print("Casino Manager) [ERROR]")
    print(error)
    print("Casino Manager) [ERROR]")
    print("\n\n")
    raise error


@socketio.on(E.Connect, CASINO_NAMESPACE)
@is_not_permabanned
def connect_to_casino(v):
    if not C.racing_manager:
        C.racing_manager = RacingManager()
        C.dispatch(A.RACING_STATE_INITIALIZED, {
                   'game_state': dumps(C.racing_manager.state)})

    user_id = str(v.id)
    payload = {'user_id': v.id, 'request_id': request.sid}

    if S.select_user_is_online(C.state, user_id):
        emit(E.ErrorOccurred, M.AlreadyInside)
        emit(E.JoinedAgain)
        return '', 403

    initial_client_state = S.select_initial_client_state(
        deepcopy(C.state), user_id)
    emit(E.InitialStateProvided, initial_client_state)

    private_rooms = [user_id]
    private_rooms.extend(S.select_user_conversation_keys(C.state, user_id))

    for room in private_rooms:
        join_room(room)

    C.dispatch(A.USER_CONNECTED, payload)

    username = S.select_user_username(C.state, user_id)
    text = f'{username} has entered the casino.'
    channels = ['lobby']
    C.send_feed_update(text, channels)
    C.send_user_update(user_id)
    return '', 200


@socketio.on(E.Disconnect, CASINO_NAMESPACE)
@is_not_permabanned
def disconnect_from_casino(v):
    user_id = str(v.id)
    payload = {'user_id': v.id}

    if not S.select_user_is_online(C.state, user_id):
        emit(E.ErrorOccurred, M.NotInsideYet)
        return '', 403

    private_rooms = [user_id]
    private_rooms.extend(S.select_user_conversation_keys(C.state, user_id))
    private_rooms.extend(S.select_game_names(C.state))

    for room in private_rooms:
        leave_room(room)

    C.dispatch(A.USER_DISCONNECTED, payload)

    username = S.select_user_username(C.state, user_id)
    text = f'{username} has exited the casino.'
    channels = ['lobby']
    C.send_feed_update(text, channels)
    C.send_user_update(user_id)
    return '', 200


@socketio.on(E.UserKickedOwnClient, CASINO_NAMESPACE)
@is_not_permabanned
def user_kicked_own_client(v):
    try:
        request_id = S.select_user_request_id(C.state, str(v.id))
        disconnect(request_id)
        return '', 200
    except:
        return '', 400


@socketio.on(E.UserSentMessage, CASINO_NAMESPACE)
@is_not_permabanned
def user_sent_message(data, v):
    text = sanitize_chat_message(data['message'])
    payload = {'user_id': v.id, 'text': text}

    if len(text) == 0:
        emit(E.ErrorOccurred, M.CannotSendEmptyMessage)
        return '', 400

    C.dispatch(A.USER_SENT_MESSAGE, payload)

    message = S.select_newest_message(C.state)
    emit(E.MessageUpdated, message, broadcast=True)
    return '', 200


@socketio.on(E.UserDeletedMessage, CASINO_NAMESPACE)
@is_not_permabanned
def user_deleted_message(data, v):
    user_id = str(v.id)
    message_id = data
    message = S.select_message(C.state, message_id)
    own_message = message['user_id'] == user_id
    payload = {'user_id': user_id, 'message_id': message_id}

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


@socketio.on(E.UserConversed, CASINO_NAMESPACE)
@is_not_permabanned
def user_conversed(data, v):
    user_id = str(v.id)
    text = sanitize_chat_message(data['message'])
    recipient = data['recipient']
    payload = {'user_id': v.id, 'text': text, 'recipient': recipient}

    if not S.select_user(C.state, recipient):
        emit(E.ErrorOccurred, M.UserNotFound)
        return '', 404

    C.dispatch(A.USER_CONVERSED, payload)

    conversation_key = B.build_conversation_key(user_id, recipient)
    user_request_id = S.select_user_request_id(C.state, user_id)
    recipient_request_id = S.select_user_request_id(C.state, recipient)
    join_room(conversation_key, user_request_id)
    join_room(conversation_key, recipient_request_id)

    conversation = S.select_conversation(C.state, conversation_key)
    emit(E.ConversationUpdated, conversation, to=conversation_key)
    return '', 200


@socketio.on(E.UserStartedGame, CASINO_NAMESPACE)
@is_not_permabanned
def user_started_game(data, v):
    user_id = str(v.id)
    game = data
    payload = {'user_id': user_id, 'game': game}

    if not game in S.select_game_names(C.state):
        emit(E.ErrorOccurred, M.GameNotFound)
        return '', 400

    C.dispatch(A.USER_STARTED_GAME, payload)

    join_room(game)

    remaining_games = list(copy(S.select_game_names(C.state)))
    remaining_games.remove(game)

    for remaining_game in remaining_games:
        leave_room(remaining_game)

    username = S.select_user_username(C.state, user_id)
    text = f'{username} started playing {game}.'
    channels = [game]
    C.send_feed_update(text, channels)
    C.send_game_update(game)

    # Games
    if game == CasinoGames.Slots:
        pass
    elif game == CasinoGames.Blackjack:
        active_game = BlackjackManager.load(v)

        if not active_game:
            active_game = BlackjackManager.wait()

        C.send_session_update(user_id, CasinoGames.Blackjack)

    return '', 200


@socketio.on(E.UserPlayedSlots, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_slots(data, v):
    user_id = str(v.id)
    currency = data['currency']
    wager = int(data['wager'])
    validated = validate_bet_request(v, currency, wager)

    if not validated:
        return '', 400

    @copy_current_request_context
    def handle_casino_slot_pull():
        with app.app_context():
            try:
                # 1. The user sees the lever pull and the slots begin.
                state = dumps(SlotsManager.start(v, currency, wager))
                payload = {'user_id': user_id, 'game_state': state}
                C.dispatch(A.USER_PLAYED_SLOTS, payload)
            except:
                return emit(E.ErrorOccurred, M.CannotPullLever, to=user_id)

            C.send_session_update(user_id, CasinoGames.Slots)

            sleep(SLOTS_PULL_DURATION)

            # 2. The game is decided some time later, and the client is updated again.
            try:
                state = dumps(SlotsManager.play(v, currency, wager))
                payload = {
                    'user_id': user_id,
                    'balances': get_balances(v),
                    'game_state': state
                }
                C.dispatch(A.USER_PLAYED_SLOTS, payload)
            except Exception as e:
                raise e
                return emit(E.ErrorOccurred, M.CannotPullLever, to=user_id)

            username = S.select_user_username(C.state, user_id)
            text = f'{username} <change me>'
            channels = ['slots']
            C.send_feed_update(text, channels)
            C.send_session_update(user_id, CasinoGames.Slots)
            C.send_user_update(user_id)

    handle_casino_slot_pull()
    return '', 200


@socketio.on(E.UserPlayedRoulette, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_roulette(data, v):
    user_id = str(v.id)
    bet = data['bet']
    which = data['which']
    currency = data['currency']
    wager = int(data['wager'])
    validated = validate_bet_request(v, currency, wager)

    if not validated:
        return '', 400

    try:
        gambler_placed_roulette_bet(v, bet, which, wager, currency)

        state = dumps({
            'bets': get_roulette_bets()
        })
        payload = {
            'user_id': user_id,
            'balances': get_balances(v),
            'game_state': state,
            'placed_bet': {
                'bet': bet,
                'which': which,
                'currency': currency,
                'wager': wager
            }
        }

        C.dispatch(A.USER_PLAYED_ROULETTE, payload)

        text = B.build_roulette_feed_entity(
            C.state,
            user_id,
            bet,
            which,
            currency,
            wager
        )
        channels = ['roulette']
        C.send_feed_update(text, channels)
        C.send_session_update(user_id, CasinoGames.Roulette)
        C.send_game_update(CasinoGames.Roulette)
        return '', 200
    except:
        emit(E.ErrorOccurred, M.CannotPlaceBet)
        return '', 400


@socketio.on(E.UserPlayedBlackjack, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_blackjack(data, v):
    user_id = str(v.id)
    action = data['action']
    active_game = BlackjackManager.load(v)

    if action == BlackjackAction.DEAL:
        if active_game:
            emit(E.ErrorOccurred, M.BlackjackGameInProgress)
            return '', 400

        currency = data['currency']
        wager = int(data['wager'])
        validated = validate_bet_request(v, currency, wager)

        if not validated:
            return '', 400

        try:
            state = dumps(BlackjackManager.start(v, currency, wager))
            payload = {
                'user_id': user_id,
                'balances': get_balances(v),
                'game_state': state
            }
            C.dispatch(A.USER_PLAYED_BLACKJACK, payload)

            C.send_session_update(user_id, CasinoGames.Blackjack)
            C.send_game_update(CasinoGames.Blackjack)
            return '', 200
        except:
            emit(E.ErrorOccurred, M.BlackjackUnableToDeal)
            return '', 400
    else:
        if not active_game:
            emit(E.ErrorOccurred, M.BlackjackNoGameInProgress)
            return '', 400

        try:
            state = dumps(BlackjackManager.play(v, action))
            payload = {
                'user_id': user_id,
                'balances': get_balances(v),
                'game_state': state
            }
            C.dispatch(A.USER_PLAYED_BLACKJACK, payload)

            C.send_session_update(user_id, CasinoGames.Blackjack)
            C.send_game_update(CasinoGames.Blackjack)
            return '', 200
        except:
            emit(E.ErrorOccurred, M.BlackjackUnableToTakeAction)
            return '', 400


@socketio.on(E.UserPlayedRacing, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_racing(data, v):
    user_id = str(v.id)
    currency = data['currency']
    wager = int(data['wager'])
    validated = validate_bet_request(v, currency, wager)

    if not validated:
        return '', 400

    try:
        kind = data['kind']
        selection = data['selection']
        placed_bet = {
            'kind': kind,
            'selection': selection,
            'currency': currency,
            'wager': wager,
        }
        successful = C.racing_manager.handle_player_bet(placed_bet, v)

        if successful:
            state = dumps(C.racing_manager.state)
            payload = {
                'user_id': user_id,
                'balances': get_balances(v),
                'game_state': state,
                'placed_bet': placed_bet
            }

            C.dispatch(A.USER_PLAYED_RACING, payload)

            text = B.build_racing_feed_entity(
                v.username,
                kind,
                selection,
                currency,
                wager
            )
            channels = [CasinoGames.Racing]
            C.send_feed_update(text, channels)
            C.send_session_update(user_id, CasinoGames.Racing)
            C.send_game_update(CasinoGames.Racing)

            emit(E.ConfirmationReceived, M.RacingBetPlacedSuccessfully)
            return 200, ''
        else:
            emit(E.ErrorOccurred, M.CannotPlaceBet)
            return 400, ''
    except:
        emit(E.ErrorOccurred, M.CannotPlaceBet)
        return 400, ''
