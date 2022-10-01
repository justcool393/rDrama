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
import { diff } from "deep-diff";
import cloneDeep from "lodash.clonedeep";

enum CasinoHandlers {
  Ping = "ping",
  StateChanged = "state-changed",
  UserSentMessage = "user-sent-message",
  UserDeletedMessage = "user-deleted-message",
  ErrorOccurred = "error-occurred",
  ConfirmationReceived = "confirmation-received",
}

const CASINO_INITIAL_STATE: CasinoState = {
  users: {
    all: [],
    by_id: {},
  },
  messages: {
    all: [],
    by_id: {},
  },
  conversations: {
    all: [],
    by_id: {},
  },
  feed: {
    all: [],
    by_id: {},
  },
  leaderboards: {
    all: [],
    by_id: {},
  },
};

export const MINIMUM_WAGER = 5;

const selectors = {
  selectUsersOnline: (state: CasinoState) =>
    state.users.all
      .map((userId) => state.users.by_id[userId])
      .filter((user) => user.online),
  selectChatMessages: (state: CasinoState) =>
    state.messages.all.map((messageId) => {
      const message = state.messages.by_id[messageId];

      return {
        message,
        author: state.users.by_id[message.user_id],
      };
    }),
  selectUserBalances: (state: CasinoState, userId: string) =>
    state.users.by_id[userId]?.balances ?? {
      coins: 0,
      procoins: 0,
    },
};

interface CasinoProviderContext {
  loaded: boolean;
  state: CasinoState;
  selectors: typeof selectors;
  wager: number;
  currency: CasinoCurrency;
  draft: string;
  recipient: null | string;
  setState: React.Dispatch<React.SetStateAction<CasinoState>>;
  setWager: React.Dispatch<React.SetStateAction<number>>;
  setCurrency: React.Dispatch<React.SetStateAction<CasinoCurrency>>;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  setRecipient: React.Dispatch<React.SetStateAction<null | string>>;
  userSentMessage(): void;
  userDeletedMessage(messageId: string): void;
}

const CasinoContext = createContext<CasinoProviderContext>({
  loaded: false,
  state: CASINO_INITIAL_STATE,
  selectors,
  wager: MINIMUM_WAGER,
  currency: "coins",
  draft: "",
  recipient: null,
  setState() {},
  setWager() {},
  setCurrency() {},
  setDraft() {},
  setRecipient() {},
  userSentMessage() {},
  userDeletedMessage() {},
});

export function CasinoProvider({ children }: PropsWithChildren) {
  const socket = useRef<null | Socket>(null);
  const prevState = useRef(CASINO_INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState(CASINO_INITIAL_STATE);
  const [wager, setWager] = useState(MINIMUM_WAGER);
  const [currency, setCurrency] = useState<CasinoCurrency>("coins");
  const [draft, setDraft] = useState("");
  const [recipient, setRecipient] = useState<null | string>(null);

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

  // Memoized Value
  const value = useMemo<CasinoProviderContext>(
    () => ({
      loaded,
      state,
      selectors,
      wager,
      currency,
      recipient,
      draft,
      setState,
      setWager,
      setCurrency,
      setDraft,
      setRecipient,
      userSentMessage,
      userDeletedMessage,
    }),
    [
      loaded,
      state,
      wager,
      currency,
      recipient,
      draft,
      userSentMessage,
      userDeletedMessage,
    ]
  );

  // Effects
  useEffect(() => {
    if (!socket.current) {
      socket.current = io();

      socket.current
        .on(CasinoHandlers.StateChanged, (nextState) => {
          prevState.current = cloneDeep(state);
          setState(nextState);

          if (!loaded) {
            setLoaded(true);
          }
        })
        .on(CasinoHandlers.ErrorOccurred, (error) => {
          console.error(`Error Occurred: ${error}`);
          message.error(error);
        })
        .on(CasinoHandlers.ConfirmationReceived, (confirmation) => {
          console.info(`Confirmation Received: ${confirmation}`);
          message.success(confirmation);
        });
    }
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const stateDiff = diff(prevState.current, state);
      console.info("Casino State Updated", stateDiff);
    }
  }, [state]);

  return (
    <CasinoContext.Provider value={value}>{children}</CasinoContext.Provider>
  );
}

export function useCasino() {
  return useContext(CasinoContext);
}
