from files.helpers.wrappers import *
from files.helpers.marsey_racing import *
from files.helpers.chat import ChatEvent, ChatManager
from files.__main__ import app, limiter, cache
from flask_socketio import SocketIO, emit

if SITE == 'localhost':
    socketio = SocketIO(
        app,
        async_mode='gevent',
        logger=True,
        engineio_logger=True,
        debug=True
    )
else:
    socketio = SocketIO(app, async_mode='gevent')

racing_manager = None
chat_manager = None


@app.get("/marsey-racing")
@is_not_permabanned
def marsey_racing(v):
    if v.rehab:
        return render_template("casino/rehab.html", v=v)

    global racing_manager, chat_manager

    if not racing_manager:
        racing_manager = MarseyRacingManager()

    if not chat_manager:
        chat_manager = ChatManager()

    return render_template("casino/marsey_racing_screen.html", v=v, state=racing_manager.state)


@app.get("/socketio.min.js")
def socketio_min_js():
    resp = make_response(send_from_directory('assets', 'js/socketio.min.js'))
    return resp


@app.get("/marsey_racing.js")
def marsey_racing_js():
    resp = make_response(send_from_directory('assets', 'js/marsey_racing.js'))
    return resp


@socketio.on(MarseyRacingEvent.CONNECT)
@auth_required
def connect(v):
    global racing_manager, chat_manager

    if racing_manager:
        emit(MarseyRacingEvent.UPDATE_STATE, racing_manager.state, broadcast=True)

    if chat_manager:
        chat_manager.handle_user_connected(v)
        emit(ChatEvent.CHAT_STATE_UPDATED, chat_manager.state, broadcast=True)

    return '', 204


@socketio.on(MarseyRacingEvent.DISCONNECT)
@auth_required
def disconnect(v):
    global racing_manager, chat_manager

    if chat_manager:
        chat_manager.handle_user_disconnected(v)
        emit(ChatEvent.CHAT_STATE_UPDATED, chat_manager.state, broadcast=True)
        return '', 204
    else:
        return '', 400


@socketio.on(MarseyRacingEvent.START_RACE)
@auth_required
def start_race(v):
    global racing_manager

    if racing_manager:
        racing_manager.start_race()
        emit(MarseyRacingEvent.UPDATE_STATE, racing_manager.state, broadcast=True)
        return '', 204
    else:
        return '', 400


@socketio.on(MarseyRacingEvent.USER_PLACED_BET)
@auth_required
def user_placed_bet(data, v):
    global racing_manager

    if racing_manager:
        successful = racing_manager.handle_player_bet(data, v)

        if successful:
            emit(event=MarseyRacingEvent.BET_SUCCEEDED, broadcast=False)
            emit(MarseyRacingEvent.UPDATE_STATE, racing_manager.state, broadcast=True)
            return '', 204
        else:
            emit(event=MarseyRacingEvent.BET_FAILED, broadcast=False)
            return '', 400
    else:
        return '', 400


@socketio.on(ChatEvent.USER_TYPED)
@is_not_permabanned
def user_typed(data, v):
    global chat_manager

    if chat_manager:
        chat_manager.handle_user_typing(v, data)
        emit(ChatEvent.CHAT_STATE_UPDATED, chat_manager.state, broadcast=True)
        return '', 204
    else:
        return '', 400


@socketio.on(ChatEvent.USER_SPOKE)
@limiter.limit("3/second;10/minute")
@limiter.limit("3/second;10/minute", key_func=lambda: f'{SITE}-{session.get("lo_user")}')
@is_not_permabanned
def user_spoke(data, v):
    global chat_manager

    if chat_manager:
        succeeded, _ = chat_manager.handle_user_spoke(v, data)

        if succeeded:
            emit(ChatEvent.CHAT_STATE_UPDATED, chat_manager.state, broadcast=True)
            return '', 204
        else:
            emit(event=ChatEvent.MESSAGE_FAILED, broadcast=False)
            return '', 400
    else:
        return '', 400


@socketio.on(ChatEvent.MESSAGE_DELETED)
@admin_level_required(2)
def message_deleted(deleted_text, _):
    global chat_manager

    if chat_manager:
        chat_manager.handle_message_deleted(deleted_text)
        emit(ChatEvent.CHAT_STATE_UPDATED, chat_manager.state, broadcast=True)
        return '', 204
    else:
        return '', 400
