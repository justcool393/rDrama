import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CasinoClientActions } from "../enums";
import { initialStateProvided } from "../actions";

type UserUpdatedPayload = {
  user: UserEntity;
};

export interface UserState {
  all: string[];
  by_id: Record<string, UserEntity>;
}

const initialState: UserState = {
  all: [],
  by_id: {},
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  extraReducers: (builder) =>
    builder.addCase(initialStateProvided, (state, action) => {
      const initialState = action.payload;
      state.all = initialState.users.all;
      state.by_id = initialState.users.by_id;
    }),
  reducers: {
    [CasinoClientActions.USER_UPDATED]: (
      state,
      action: PayloadAction<UserUpdatedPayload>
    ) => {
      const { user } = action.payload;

      state.all = Array.from(new Set(state.all.concat(user.id)));
      state.by_id[user.id] = user;
    },
  },
});

export const {
  actions: { [CasinoClientActions.USER_UPDATED]: userUpdated },
  reducer: user,
} = userSlice;
