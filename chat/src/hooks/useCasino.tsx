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
  conversationUpdated,
  feedUpdated,
  gameUpdated,
  initialStateProvided,
  leaderboardUpdated,
  messageUpdated,
  messageDeleted,
  sessionUpdated,
  userUpdated,
} from "../casino";

export enum RouletteBet {
  STRAIGHT_UP_BET = "STRAIGHT_UP_BET",
  LINE_BET = "LINE_BET",
  COLUMN_BET = "COLUMN_BET",
  DOZEN_BET = "DOZEN_BET",
  EVEN_ODD_BET = "EVEN_ODD_BET",
  RED_BLACK_BET = "RED_BLACK_BET",
  HIGH_LOW_BET = "HIGH_LOW_BET",
}

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
  userStartedGame(game: CasinoGame): void;
  UserPlayedSlots(): void;
  userPlayedRoulette(bet: RouletteBet, which: string): void;
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
  userStartedGame() {},
  UserPlayedSlots() {},
  userPlayedRoulette() {},
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
      recipient,
    });

    setRecipient(null);
    setTimeout(() => setDraft(""), 0);
  }, [draft, recipient]);

  const userDeletedMessage = useCallback(
    (messageId: string) =>
      socket.current?.emit(CasinoHandlers.UserDeletedMessage, messageId),
    []
  );

  const userStartedGame = useCallback((game: CasinoGame) => {
    socket.current?.emit(CasinoHandlers.UserStartedGame, game);
  }, []);

  const UserPlayedSlots = useCallback(() => {
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
      userStartedGame,
      UserPlayedSlots,
      userPlayedRoulette,
    }),
    [
      wager,
      currency,
      recipient,
      draft,
      userKickedOwnClient,
      userSentMessage,
      userDeletedMessage,
      UserPlayedSlots,
      userPlayedRoulette,
    ]
  );

  // Effects
  useEffect(() => {
    if (!socket.current) {
      socket.current = io();

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
          <Button type="primary" onClick={userKickedOwnClient}>I want to sign in here</Button>
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
