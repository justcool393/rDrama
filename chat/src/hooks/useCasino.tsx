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
import { message } from "antd";
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

interface CasinoProviderContext {
  wager: number;
  currency: CasinoCurrency;
  draft: string;
  recipient: null | string;
  setWager: React.Dispatch<React.SetStateAction<number>>;
  setCurrency: React.Dispatch<React.SetStateAction<CasinoCurrency>>;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  setRecipient: React.Dispatch<React.SetStateAction<null | string>>;
  userSentMessage(): void;
  userDeletedMessage(messageId: string): void;
  userStartedGame(game: CasinoGame): void;
  userPulledSlots(): void;
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
  userSentMessage() {},
  userDeletedMessage() {},
  userStartedGame() {},
  userPulledSlots() {},
  userPlayedRoulette() {},
});

export function CasinoProvider({ children }: PropsWithChildren) {
  const socket = useRef<null | Socket>(null);
  const [currency, setCurrency] = useState<CasinoCurrency>("coins");
  const [wager, setWager] = useState(MINIMUM_WAGER);
  const [draft, setDraft] = useState("");
  const [recipient, setRecipient] = useState<null | string>(null);
  const dispatch = useCasinoDispatch();

  // Callbacks
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

  const userPulledSlots = useCallback(() => {
    socket.current?.emit(CasinoHandlers.UserPulledSlots, {
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
      userSentMessage,
      userDeletedMessage,
      userStartedGame,
      userPulledSlots,
      userPlayedRoulette,
    }),
    [
      wager,
      currency,
      recipient,
      draft,
      userSentMessage,
      userDeletedMessage,
      userPulledSlots,
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

  return (
    <CasinoContext.Provider value={value}>{children}</CasinoContext.Provider>
  );
}

export function useCasino() {
  return useContext(CasinoContext);
}
