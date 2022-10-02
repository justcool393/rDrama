import { Select } from "antd";
import React from "react";
import { useCasino, useRootContext } from "../hooks";

const { Option } = Select;

export function GameSelect() {
  const { id } = useRootContext();
  const { state, selectors, userStartedGame } = useCasino();
  const activeGame = selectors.selectUserActiveGame(state, id) || "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Select
        value={activeGame}
        style={{ width: 180 }}
        onChange={(value) => {
          if (value) {
            userStartedGame(value as CasinoGame);
          }
        }}
      >
        <Option value="">Select a game</Option>
        <Option value="slots">Slots</Option>
        <Option value="blackjack">Blackjack</Option>
        <Option value="roulette">Roulette</Option>
        <Option value="racing">Racing</Option>
        <Option value="crossing">Crossing</Option>
      </Select>
    </div>
  );
}
