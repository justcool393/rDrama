from flask_socketio import emit
from files.helpers.regex import censor_slurs
from files.helpers.sanitize import sanitize
from .config import MESSAGE_MAX_LENGTH, MINIMUM_WAGER
from .enums import CasinoEvents, CasinoMessages
from .exceptions import *


def grab(object, path, delimiter='/', fallback=None):
    try:
        result = object
        path_parts = path.split(delimiter)

        for part in path_parts:
            result = result[part]

        return result
    except:
        return fallback


def can_user_afford(user, currency, amount):
    return getattr(user, currency, 0) >= amount


def meets_minimum_wager(wager):
    return wager >= MINIMUM_WAGER


def sanitize_chat_message(text):
    text = text[:MESSAGE_MAX_LENGTH].strip()
    text_censored = censor_slurs(text, 'chat')
    html = sanitize(text, count_marseys=True)
    html_censored = censor_slurs(html, 'chat')

    return {
        'text': text,
        'text_censored': text_censored,
        'html': html,
        'html_censored': html_censored
    }


def validate_bet(user, currency, wager):
    if user.rehab:
        raise UserInRehabException(user)

    if not wager >= MINIMUM_WAGER:
        raise UnderMinimumBetException(wager)

    if not user.can_afford(currency, wager):
        raise CannotAffordBetException(user, currency, wager)


def validate_bet_request(user, currency, wager):
    try:
        validate_bet(user, currency, wager)
        return True
    except UserInRehabException:
        emit(CasinoEvents.ErrorOccurred, CasinoMessages.UserInRehab)
        return False
    except CannotAffordBetException:
        emit(CasinoEvents.ErrorOccurred, CasinoMessages.CannotAffordBet)
        return False
    except UnderMinimumBetException:
        emit(CasinoEvents.ErrorOccurred, CasinoMessages.MinimumWagerNotMet)
        return False


def charge_user(user, currency, wager):
    validate_bet(user, currency, wager)

    charged = user.charge_account(currency, wager)

    if not charged:
        raise CannotAffordBetException(user, currency, wager)


def charge_user_request(user, currency, wager):
    try:
        charge_user(user, currency, wager)
        return True
    except CannotAffordBetException:
        emit(CasinoEvents.ErrorOccurred, CasinoMessages.CannotAffordBet)
        return False


def get_balances(user):
    return {
        'coins': user.coins,
        'procoins': user.procoins
    }
