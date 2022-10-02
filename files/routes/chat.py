from copy import copy
import time
import uuid
from chat.server import CasinoActions, CasinoEvents, CasinoManager, CasinoSelectors, MESSAGE_MAX_LENGTH, meets_minimum_wager, can_user_afford
from files.helpers.jinja2 import timestamp
from files.helpers.wrappers import *
from files.helpers.sanitize import sanitize
from files.helpers.const import *
from files.helpers.alerts import *
from files.helpers.regex import *
from files.helpers.slots import casino_slot_pull
from files.helpers.roulette import gambler_placed_roulette_bet, get_roulette_bets
from flask_socketio import SocketIO, emit
from files.__main__ import app, limiter, cache
from flask import render_template
import sys
import atexit

if SITE == 'localhost':
	socketio = SocketIO(
		app,
		async_mode='gevent',
		logger=True,
		engineio_logger=True,
		debug=True
	)
else:
	socketio = SocketIO(
		app,
		async_mode='gevent',
	)

#region Chat
typing = []
online = []
cache.set(ONLINE_STR, len(online), timeout=0)
muted = cache.get(f'{SITE}_muted') or {}
messages = cache.get(f'{SITE}_chat') or []
total = cache.get(f'{SITE}_total') or 0
socket_ids_to_user_ids = {}
user_ids_to_socket_ids = {}

@app.get("/chat")
@is_not_permabanned
def chat(v):
	return render_template("chat.html", v=v, messages=messages)


