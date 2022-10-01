import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

enum CasinoHandlers {
  Ping = "ping",
  StateChanged = "state-changed",
  UserSentMessage = "user-sent-message",
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
    state.users.all.map((userId) => state.users.by_id[userId]),
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

export function useCasino() {
  const socket = useRef<null | Socket>(null);
  const [state, setState] = useState(CASINO_INITIAL_STATE);
  const [wager, setWager] = useState(MINIMUM_WAGER);
  const [currency, setCurrency] = useState<CasinoCurrency>("coins");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!socket.current) {
      socket.current = io();
      socket.current.on(CasinoHandlers.StateChanged, setState);
    }
  });

  const userSentMessage = useCallback((message: string, recipient = null) => {
    socket.current?.emit(CasinoHandlers.UserSentMessage, {
      message,
      recipient,
    });
  }, []);

  return {
    state,
    selectors,
    wager,
    currency,
    draft,
    userSentMessage,
    setWager,
    setCurrency,
    setDraft
  };
}
