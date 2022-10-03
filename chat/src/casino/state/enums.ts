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
  InitialStateProvided = "initial-state-provided",
  ConfirmationReceived = "confirmation-received",
  ConversationUpdated = "conversation-updated",
	FeedUpdated = "feed-updated",
	GameUpdated = "game-updated",
	LeaderboardUpdated = "leaderboard-updated",
	MessageUpdated = "message-updated",
  MessageDeleted = "message-deleted",
	SessionUpdated = "session-updated",
	UserUpdated = "user-updated"
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
  SESSION_UPDATED = "SESSION_UPDATED"
}
