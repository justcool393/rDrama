from enum import Enum
from .config import MINIMUM_WAGER

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
	USER_CONVERSED = "USER_CONVERSED"
	USER_STARTED_GAME = "USER_STARTED_GAME"
	USER_PULLED_SLOTS = "USER_PULLED_SLOTS"
	USER_PLAYED_ROULETTE = "USER_PLAYED_ROULETTE"


class CasinoClientActions(str, Enum):
  USER_UPDATED = "USER_UPDATED"
  MESSAGE_UPDATED = "MESSAGE_UPDATED"
  CONVERSATION_UPDATED = "CONVERSATION_UPDATED"
  FEED_UPDATED = "FEED_UPDATED"
  LEADERBOARD_UPDATED = "LEADERBOARD_UPDATED"
  GAME_UPDATED = "GAME_UPDATED"
  SESSION_UPDATED = "SESSION_UPDATED"


class CasinoEvents(str, Enum):
	# Incoming
	Connect = "connect"
	Disconnect = "disconnect"
	UserSentMessage = "user-sent-message"
	UserDeletedMessage = "user-deleted-message"
	UserConversed = "user-conversed"
	UserStartedGame = "user-started-game"
	UserPulledSlots = "user-pulled-slots"
	UserPlayedRoulette = "user-played-roulette"

	# Outgoing
	StateChanged = "state-changed"
	ErrorOccurred = "error-occurred"
	ConfirmationReceived = "confirmation-received"

class CasinoMessages(str, Enum):
	InsufficientPermissions = "You do not have permission to perform that action."
	MessageNotFound = "That message does not exist."
	MessageDeleteSuccess = "Successfully deleted a message."
	GameNotFound = "That game does not exist."
	MinimumWagerNotMet = f"You must bet at least {MINIMUM_WAGER} coins or procoins."
	CannotAffordBet = "You cannot afford that bet."
	CannotPullLever = "Unable to pull the lever."
	CannotPlaceBet = "Unable to place bet."