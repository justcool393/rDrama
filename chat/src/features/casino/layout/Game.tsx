import React from "react";
import { ImExit } from "react-icons/im";
import { Button, Divider, Space } from "antd";
import { GameIconSider } from "../GameIconSider";
import { GameData } from "../GameData";
import { Wager } from "../Wager";
import { Slots } from "../games";

export function Game() {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Divider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flex: 1,
        }}
      >
        <GameIconSider direction="horizontal" />
        <Button
          size="large"
          type="ghost"
          shape="circle"
          icon={<ImExit />}
          //   onClick={onClose}
        />
      </div>
      <Slots />
      {/* <div style={{ padding: "0 2rem" }}>
        <Wager />
      </div>
      <Divider />
      <div style={{ padding: "0 1rem" }}>
        <GameData />
      </div> */}
    </Space>
  );
}
