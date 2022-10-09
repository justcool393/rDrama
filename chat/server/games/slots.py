import random
from files.helpers.const import *
from files.helpers.casino import distribute_wager_badges
from ..config import SLOTS_PAYOUTS_TO_SYMBOLS
from ..enums import CasinoCurrency, CasinoGames, CasinoGameStatus, SlotsOutcome
from .shared import *

# Manager


class SlotsManager():
    @staticmethod
    def wait():
        return {
            "game_status": CasinoGameStatus.Waiting,
            "symbols": [None, None, None],
            "currency": CasinoCurrency.Coins,
            "wager": 0,
            "reward": 0
        }

    @staticmethod
    def start(currency, wager):
        return {
            "game_status": CasinoGameStatus.Started,
            "currency": currency,
            "wager": wager,
            "reward": 0,
            "symbols": [None, None, None],
            "outcome": SlotsOutcome.Undecided
        }

    @staticmethod
    def play(user, currency, wager):
        charge_user(user, currency, wager)

        payout = determine_payout()
        to_pay = wager * payout
        reward = to_pay - wager
        user.pay_account(currency, to_pay)

        if currency == CasinoCurrency.Coins:
            distribute_wager_badges(user, wager, won=(payout > 0))

        game_state = {
            "game_status": CasinoGameStatus.Done,
            "symbols": build_symbols(payout),
            "currency": currency,
            "wager": wager,
            "reward": reward,
            "outcome": determine_outcome(payout)
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
    return get_all_slot_symbols()[:3]


def determine_pushing_symbols():
    matching_symbol, other_symbol = get_all_slot_symbols()[:2]
    match_a, match_b, nonmatch = shuffle([0, 1, 2])
    symbols = [None, None, None]
    symbols[match_a] = matching_symbol
    symbols[match_b] = matching_symbol
    symbols[nonmatch] = other_symbol

    return symbols


def determine_winning_symbols(payout):
    relevantSymbols = shuffle(SLOTS_PAYOUTS_TO_SYMBOLS[payout])
    symbol = relevantSymbols[0]

    return [symbol, symbol, symbol]


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


def determine_outcome(payout):
    return {
        0: SlotsOutcome.Loss,
        1: SlotsOutcome.Push,
        12: SlotsOutcome.Jackpot
    }.get(payout) or SlotsOutcome.Win