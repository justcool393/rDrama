import React from "react";
import {
  Card,
  InputNumber,
  Radio,
  Space,
} from "antd";

export function Wager() {
  return (
    <Card title="Wager">
      <Space style={{ width: "100%" }} direction="vertical" align="center">
        <InputNumber
          placeholder="Enter your wager..."
          min={5}
          defaultValue={5}
          addonAfter={
            <Radio.Group defaultValue="coins">
              <Radio value="coins">Coins</Radio>
              <Radio value="procoins">Procoins</Radio>
            </Radio.Group>
          }
        />
      </Space>
    </Card>
  );
}
