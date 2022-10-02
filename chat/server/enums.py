from enum import Enum

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
	USER_PULLED_SLOTS = "USER_PULLED_SLOTS"
	USER_PLAYED_ROULETTE = "USER_PLAYED_ROULETTE"


class CasinoEvents(str, Enum):
	# Incoming
	Connect = "connect"
	Disconnect = "disconnect"
	UserSentMessage = "user-sent-message"
	UserDeletedMessage = "user-deleted-message"
	UserStartedGame = "user-started-game"
	UserPulledSlots = "user-pulled-slots"
	UserPlayedRoulette = "user-played-roulette"

	# Outgoing
	StateChanged = "state-changed"
	ErrorOccurred = "error-occurred"
	ConfirmationReceived = "confirmation-received"