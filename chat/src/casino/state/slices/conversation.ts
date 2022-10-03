import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";

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
