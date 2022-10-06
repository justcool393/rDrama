from time import time
import uuid
from files.helpers.get import get_account
from .games import get_roulette_empty_bets
from .enums import CasinoGames


class CasinoBuilders():
    # Builders
    @staticmethod
    def build_user_entity(user_id, request_id):
        user_account = get_account(user_id, graceful=True)

        return {
            'id': str(user_id),
            'request_id': request_id,
            'account': user_account.json,
            'online': True,
            'last_active': int(time()),
            'balances': {
                'coins': user_account.coins,
                'procoins': user_account.procoins
            }
        }

    @staticmethod
    def build_message_entity(user_id, text):
        message_id = str(uuid.uuid4())

        return {
            'id': message_id,
            'user_id': user_id,
            'text': text,
            'timestamp': int(time())
        }

    @staticmethod
    def build_conversation_key(user_id_a, user_id_b):
        participants = sorted((str(user_id_a), str(user_id_b)))
        return '#'.join(participants)

    @staticmethod
    def build_conversation_entity(conversation_key, participant_a, participant_b):
        return {
            'id': conversation_key,
            'participants': (participant_a, participant_b),
            'messages': {
                'all': [],
                'by_id': {}
            }
        }

    @staticmethod
    def build_feed_entity(id, channels, text):
        return {
            'id': id,
            'channels': channels,
            'text': text,
            'timestamp': int(time())
        }

    @staticmethod
    def build_game_entity(name):
        return {
            'id': name,
            'name': name,
            'user_ids': [],
            'session_ids': [],
            'state': {}
        }

    @staticmethod
    def build_session_key(user_id, game):
        return '#'.join([user_id, game])

    @staticmethod
    def build_session_entity(user_id, game, game_state):
        return {
            'id': CasinoBuilders.build_session_key(user_id, game),
            'user_id': user_id,
            'game': game,
            'game_state': game_state
        }

    @staticmethod
    def build_initial_state():
        slots, blackjack, roulette, racing, crossing = [
            CasinoBuilders.build_game_entity(CasinoGames.Slots),
            CasinoBuilders.build_game_entity(CasinoGames.Blackjack),
            CasinoBuilders.build_game_entity(CasinoGames.Roulette),
            CasinoBuilders.build_game_entity(CasinoGames.Racing),
            CasinoBuilders.build_game_entity(CasinoGames.Crossing),
        ]

        slots['state'] = {'bets': get_roulette_empty_bets()}

        return {
            'users': {
                'all': [],
                'by_id': {}
            },
            'messages': {
                'all': [],
                'by_id': {}
            },
            'conversations': {
                'all': [],
                'by_id': {}
            },
            'feed': {
                'all': [],
                'by_id': {}
            },
            'leaderboards': {
                'all': [],
                'by_id': {}
            },
            'games': {
                'all': [slots['id'], blackjack['id'], roulette['id'], racing['id'], crossing['id']],
                'by_id': {
                    CasinoGames.Slots: slots,
                    CasinoGames.Blackjack: blackjack,
                    CasinoGames.Roulette: roulette,
                    CasinoGames.Racing: racing,
                    CasinoGames.Crossing: crossing,
                }
            },
            'sessions': {
                'all': [],
                'by_id': {}
            }
        }
