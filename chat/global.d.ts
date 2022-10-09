declare var process: {
  env: Record<string, any>;
};

declare interface IChatMessage {
  id: string;
  username: string;
  user_id?: string;
  avatar: string;
  hat: string;
  namecolor: string;
  text: string;
  base_text_censored: string;
  text_censored: string;
  text_html: string;
  time: number;
  quotes: null | string;
  dm: boolean;
}

declare interface EmojiModSelection {
  large: boolean;
  mirror: boolean;
  pat: boolean;
}

declare type CasinoGame =
  | "slots"
  | "blackjack"
  | "roulette"
  | "racing"
  | "crossing";

declare type CasinoCurrency = "coins" | "procoins";

declare type CasinoGameStatus = "waiting" | "started" | "done";

declare interface CasinoGameState {
  game_status: CasinoGameStatus;
  currency: CasinoCurrency;
  wager: number;
  reward: number;
}

declare interface Normalized<T> {
  all: string[];
  by_id: Record<string, T>;
}

declare interface Wager {
  amount: number;
  currency: CasinoCurrency;
}

declare interface UserAccountJson {
  username: string;
  url: string;
  is_banned: boolean;
  created_utc: string;
  id: string;
  is_private: string;
  profile_url: string;
  bannerurl: string;
  bio: string;
  bio_html: string;
  flair: string;
  badges: any[];
  coins: number;
  post_count: number;
  comment_count: number;
}

declare interface UserEntity {
  id: string;
  account: UserAccountJson;
  online: boolean;
  last_active: number;
  balances: Record<CasinoCurrency, number>;
}

declare interface MessageEntity {
  id: string;
  user_id: string;
  text: string;
  timestamp: number;
}

declare interface ConversationEntity {
  id: string;
  participants: [string, string] /* [user_id, user_id] */;
  messages: Normalized<MessageEntity>;
}

declare interface FeedEntity {
  id: string;
  channels: string[];
  text: string;
  timestamp: number;
}

type LeaderboardStat = {
  user_id: string;
  amount: number;
};

declare interface LeaderboardEntity {
  id: string;
  game: CasinoGame;
  all_time: {
    winners: LeaderboardStat[];
    losers: LeaderboardStat[];
  };
  last_24h: {
    winners: LeaderboardStat[];
    losers: LeaderboardStat[];
  };
}

declare interface GameEntity<T> {
  id: string;
  name: string;
  user_ids: string[];
  state: T;
}

declare type PossibleGameEntity =
  | SlotsGameEntity
  | RouletteGameEntity
  | BlackjackGameEntity
  | RacingGameEntity;

declare interface SlotsGameState extends CasinoGameState {
  symbols: [null | string, null | string, null | string];
  outcome: "undecided" | "loss" | "push" | "win" | "jackpot";
}

declare type SlotsGameEntity = GameEntity<null>;

declare type RouletteBet =
  | "STRAIGHT_UP_BET"
  | "LINE_BET"
  | "COLUMN_BET"
  | "DOZEN_BET"
  | "EVEN_ODD_BET"
  | "RED_BLACK_BET"
  | "HIGH_LOW_BET";

declare interface RouletteBetData {
  game_id: string;
  gambler: string;
  gambler_username: string;
  gambler_profile_url: string;
  bet: RouletteBet;
  which: string;
  wager: Wager;
}

declare interface RouletteGameState {
  bets: Record<RouletteBet, RouletteBetData[]>;
}

declare type RouletteGameEntity = GameEntity<RouletteGameState>;

declare type BlackjackAction =
  | "DEAL"
  | "HIT"
  | "STAY"
  | "DOUBLE_DOWN"
  | "BUY_INSURANCE";

declare type BlackjackStatus = 
  | "PLAYING"
  | "STAYED"
  | "PUSHED"
  | "WON"
  | "LOST"
  | "BLACKJACK"

declare interface BlackjackGameState extends CasinoGameState {
  player: string[];
  player_value: number;
  dealer: string[];
  dealer_value: number;
  player_bought_insurance: boolean;
  player_doubled_down: boolean;
  status: BlackjackStatus;
  actions: BlackjackAction[];
}

declare type BlackjackGameEntity = GameEntity<null>;

declare type RacingBet =
  | "WIN"
  | "PLACE"
  | "SHOW"
  | "QUINELLA"
  | "EXACTA"
  | "TRIFECTA"
  | "TRIFECTA_BOX"
  | "SUPERFECTA"
  | "SUPERFECTA_BOX";

declare type RacingHealth =
  | "EXCELLENT"
  | "GREAT"
  | "GOOD"
  | "AVERAGE"
  | "POOR"
  | "DEVASTATING"
  | "CATASTROPHIC";

declare type RacingSpirit =
  | "EMANATING"
  | "PULSING"
  | "THROBBING"
  | "TWITCHING"
  | "FLICKERING"
  | "NONEXISTENT"
  | "SOREN";

declare interface RacingBetData {
  id: string;
  user_id: string;
  bet: RacingBet;
  selections: string[];
  amount: number;
  currency: CasinoCurrency;
  succeeded: boolean;
}

declare interface RacingUserData {
  id: string;
  username: string;
  bets: string[];
  payouts: string[];
}

declare interface RacingPayoutData {
  id: string;
  bet_id: string;
  user_id: string;
  currency: CasinoCurrency;
  refund: number;
  reward: number;
  total: number;
  paid: boolean;
}

declare interface Racer {
  name: string;
  health: RacingHealth;
  spirit: RacingSpirit;
  speed: number;
  placement: number;
}

declare type PodiumRacer = null | string;

declare interface RacingGameState {
  marseys: Normalized<Racer>;
  betting_open: boolean;
  race_started: boolean;
  podium: [PodiumRacer, PodiumRacer, PodiumRacer, PodiumRacer];
  biggest_loser: null | string;
  odds: Record<RacingBet, number>;
  bets: Normalized<RacingBetData>;
  users: Normalized<RacingUserData>;
  payouts: Normalized<RacingPayoutData>;
}

declare type RacingGameEntity = GameEntity<RacingGameState>;

declare interface SessionEntity {
  id: string;
  user_id: string;
  game: CasinoGame;
  game_state: CasinoGameState;
}

declare interface CasinoState {
  users: Normalized<UserEntity>;
  messages: Normalized<MessageEntity>;
  conversations: Normalized<ConversationEntity>;
  feed: Normalized<FeedEntity>;
  leaderboards: Normalized<LeaderboardEntity>;
  sessions: Normalized<SessionEntity>;
  games: {
    all: ["slots", "roulette", "blackjack", "racing"];
    by_id: {
      slots: SlotsGameEntity;
      roulette: RouletteGameEntity;
      blackjack: BlackjackGameEntity;
      racing: RacingGameEntity;
    };
  };
}

declare type PlayingCardRank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

declare type PlayingCardSuit = "C" | "H" | "D" | "S";