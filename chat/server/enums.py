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
	USER_PLAYED_SLOTS = "user_played_slots"
	USER_PLAYED_ROULETTE = "USER_PLAYED_ROULETTE"
	USER_PLAYED_BLACKJACK = "USER_PLAYED_BLACKJACK"


class CasinoEvents(str, Enum):
	# Incoming
	Connect = "connect"
	Disconnect = "disconnect"
	UserKickedOwnClient = "user-kicked-own-client"
	UserSentMessage = "user-sent-message"
	UserDeletedMessage = "user-deleted-message"
	UserConversed = "user-conversed"
	UserStartedGame = "user-started-game"
	UserPlayedSlots = "user-played-slots"
	UserPlayedRoulette = "user-played-roulette"
	UserPlayedBlackjack = "user-played-blackjack"

	# Outgoing
	StateChanged = "state-changed"
	ErrorOccurred = "error-occurred"
	JoinedAgain = "joined-again"
	Refresh = "refresh"
	ConfirmationReceived = "confirmation-received"
	InitialStateProvided = "initial-state-provided"
	ConversationUpdated = "conversation-updated"
	FeedUpdated = "feed-updated"
	GameUpdated = "game-updated"
	LeaderboardUpdated = "leaderboard-updated"
	MessageUpdated = "message-updated"
	MessageDeleted = "message-deleted"
	SessionUpdated = "session-updated"
	UserUpdated = "user-updated"

class CasinoMessages(str, Enum):
	InsufficientPermissions = "You do not have permission to perform that action."
	MessageNotFound = "That message does not exist."
	MessageDeleteSuccess = "Successfully deleted a message."
	GameNotFound = "That game does not exist."
	MinimumWagerNotMet = f"You must bet at least {MINIMUM_WAGER} coins or procoins."
	CannotAffordBet = "You cannot afford that bet."
	CannotPullLever = "Unable to pull the lever."
	CannotPlaceBet = "Unable to place bet."
	AlreadyInside = "You are already inside the casino."
	BlackjackGameInProgress = "You already have a blackjack game in progress."
	BlackjackUnableToDeal = "Unable to deal a hand."
	BlackjackUnableToTakeAction = "Unable to take that action."
	BlackjackNoGameInProgress = "You do not have a blackjack game in progress."