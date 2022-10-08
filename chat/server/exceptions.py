from .config import MINIMUM_WAGER


class InvalidGameException(Exception):
    def __init__(self, user, game):
        self.message = f'{user} attempted to join invalid game {game}'
        super().__init__(self.message)


class NotAllowedException(Exception):
    def __init__(self, user, action):
        self.message = f'{user} was not allowed to perform action {action}'
        super().__init__(self.message)


class NotFoundException(Exception):
    def __init__(self, entity):
        self.message = f'{entity} was not found'
        super().__init__(self.message)


class UserSentEmptyMessageException(Exception):
    def __init__(self, user):
        self.message = f'{user} sent an empty message'
        super().__init__(self.message)


class UserAlreadyOnlineException(Exception):
    def __init__(self, user):
        self.message = f'{user} is already online'
        super().__init__(self.message)


class UserNotOnlineException(Exception):
    def __init__(self, user):
        self.message = f'{user} is not online'
        super().__init__(self.message)


class UserInRehabException(Exception):
    def __init__(self, user):
        self.message = f'{user} is in rehab'
        super().__init__(self.message)


class UnderMinimumBetException(Exception):
    def __init__(self, user, currency, wager):
        self.message = f'{user}s bet of {wager} {currency} does not equal or exceed minimum wager of {MINIMUM_WAGER}'
        super().__init__(self.message)


class CannotAffordBetException(Exception):
    def __init__(self, user, currency, wager):
        self.message = f'{user} cannot afford to bet {wager} {currency}'
        super().__init__(self.message)


class GameInProgressException(Exception):
    def __init__(self, user, game):
        self.message = f'{user} already has a game of {game} in progress'
        super().__init__(self.message)


class NoGameInProgressException(Exception):
    def __init__(self, user, game):
        self.message = f'{user} does not have a game of {game} in progress'
        super().__init__(self.message)


class BadBetException(Exception):
    def __init__(self, user, game):
        self.message = f'{user} placed a bad bet at {game}'
        super().__init__(self.message)
