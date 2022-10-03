import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";

type PossibleGameEntity = SlotsGameEntity | RouletteGameEntity;

type GameUpdatedPayload = {
  game: PossibleGameEntity;
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
  reducers: {
    [CasinoClientActions.GAME_UPDATED]: (
      state,
      action: PayloadAction<GameUpdatedPayload>
    ) => {
      const { game } = action.payload;

      state.all = Array.from(new Set(state.all.concat(game.id)));
      state.by_id[game.id] = game;
    },
  },
});

export const {
  actions: { [CasinoClientActions.GAME_UPDATED]: gameUpdated },
  reducer: game,
} = gameSlice;
