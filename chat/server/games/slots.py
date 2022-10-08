import random
from files.helpers.const import *
from files.helpers.casino import distribute_wager_badges
from ..config import SLOTS_PAYOUTS_TO_SYMBOLS
from ..enums import CasinoCurrency, CasinoGames
from .shared import *

# Manager


class SlotsManager():
    @staticmethod
    def wait():
        return {
            "game_status": GameStatus.Waiting,
            "symbols": "",
            "text": ""
        }

    @staticmethod
    def start():
        return {
            "game_status": GameStatus.Started,
            "symbols": "",
            "text": ""
        }

    @staticmethod
    def play(user, currency, wager):
        charge_user(user, currency, wager)

        payout = determine_payout()
        reward = wager * payout
        user.pay_account(currency, reward)

        if currency == CasinoCurrency.Coins:
            distribute_wager_badges(user, wager, won=(payout > 0))

        game_state = {
            "game_status": GameStatus.Done,
            "symbols": build_symbols(payout),
            "text": build_text(currency, wager, payout)
        }
        create_game(
            user=user,
            currency=currency,
            wager=wager,
            winnings=reward,
            game=CasinoGames.Slots,
            state=game_state,
            active=False
        )

        return game_state

# Helpers


def get_all_slot_symbols():
    all_symbols = []

    for payout in SLOTS_PAYOUTS_TO_SYMBOLS:
        for symbol in SLOTS_PAYOUTS_TO_SYMBOLS[payout]:
            all_symbols.append(symbol)

    return shuffle(all_symbols)


def determine_losing_symbols():
    a, b, c, *_ = get_all_slot_symbols()
    return ",".join([a, b, c])


def determine_pushing_symbols():
    matching_symbol, other_symbol, *_ = get_all_slot_symbols()
    match_a, match_b, nonmatch = shuffle([0, 1, 2])
    symbols = ["", "", ""]
    symbols[match_a] = matching_symbol
    symbols[match_b] = matching_symbol
    symbols[nonmatch] = other_symbol

    return ",".join(symbols)


def determine_winning_symbols(payout):
    relevantSymbols = shuffle(SLOTS_PAYOUTS_TO_SYMBOLS[payout])
    symbol = relevantSymbols[0]

    return "".join([symbol, symbol, symbol])


def determine_payout():
    value = random.randint(1, 100)
    if value == 100:
        return 12
    elif value >= 96:
        return 5
    elif value >= 88:
        return 3
    elif value >= 72:
        return 2
    elif value >= 61:
        return 1
    else:
        return 0


def build_symbols(payout):
    return {
        0: determine_losing_symbols(),
        1: determine_pushing_symbols(),
    }.get(payout) or determine_winning_symbols(payout)


def build_text(currency, wager, payout):
    return {
        0: f'Lost {wager} {currency}',
        1: 'Broke Even',
        12: f'Jackpot! Won {wager * (payout - 1)} {currency}'
    }.get(payout) or f'Won {wager * (payout - 1)} {currency}'
