from uuid import uuid4
from random import choice, uniform
from enum import Enum
from copy import copy
from flask import g
from files.helpers.const import *
from sqlalchemy.sql.expression import func
from files.classes.marsey import Marsey
from files.helpers.get import get_account
from ..enums import CasinoCurrency
from ..config import MINIMUM_WAGER
from ..helpers import charge_user


class MarseyRacingEvent(str, Enum):
    START_RACE = 'start-race'
    USER_PLACED_BET = 'user-placed-bet'
    BET_SUCCEEDED = 'bet-succeeded'
    BET_FAILED = 'bet-failed'


class MarseyRacingBet(str, Enum):
    WIN = 'WIN'
    PLACE = 'PLACE'
    SHOW = 'SHOW'
    QUINELLA = 'QUINELLA'
    EXACTA = 'EXACTA'
    TRIFECTA = 'TRIFECTA'
    TRIFECTA_BOX = 'TRIFECTA_BOX'
    SUPERFECTA = 'SUPERFECTA'
    SUPERFECTA_BOX = 'SUPERFECTA_BOX'


class MarseyRacingHealth(str, Enum):
    EXCELLENT = 'EXCELLENT'
    GREAT = 'GREAT'
    GOOD = 'GOOD'
    AVERAGE = 'AVERAGE'
    POOR = 'POOR'
    DEVASTATING = 'DEVASTATING'
    CATASTROPHIC = 'CATASTROPHIC'


class MarseyRacingSpirit(str, Enum):
    EMANATING = 'EMANATING'
    PULSING = 'PULSING'
    THROBBING = 'THROBBING'
    TWITCHING = 'TWITCHING'
    FLICKERING = 'FLICKERING'
    NONEXISTENT = 'NONEXISTENT'
    SOREN = 'SOREN'


HOW_MANY_MARSEYS_PER_RACE = 14

BASELINE_RACE_COMPLETION_SPEED_IN_MS = 16000

SELECTIONS_IN_BET = {
    MarseyRacingBet.WIN: 1,
    MarseyRacingBet.PLACE: 1,
    MarseyRacingBet.SHOW: 1,
    MarseyRacingBet.QUINELLA: 2,
    MarseyRacingBet.TRIFECTA_BOX: 3,
    MarseyRacingBet.TRIFECTA: 3,
    MarseyRacingBet.SUPERFECTA_BOX: 4,
    MarseyRacingBet.SUPERFECTA: 4,
}

PAYOUT_MULITPLIERS = {
    MarseyRacingBet.WIN: 14,
    MarseyRacingBet.PLACE: 7,
    MarseyRacingBet.SHOW: 4,
    MarseyRacingBet.QUINELLA: 91,
    MarseyRacingBet.TRIFECTA_BOX: 364,
    MarseyRacingBet.TRIFECTA: 2184,
    MarseyRacingBet.SUPERFECTA_BOX: 1001,
    MarseyRacingBet.SUPERFECTA: 24024,
}

HEALTH_STATUSES = (
    MarseyRacingHealth.EXCELLENT,
    MarseyRacingHealth.GREAT,
    MarseyRacingHealth.GOOD,
    MarseyRacingHealth.AVERAGE,
    MarseyRacingHealth.POOR,
    MarseyRacingHealth.DEVASTATING,
    MarseyRacingHealth.CATASTROPHIC,
)

HEALTH_RANGES = {
    MarseyRacingHealth.EXCELLENT: (0.4, 0.8),
    MarseyRacingHealth.GREAT: (0.5, 0.9),
    MarseyRacingHealth.GOOD: (0.6, 1.0),
    MarseyRacingHealth.AVERAGE: (0.7, 1.1),
    MarseyRacingHealth.POOR: (0.8, 1.2),
    MarseyRacingHealth.DEVASTATING: (0.9, 1.3),
    MarseyRacingHealth.CATASTROPHIC: (1.0, 1.4),
}

SPIRIT_STATUSES = (
    MarseyRacingSpirit.EMANATING,
    MarseyRacingSpirit.PULSING,
    MarseyRacingSpirit.THROBBING,
    MarseyRacingSpirit.TWITCHING,
    MarseyRacingSpirit.FLICKERING,
    MarseyRacingSpirit.NONEXISTENT,
    MarseyRacingSpirit.SOREN,
)

SPIRIT_RANGES = {
    MarseyRacingSpirit.EMANATING: (0.4, 0.8),
    MarseyRacingSpirit.PULSING: (0.5, 0.9),
    MarseyRacingSpirit.THROBBING: (0.6, 1.0),
    MarseyRacingSpirit.TWITCHING: (0.7, 1.1),
    MarseyRacingSpirit.FLICKERING: (0.8, 1.2),
    MarseyRacingSpirit.NONEXISTENT: (0.9, 1.3),
    MarseyRacingSpirit.SOREN: (1.0, 1.4),
}


