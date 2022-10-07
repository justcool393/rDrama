import React from "react";
import { Layout, Space } from "antd";
import { Wager } from "../../Wager";
import { SlotMachine } from "./SlotMachine";
import "./Slots.css";

export function Slots() {
  return (
    <Layout>
      <Layout.Content>
        <Space size="large" direction="vertical">
          <SlotMachine />
          <Wager />
        </Space>
      </Layout.Content>
    </Layout>
  );
}
