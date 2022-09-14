import json
from enum import Enum
from math import floor
from copy import copy
import time
import random
from files.classes.casino_game import Casino_Game
from files.classes.marsey import Marsey
from files.helpers.get import *
from flask import g
from sqlalchemy.sql.expression import func


class MarseyRacingEvent(str, Enum):
    CONNECT = 'connect'
    UPDATE_STATE = 'update-state'


class MarseyRacingCurrency(str, Enum):
    COINS = 'coins'
    PROCOINS = 'procoins'


class MarseyRacingBet(str, Enum):
    WIN = 'WIN'
    PLACE = 'PLACE'
    SHOW = 'SHOW'
    EXACTA = 'EXACTA'
    QUINELLA = 'QUINELLA'
    TRIFECTA = 'TRIFECTA'
    SUPERFECTA = 'SUPERFECTA'


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
BASELINE_RACE_COMPLETION_SPEED_IN_MS = 5000

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
    MarseyRacingHealth.EXCELLENT: (1, 1.4),
    MarseyRacingHealth.GREAT: (0.9, 1.3),
    MarseyRacingHealth.GOOD: (0.8, 1.2),
    MarseyRacingHealth.AVERAGE: (0.7, 1.1),
    MarseyRacingHealth.POOR: (0.6, 1.0),
    MarseyRacingHealth.DEVASTATING: (0.5, 0.9),
    MarseyRacingHealth.CATASTROPHIC: (0.4, 0.8),
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
    MarseyRacingSpirit.EMANATING: (1, 1.4),
    MarseyRacingSpirit.PULSING: (0.9, 1.3),
    MarseyRacingSpirit.THROBBING: (0.8, 1.2),
    MarseyRacingSpirit.TWITCHING: (0.7, 1.1),
    MarseyRacingSpirit.FLICKERING: (0.6, 1.0),
    MarseyRacingSpirit.NONEXISTENT: (0.5, 0.9),
    MarseyRacingSpirit.SOREN: (0.4, 0.8),
}


def select_marsey_set():
    return g.db.query(Marsey).order_by(func.random()).limit(HOW_MANY_MARSEYS_PER_RACE).all()


def format_marsey_model(model):
    return {
        'name': model.name,
        'health': random.choice(HEALTH_STATUSES),
        'spirit': random.choice(SPIRIT_STATUSES),
        'speed': BASELINE_RACE_COMPLETION_SPEED_IN_MS
    }


def decide_marsey_speed(formatted_model):
    health_minimum, health_maximum = HEALTH_RANGES[formatted_model['health']]
    health_modifier = random.randint(health_minimum, health_maximum)
    spirit_minimum, spirit_maximum = SPIRIT_RANGES[formatted_model['spirit']]
    spirit_modifier = random.randint(spirit_minimum, spirit_maximum)
    speed = BASELINE_RACE_COMPLETION_SPEED_IN_MS * health_modifier * spirit_modifier

    decided_model = copy(formatted_model)
    decided_model['speed'] = speed

    return decided_model


def create_initial_state():
    formatted_marseys = list(map(format_marsey_model, select_marsey_set()))
    marseys = {
        'all': [],
        'by_name': {}
    }

    for marsey in formatted_marseys:
        marseys['all'].append(marsey['name'])
        marseys['by_name'][marsey['name']] = marsey

    return {
        'marseys': marseys,
        'bets': {
            'all': [],
            'by_id': {}
        },
        'users': {
            'all': [],
            'by_id': {}
        }
    }


def handle_place_bet(state, user_id, bet, selections, amount, currency):
    next_state = copy(state)
    bet_id = int(time.time())
    bet_data = {
        'id': bet_id,
        'user_id': user_id,
        'bet': bet,
        'selections': selections,
        'amount': amount,
        'currency': currency,
    }

    next_state['bets']['all'].append(bet_id)
    next_state['bets']['by_id'][bet_id] = bet_data

    if not next_state['users']['by_id'].get(user_id):
        user = get_account(user_id)

        next_state['users']['all'].append(user_id)
        next_state['users']['by_id'][user_id] = {
            'id': user_id,
            'username': user.username,
            'bets': []
        }

    next_state['users']['by_id'][user_id]['bets'].append(bet_id)

    return next_state


def do_the_thing():
    state = create_initial_state()
    next_state = handle_place_bet(state, 5, MarseyRacingBet.WIN, [
                                  state['marseys']['by_name'][state['marseys']['all'][0]]['name']], 5, MarseyRacingCurrency.COINS)
    return next_state
