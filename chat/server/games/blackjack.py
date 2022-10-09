from json import loads
from math import floor
from enum import Enum
from files.helpers.const import *
from files.helpers.casino import distribute_wager_badges
from ..config import BLACKJACK_DECK_COUNT, PLAYING_CARD_RANKS
from ..enums import CasinoCurrency, CasinoGames, CasinoGameStatus
from .shared import *

# Manager


class BlackjackStatus(str, Enum):
    PLAYING = "PLAYING"
    STAYED = "STAYED"
    PUSHED = "PUSHED"
    WON = "WON"
    LOST = "LOST"
    BLACKJACK = "BLACKJACK"


class BlackjackActions(str, Enum):
    DEAL = "DEAL"
    HIT = "HIT"
    STAY = "STAY"
    DOUBLE_DOWN = "DOUBLE_DOWN"
    BUY_INSURANCE = "BUY_INSURANCE"


class BlackjackManager():
    @staticmethod
    def load(user):
        saved_game = load_game(user, CasinoGames.Blackjack)

        if saved_game:
            return loads(saved_game.game_state)
        else:
            return None

    @staticmethod
    def wait():
        return {
            "game_status": CasinoGameStatus.Waiting,
            **get_initial_state()
        }

    @staticmethod
    def start(user, currency, wager):
        in_progress = BlackjackManager.load(user)

        if in_progress:
            raise GameInProgressException(user, CasinoGames.Blackjack)

        game_state = {
            "game_status": CasinoGameStatus.Started,
            **get_initial_state(),
            'currency': currency,
            'wager': wager
        }
        create_game(
            user=user,
            currency=currency,
            wager=wager,
            winnings=0,
            game=CasinoGames.Blackjack,
            state=game_state,
            active=True
        )

        return BlackjackManager.play(user, BlackjackActions.DEAL)

    @staticmethod
    def play(user, action):
        game, state = dispatch_action(user, action)
        status = CasinoGameStatus.Started if game.active else CasinoGameStatus.Done

        return {
            "status": status,
            **state
        }

# Helpers


def remove_exploitable_information(state):
    safe_state = state

    if len(safe_state['dealer']) >= 2:
        safe_state['dealer'][1] = '?'

    safe_state['dealer_value'] = '?'


def get_initial_state():
    return {
        "player": [],
        "player_value": 0,
        "dealer": [],
        "dealer_value": 0,
        "player_bought_insurance": False,
        "player_doubled_down": False,
        "status": BlackjackStatus.PLAYING,
        "actions": [BlackjackActions.DEAL],
        "currency": CasinoCurrency.Coins,
        "wager": 0,
        "reward": 0
    }


def get_active_game_state(user):
    game = BlackjackManager.load(user)
    state = loads(game.game_state)
    return remove_exploitable_information(state)


def handle_blackjack_deal(state):
    deck = build_deck(state)
    first = deck.pop()
    second = deck.pop()
    third = deck.pop()
    fourth = deck.pop()
    state['player'] = [first, third]
    state['dealer'] = [second, fourth]
    return state


def handle_blackjack_hit(state):
    deck = build_deck(state)
    next_card = deck.pop()
    state['player'].append(next_card)
    return state


def handle_blackjack_stay(state):
    state['status'] = BlackjackStatus.STAYED
    return state


def handle_blackjack_double_down(state):
    state['player_doubled_down'] = True
    state = handle_blackjack_hit(state)
    state = handle_blackjack_stay(state)
    return state


def handle_blackjack_buy_insurance(state):
    state['player_bought_insurance'] = True
    return state


def check_for_completion(state):
    after_initial_deal = len(
        state['player']) == 2 and len(state['dealer']) == 2
    player_hand_value = get_value_of_hand(state['player'])
    dealer_hand_value = get_value_of_hand(state['dealer'])

    # Both player and dealer were initially dealt 21: Push.
    if after_initial_deal and player_hand_value == 21 and dealer_hand_value == 21:
        state['status'] = BlackjackStatus.PUSHED
        return True, state

    # Player was originally dealt 21, dealer was not: Blackjack.
    if after_initial_deal and player_hand_value == 21:
        state['status'] = BlackjackStatus.BLACKJACK
        return True, state

    # Player went bust: Lost.
    if player_hand_value == -1:
        state['status'] = BlackjackStatus.LOST
        return True, state

    # Player chose to stay: Deal rest for dealer then determine winner.
    if state['status'] == BlackjackStatus.STAYED:
        deck = build_deck(state)

        while dealer_hand_value < 17 and dealer_hand_value != -1:
            next_card = deck.pop()
            state['dealer'].append(next_card)
            dealer_hand_value = get_value_of_hand(state['dealer'])

        if player_hand_value > dealer_hand_value or dealer_hand_value == -1:
            state['status'] = BlackjackStatus.WON
        elif dealer_hand_value > player_hand_value:
            state['status'] = BlackjackStatus.LOST
        else:
            state['status'] = BlackjackStatus.PUSHED

        state['player_value'] = get_value_of_hand(state['player'])
        state['dealer_value'] = get_value_of_hand(state['dealer'])

        return True, state

    return False, state


def does_insurance_apply(state):
    dealer = state['dealer']
    dealer_hand_value = get_value_of_hand(dealer)
    dealer_first_card_ace = dealer[0][0] == 'A'
    dealer_never_hit = len(dealer) == 2
    return dealer_hand_value == 21 and dealer_first_card_ace and dealer_never_hit


