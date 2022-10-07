import React from "react";
import { Divider } from "antd";
import { GameData } from "../GameData";
import { Wager } from "../Wager";
import { SlotMachine } from "../games";

export function Game() {
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
          <SlotMachine />
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
