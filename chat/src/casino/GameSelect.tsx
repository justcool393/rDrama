import { Select } from "antd";
import React from "react";

const { Option } = Select;

export function GameSelect() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Select defaultValue="slots" style={{ width: 180 }}>
        <Option value="slots">Slots</Option>
        <Option value="blackjack">Blackjack</Option>
        <Option value="roulette">Roulette</Option>
        <Option value="racing">Racing</Option>
        <Option value="crossing">Crossing</Option>
      </Select>
    </div>
  );
}
