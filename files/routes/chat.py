from copy import copy
import enum
import time
import uuid
from files.helpers.jinja2 import timestamp
from files.helpers.wrappers import *
from files.helpers.sanitize import sanitize
from files.helpers.const import *
from files.helpers.alerts import *
from files.helpers.regex import *
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


class CasinoGames(str, Enum):
	Slots = "slots"
	Blackjack = "blackjack"
	Roulette = "roulette"
	Racing = "racing"
	Crossing = "crossing"


class CasinoActions(str, Enum):
	USER_CONNECTED = "USER_CONNECTED"
	USER_DISCONNECTED = "USER_DISCONNECTED"
	USER_SENT_MESSAGE = "USER_SENT_MESSAGE"
	USER_DELETED_MESSAGE = "USER_DELETED_MESSAGE"
	USER_STARTED_GAME = "USER_STARTED_GAME"


class CasinoManager():
	# Builders
	@staticmethod
	def build_user_entity(user_id, request_id):
		user_account = get_account(user_id, graceful=True)

		return {
			'id': str(user_id),
			'request_id': request_id,
			'account': user_account.json,
			'online': True,
			'balances': {
				'coins': user_account.coins,
				'procoins': user_account.procoins
			}
		}

	@staticmethod
	def build_message_entity(user_id, text):
		message_id = str(uuid.uuid4())

		return {
			'id': message_id,
			'user_id': user_id,
			'text': text,
			'timestamp': int(time.time())
		}

	@staticmethod
	def build_conversation_key(user_id_a, user_id_b):
		participants = sorted((str(user_id_a), str(user_id_b)))
		return '#'.join(participants)

	@staticmethod
	def build_conversation_entity(conversation_key, participant_a, participant_b):
		return {
			'id': conversation_key,
			'participants': (participant_a, participant_b),
			'messages': {
				'all': [],
				'by_id': {}
			}
		}

	@staticmethod
	def build_feed_entity(user_id, game, currency, amount, description):
		feed_id = str(uuid.uuid4())

		return {
			'id': feed_id,
			'user_id': user_id,
			'game': game,
			'currency': currency,
			'amount': amount,
			'description': description,
			'timestamp': int(time.time())
		}

	@staticmethod
	def build_game_entity(name):
		return {
			'id': name,
			'name': name,
			'user_ids': []
		}

	# Selectors
	@staticmethod
	def select_available_games(from_state):
		return from_state['games']['all']

	@staticmethod
	def select_user_in_game(from_state, game, user_id):
		return user_id in from_state['games']['by_id'][game]['user_ids']

	@staticmethod
	def select_user(from_state, user_id):
		return from_state['users']['by_id'].get(user_id)

	@staticmethod
	def select_message(from_state, message_id):
		return from_state['messages']['by_id'].get(message_id)

	@staticmethod
	def select_conversation(from_state, conversation_key):
		return from_state['conversations']['by_id'].get(conversation_key)

	@staticmethod
	def select_client_state(from_state):
		client_state = deepcopy(from_state)
		users = client_state['users']

		for user_id in users['all']:
			user = users['by_id'][user_id]
			del user['request_id']

		return client_state

	@staticmethod
	def get_initial_state():
		[slots, blackjack, roulette, racing, crossing] = [
			CasinoManager.build_game_entity(CasinoGames.Slots),
			CasinoManager.build_game_entity(CasinoGames.Blackjack),
			CasinoManager.build_game_entity(CasinoGames.Roulette),
			CasinoManager.build_game_entity(CasinoGames.Racing),
			CasinoManager.build_game_entity(CasinoGames.Crossing),
		]

		return {
			'users': {
				'all': [],
				'by_id': {}
			},
			'messages': {
				'all': [],
				'by_id': {}
			},
			'conversations': {
				'all': [],
				'by_id': {}
			},
			'feed': {
				'all': [],
				'by_id': {}
			},
			'leaderboards': {
				'all': [],
				'by_id': {}
			},
			'games': {
				'all': [slots['id'], blackjack['id'], roulette['id'], racing['id'], crossing['id']],
				'by_id': {
					CasinoGames.Slots: slots,
					CasinoGames.Blackjack: blackjack,
					CasinoGames.Roulette: roulette,
					CasinoGames.Racing: racing,
					CasinoGames.Crossing: crossing,
				}
			}
		}

	# Middleware
	@staticmethod
	def log_middleware(action, payload):
		print(
			f'Casino Manager) {action} dispatched with a payload of {json.dumps(payload)}')
		return action, payload

	def __init__(self):
		self.state = CasinoManager.get_initial_state()
		self.state_history = []
		self.middleware = []

		if app.config["SERVER_NAME"] == 'localhost':
			self.middleware.append(CasinoManager.log_middleware)

		self.action_handlers = {
			CasinoActions.USER_CONNECTED: self.handle_user_connected,
			CasinoActions.USER_DISCONNECTED: self.handle_user_disconnected,
			CasinoActions.USER_SENT_MESSAGE: self.handle_user_sent_message,
			CasinoActions.USER_DELETED_MESSAGE: self.handle_user_deleted_message,
			CasinoActions.USER_STARTED_GAME: self.handle_user_started_game
		}

	def dispatch(self, action, payload=None):
		for middleware in self.middleware:
			action, payload = middleware(action, payload)

		handler = self.action_handlers[action]

		if not handler:
			raise Exception(f"Invalid action {action} passed to CasinoManager#dispatch")

		self.state_history.append(copy(self.state))
		next_state = copy(self.state)
		self.state = handler(next_state, payload)

		emit(CasinoEvents.StateChanged,
		     CasinoManager.select_client_state(self.state), broadcast=True)

	# Action Handlers
	def handle_user_connected(self, next_state, payload):
		user_id = str(payload['user_id'])
		request_id = payload['request_id']
		existing_user = CasinoManager.select_user(next_state, user_id)

		if existing_user:
			existing_user['request_id'] = request_id
			existing_user['online'] = True
		else:
			user = CasinoManager.build_user_entity(user_id, request_id)
			next_state['users']['all'].append(user_id)
			next_state['users']['by_id'][user_id] = user

		return next_state

	def handle_user_disconnected(self, next_state, payload):
		user_id = str(payload)
		user = next_state['users']['by_id'].get(user_id)

		if user:
			user['online'] = False

		return next_state

	def handle_user_sent_message(self, next_state, payload):
		recipient = payload['recipient']

		if recipient:
			# Direct Message
			return self.handle_user_conversed(next_state, payload)
		else:
			user_id = payload['user_id']
			text = payload['text']
			message = CasinoManager.build_message_entity(user_id, text)
			next_state['messages']['all'].append(message['id'])
			next_state['messages']['by_id'][message['id']] = message

		return next_state

	def handle_user_conversed(self, next_state, payload):
		user_id = str(payload['user_id'])
		recipient = payload['recipient']
		text = payload['text']
		message = CasinoManager.build_message_entity(user_id, text)
		conversation_key = CasinoManager.build_conversation_key(user_id, recipient)
		conversation = CasinoManager.select_conversation(
			next_state, conversation_key)

		if not conversation:
			conversation = CasinoManager.build_conversation_entity(
				conversation_key, user_id, recipient)
			next_state['conversations']['all'].append(conversation['id'])
			next_state['conversations']['by_id'][conversation['id']] = conversation

		conversation['messages']['all'].append(message['id'])
		conversation['messages']['by_id'].append(message)

		return next_state

	def handle_user_deleted_message(self, next_state, payload):
		message_id = payload

		try:
			next_state['messages']['all'].remove(message_id)
			del next_state['messages']['by_id'][message_id]
		except:
			pass  # The message did not exist.

		return next_state

	def handle_user_started_game(self, next_state, payload):
		user_id = str(payload['user_id'])
		game = payload['game']
		existing_user_in_game = CasinoManager.select_user_in_game(next_state, game, user_id)

		if not existing_user_in_game:
			next_state['games']['by_id'][game]['user_ids'].append(user_id)

		remaining_games = list(copy(next_state['games']['all']))
		remaining_games.remove(game)

		for remaining_game in remaining_games:
			users_in_game = next_state['games']['by_id'][remaining_game]['user_ids']
			
			if user_id in users_in_game:
				users_in_game.remove(user_id)

		return next_state


