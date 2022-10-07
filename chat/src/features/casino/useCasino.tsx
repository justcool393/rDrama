import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Button, Empty, message } from "antd";
import { io, Socket } from "socket.io-client";
import {
  CasinoHandlers,
  useCasinoDispatch,
  initialStateProvided,
  conversationUpdated,
  feedUpdated,
  gameUpdated,
  leaderboardUpdated,
  messageUpdated,
  messageDeleted,
  sessionUpdated,
  userUpdated,
} from "./state";

export const MINIMUM_WAGER = 5;
export const JOINED_AGAIN_EMPTY_IMAGE_URL = "/e/marseyrain.webp";

interface CasinoProviderContext {
  wager: number;
  currency: CasinoCurrency;
  draft: string;
  recipient: null | string;
  setWager: React.Dispatch<React.SetStateAction<number>>;
  setCurrency: React.Dispatch<React.SetStateAction<CasinoCurrency>>;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  setRecipient: React.Dispatch<React.SetStateAction<null | string>>;
  userKickedOwnClient(): void;
  userSentMessage(): void;
  userDeletedMessage(messageId: string): void;
  userConversed(): void;
  userStartedGame(game: CasinoGame): void;
  userPlayedSlots(): void;
  userPlayedRoulette(bet: RouletteBet, which: string): void;
  userPlayedBlackjack(action: BlackjackAction): void;
  userPlayedRacing(kind: RacingBet, selection: string[]): void;
}

const CasinoContext = createContext<CasinoProviderContext>({
  wager: MINIMUM_WAGER,
  currency: "coins",
  draft: "",
  recipient: null,
  setWager() {},
  setCurrency() {},
  setDraft() {},
  setRecipient() {},
  userKickedOwnClient() {},
  userSentMessage() {},
  userDeletedMessage() {},
  userConversed() {},
  userStartedGame() {},
  userPlayedSlots() {},
  userPlayedRoulette() {},
  userPlayedBlackjack() {},
  userPlayedRacing() {},
});

