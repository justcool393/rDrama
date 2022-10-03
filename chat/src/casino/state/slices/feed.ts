import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";

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
