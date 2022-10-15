import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppDispatch, RootState, SocketActions } from "./store";
import {
  confirmingDeleteMessage,
  closedReactionModal,
  draftChanged,
} from "./slices";

type ThunkType = {
  dispatch: AppDispatch;
  state: RootState;
  extra: SocketActions;
};

export const userSentMessage = createAsyncThunk<void, void, ThunkType>(
  "userSentMessage",
  (_, { dispatch, getState, extra: socketActions }) => {
    const {
      active: { editing, draft },
    } = getState();

    if (editing) {
      if (draft.length === 0) {
        dispatch(confirmingDeleteMessage());
      } else {
        socketActions.userEditedMessage(editing, draft);
      }
    } else {
      socketActions.userSentMessage(draft);
    }
  }
);

type MessageReaction = {
  messageId: string;
  reaction: string;
};

export const userReactedToMessage = createAsyncThunk<
  void,
  MessageReaction,
  ThunkType
>(
  "userReactedToMessage",
  ({ messageId, reaction }, { dispatch, extra: socketActions }) => {
    socketActions.userReactedToMessage(messageId, reaction);
    dispatch(closedReactionModal());
  }
);

export const userConversed = createAsyncThunk<void, void, ThunkType>(
  "userConversed",
  (_, { dispatch, getState, extra: socketActions }) => {
    const {
      active: { draft, recipient },
    } = getState();

    socketActions.userConversed(draft, recipient);
    dispatch(draftChanged(""));
  }
);

export const userPlayedSlots = createAsyncThunk<void, void, ThunkType>(
  "userPlayedSlots",
  (_, { getState, extra: socketActions }) => {
    const {
      active: {
        bet: { currency, wager },
      },
    } = getState();

    socketActions.userPlayedSlots(currency, wager);
  }
);

export const userPlayedBlackjack = createAsyncThunk<
  void,
  BlackjackAction,
  ThunkType
>("userPlayedBlackjack", (action, { getState, extra: socketActions }) => {
  const {
    active: {
      bet: { currency, wager },
    },
  } = getState();

  socketActions.userPlayedBlackjack(action, currency, wager);
});

type RouletteWager = {
  bet: RouletteBet;
  which: string;
};

export const userPlayedRoulette = createAsyncThunk<
  void,
  RouletteWager,
  ThunkType
>(
  "userPlayedRoulette",
  ({ bet, which }, { getState, extra: socketActions }) => {
    const {
      active: {
        bet: { currency, wager },
      },
    } = getState();

    socketActions.userPlayedRoulette(bet, which, currency, wager);
  }
);

type RacingWager = {
  kind: RacingBet;
  selection: string[];
};

export const userPlayedRacing = createAsyncThunk<void, RacingWager, ThunkType>(
  "userPlayedRacing",
  ({ kind, selection }, { getState, extra: socketActions }) => {
    const {
      active: {
        bet: { currency, wager },
      },
    } = getState();

    socketActions.userPlayedRacing(kind, selection, currency, wager);
  }
);
