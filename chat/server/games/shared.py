import random
from json import dumps
from enum import Enum
from files.helpers.const import *
from files.classes.casino_game import Casino_Game
from ..config import MINIMUM_WAGER, PLAYING_CARD_RANKS, PLAYING_CARD_SUITS


class GameStatus(str, Enum):
    Waiting = "waiting"
    Started = "started"
    Done = "done"


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


def shuffle(collection):
    random.shuffle(collection)
    return collection


def build_deck_of_cards():
    return [rank + suit for rank in PLAYING_CARD_RANKS for suit in PLAYING_CARD_SUITS]


def validate_bet(user, currency, wager):
    if user.rehab:
        raise UserInRehabException(user)

    if not user.can_afford(currency, wager):
        raise CannotAffordBetException(user, currency, wager)

    over_min = wager >= MINIMUM_WAGER

    if not over_min:
        raise UnderMinimumBetException(wager)


def charge_user(user, currency, wager):
    validate_bet(user, currency, wager)

    charged = user.charge_account(currency, wager)

    if not charged:
        raise CannotAffordBetException(user, currency, wager)


def create_game(user, currency, wager, winnings, game, state, active):
    casino_game = Casino_Game()
    casino_game.active = active
    casino_game.user_id = user.id
    casino_game.currency = currency
    casino_game.wager = wager
    casino_game.winnings = winnings
    casino_game.kind = game
    casino_game.game_state = dumps(state)

    db = db_session()
    db.add(casino_game)
    db.commit()


def save_game(game, state):
    db = db_session()
    game.game_state = dumps(state)
    db.add(game)
    db.commit()


def load_game(user, game):
    db = db_session()

    return db.query(Casino_Game).filter(
        Casino_Game.active == True,
        Casino_Game.kind == game,
        Casino_Game.user_id == user.id).first()
