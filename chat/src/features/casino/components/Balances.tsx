import React from "react";
import { Space } from "antd";
import { useRootContext } from "../../../hooks";
import { useCasinoSelector } from "../state";
import { Currency } from "./Currency";

export function Balances() {
  const { id } = useRootContext();
  const balances = useCasinoSelector(
    (state) =>
      state.user.by_id[id]?.balances ?? {
        coins: 0,
        procoins: 0,
      }
  );

  return (
    <Space>
      <Currency kind="coins" amount={balances.coins} />
      <Currency kind="procoins" amount={balances.procoins} />
    </Space>
  );
}
