import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";
import { initialStateProvided } from "../actions";

type MessageUpdatedPayload = {
  message: MessageEntity;
};

type MessageDeletedPayload = {
  message_id: string;
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
  extraReducers: (builder) =>
    builder.addCase(initialStateProvided, (state, action) => {
      const initialState = action.payload;
      state.all = initialState.messages.all;
      state.by_id = initialState.messages.by_id;
    }),
  reducers: {
    [CasinoClientActions.MESSAGE_UPDATED]: (
      state,
      action: PayloadAction<MessageUpdatedPayload>
    ) => {
      const { message } = action.payload;

      state.all = Array.from(new Set(state.all.concat(message.id)));
      state.by_id[message.id] = message;
    },
    [CasinoClientActions.MESSAGE_DELETED]: (
      state,
      action: PayloadAction<MessageDeletedPayload>
    ) => {
      const { message_id } = action.payload;

      state.all = state.all.filter((id) => id !== message_id);
      delete state.by_id[message_id];
    },
  },
});

export const {
  actions: {
    [CasinoClientActions.MESSAGE_UPDATED]: messageUpdated,
    [CasinoClientActions.MESSAGE_DELETED]: messageDeleted,
  },
  reducer: message,
} = messageSlice;
