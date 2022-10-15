import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { message } from "antd";
import { io, Socket } from "socket.io-client";
import { CasinoHandlers } from "./enums";
import { initialStateProvided } from "./actions";
import { useCasinoDispatch } from "./store";
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

interface SocketActionProviderContext {
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

const SocketActionContext = createContext<SocketActionProviderContext>({
  userKickedOwnClient() {},
  userSentMessage() {},
  userReactedToMessage() {},
  userEditedMessage() {},
  userDeletedMessage() {},
  userConversed() {},
  userStartedGame() {},
  userQuitGame() {},
  userPlayedSlots() {},
  userPlayedRoulette() {},
  userPlayedBlackjack() {},
  userPlayedRacing() {},
});

export function SocketActionProvider({ children }: PropsWithChildren) {
  const socket = useRef<null | Socket>(null);
  const dispatch = useCasinoDispatch();
  const value = useMemo(() => {
    const actions: SocketActionProviderContext = {
      userKickedOwnClient() {
        socket.current?.emit(CasinoHandlers.UserKickedOwnClient);
      },
      userSentMessage(message) {
        socket.current?.emit(CasinoHandlers.UserSentMessage, {
          message,
        });
      },
      userReactedToMessage(messageId, reaction) {
        socket.current?.emit(CasinoHandlers.UserReactedToMessage, {
          id: messageId,
          reaction,
        });
      },
      userEditedMessage(messageId, content) {
        socket.current?.emit(CasinoHandlers.UserEditedMessage, {
          id: messageId,
          content,
        });
      },
      userDeletedMessage(messageId) {
        socket.current?.emit(CasinoHandlers.UserDeletedMessage, {
          id: messageId,
        });
      },
      userConversed(message, recipient) {
        socket.current?.emit(CasinoHandlers.UserConversed, {
          message,
          recipient,
        });
      },
      userStartedGame(game) {
        socket.current?.emit(CasinoHandlers.UserStartedGame, { game });
      },
      userQuitGame() {
        socket.current?.emit(CasinoHandlers.UserQuitGame);
      },
      userPlayedSlots(currency, wager) {
        socket.current?.emit(CasinoHandlers.UserPlayedSlots, {
          currency,
          wager,
        });
      },
      userPlayedRoulette(bet, which, currency, wager) {
        socket.current?.emit(CasinoHandlers.UserPlayedRoulette, {
          bet,
          which,
          currency,
          wager,
        });
      },
      userPlayedBlackjack(action, currency, wager) {
        const payload =
          action === "DEAL" ? { action, currency, wager } : { action };

        socket.current?.emit(CasinoHandlers.UserPlayedBlackjack, payload);
      },
      userPlayedRacing(kind, selection, currency, wager) {
        socket.current?.emit(CasinoHandlers.UserPlayedRacing, {
          kind,
          selection,
          currency,
          wager,
        });
      },
    };

    return actions;
  }, []);

  // Handle socket connection.
  useEffect(() => {
    if (!socket.current) {
      socket.current = io("/casino")
        .on(CasinoHandlers.ConfirmationReceived, (confirmation) => {
          setTimeout(() => message.success(confirmation), 0);
        })
        .on(CasinoHandlers.ErrorOccurred, (error) =>
          setTimeout(() => message.error(error), 0)
        )
        .on(CasinoHandlers.InitialStateProvided, (state: CasinoState) =>
          dispatch(initialStateProvided(state))
        );

      for (const [updatedEvent, eventProperties] of Object.values(
        CASINO_HANDLERS_TO_UPDATERS
      )) {
        const [updater, entityName] = eventProperties as any;
        socket.current.on(updatedEvent as CasinoHandlers, (value: any) =>
          dispatch(
            updater({
              [entityName]: value,
            })
          )
        );
      }
    }
  });

  return (
    <SocketActionContext.Provider value={value}>
      {children}
    </SocketActionContext.Provider>
  );
}

export function useSocketActions() {
  return useContext(SocketActionContext);
}
