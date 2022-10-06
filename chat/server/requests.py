from json import dumps
from copy import copy
from flask_socketio import emit, disconnect, join_room, leave_room
from chat.server.games.racing import MarseyRacingManager
from files.helpers.twentyone import BlackjackAction
from files.routes.chat import socketio
from files.helpers.wrappers import *
from files.helpers.const import *
from files.helpers.alerts import *
from files.helpers.regex import *
from .builders import CasinoBuilders as B
from .enums import CasinoActions as A, CasinoEvents as E, CasinoGames, CasinoMessages as M
from .games import MarseyRacingManager, \
    casino_slot_pull, \
    gambler_placed_roulette_bet, \
    get_roulette_bets, \
    get_active_twentyone_game, \
    create_new_game as create_new_blackjack_game, \
    dispatch_action as dispatch_blackjack_action
from .helpers import meets_minimum_wager, can_user_afford, sanitize_chat_message
from .manager import CasinoManager
from .selectors import CasinoSelectors as S

C = CasinoManager.instance


@socketio.on(E.Connect)
@is_not_permabanned
def connect_to_casino(v):
    if not C.instance.racing_manager:
        C.instance.racing_manager = MarseyRacingManager()
        C.dispatch(A.RACING_STATE_INITIALIZED, {
                   'game_state': dumps(C.instance.racing_manager.state)})

    user_id = str(v.id)
    payload = {'user_id': v.id, 'request_id': request.sid}

    # if S.select_user_is_online(C.state, user_id):
    #     emit(E.ErrorOccurred, M.AlreadyInside)
    #     emit(E.JoinedAgain)
    #     return '', 403

    private_rooms = [user_id]
    private_rooms.extend(S.select_user_conversation_keys(C.state, user_id))

    for room in private_rooms:
        join_room(room)

    C.dispatch(A.USER_CONNECTED, payload)

    user = S.select_user(C.state, str(v.id))
    emit(E.UserUpdated, user, broadcast=True)

    feed = S.select_newest_feed(C.state)
    emit(E.FeedUpdated, feed, broadcast=True)

    emit(E.InitialStateProvided, C.state)
    return '', 200


@socketio.on(E.Disconnect)
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

    if len(text) == 0:
        emit(E.ErrorOccurred, M.CannotSendEmptyMessage)
        return '', 400

    C.dispatch(A.USER_SENT_MESSAGE, payload)

    message = S.select_newest_message(C.state)
    emit(E.MessageUpdated, message, broadcast=True)
    return '', 200


@socketio.on(E.UserDeletedMessage)
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


@socketio.on(E.UserConversed)
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


@socketio.on(E.UserStartedGame)
@is_not_permabanned
def user_started_game(data, v):
    game = data
    payload = {'user_id': v.id, 'game': game}

    if not game in S.select_game_names(C.state):
        emit(E.ErrorOccurred, M.GameNotFound)
        return '', 400

    C.dispatch(A.USER_STARTED_GAME, payload)

    join_room(game)

    remaining_games = list(copy(S.select_game_names(C.state)))
    remaining_games.remove(game)

    for remaining_game in remaining_games:
        leave_room(remaining_game)

    feed = S.select_newest_feed(C.state)
    emit(E.FeedUpdated, feed, broadcast=True)

    game = S.select_game(C.state, game)
    emit(E.GameUpdated, game)
    return '', 200


@socketio.on(E.UserPlayedSlots)
@is_not_permabanned
def user_played_slots(data, v):
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

        C.dispatch(A.USER_PLAYED_SLOTS, payload)
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
            'user_id': str(v.id),
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


