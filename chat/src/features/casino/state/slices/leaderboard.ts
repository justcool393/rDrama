import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";
import { initialStateProvided } from "../actions";

type LeaderboardUpdatedPayload = {
  leaderboard: LeaderboardEntity;
};

export interface LeaderboardState {
  all: string[];
  by_id: Record<string, LeaderboardEntity>;
}

const initialState: LeaderboardState = {
  all: [],
  by_id: {},
};

export const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  extraReducers: (builder) =>
    builder.addCase(initialStateProvided, (state, action) => {
      const initialState = action.payload;
      state.all = initialState.leaderboards.all;
      state.by_id = initialState.leaderboards.by_id;
    }),
  reducers: {
    [CasinoClientActions.LEADERBOARD_UPDATED]: (
      state,
      action: PayloadAction<LeaderboardUpdatedPayload>
    ) => {
      const { leaderboard } = action.payload;

      state.all = Array.from(new Set(state.all.concat(leaderboard.id)));
      state.by_id[leaderboard.id] = leaderboard;
    },
  },
});

export const {
  actions: { [CasinoClientActions.LEADERBOARD_UPDATED]: leaderboardUpdated },
  reducer: leaderboard,
} = leaderboardSlice;