casino_manager = CasinoManager()


class CasinoEvents(str, Enum):
	# Incoming
	Connect = "connect"
	Disconnect = "disconnect"
	UserSentMessage = "user-sent-message"
	UserDeletedMessage = "user-deleted-message"
	UserStartedGame = "user-started-game"

	# Outgoing
	StateChanged = "state-changed"
	ErrorOccurred = "error-occurred"
	ConfirmationReceived = "confirmation-received"


MESSAGE_MAX_LENGTH = 1000


@socketio.on(CasinoEvents.Connect)
@is_not_permabanned
def connect_to_casino(v):
	payload = {'user_id': v.id, 'request_id': request.sid}
	casino_manager.dispatch(CasinoActions.USER_CONNECTED, payload)
	return '', 200


@socketio.on(CasinoEvents.Disconnect)
@is_not_permabanned
def disconnect_from_casino(v):
	payload = v.id
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
	message = CasinoManager.select_message(casino_manager.state, message_id)

	if not message:
		emit(CasinoEvents.ErrorOccurred, "That message does not exist.")
		return '', 404

	if message['user_id'] != v.id and v.admin_level < 2:
		emit(CasinoEvents.ErrorOccurred,
		     "You do not have permission to delete that message.")
		return '', 403

	payload = message_id
	casino_manager.dispatch(CasinoActions.USER_DELETED_MESSAGE, payload)
	emit(CasinoEvents.ConfirmationReceived, "Successfully deleted a message.")
	return '', 200


@socketio.on(CasinoEvents.UserStartedGame)
@is_not_permabanned
def user_started_game(data, v):
	game = data

	if not game in CasinoManager.select_available_games(casino_manager.state):
		emit(CasinoEvents.ErrorOccurred, "That game does not exist.")
		return '', 400

	payload = {'user_id': v.id, 'game': game}
	casino_manager.dispatch(CasinoActions.USER_STARTED_GAME, payload)
	return '', 200
#endregion