@socketio.on(E.UserPlayedBlackjack)
@is_not_permabanned
def user_played_blackjack(data, v):
    action = data['action']
    active_game = get_active_twentyone_game(v)
    balances = {
        'coins': v.coins,
        'procoins': v.procoins
    }

    if action == BlackjackAction.DEAL:
        currency = data['currency']
        wager = int(data['wager'])

        if active_game:
            emit(E.ErrorOccurred, M.BlackjackGameInProgress)
            return '', 400

        if not meets_minimum_wager(wager):
            emit(E.ErrorOccurred, M.MinimumWagerNotMet)
            return '', 400

        if not can_user_afford(v, currency, wager):
            emit(E.ErrorOccurred, M.CannotAffordBet)
            return '', 400

        try:
            create_new_blackjack_game(v, wager, currency)

            game_state = dumps(
                dispatch_blackjack_action(v, BlackjackAction.DEAL))
            placed_bet = {
                'currency': currency,
                'wager': wager
            }
            payload = {
                'user_id': str(v.id),
                'balances': balances,
                'game_state': game_state,
                'placed_bet': placed_bet
            }

            C.dispatch(A.USER_PLAYED_BLACKJACK, payload)

            game = S.select_game(C.state, CasinoGames.Blackjack)
            session_key = B.build_session_key(str(v.id), CasinoGames.Blackjack)
            session = S.select_session(C.state, session_key)

            emit(E.GameUpdated, game, broadcast=True)
            emit(E.SessionUpdated, session, broadcast=True)
            return '', 200
        except:
            emit(E.ErrorOccurred, M.BlackjackUnableToDeal)
            return '', 400
    else:
        if not active_game:
            emit(E.ErrorOccurred, M.BlackjackNoGameInProgress)
            return '', 400

        try:
            game_state = dumps(dispatch_blackjack_action(v, action))
            payload = {
                'user_id': str(v.id),
                'balances': balances,
                'game_state': game_state,
            }

            C.dispatch(A.USER_PLAYED_BLACKJACK, payload)

            game = S.select_game(C.state, CasinoGames.Blackjack)
            session_key = B.build_session_key(str(v.id), CasinoGames.Blackjack)
            session = S.select_session(C.state, session_key)

            emit(E.GameUpdated, game, broadcast=True)
            emit(E.SessionUpdated, session, broadcast=True)
            return '', 200
        except:
            emit(E.ErrorOccurred, M.BlackjackUnableToTakeAction)
            return '', 400


@socketio.on(E.UserPlayedRacing)
@is_not_permabanned
def user_played_racing(data, v):
    currency = data['currency']
    wager = int(data['wager'])

    if not meets_minimum_wager(wager):
        emit(E.ErrorOccurred, M.MinimumWagerNotMet)
        return '', 400

    if not can_user_afford(v, currency, wager):
        emit(E.ErrorOccurred, M.CannotAffordBet)
        return '', 400

    try:
        user_id = str(v.id)
        kind = data['kind']
        selection = data['selection']
        racing_bet = {
            'kind': kind,
            'selection': selection,
            'wager': {
                'amount': wager,
                'currency': currency
            }
        }
        successful = C.racing_manager.handle_player_bet(racing_bet, v)

        if successful:
            game_state = dumps(C.racing_manager.state)
            balances = {
                'coins': v.coins,
                'procoins': v.procoins
            }
            placed_bet = {
                'kind': kind,
                'selection': selection,
                'currency': currency,
                'wager': wager
            }
            payload = {
                'user_id': user_id,
                'balances': balances,
                'game_state': game_state,
                'placed_bet': placed_bet
            }

            C.dispatch(A.USER_PLAYED_RACING, payload)

            game = S.select_game(C.state, CasinoGames.Racing)
            session_key = B.build_session_key(user_id, CasinoGames.Racing)
            session = S.select_session(C.state, session_key)
            feed = S.select_newest_feed(C.state)
            emit(E.GameUpdated, game, broadcast=True)
            emit(E.SessionUpdated, session, broadcast=True)
            emit(E.FeedUpdated, feed, broadcast=True)
            emit(E.ConfirmationReceived, M.RacingBetPlacedSuccessfully)
            return 200, ''
        else:
            emit(E.ErrorOccurred, M.CannotPlaceBet)
            return 400, ''
    except Exception as e:
        print("\n\n\n\n\n")
        print("\n\n\n\n\n")
        print("\n\n\n\n\n")
        print(e)
        emit(E.ErrorOccurred, M.CannotPlaceBet)
        return 400, ''
