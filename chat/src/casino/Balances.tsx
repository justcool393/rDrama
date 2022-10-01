import React from "react";
import { Space } from "antd";
import { Currency } from "./Currency";
import { useCasino, useRootContext } from "../hooks";

export function Balances() {
  const { id } = useRootContext();
  const { state, selectors } = useCasino();
  const balances = selectors.selectUserBalances(state, id);

  return (
    <Space>
      <Currency kind="coins" amount={balances.coins} />
      <Currency kind="procoins" amount={balances.procoins} />
    </Space>
  );
}
