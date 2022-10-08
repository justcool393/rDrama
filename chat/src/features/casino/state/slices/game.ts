import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";
import { initialStateProvided } from "../actions";

type GameUpdatedPayload = {
  game: PossibleGameEntity;
};

type GamesUpdatedPayload = {
  games: Normalized<PossibleGameEntity>;
};

export interface GameState {
  all: string[];
  by_id: Record<string, PossibleGameEntity>;
}

const initialState: GameState = {
  all: [],
  by_id: {},
};

export const gameSlice = createSlice({
  name: "game",
  initialState,
  extraReducers: (builder) =>
    builder.addCase(initialStateProvided, (state, action) => {
      const initialState = action.payload;
      state.all = initialState.games.all;
      state.by_id = initialState.games.by_id;
    }),
  reducers: {
    [CasinoClientActions.GAME_UPDATED]: (
      state,
      action: PayloadAction<GameUpdatedPayload>
    ) => {
      const { game } = action.payload;

      state.all = Array.from(new Set(state.all.concat(game.id)));
      state.by_id[game.id] = game;
    },
    [CasinoClientActions.GAMES_UPDATED]: (
      state,
      action: PayloadAction<GamesUpdatedPayload>
    ) => {
      const { games } = action.payload;

      state.all = games.all;
      state.by_id = games.by_id;
    },
  },
});

export const {
  actions: {
    [CasinoClientActions.GAME_UPDATED]: gameUpdated,
    [CasinoClientActions.GAMES_UPDATED]: gamesUpdated,
  },
  reducer: game,
} = gameSlice;