# Utilities


def select_random_marsey_set():
    db = db_session()
    return db.query(Marsey).order_by(func.random()).limit(HOW_MANY_MARSEYS_PER_RACE).all()


def format_marsey_model(model):
    return {
        'name': model.name,
        'health': choice(HEALTH_STATUSES),
        'spirit': choice(SPIRIT_STATUSES),
        'speed': BASELINE_RACE_COMPLETION_SPEED_IN_MS,
        'placement': -1
    }


def decide_marsey_speed(formatted_model):
    health_minimum, health_maximum = HEALTH_RANGES[formatted_model['health']]
    health_modifier = uniform(health_minimum, health_maximum)
    spirit_minimum, spirit_maximum = SPIRIT_RANGES[formatted_model['spirit']]
    spirit_modifier = uniform(spirit_minimum, spirit_maximum)

    return int(BASELINE_RACE_COMPLETION_SPEED_IN_MS * health_modifier * spirit_modifier)


def create_initial_state():
    formatted_marseys = list(
        map(format_marsey_model, select_random_marsey_set()))
    marseys = {
        'all': [],
        'by_id': {}
    }

    for marsey in formatted_marseys:
        marseys['all'].append(marsey['name'])
        marseys['by_id'][marsey['name']] = marsey

    return {
        'marseys': marseys,
        'betting_open': True,
        'race_started': False,
        'podium': [None, None, None, None],
        'biggest_loser': None,
        'odds': PAYOUT_MULITPLIERS,
        'bets': {
            'all': [],
            'by_id': {}
        },
        'users': {
            'all': [],
            'by_id': {}
        },
        'payouts': {
            'all': [],
            'by_id': {}
        }
    }


def create_id(): return str(uuid4())


# Selectors


def select_all_entities(state, entity):
    return [state[entity]['by_id'][user_id] for user_id in state[entity]['all']]


def select_all_marseys(state):
    return select_all_entities(state, 'marseys')


def select_all_users(state):
    return select_all_entities(state, 'users')


def select_all_bets(state):
    return select_all_entities(state, 'bets')


# Handlers


def handle_place_bet(state, user_id, bet, selection, currency, wager):
    next_state = copy(state)
    user_id = str(user_id)

    if not state['betting_open']:
        return next_state

    bet_id = create_id()
    bet_data = {
        'id': bet_id,
        'user_id': user_id,
        'bet': bet,
        'selections': selection,
        'wager': wager,
        'currency': currency,
        'succeeded': False
    }

    next_state['bets']['all'].append(bet_id)
    next_state['bets']['by_id'][bet_id] = bet_data

    if not next_state['users']['by_id'].get(user_id):
        user = get_account(user_id)
        user_data = {
            'id': user_id,
            'username': user.username,
            'bets': [],
            'payouts': []
        }

        next_state['users']['all'].append(user_id)
        next_state['users']['by_id'][user_id] = user_data

    next_state['users']['by_id'][user_id]['bets'].append(bet_id)

    return next_state


def handle_freeze_betting(state):
    next_state = copy(state)
    next_state['betting_open'] = False
    return next_state


def handle_unfreeze_betting(state):
    next_state = copy(state)
    next_state['betting_open'] = True
    return next_state


def handle_determine_outcome(state):
    next_state = copy(state)
    next_state = handle_freeze_betting(next_state)
    marseys = select_all_marseys(next_state)

    def update_local_and_state(marsey, property, value):
        marsey[property] = value
        next_state['marseys']['by_id'][marsey['name']][property] = value

    for marsey in marseys:
        speed = decide_marsey_speed(marsey)
        update_local_and_state(marsey, 'speed', speed)

    placements = sorted(marseys, key=lambda x: x['speed'])

    for index, placed_marsey in enumerate(placements):
        if index < 4:
            next_state['podium'][index] = placed_marsey['name']

        if index == len(placements) - 1:
            next_state['biggest_loser'] = placed_marsey['name']

        placement = index + 1
        update_local_and_state(placed_marsey, 'placement', placement)

    return next_state


def handle_determine_payouts(state):
    next_state = copy(state)
    bets = select_all_bets(state)

    for bet in bets:
        bet_succeeded = did_bet_succeed(state, bet)

        if bet_succeeded:
            bet_id = bet['id']
            next_state['bets']['by_id'][bet_id]['succeeded'] = True

            payout_id = create_id()
            refund = bet['wager']
            reward = bet['wager'] * PAYOUT_MULITPLIERS[bet['bet']]
            payout_data = {
                'id': payout_id,
                'bet_id': bet_id,
                'user_id': bet['user_id'],
                'currency': bet['currency'],
                'refund': refund,
                'reward': reward,
                'total': refund + reward,
                'paid': False
            }

            next_state['users']['by_id'][bet['user_id']
                                         ]['payouts'].append(payout_id)
            next_state['payouts']['all'].append(payout_id)
            next_state['payouts']['by_id'][payout_id] = payout_data

    return next_state


