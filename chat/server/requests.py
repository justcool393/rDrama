from time import time
from json import dumps
from copy import copy
from flask import copy_current_request_context
from flask_socketio import emit, disconnect, join_room, leave_room
from chat.server.games.racing import MarseyRacingManager
from files.helpers.twentyone import BlackjackAction
from files.routes.chat import socketio
from files.helpers.wrappers import *
from files.helpers.const import *
from files.helpers.alerts import *
from files.helpers.regex import *
from gevent import sleep
from .builders import CasinoBuilders as B
from .config import SLOTS_PULL_DURATION
from .enums import CasinoActions as A, CasinoEvents as E, CasinoGames, CasinoMessages as M
from .games import MarseyRacingManager, \
    SlotsManager, \
    gambler_placed_roulette_bet, \
    get_roulette_bets, \
    get_active_twentyone_game, \
    create_new_game as create_new_blackjack_game, \
    dispatch_action as dispatch_blackjack_action, \
    build_started_state as build_slots_start_state
from .helpers import meets_minimum_wager, can_user_afford, sanitize_chat_message
from .manager import CasinoManager
from .selectors import CasinoSelectors as S

C = CasinoManager.instance
CASINO_NAMESPACE = "/casino"


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
        C.racing_manager = MarseyRacingManager()
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
    user = S.select_user(C.state, str(v.id))
    emit(E.UserUpdated, user, broadcast=True)

    channels = ['lobby']
    username = S.select_user_username(C.state, user_id)
    text = f'{username} has entered the casino.'
    feed = C.add_feed(channels, text)

    for channel in channels:
        emit(E.FeedUpdated, feed, broadcast=False, to=channel)
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

    user = S.select_user(C.state, str(v.id))
    emit(E.UserUpdated, user, broadcast=True)

    channels = ['lobby']
    username = S.select_user_username(C.state, user_id)
    text = f'{username} has exited the casino.'
    feed = C.add_feed(channels, text)

    for channel in channels:
        emit(E.FeedUpdated, feed, to=channel)

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

    channels = [game]
    username = S.select_user_username(C.state, str(v.id))
    text = f'{username} started playing {game}.'
    feed = C.add_feed(channels, text)

    for channel in channels:
        emit(E.FeedUpdated, feed, to=channel)

    game = S.select_game(C.state, game)
    emit(E.GameUpdated, game)

    return '', 200


@socketio.on(E.UserPlayedSlots, CASINO_NAMESPACE)
@is_not_permabanned
def user_played_slots(data, v):
    user_id = str(v.id)
    currency = data['currency']
    wager = int(data['wager'])

    if not meets_minimum_wager(wager):
        emit(E.ErrorOccurred, M.MinimumWagerNotMet)
        return '', 400

    if not can_user_afford(v, currency, wager):
        emit(E.ErrorOccurred, M.CannotAffordBet)
        return '', 400

    @copy_current_request_context
    def handle_casino_slot_pull():
        with app.app_context():
            def send_session_update():
                session_key = B.build_session_key(user_id, CasinoGames.Slots)
                session = S.select_session(C.state, session_key)
                emit(E.SessionUpdated, session, to=user_id)

            # 1. The user sees the lever pull and the slots begin.
            payload = {
                'user_id': user_id,
                'game_state': dumps(build_slots_start_state())
            }
            C.dispatch(A.USER_PLAYED_SLOTS, payload)

            send_session_update()

            sleep(SLOTS_PULL_DURATION)

            # 2. The game is decided some time later, and the client is updated again.
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

                send_session_update()

                channels = ['slots']
                username = S.select_user_username(C.state, user_id)
                text = f'{username} <change me>'
                feed = C.add_feed(channels, text)

                for channel in channels:
                    emit(E.FeedUpdated, feed, to=channel)

                user = S.select_user(C.state, user_id)
                emit(E.UserUpdated, user, broadcast=True)
            else:
                emit(E.ErrorOccurred, M.CannotPullLever, to=user_id)

    handle_casino_slot_pull()
    return '', 200


@socketio.on(E.UserPlayedRoulette, CASINO_NAMESPACE)
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
        emit(E.GameUpdated, game, broadcast=True)

        session_key = B.build_session_key(str(v.id), CasinoGames.Roulette)
        session = S.select_session(C.state, session_key)
        emit(E.SessionUpdated, session, broadcast=True)

        channels = ['roulette']
        text = S.select_roulette_bet_feed_item(
            C.state,
            str(v.id),
            bet,
            which,
            currency,
            wager
        )
        feed = C.add_feed(channels, text)

        for channel in channels:
            emit(E.FeedUpdated, feed, to=channel)

        return '', 200
    except:
        emit(E.ErrorOccurred, M.CannotPlaceBet)
        return '', 400


@socketio.on(E.UserPlayedBlackjack, CASINO_NAMESPACE)
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
            emit(E.GameUpdated, game, broadcast=True)

            session_key = B.build_session_key(str(v.id), CasinoGames.Blackjack)
            session = S.select_session(C.state, session_key)
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


@socketio.on(E.UserPlayedRacing, CASINO_NAMESPACE)
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
            emit(E.GameUpdated, game, broadcast=True)

            session_key = B.build_session_key(user_id, CasinoGames.Racing)
            session = S.select_session(C.state, session_key)
            emit(E.SessionUpdated, session, broadcast=True)

            channels = ['roulette']
            text = S.select_racing_bet_feed_item(
                C.state,
                str(v.id),
                kind,
                selection,
                currency,
                wager
            )
            feed = C.add_feed(channels, text)

            for channel in channels:
                emit(E.FeedUpdated, feed, to=channel)

            emit(E.ConfirmationReceived, M.RacingBetPlacedSuccessfully)
            return 200, ''
        else:
            emit(E.ErrorOccurred, M.CannotPlaceBet)
            return 400, ''
    except:
        emit(E.ErrorOccurred, M.CannotPlaceBet)
        return 400, ''
