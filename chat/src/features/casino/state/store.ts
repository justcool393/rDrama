import { configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import {
  active,
  conversation,
  feed,
  game,
  leaderboard,
  message,
  reaction,
  session,
  user,
} from "./slices";

export const store = configureStore({
  reducer: {
    active,
    conversation,
    feed,
    game,
    leaderboard,
    message,
    reaction,
    session,
    user,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useCasinoDispatch: () => AppDispatch = useDispatch;
