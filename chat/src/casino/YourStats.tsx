import React from "react";
import { Card, Space } from "antd";
import { useCasino, useRootContext } from "../hooks";

export function YourStats() {
  const { id } = useRootContext();
  const { state, selectors } = useCasino();
  const { coins, procoins } = selectors.selectUserBalances(state, id);

  return (
    <Card title="Your Stats">
      <Space style={{ width: "100%" }} direction="vertical">
        Coins: {coins} <br />
        Procoins: {procoins}
      </Space>
    </Card>
  );
}
