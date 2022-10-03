import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";

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
