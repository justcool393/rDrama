export enum CasinoHandlers {
  // Outgoing
  UserKickedOwnClient = "user-kicked-own-client",
  UserSentMessage = "user-sent-message",
  UserDeletedMessage = "user-deleted-message",
  UserConversed = "user-conversed",
  UserStartedGame = "user-started-game",
  UserPlayedSlots = "user-played-slots",
  UserPlayedRoulette = "user-played-roulette",
  UserPlayedBlackjack = "user-played-blackjack",
  UserPlayedRacing = "user-played-racing",

  // Incoming
  Disconnect = "disconnect",
  StateChanged = "state-changed",
  ErrorOccurred = "error-occurred",
  JoinedAgain = "joined-again",
  Refresh = "refresh",
  InitialStateProvided = "initial-state-provided",
  ConfirmationReceived = "confirmation-received",
  ConversationUpdated = "conversation-updated",
  FeedUpdated = "feed-updated",
  GameUpdated = "game-updated",
  LeaderboardUpdated = "leaderboard-updated",
  MessageUpdated = "message-updated",
  MessageDeleted = "message-deleted",
  SessionUpdated = "session-updated",
  UserUpdated = "user-updated",
}

export enum CasinoClientActions {
  INITIAL_STATE_PROVIDED = "INITIAL_STATE_PROVIDED",
  USER_UPDATED = "USER_UPDATED",
  MESSAGE_UPDATED = "MESSAGE_UPDATED",
  MESSAGE_DELETED = "MESSAGE_DELETED",
  CONVERSATION_UPDATED = "CONVERSATION_UPDATED",
  FEED_UPDATED = "FEED_UPDATED",
  LEADERBOARD_UPDATED = "LEADERBOARD_UPDATED",
  GAME_UPDATED = "GAME_UPDATED",
  SESSION_UPDATED = "SESSION_UPDATED",
}
