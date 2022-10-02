from .config import MINIMUM_WAGER

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