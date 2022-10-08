class UserInRehabException(Exception):
    def __init__(self, user):
        self.user = user
        self.message = f'{user} is in rehab'
        super().__init__(self.message)


class UnderMinimumBetException(Exception):
    def __init__(self, wager):
        self.wager = wager
        self.message = 'Wager of {wager} does not equal or exceed minimum wager of {MINIMUM_WAGER}'
        super().__init__(self.message)


class CannotAffordBetException(Exception):
    def __init__(self, user, currency, wager):
        self.wager = wager
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

