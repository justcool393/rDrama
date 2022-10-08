import random
from json import dumps
from enum import Enum
from files.helpers.const import *
from files.classes.casino_game import Casino_Game
from ..config import PLAYING_CARD_RANKS, PLAYING_CARD_SUITS
from ..exceptions import *

class GameStatus(str, Enum):
    Waiting = "waiting"
    Started = "started"
    Done = "done"


def shuffle(collection):
    random.shuffle(collection)
    return collection


def build_deck_of_cards():
    return [rank + suit for rank in PLAYING_CARD_RANKS for suit in PLAYING_CARD_SUITS]


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
