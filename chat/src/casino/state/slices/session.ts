import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";

type SessionUpdatedPayload = {
  session: SessionEntity;
};

export interface SessionState {
  all: string[];
  by_id: Record<string, SessionEntity>;
}

const initialState: SessionState = {
  all: [],
  by_id: {},
};

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    [CasinoClientActions.SESSION_UPDATED]: (
      state,
      action: PayloadAction<SessionUpdatedPayload>
    ) => {
      const { session } = action.payload;

      state.all = Array.from(new Set(state.all.concat(session.id)));
      state.by_id[session.id] = session;
    },
  },
});

export const {
  actions: { [CasinoClientActions.SESSION_UPDATED]: sessionUpdated },
  reducer: session,
} = sessionSlice;
