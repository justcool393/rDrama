import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";
import { initialStateProvided } from "../actions";

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
  extraReducers: (builder) =>
    builder.addCase(initialStateProvided, (state, action) => {
      const initialState = action.payload;
      state.all = initialState.sessions.all;
      state.by_id = initialState.sessions.by_id;
    }),
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
