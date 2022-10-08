from files.__main__ import app

# -- Sockets

#  Where casino-specific messages should be sent and handled.
CASINO_NAMESPACE = "/casino"

# The maximum size of a chat message.
MESSAGE_MAX_LENGTH = 1000


# -- Debug

# Some stuff is only done when developing.
IN_DEVELOPMENT_MODE = app.config["SERVER_NAME"] == 'localhost'

#
CASINO_LOGGER_PREFIX = "Controller)"

# When the controller errors, where should a local copy be stored for debugging?
ERROR_LOG_PATH = "chat/server/errors.txt"

# When the state updates, where should a local copy be stored for debugging?
STATE_LOG_PATH = "chat/server/state.json"

# When the scheduler runs, where should a local copy be stored for debugging?
SCHEDULER_LOG_PATH = "chat/server/scheduler.log.txt"


# -- Games

# The smallest amount of either coins or procoins that can be gambled with.
MINIMUM_WAGER = 5

# Playing cards
PLAYING_CARD_RANKS = ("2", "3", "4", "5", "6", "7", "8", "9", "X", "J", "Q", "K", "A")
PLAYING_CARD_SUITS = ("S", "H", "C", "D")

# A record where the key is the payout multiplier and the value is the collection of symbols
# with the value of that multiplier.
SLOTS_PAYOUTS_TO_SYMBOLS = {
    2: ["👣", "🍀", "🌈", "⭐️"],
    3: ["🍎", "🔞", "⚛️", "☢️"],
    5: ["✡️", "⚔️", "🍆", "🍒"],
    12: ["🐱"]
}

# How many seconds does the slots animation last?
SLOTS_PULL_DURATION = 3

# How many decks in Blackjack?
BLACKJACK_DECK_COUNT = 4