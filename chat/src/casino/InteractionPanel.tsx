import { Space, Tabs } from "antd";
import React from "react";
import { Game } from "./Game";
import { GameSelect } from "./GameSelect";
import { Wager } from "./Wager";
import { YourStats } from "./YourStats";

export function InteractionPanel() {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Tabs
        defaultActiveKey="games"
        centered={true}
        items={[
          {
            label: "Games",
            key: "games",
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                <GameSelect />
                <Game />
                <Wager />
                <YourStats />
              </Space>
            ),
          },
          {
            label: "Leaderboards",
            key: "leaderboards",
            children: (
              <Space direction="vertical" style={{ width: "100%" }}>
                <GameSelect />
              </Space>
            ),
          },
        ]}
      ></Tabs>
    </Space>
  );
}
