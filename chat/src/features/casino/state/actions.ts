import { createAction } from "@reduxjs/toolkit";
import { CasinoClientActions } from "./enums";

export const initialStateProvided = createAction<CasinoState>(
  CasinoClientActions.INITIAL_STATE_PROVIDED
);

