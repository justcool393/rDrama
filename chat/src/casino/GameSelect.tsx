import { Select } from "antd";
import React from "react";
import { capitalize } from "../helpers";
import { useCasino, useRootContext } from "../hooks";

const { Option } = Select;

export function GameSelect() {
  const { id } = useRootContext();
  const { state, selectors, userStartedGame } = useCasino();
  const activeGame = selectors.selectUserActiveGame(state, id) || "";
  const availableGames = selectors.selectAvailableGames(state);

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
        {availableGames.map((game) => (
          <Option key={game} value={game}>
            {capitalize(game)}
          </Option>
        ))}
      </Select>
    </div>
  );
}
