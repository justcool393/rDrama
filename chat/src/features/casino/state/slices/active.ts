import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface ActiveState {
  draft: string;
  recipient: string;
  reacting: boolean;
  editing: string;
  bet: {
    wager: number;
    currency: CasinoCurrency;
  };
  user: ActiveUser;
  confirmingDeleteMessage: boolean;
}

const initialState: ActiveState = {
  draft: "",
  recipient: "",
  editing: "",
  reacting: false,
  bet: {
    wager: 0,
    currency: "coins",
  },
  user: {
    id: "",
    username: "",
    admin: false,
    censored: true,
    themeColor: "#ff66ac",
    siteName: "",
    nameColor: "",
    avatar: "",
    hat: "",
  },
  confirmingDeleteMessage: false,
};

export const activeSlice = createSlice({
  name: "active",
  initialState,
  reducers: {
    draftChanged(state, action: PayloadAction<string>) {
      state.draft = action.payload;
    },
    recipientChanged(state, action: PayloadAction<string>) {
      const recipient = action.payload;

      if (recipient === state.recipient) {
        state.recipient = "";
      } else {
        state.recipient = recipient;
      }
    },
    betChanged(state, action: PayloadAction<ActiveState["bet"]>) {
      state.bet = action.payload;
    },
    beganEditing(
      state,
      action: PayloadAction<{ message: string; editing: string }>
    ) {
      const { message, editing } = action.payload;
      state.draft = message;
      state.editing = editing;
    },
    quitEditing(state) {
      state.draft = "";
      state.editing = "";
    },
    userLoaded(state, action: PayloadAction<Partial<ActiveUser>>) {
      Object.assign(state.user, action.payload);
    },
    confirmingDeleteMessage(state) {
      state.confirmingDeleteMessage = true;
    },
    confirmedDeleteMessage(state) {
      state.confirmingDeleteMessage = false;
      state.draft = "";
      state.editing = "";
    },
    openedReactionModal(state) {
      state.reacting = true;
    },
    closedReactionModal(state) {
      state.reacting = false;
    },
  },
});

export const {
  actions: {
    draftChanged,
    recipientChanged,
    betChanged,
    userLoaded,
    confirmingDeleteMessage,
    confirmedDeleteMessage,
    openedReactionModal,
    closedReactionModal,
    beganEditing,
    quitEditing,
  },
  reducer: active,
} = activeSlice;
