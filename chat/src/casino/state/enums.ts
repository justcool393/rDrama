export enum CasinoHandlers {
  // Outgoing
  UserSentMessage = "user-sent-message",
  UserDeletedMessage = "user-deleted-message",
  UserConversed = "user-convered",
  UserStartedGame = "user-started-game",
  UserPulledSlots = "user-pulled-slots",
  UserPlayedRoulette = "user-played-roulette",

  // Incoming
  StateChanged = "state-changed",
  ErrorOccurred = "error-occurred",
  ConfirmationReceived = "confirmation-received",
}

export enum CasinoClientActions {
  USER_UPDATED = "USER_UPDATED",
  MESSAGE_UPDATED = "MESSAGE_UPDATED",
  CONVERSATION_UPDATED = "CONVERSATION_UPDATED",
  FEED_UPDATED = "FEED_UPDATED",
  LEADERBOARD_UPDATED = "LEADERBOARD_UPDATED",
  GAME_UPDATED = "GAME_UPDATED",
  SESSION_UPDATED = "SESSION_UPDATED"
}
