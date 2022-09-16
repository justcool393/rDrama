from files.helpers.wrappers import *
from files.helpers.marsey_racing import *
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

manager = None


@app.get("/marsey-racing")
@auth_required
def marsey_racing(v):
    if v.rehab:
        return render_template("casino/rehab.html", v=v)

    global manager

    if not manager:
        manager = MarseyRacingManager()

    return render_template("casino/marsey_racing_screen.html", v=v, state=manager.state)


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
    global manager

    if manager:
        emit(MarseyRacingEvent.UPDATE_STATE, manager.state)
        return '', 204


@socketio.on(MarseyRacingEvent.START_RACE)
@auth_required
def start_race(data, v):
    global manager

    if manager:
        manager.start_race()
        emit(MarseyRacingEvent.UPDATE_STATE, manager.state)
        return '', 204


@socketio.on(MarseyRacingEvent.USER_PLACED_BET)
@auth_required
def user_placed_bet(data, v):
    global manager

    if manager:
        successful = manager.handle_player_bet(data, v)

        if successful:
            emit(event=MarseyRacingEvent.BET_SUCCEEDED, broadcast=False)
            emit(MarseyRacingEvent.UPDATE_STATE, manager.state)
            return '', 204
        else:
            emit(event=MarseyRacingEvent.BET_FAILED, broadcast=False)
            return '', 400
