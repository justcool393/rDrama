import { configureStore } from "@reduxjs/toolkit";
import { message as antMessage } from "antd";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { initialStateProvided } from "./actions";
import { CasinoHandlers } from "./enums";
import {
  active,
  conversation,
  feed,
  game,
  leaderboard,
  message,
  reaction,
  session,
  user,
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

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: socketActions,
      },
      serializableCheck: false,
    }),
  reducer: {
    active,
    conversation,
    feed,
    game,
    leaderboard,
    message,
    reaction,
    session,
    user,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useCasinoDispatch: () => AppDispatch = useDispatch;

//===
const CASINO_HANDLERS_TO_UPDATERS = {
  [CasinoHandlers.ConversationUpdated]: [conversationUpdated, "conversation"],
  [CasinoHandlers.ReactionUpdated]: [reactionUpdated, "reaction"],
  [CasinoHandlers.FeedUpdated]: [feedUpdated, "feed"],
  [CasinoHandlers.GameUpdated]: [gameUpdated, "game"],
  [CasinoHandlers.GamesUpdated]: [gamesUpdated, "games"],
  [CasinoHandlers.LeaderboardUpdated]: [leaderboardUpdated, "leaderboard"],
  [CasinoHandlers.MessageUpdated]: [messageUpdated, "message"],
  [CasinoHandlers.MessageDeleted]: [messageDeleted, "message_id"],
  [CasinoHandlers.SessionUpdated]: [sessionUpdated, "session"],
  [CasinoHandlers.UserUpdated]: [userUpdated, "user"],
};

const socket = io("/casino")
.on(CasinoHandlers.ConfirmationReceived, (confirmation) => {
  setTimeout(() => antMessage.success(confirmation), 0);
})
.on(CasinoHandlers.ErrorOccurred, (error) =>
  setTimeout(() => antMessage.error(error), 0)
)
.on(CasinoHandlers.InitialStateProvided, (state: CasinoState) =>
  store.dispatch(initialStateProvided(state))
);

for (const [updatedEvent, eventProperties] of Object.values(
  CASINO_HANDLERS_TO_UPDATERS
)) {
  const [updater, entityName] = eventProperties as any;
  socket.on(updatedEvent as CasinoHandlers, (value: any) =>
    store.dispatch(
      updater({
        [entityName]: value,
      })
    )
  );
}

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
//===