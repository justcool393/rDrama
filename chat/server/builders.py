from time import time
from uuid import uuid4
from files.helpers.get import get_account
from .enums import CasinoGames, MarseyRacingBet, RouletteAction, SlotsOutcome


class CasinoBuilders():
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
    def build_message_entity(user_id, content):
        message_id = str(uuid4())

        return {
            'id': message_id,
            'user_id': user_id,
            'content': content,
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
    def build_reaction_entity(entity_id):
        return {
            'id': entity_id,
            'user_ids': [],
            'reactions': {}  # user_id -> :emoji:
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
    def build_slots_feed_entity(username, game_state):
        currency = game_state['currency']
        wager = game_state['wager']
        reward = game_state['reward']
        symbols = game_state['symbols']
        outcome = game_state['outcome']

        bet_fragment = f'{wager} {currency}'
        reward_fragment = f'{reward} {currency}'
        symbols_fragment = f'[{"/".join(symbols)}]'

        return {
            SlotsOutcome.Undecided: '',
            SlotsOutcome.Loss: f'{username} lost {bet_fragment}. {symbols_fragment}',
            SlotsOutcome.Push: f'{username} bet {bet_fragment} and pushed. {symbols_fragment}',
            SlotsOutcome.Win: f'{username} won {reward_fragment}. {symbols_fragment}',
            SlotsOutcome.Jackpot: f'JACKPOT! {username} made off with {reward_fragment}! {symbols_fragment}',
        }[outcome]

    @staticmethod
    def build_racing_feed_entity(username, kind, selection, currency, wager):
        single_choice = selection[0]
        multi_choice = ' '.join(selection)
        bet = f'bet {wager} {currency}'
        phrase = {
            MarseyRacingBet.WIN: f'{bet} to win on {single_choice}',
            MarseyRacingBet.PLACE: f'{bet} to place on {single_choice}',
            MarseyRacingBet.SHOW: f'{bet} to show on {single_choice}',
            MarseyRacingBet.QUINELLA: f'{bet}, quinella, {multi_choice}',
            MarseyRacingBet.TRIFECTA_BOX: f'{bet}, boxed trifecta, {multi_choice}',
            MarseyRacingBet.TRIFECTA: f'{bet}, trifecta, {multi_choice}',
            MarseyRacingBet.SUPERFECTA_BOX: f'{bet}, boxed superfecta, {multi_choice}',
            MarseyRacingBet.SUPERFECTA: f'{bet}, superfecta, {multi_choice}'
        }[kind]

        return f'{username} {phrase}'

    @staticmethod
    def build_roulette_initial_state():
        return {
            'bets': {
                RouletteAction.STRAIGHT_UP_BET: [],
                RouletteAction.LINE_BET: [],
                RouletteAction.COLUMN_BET: [],
                RouletteAction.DOZEN_BET: [],
                RouletteAction.EVEN_ODD_BET: [],
                RouletteAction.RED_BLACK_BET: [],
                RouletteAction.HIGH_LOW_BET: [],
            }
        }

    @staticmethod
    def build_roulette_feed_entity(username, bet, which, currency, amount):
        item = f'{username} bet {amount} {currency} that the number will be'

        if bet == RouletteAction.STRAIGHT_UP_BET:
            return f'{item} {which}.'
        elif bet == RouletteAction.LINE_BET:
            return f'{item} within line {which}.'
        elif bet == RouletteAction.COLUMN_BET:
            return f'{item} within columns {which}.'
        elif bet == RouletteAction.DOZEN_BET:
            return f'{item} within dozen {which}.'
        elif bet == RouletteAction.EVEN_ODD_BET:
            return f'{item} {which.lower()}.'
        elif bet == RouletteAction.RED_BLACK_BET:
            return f'{item} {which.lower()}.'
        else:
            condition = "higher than 18" if which == "HIGH" else "lower than 19"
            return f'{item} {condition}.'

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

        roulette['state'] = CasinoBuilders.build_roulette_initial_state()

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
            'reactions': {
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
