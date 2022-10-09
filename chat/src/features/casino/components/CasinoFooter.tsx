import React from "react";
import { Divider, Menu, Layout } from "antd";
import { TextBox } from "./TextBox";
import {
  useActiveCasinoGame,
  useCasinoGameNames,
  useGameIcons,
} from "../state";
import { useCasino } from "../useCasino";

export function CasinoFooter() {
  const { userStartedGame } = useCasino();
  const activeGame = useActiveCasinoGame();
  const availableGames = useCasinoGameNames();
  const gameIcons = useGameIcons();

  return (
    <Layout.Footer
      style={{
        position: "fixed",
        bottom: 0,
        zIndex: 1,
        width: "100%",
        padding: 0,
      }}
    >
      <Divider style={{ margin: 0 }} />
      <TextBox />
      <Menu
        mode="horizontal"
        selectable={false}
        activeKey={activeGame?.name}
        style={{ borderTop: "1px solid var(--primary)" }}
        items={availableGames.map((game) => {
          const Icon = gameIcons[game];

          return {
            key: game,
            label: <Icon />,
            onClick: () => userStartedGame(game as CasinoGame),
            disabled: activeGame?.name === game,
          };
        })}
      />
    </Layout.Footer>
  );
}
