import { Select } from "antd";
import React from "react";
import { capitalize } from "../../helpers";
import { useRootContext } from "../../hooks";
import { useCasinoSelector } from "./state";
import { useCasino } from "./useCasino";

const { Option } = Select;

export function GameSelect() {
  const { id } = useRootContext();
  const { userStartedGame } = useCasino();
  const activeGame = useCasinoSelector((state) => {
    for (const gameName of state.game.all) {
      if (state.game.by_id[gameName].user_ids.includes(id)) {
        return gameName;
      }
    }

    return null;
  });
  const availableGames = useCasinoSelector((state) => state.game.all);

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
