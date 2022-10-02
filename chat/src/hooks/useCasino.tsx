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
  // Outgoing
  UserSentMessage = "user-sent-message",
  UserDeletedMessage = "user-deleted-message",
  UserStartedGame = "user-started-game",
  UserPulledSlots = "user-pulled-slots",
  UserPlayedRoulette = "user-played-roulette",

  // Incoming
  StateChanged = "state-changed",
  ErrorOccurred = "error-occurred",
  ConfirmationReceived = "confirmation-received",
}

export enum RouletteBet {
  STRAIGHT_UP_BET = "STRAIGHT_UP_BET",
  LINE_BET = "LINE_BET",
  COLUMN_BET = "COLUMN_BET",
  DOZEN_BET = "DOZEN_BET",
  EVEN_ODD_BET = "EVEN_ODD_BET",
  RED_BLACK_BET = "RED_BLACK_BET",
  HIGH_LOW_BET = "HIGH_LOW_BET",
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
  games: {
    all: ["slots", "roulette"],
    by_id: {
      slots: {
        id: "slots",
        name: "Slots",
        user_ids: [],
        state: null,
      },
      roulette: {
        id: "roulette",
        name: "Roulette",
        user_ids: [],
        state: {
          bets: {
            [RouletteBet.STRAIGHT_UP_BET]: [],
            [RouletteBet.LINE_BET]: [],
            [RouletteBet.COLUMN_BET]: [],
            [RouletteBet.DOZEN_BET]: [],
            [RouletteBet.EVEN_ODD_BET]: [],
            [RouletteBet.RED_BLACK_BET]: [],
            [RouletteBet.HIGH_LOW_BET]: [],
          },
        },
      },
    },
  },
  sessions: {
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
  selectUserActiveGame: (state: CasinoState, userId: string) => {
    for (const gameName of state.games.all) {
      if (state.games.by_id[gameName].user_ids.includes(userId)) {
        return gameName;
      }
    }

    return null;
  },
  selectAvailableGames: (state: CasinoState) => state.games.all,
  selectGameSession: (state: CasinoState, user_id: string, game: CasinoGame) => {
    const sharedStateGames: CasinoGame[] = ['roulette', 'racing'];

    if (sharedStateGames.includes(game)) {
      return state.games.by_id[game].state;
    } else {
      return state.sessions.by_id[`${user_id}#${game}`] ?? null
    }
  }
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
  userStartedGame(game: CasinoGame): void;
  userPulledSlots(): void;
  userPlayedRoulette(bet: RouletteBet, which: string): void;
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
  userStartedGame() {},
  userPulledSlots() {},
  userPlayedRoulette() {},
});

export function CasinoProvider({ children }: PropsWithChildren) {
  const socket = useRef<null | Socket>(null);
  const prevState = useRef(CASINO_INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState(CASINO_INITIAL_STATE);
  const [currency, setCurrency] = useState<CasinoCurrency>("coins");
  const [wager, setWager] = useState(MINIMUM_WAGER);
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
      userStartedGame,
      userPulledSlots,
      userPlayedRoulette
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
      userPulledSlots,
      userPlayedRoulette
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
          setTimeout(() => message.error(error), 0);
        })
        .on(CasinoHandlers.ConfirmationReceived, (confirmation) => {
          console.info(`Confirmation Received: ${confirmation}`);
          setTimeout(() => message.success(confirmation), 0);
        });
    }
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const stateDiff = diff(prevState.current, state);
      console.info("Casino State Updated", state, stateDiff);
    }
  }, [state]);

  return (
    <CasinoContext.Provider value={value}>{children}</CasinoContext.Provider>
  );
}

export function useCasino() {
  return useContext(CasinoContext);
}
