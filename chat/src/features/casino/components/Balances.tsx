import React from "react";
import { Space } from "antd";
import { useActiveUserBalances } from "../state";
import { Currency } from "./Currency";

export function Balances() {
  const { coins, procoins } = useActiveUserBalances();

  return (
    <Space>
      <Currency kind="coins" amount={coins} />
      <Currency kind="procoins" amount={procoins} />
    </Space>
  );
}
