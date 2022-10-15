import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "./store";
import {
  confirmingDeleteMessage,
  closedReactionModal,
  draftChanged,
  quitEditing,
} from "./slices";
import { socketActions } from "./socket";

type ThunkType = {
  dispatch: AppDispatch;
  state: RootState;
};

export const userSentMessage = createAsyncThunk<void, void, ThunkType>(
  "userSentMessage",
  (_, { dispatch, getState }) => {
    const {
      active: { editing, draft },
    } = getState();

    if (editing) {
      if (draft.length === 0) {
        dispatch(confirmingDeleteMessage());
      } else {
        socketActions.userEditedMessage(editing, draft);
        dispatch(quitEditing());
      }
    } else {
      socketActions.userSentMessage(draft);
      setTimeout(() => dispatch(draftChanged("")), 0);
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
>("userReactedToMessage", ({ messageId, reaction }, { dispatch }) => {
  socketActions.userReactedToMessage(messageId, reaction);
  dispatch(closedReactionModal());
});

export const userConversed = createAsyncThunk<void, void, ThunkType>(
  "userConversed",
  (_, { dispatch, getState }) => {
    const {
      active: { draft, recipient },
    } = getState();

    socketActions.userConversed(draft, recipient);
    setTimeout(() => dispatch(draftChanged("")), 0);
  }
);

export const userPlayedSlots = createAsyncThunk<void, void, ThunkType>(
  "userPlayedSlots",
  (_, { getState }) => {
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
>("userPlayedBlackjack", (action, { getState }) => {
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
>("userPlayedRoulette", ({ bet, which }, { getState }) => {
  const {
    active: {
      bet: { currency, wager },
    },
  } = getState();

  socketActions.userPlayedRoulette(bet, which, currency, wager);
});

type RacingWager = {
  kind: RacingBet;
  selection: string[];
};

export const userPlayedRacing = createAsyncThunk<void, RacingWager, ThunkType>(
  "userPlayedRacing",
  ({ kind, selection }, { getState }) => {
    const {
      active: {
        bet: { currency, wager },
      },
    } = getState();

    socketActions.userPlayedRacing(kind, selection, currency, wager);
  }
);