def can_purchase_insurance(state):
    dealer = state['dealer']
    dealer_first_card_ace = dealer[0][0] == 'A'
    dealer_never_hit = len(dealer) == 2
    return dealer_first_card_ace and dealer_never_hit and not state['player_bought_insurance']


def can_double_down(state):
    player = state['player']
    player_hand_value = get_value_of_hand(player)
    player_never_hit = len(player) == 2
    return player_hand_value in (10, 11) and player_never_hit


def handle_payout(user, game, state):
    status = state['status']
    payout = 0

    if status == BlackjackStatus.BLACKJACK:
        game.winnings = floor(game.wager * 3/2)
        payout = game.wager + game.winnings
    elif status == BlackjackStatus.WON:
        game.winnings = game.wager
        payout = game.wager * 2
    elif status == BlackjackStatus.LOST:
        dealer = state['dealer']
        dealer_first_card_ace = dealer[0][0] == 'A'
        dealer_never_hit = len(dealer) == 2
        dealer_hand_value = get_value_of_hand(dealer) == 21
        insurance_applies = dealer_hand_value == 21 and dealer_first_card_ace and dealer_never_hit

        if insurance_applies and state['player_bought_insurance']:
            game.winnings = 0
            payout = game.wager
        else:
            game.winnings = -game.wager
            payout = 0
    elif status == BlackjackStatus.PUSHED:
        game.winnings = 0
        payout = game.wager
    else:
        raise Exception("Attempted to payout a game that has not finished.")

    user.pay_account(game.currency, payout)

    if game.currency == CasinoCurrency.Coins:
        if status in (BlackjackStatus.BLACKJACK, BlackjackStatus.WON):
            distribute_wager_badges(user, game.wager, won=True)
        elif status == BlackjackStatus.LOST:
            distribute_wager_badges(user, game.wager, won=False)

    game.active = False
    save_game(game, state)

    return payout


def remove_exploitable_information(state):
    safe_state = deepcopy(state)

    if len(safe_state['dealer']) >= 2:
        safe_state['dealer'][1] = '?'

    safe_state['dealer_value'] = '?'
    return safe_state


def dispatch_action(user, action):
    handler = {
        BlackjackActions.DEAL: handle_blackjack_deal,
        BlackjackActions.HIT: handle_blackjack_hit,
        BlackjackActions.STAY: handle_blackjack_stay,
        BlackjackActions.DOUBLE_DOWN: handle_blackjack_double_down,
        BlackjackActions.BUY_INSURANCE: handle_blackjack_buy_insurance,
    }[action] or None

    if not handler:
        raise Exception(
            f'Illegal action {action} passed to Blackjack#dispatch_action.')

    game = load_game(user, CasinoGames.Blackjack)

    if not game:
        raise NoGameInProgressException(user, CasinoGames.Blackjack)

    state = loads(game.game_state)

    if action == BlackjackActions.BUY_INSURANCE:
        if not can_purchase_insurance(state):
            raise Exception("Insurance cannot be purchased.")

        price = floor(game.wager / 2)
        charge_user(user, game.currency, price)
    if action == BlackjackActions.DOUBLE_DOWN:
        if not can_double_down(state):
            raise Exception("Cannot double down.")

        charge_user(user, game.currency, price)
        game.wager *= 2

    new_state = handler(state)
    new_state = {
        **new_state,
        'player_value': get_value_of_hand(new_state['player']),
        'dealer_value': get_value_of_hand(new_state['dealer']),
        'actions': get_available_actions(new_state)
    }
    save_game(game, new_state)

    game_over, final_state = check_for_completion(new_state)

    if game_over:
        payout = handle_payout(user, game, final_state)
        final_state['actions'] = [BlackjackActions.DEAL]
        final_state['payout'] = payout
        return game, final_state
    else:
        safe_state = remove_exploitable_information(new_state)
        return game, safe_state


def build_deck(state):
    deck = build_deck_of_cards()
    card_counts = {}

    for card in deck:
        card_counts[card] = BLACKJACK_DECK_COUNT

    cards_already_dealt = state['player'].copy()
    cards_already_dealt.extend(state['dealer'].copy())

    for card in cards_already_dealt:
        card_counts[card] = card_counts[card] - 1

    deck_without_already_dealt_cards = []

    for card in deck:
        amount = card_counts[card]

        for _ in range(amount):
            deck_without_already_dealt_cards.append(card)

    return shuffle(deck_without_already_dealt_cards)


def get_value_of_card(card):
    rank = card[0]
    return 0 if rank == "A" else min(PLAYING_CARD_RANKS.index(rank) + 2, 10)


def get_value_of_hand(hand):
    without_aces = sum(map(get_value_of_card, hand))
    ace_count = sum("A" in c for c in hand)
    possibilities = []

    for i in range(ace_count + 1):
        value = without_aces + (ace_count - i) + i * 11
        possibilities.append(-1 if value > 21 else value)

    return max(possibilities)


def get_available_actions(state):
    actions = []

    if state['status'] == BlackjackStatus.PLAYING:
        actions.append(BlackjackActions.HIT)
        actions.append(BlackjackActions.STAY)

    if can_double_down(state):
        actions.append(BlackjackActions.DOUBLE_DOWN)

    if can_purchase_insurance(state):
        actions.append(BlackjackActions.BUY_INSURANCE)

    return actions
