import React from "react";
import { Divider } from "antd";
import { GameData } from "../GameData";
import { Wager } from "../Wager";
import { Blackjack, Crossing, Slots, Racing, Roulette } from "../games";
import { useActiveCasinoGame } from "../state";

const GAMES_TO_GAME_COMPONENTS: Record<CasinoGame, () => JSX.Element> = {
  slots: Slots,
  blackjack: Blackjack,
  roulette: Roulette,
  racing: Racing,
  crossing: Crossing,
};

export function Game() {
  const game = useActiveCasinoGame();
  const ActiveGame = game ? GAMES_TO_GAME_COMPONENTS[game.name] : () => null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Divider />
      <div style={{ flex: 1 }}>
        <div style={{ position: "relative", left: 30 }}>
          <ActiveGame />
        </div>
        <div style={{ flex: 1, padding: "2rem" }}>
          <Wager />
        </div>
      </div>
      <Divider />
      <div style={{ width: "90%" }}>
        <GameData />
      </div>
    </div>
  );
}
