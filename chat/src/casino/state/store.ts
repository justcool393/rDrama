import { configureStore } from "@reduxjs/toolkit";
import {
  conversation,
  feed,
  game,
  leaderboard,
  message,
  session,
  user,
} from "./slices";

export const store = configureStore({
  reducer: {
    conversation,
    feed,
    game,
    leaderboard,
    message,
    session,
    user
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