def handle_start_race(state):
    next_state = copy(state)
    next_state['race_started'] = True
    next_state = handle_determine_outcome(next_state)
    return next_state


def handle_stop_race(state):
    next_state = copy(state)
    next_state['race_started'] = False
    return next_state



# Bet Checkers


def check_for_win(state, bet):
    selections = bet['selections']
    podium = state['podium']

    return selections[0] == podium[0]


def check_for_place(state, bet):
    selections = bet['selections']
    podium = state['podium']

    return selections[0] in (podium[0], podium[1])


def check_for_show(state, bet):
    selections = bet['selections']
    podium = state['podium']

    return selections[0] in (podium[0], podium[1], podium[2])


def check_for_quinella(state, bet):
    selections = bet['selections']
    podium = state['podium']
    collection = (podium[0], podium[1])

    return selections[0] in collection and selections[1] in collection


def check_for_exacta(state, bet):
    selections = bet['selections']
    podium = state['podium']

    return selections[0] == podium[0] and selections[1] == podium[1]


def check_for_trifecta(state, bet):
    selections = bet['selections']
    podium = state['podium']

    return selections[0] == podium[0] and selections[1] == podium[1] and selections[2] == podium[2]


def check_for_trifecta_box(state, bet):
    selections = bet['selections']
    podium = state['podium']
    collection = podium[:3]
    return all(selection in collection for selection in selections)


def check_for_superfecta(state, bet):
    selections = bet['selections']
    podium = state['podium']
    return all(selections[index] == podium[index] for index in range(len(podium)))


def check_for_superfecta_box(state, bet):
    selections = bet['selections']
    podium = state['podium']
    collection = podium[:4]
    return all(selection in collection for selection in selections)


BETS_TO_BET_CHECKERS = {
    MarseyRacingBet.WIN: check_for_win,
    MarseyRacingBet.PLACE: check_for_place,
    MarseyRacingBet.SHOW: check_for_show,
    MarseyRacingBet.QUINELLA: check_for_quinella,
    MarseyRacingBet.EXACTA: check_for_exacta,
    MarseyRacingBet.TRIFECTA: check_for_trifecta,
    MarseyRacingBet.TRIFECTA_BOX: check_for_trifecta_box,
    MarseyRacingBet.SUPERFECTA: check_for_superfecta,
    MarseyRacingBet.SUPERFECTA_BOX: check_for_superfecta_box,
}


def did_bet_succeed(state, bet):
    checker = BETS_TO_BET_CHECKERS[bet['bet']]
    return checker(state, bet)


    

# Manager

class RacingManager():
    def __init__(self):
        self.state = create_initial_state()

    def start_race(self):
        self.state = handle_start_race(self.state)

    def validate_bet(self, kind, selection, currency, wager):
        valid_kinds = (
            MarseyRacingBet.WIN,
            MarseyRacingBet.PLACE,
            MarseyRacingBet.SHOW,
            MarseyRacingBet.QUINELLA,
            MarseyRacingBet.TRIFECTA_BOX,
            MarseyRacingBet.TRIFECTA,
            MarseyRacingBet.SUPERFECTA_BOX,
            MarseyRacingBet.SUPERFECTA,
        )

        # Betting isn't open.
        if not self.state['betting_open']:
            return False

        # Race is underway.
        if self.state['race_started']:
            return False

        # Not a real bet.
        if not kind in valid_kinds:
            return False

        # Wrong number of Marseys picked.
        if len(selection) != SELECTIONS_IN_BET[kind]:
            return False

        # Picked a Marsey not in the race.
        for selected in selection:
            if not selected in self.state['marseys']['all']:
                return False

        # Supplied an invalid currency.
        if not currency in (CasinoCurrency.Coins, CasinoCurrency.Procoins):
            return False

        # Bet was too low.
        if wager < MINIMUM_WAGER:
            return False

        return True

    def handle_player_bet(self, data, user):
        kind = data['kind']
        selection = data['selection']
        currency = data['currency']
        wager = data['wager']
        valid = self.validate_bet(kind, selection, wager)

        if valid:
            charged = charge_user(user, currency, wager)

            if charged:
                self.state = handle_place_bet(
                    state=self.state,
                    user_id=user.id,
                    bet=kind,
                    selection=selection,
                    currency=currency,
                    wager=wager,
                )

                return True
            else:
                return False
        else:
            return False

