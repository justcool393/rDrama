import { message as antMessage } from "antd";
import { io } from "socket.io-client";
import { initialStateProvided } from "./actions";
import { CasinoHandlers } from "./enums";
import {
  conversationUpdated,
  feedUpdated,
  gameUpdated,
  gamesUpdated,
  leaderboardUpdated,
  messageUpdated,
  messageDeleted,
  sessionUpdated,
  userUpdated,
  reactionUpdated,
} from "./slices";
import { store } from './store';

export interface SocketActions {
    userKickedOwnClient(): void;
    userSentMessage(message: string): void;
    userReactedToMessage(messageId: string, reaction: string): void;
    userEditedMessage(messageId: string, content: string): void;
    userDeletedMessage(messageId: string): void;
    userConversed(message: string, recipient: string): void;
    userStartedGame(game: CasinoGame): void;
    userQuitGame(): void;
    userPlayedSlots(currency: CasinoCurrency, wager: number): void;
    userPlayedRoulette(
      bet: RouletteBet,
      which: string,
      currency: CasinoCurrency,
      wager: number
    ): void;
    userPlayedBlackjack(
      action: BlackjackAction,
      currency?: CasinoCurrency,
      wager?: number
    ): void;
    userPlayedRacing(
      kind: RacingBet,
      selection: string[],
      currency: CasinoCurrency,
      wager: number
    ): void;
  }

const socket = io("/casino")
  .on(CasinoHandlers.ConfirmationReceived, (confirmation) => {
    setTimeout(() => antMessage.success(confirmation), 0);
  })
  .on(CasinoHandlers.ErrorOccurred, (error) =>
    setTimeout(() => antMessage.error(error), 0)
  )
  .on(CasinoHandlers.InitialStateProvided, (state: CasinoState) =>
    store.dispatch(initialStateProvided(state))
  )
  .on(CasinoHandlers.ConversationUpdated, (conversation: ConversationEntity) =>
    store.dispatch(conversationUpdated({ conversation }))
  )
  .on(CasinoHandlers.ReactionUpdated, (reaction: ReactionEntity) =>
    store.dispatch(reactionUpdated({ reaction }))
  )
  .on(CasinoHandlers.FeedUpdated, (feed: FeedEntity) =>
    store.dispatch(feedUpdated({ feed }))
  )
  .on(CasinoHandlers.GameUpdated, (game: PossibleGameEntity) =>
    store.dispatch(gameUpdated({ game }))
  )
  .on(CasinoHandlers.GamesUpdated, (games: Normalized<PossibleGameEntity>) =>
    store.dispatch(gamesUpdated({ games }))
  )
  .on(CasinoHandlers.LeaderboardUpdated, (leaderboard: LeaderboardEntity) =>
    store.dispatch(leaderboardUpdated({ leaderboard }))
  )
  .on(CasinoHandlers.UserUpdated, (user: UserEntity) =>
    store.dispatch(userUpdated({ user }))
  )
  .on(CasinoHandlers.SessionUpdated, (session: SessionEntity) =>
    store.dispatch(sessionUpdated({ session }))
  )
  .on(CasinoHandlers.MessageUpdated, (message: MessageEntity) =>
    store.dispatch(messageUpdated({ message }))
  )
  .on(CasinoHandlers.MessageDeleted, (message_id: string) =>
    store.dispatch(messageDeleted({ message_id }))
  );

export const socketActions: SocketActions = {
  userKickedOwnClient() {
    socket.emit(CasinoHandlers.UserKickedOwnClient);
  },
  userSentMessage(message) {
    socket.emit(CasinoHandlers.UserSentMessage, {
      message,
    });
  },
  userReactedToMessage(messageId, reaction) {
    socket.emit(CasinoHandlers.UserReactedToMessage, {
      id: messageId,
      reaction,
    });
  },
  userEditedMessage(messageId, content) {
    socket.emit(CasinoHandlers.UserEditedMessage, {
      id: messageId,
      content,
    });
  },
  userDeletedMessage(messageId) {
    socket.emit(CasinoHandlers.UserDeletedMessage, {
      id: messageId,
    });
  },
  userConversed(message, recipient) {
    socket.emit(CasinoHandlers.UserConversed, {
      message,
      recipient,
    });
  },
  userStartedGame(game) {
    socket.emit(CasinoHandlers.UserStartedGame, { game });
  },
  userQuitGame() {
    socket.emit(CasinoHandlers.UserQuitGame);
  },
  userPlayedSlots(currency, wager) {
    socket.emit(CasinoHandlers.UserPlayedSlots, {
      currency,
      wager,
    });
  },
  userPlayedRoulette(bet, which, currency, wager) {
    socket.emit(CasinoHandlers.UserPlayedRoulette, {
      bet,
      which,
      currency,
      wager,
    });
  },
  userPlayedBlackjack(action, currency, wager) {
    const payload =
      action === "DEAL" ? { action, currency, wager } : { action };

    socket.emit(CasinoHandlers.UserPlayedBlackjack, payload);
  },
  userPlayedRacing(kind, selection, currency, wager) {
    socket.emit(CasinoHandlers.UserPlayedRacing, {
      kind,
      selection,
      currency,
      wager,
    });
  },
};

