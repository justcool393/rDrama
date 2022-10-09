import React from "react";
import { Blackjack, Crossing, Slots, Racing, Roulette } from "../games";
import { useActiveCasinoGame, useUserGameSession } from "../state";

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

  return <ActiveGame />;
}
