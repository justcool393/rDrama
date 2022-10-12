import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";
import { initialStateProvided } from "../actions";

type ReactionUpdatedPayload = {
  reaction: ReactionEntity;
};

export interface ReactionState {
  all: string[];
  by_id: Record<string, ReactionEntity>;
}

const initialState: ReactionState = {
  all: [],
  by_id: {},
};

export const reactionSlice = createSlice({
  name: "reaction",
  initialState,
  extraReducers: (builder) =>
    builder.addCase(initialStateProvided, (state, action) => {
      const initialState = action.payload;
      state.all = initialState.reactions.all;
      state.by_id = initialState.reactions.by_id;
    }),
  reducers: {
    [CasinoClientActions.REACTION_UPDATED]: (
      state,
      action: PayloadAction<ReactionUpdatedPayload>
    ) => {
      const { reaction } = action.payload;

      state.all = Array.from(new Set(state.all.concat(reaction.id)));
      state.by_id[reaction.id] = reaction;
    },
  },
});

export const {
  actions: { [CasinoClientActions.REACTION_UPDATED]: reactionUpdated },
  reducer: reaction,
} = reactionSlice;
