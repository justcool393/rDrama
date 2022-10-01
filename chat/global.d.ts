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

/* === */
type CasinoGame = "slots" | "blackjack" | "roulette" | "racing" | "crossing";

type CasinoCurrency = "coins" | "procoins";

declare interface Normalized<T> {
  all: string[];
  by_id: Record<string, T>;
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
  user_id: string;
  game: CasinoGame;
  currency: CasinoCurrency;
  amount: number;
  description: string;
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

declare interface CasinoState {
  users: Normalized<UserEntity>
  messages: Normalized<MessageEntity>
  conversations: Normalized<ConversationEntity>
  feed: Normalized<FeedEntity>
  leaderboards: Normalized<LeaderboardEntity>
}