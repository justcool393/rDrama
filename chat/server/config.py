from files.__main__ import app

# The maximum size of a chat message.
MESSAGE_MAX_LENGTH = 1000

# The smallest amount of either coins or procoins that can be gambled with.
MINIMUM_WAGER = 5

# Some stuff is only done when developing.
IN_DEVELOPMENT_MODE = app.config["SERVER_NAME"] == 'localhost'

# When the state updates, where should a local copy be stored for debugging?
STATE_LOG_PATH = "chat/server/state.json"

# When the scheduler runs, where should a local copy be stored for debugging?
SCHEDULER_LOG_PATH = "chat/server/scheduler.log.txt"

# How many seconds does the slots animation last?
SLOTS_PULL_DURATION = 3