import React from "react";
import { ImExit } from "react-icons/im";
import { Button, Divider, Space } from "antd";
import { GameIconSider } from "./GameIconSider";
import { Game } from "./Game";
import { Wager } from "./Wager";
import { Slots } from "./games";

interface Props {
  onClose(): void;
}

export function InteractionPanel({ onClose }: Props) {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flex: 1,
        }}
      >
        <GameIconSider direction="horizontal" onLoadGame={() => {}} />
        <Button
          size="large"
          type="ghost"
          shape="circle"
          icon={<ImExit />}
          onClick={onClose}
        />
      </div>
      <Slots onBack={onClose} />
      <div style={{ padding: "0 2rem" }}>
        <Wager />
      </div>
      <Divider />
      <div style={{ padding: "0 1rem" }}>
        <Game />
      </div>
    </Space>
  );
}
