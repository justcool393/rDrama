import React from "react";
import { Space } from "antd";
import { Game } from "./Game";
import { Wager } from "./Wager";

export function InteractionPanel() {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Game />
      <Wager />
    </Space>
  );
}
