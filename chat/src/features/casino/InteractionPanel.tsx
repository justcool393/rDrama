import React from "react";
import { ImExit } from "react-icons/im";
import { Button, Space } from "antd";
import { Game } from "./Game";
import { GameIconSider } from "./GameIconSider";
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
      <Slots />
      <div style={{ padding: "0 2rem" }}>
        <Wager />
      </div>
    </Space>
  );
}
