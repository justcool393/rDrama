import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";
import { initialStateProvided } from "../actions";

type ConversationUpdatedPayload = {
  conversation: ConversationEntity;
};

export interface ConversationState {
  all: string[];
  by_id: Record<string, ConversationEntity>;
}

const initialState: ConversationState = {
  all: [],
  by_id: {},
};

export const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  extraReducers: (builder) =>
    builder.addCase(initialStateProvided, (state, action) => {
      const initialState = action.payload;
      state.all = initialState.conversations.all;
      state.by_id = initialState.conversations.by_id;
    }),
  reducers: {
    [CasinoClientActions.CONVERSATION_UPDATED]: (
      state,
      action: PayloadAction<ConversationUpdatedPayload>
    ) => {
      const { conversation } = action.payload;

      state.all = Array.from(new Set(state.all.concat(conversation.id)));
      state.by_id[conversation.id] = conversation;
    },
  },
});

export const {
  actions: { [CasinoClientActions.CONVERSATION_UPDATED]: conversationUpdated },
  reducer: conversation,
} = conversationSlice;