@socketio.on('speak')
@limiter.limit("3/second;10/minute")
@limiter.limit("3/second;10/minute", key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@is_not_permabanned
def speak(data, v):
	if v.is_banned: return '', 403

	vname = v.username.lower()
	if vname in muted:
		if time.time() < muted[vname]: return '', 403
		else: del muted[vname]

	global messages, total

	if SITE == 'rdrama.net': text = data['message'][:200].strip()
	else: text = data['message'][:1000].strip()

	if not text: return '', 403
	text_html = sanitize(text, count_marseys=True)
	quotes = data['quotes']
	recipient = data['recipient']
	data={
		"id": str(uuid.uuid4()),
		"quotes": quotes,
		"avatar": v.profile_url,
		"hat": v.hat_active,
		"user_id": v.id,
		"dm": bool(recipient and recipient != ""),
		"username": v.username,
		"namecolor": v.name_color,
		"text": text,
		"text_html": text_html,
		"base_text_censored": censor_slurs(text, 'chat'),
		"text_censored": censor_slurs(text_html, 'chat'),
		"time": int(time.time()),
	}
	
	if v.shadowbanned:
		emit('speak', data)
	elif blackjack and any(i in text.lower() for i in blackjack.split()):
		emit('speak', data)
		v.shadowbanned = 'AutoJanny'
		g.db.add(v)
		send_repeatable_notification(CARP_ID, f"{v.username} has been shadowbanned because of a chat message.")
	elif recipient:
		if user_ids_to_socket_ids.get(recipient):
			recipient_sid = user_ids_to_socket_ids[recipient]
			emit('speak', data, broadcast=False, to=recipient_sid)
	else:
		emit('speak', data, broadcast=True)
		messages.append(data)
		messages = messages[-100:]

	total += 1

	if v.admin_level > 1:
		text = text.lower()
		for i in mute_regex.finditer(text):
			username = i.group(1).lower()
			duration = int(int(i.group(2)) * 60 + time.time())
			muted[username] = duration

	typing = []
	return '', 204

@socketio.on('connect')
@is_not_permabanned
def connect(v):
	if v.username not in online:
		online.append(v.username)
		emit("online", online, broadcast=True)
		cache.set(ONLINE_STR, len(online), timeout=0)

	if not socket_ids_to_user_ids.get(request.sid):
		socket_ids_to_user_ids[request.sid] = v.id
		user_ids_to_socket_ids[v.id] = request.sid

	emit('online', online)
	emit('catchup', messages)
	emit('typing', typing)
	return '', 204


@socketio.on('disconnect')
@is_not_permabanned
def disconnect(v):
	if v.username in online:
		online.remove(v.username)
		emit("online", online, broadcast=True)
		cache.set(ONLINE_STR, len(online), timeout=0)

	if v.username in typing: typing.remove(v.username)

	if socket_ids_to_user_ids.get(request.sid):
		del socket_ids_to_user_ids[request.sid]
		del user_ids_to_socket_ids[v.id]

	emit('typing', typing, broadcast=True)
	return '', 204


@socketio.on('typing')
@is_not_permabanned
def typing_indicator(data, v):

	if data and v.username not in typing: typing.append(v.username)
	elif not data and v.username in typing: typing.remove(v.username)

	emit('typing', typing, broadcast=True)
	return '', 204


@socketio.on('delete')
@admin_level_required(2)
def delete(text, v):

	for message in messages:
		if message['text'] == text:
			messages.remove(message)

	emit('delete', text, broadcast=True)

	return '', 204


def close_running_threads():
	cache.set(f'{SITE}_chat', messages)
	cache.set(f'{SITE}_total', total)
	cache.set(f'{SITE}_muted', muted)
atexit.register(close_running_threads)
#endregion

#region Casino
casino_manager = CasinoManager()


@socketio.on(CasinoEvents.Connect)
@is_not_permabanned
def connect_to_casino(v):
	payload = {'user_id': v.id, 'request_id': request.sid}
	casino_manager.dispatch(CasinoActions.USER_CONNECTED, payload)
	return '', 200


@socketio.on(CasinoEvents.Disconnect)
@is_not_permabanned
def disconnect_from_casino(v):
	payload = {'user_id': v.id}
	casino_manager.dispatch(CasinoActions.USER_DISCONNECTED, payload)
	return '', 200


@socketio.on(CasinoEvents.UserSentMessage)
@is_not_permabanned
def user_sent_message(data, v):
	# TODO: Formatting helper to implement sanitization.
	text = data['message'][:MESSAGE_MAX_LENGTH].strip()
	recipient = data.get('recipient')
	payload = {'user_id': v.id, 'text': text, 'recipient': recipient}
	casino_manager.dispatch(CasinoActions.USER_SENT_MESSAGE, payload)
	return '', 200


@socketio.on(CasinoEvents.UserDeletedMessage)
@is_not_permabanned
def user_deleted_message(data, v):
	message_id = data
	message = CasinoSelectors.select_message(casino_manager.state, message_id)

	if not message:
		emit(CasinoEvents.ErrorOccurred, "That message does not exist.")
		return '', 404

	if message['user_id'] != v.id and v.admin_level < 2:
		emit(CasinoEvents.ErrorOccurred,
		     "You do not have permission to delete that message.")
		return '', 403

	payload = {'message_id': message_id}
	casino_manager.dispatch(CasinoActions.USER_DELETED_MESSAGE, payload)
	emit(CasinoEvents.ConfirmationReceived, "Successfully deleted a message.")
	return '', 200


@socketio.on(CasinoEvents.UserStartedGame)
@is_not_permabanned
def user_started_game(data, v):
	game = data

	if not game in CasinoSelectors.select_available_games(casino_manager.state):
		emit(CasinoEvents.ErrorOccurred, "That game does not exist.")
		return '', 400

	payload = {'user_id': v.id, 'game': game}
	casino_manager.dispatch(CasinoActions.USER_STARTED_GAME, payload)
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
		payload = {'user_id': v.id, 'balances': balances, 'game_state': game_state}
		casino_manager.dispatch(CasinoActions.USER_PULLED_SLOTS, payload)
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
		casino_manager.dispatch(CasinoActions.USER_PLAYED_ROULETTE, payload)
		return '', 200
	except:
		emit(CasinoEvents.ErrorOccurred, "Unable to place bet.")
		return '', 400


#endregion
