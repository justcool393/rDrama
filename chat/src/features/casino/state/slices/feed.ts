import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";
import { initialStateProvided } from "../actions";

type FeedUpdatedPayload = {
  feed: FeedEntity;
};

export interface FeedState {
  all: string[];
  by_id: Record<string, FeedEntity>;
}

const initialState: FeedState = {
  all: [],
  by_id: {},
};

export const feedSlice = createSlice({
  name: "feed",
  initialState,
  extraReducers: (builder) =>
    builder.addCase(initialStateProvided, (state, action) => {
      const initialState = action.payload;
      state.all = initialState.feed.all;
      state.by_id = initialState.feed.by_id;
    }),
  reducers: {
    [CasinoClientActions.FEED_UPDATED]: (
      state,
      action: PayloadAction<FeedUpdatedPayload>
    ) => {
      const { feed } = action.payload;

      state.all = Array.from(new Set(state.all.concat(feed.id)));
      state.by_id[feed.id] = feed;
    },
  },
});

export const {
  actions: { [CasinoClientActions.FEED_UPDATED]: feedUpdated },
  reducer: feed,
} = feedSlice;
