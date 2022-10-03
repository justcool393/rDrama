import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";

type MessageUpdatedPayload = {
  message: MessageEntity;
};

export interface MessageState {
  all: string[];
  by_id: Record<string, MessageEntity>;
}

const initialState: MessageState = {
  all: [],
  by_id: {},
};

export const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    [CasinoClientActions.MESSAGE_UPDATED]: (
      state,
      action: PayloadAction<MessageUpdatedPayload>
    ) => {
      const { message } = action.payload;

      state.all = Array.from(new Set(state.all.concat(message.id)));
      state.by_id[message.id] = message;
    },
  },
});

export const {
  actions: { [CasinoClientActions.MESSAGE_UPDATED]: messageUpdated },
  reducer: message,
} = messageSlice;
