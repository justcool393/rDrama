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


@app.get("/marsey-racing")
@auth_required
def marsey_racing(v):
    if v.rehab:
        return render_template("casino/rehab.html", v=v)

    state = do_the_thing()

    return render_template("casino/marsey_racing_screen.html", v=v, state=json.dumps(state))


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
    emit(MarseyRacingEvent.UPDATE_STATE, { "foo": "bar" })

    return '', 204