export function CasinoProvider({ children }: PropsWithChildren) {
  const socket = useRef<null | Socket>(null);
  const [joinedAgain, setJoinedAgain] = useState(false);
  const [currency, setCurrency] = useState<CasinoCurrency>("coins");
  const [wager, setWager] = useState(MINIMUM_WAGER);
  const [draft, setDraft] = useState("");
  const [recipient, setRecipient] = useState<null | string>(null);
  const dispatch = useCasinoDispatch();

  // Callbacks
  const userKickedOwnClient = useCallback(() => {
    socket.current?.emit(CasinoHandlers.UserKickedOwnClient);
  }, []);

  const userSentMessage = useCallback(() => {
    socket.current?.emit(CasinoHandlers.UserSentMessage, {
      message: draft,
    });

    setTimeout(() => setDraft(""), 0);
  }, [draft]);

  const userDeletedMessage = useCallback(
    (messageId: string) =>
      socket.current?.emit(CasinoHandlers.UserDeletedMessage, messageId),
    []
  );

  const userConversed = useCallback(() => {
    if (recipient) {
      socket.current?.emit(CasinoHandlers.UserConversed, {
        message: draft,
        recipient,
      });

      setTimeout(() => setDraft(""), 0);
    }
  }, [draft, recipient]);

  const userStartedGame = useCallback((game: CasinoGame) => {
    socket.current?.emit(CasinoHandlers.UserStartedGame, game);
  }, []);

  const userPlayedSlots = useCallback(() => {
    socket.current?.emit(CasinoHandlers.UserPlayedSlots, {
      currency,
      wager,
    });
  }, [currency, wager]);

  const userPlayedRoulette = useCallback(
    (bet: RouletteBet, which: string) => {
      socket.current?.emit(CasinoHandlers.UserPlayedRoulette, {
        bet,
        which,
        currency,
        wager,
      });
    },
    [currency, wager]
  );

  const userPlayedBlackjack = useCallback(
    (action: BlackjackAction) => {
      const payload =
        action === "DEAL" ? { action, currency, wager } : { action };

      socket.current?.emit(CasinoHandlers.UserPlayedBlackjack, payload);
    },
    [currency, wager]
  );

  const userPlayedRacing = useCallback(
    (kind: RacingBet, selection: string[]) => {
      socket.current?.emit(CasinoHandlers.UserPlayedRacing, {
        kind,
        selection,
        currency,
        wager,
      });
    },
    [currency, wager]
  );

  // Memoized Value
  const value = useMemo<CasinoProviderContext>(
    () => ({
      wager,
      currency,
      recipient,
      draft,
      setWager,
      setCurrency,
      setDraft,
      setRecipient,
      userKickedOwnClient,
      userSentMessage,
      userDeletedMessage,
      userConversed,
      userStartedGame,
      userPlayedSlots,
      userPlayedRoulette,
      userPlayedBlackjack,
      userPlayedRacing,
    }),
    [
      wager,
      currency,
      recipient,
      draft,
      userKickedOwnClient,
      userSentMessage,
      userDeletedMessage,
      userConversed,
      userPlayedSlots,
      userPlayedRoulette,
      userPlayedBlackjack,
      userPlayedRacing,
    ]
  );

  // Effects
  useEffect(() => {
    if (!socket.current) {
      socket.current = io("/casino");

      socket.current
        .on(CasinoHandlers.ErrorOccurred, (error) => {
          console.error(`Error Occurred: ${error}`);
          setTimeout(() => message.error(error), 0);
        })
        .on(CasinoHandlers.ConfirmationReceived, (confirmation) => {
          console.info(`Confirmation Received: ${confirmation}`);
          setTimeout(() => message.success(confirmation), 0);
        })
        .on(CasinoHandlers.Disconnect, () => {
          window.location.href = "/";
        })
        .on(CasinoHandlers.Refresh, () =>
          setTimeout(() => window.location.reload(), 2000)
        )
        .on(CasinoHandlers.JoinedAgain, () => setJoinedAgain(true))
        .on(CasinoHandlers.InitialStateProvided, (state: CasinoState) =>
          dispatch(initialStateProvided(state))
        )
        .on(
          CasinoHandlers.ConversationUpdated,
          (conversation: ConversationEntity) =>
            dispatch(conversationUpdated({ conversation }))
        )
        .on(CasinoHandlers.FeedUpdated, (feed: FeedEntity) =>
          dispatch(feedUpdated({ feed }))
        )
        .on(CasinoHandlers.GameUpdated, (game: GameEntity<any>) =>
          dispatch(gameUpdated({ game }))
        )
        .on(
          CasinoHandlers.LeaderboardUpdated,
          (leaderboard: LeaderboardEntity) =>
            dispatch(leaderboardUpdated({ leaderboard }))
        )
        .on(CasinoHandlers.MessageUpdated, (message: MessageEntity) =>
          dispatch(messageUpdated({ message }))
        )
        .on(CasinoHandlers.MessageDeleted, (message_id: string) =>
          dispatch(messageDeleted({ message_id }))
        )
        .on(CasinoHandlers.SessionUpdated, (session: SessionEntity) =>
          dispatch(sessionUpdated({ session }))
        )
        .on(CasinoHandlers.UserUpdated, (user: UserEntity) =>
          dispatch(userUpdated({ user }))
        );
    }
  });

  if (joinedAgain) {
    return (
      <div
        style={{
          position: "fixed",
          top: 90,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty
          description={
            <Alert
              type="error"
              message="You are already signed into the casino from somewhere else."
            />
          }
          image={JOINED_AGAIN_EMPTY_IMAGE_URL}
        >
          <Button type="primary" onClick={userKickedOwnClient}>
            I want to sign in here
          </Button>
        </Empty>
      </div>
    );
  } else {
    return (
      <CasinoContext.Provider value={value}>{children}</CasinoContext.Provider>
    );
  }
}

export function useCasino() {
  return useContext(CasinoContext);
}
