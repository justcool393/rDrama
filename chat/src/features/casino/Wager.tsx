import React, { useMemo } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Button, InputNumber, Tabs, Typography } from "antd";
import { useRootContext } from "../../hooks";
import { Currency } from "./Currency";
import { useCasinoSelector } from "./state";
import { MINIMUM_WAGER, useCasino } from "./useCasino";

const { Title, Text } = Typography;

export function Wager() {
  const { id } = useRootContext();
  const { wager, currency, setWager, setCurrency } = useCasino();
  const balances = useCasinoSelector(
    (state) =>
      state.user.by_id[id]?.balances ?? {
        coins: 0,
        procoins: 0,
      }
  );
  const balanceError = useMemo(() => {
    const maximumWager = balances[currency];
    return wager > maximumWager ? "Insufficient balance." : "";
  }, [balances, wager, currency]);

  return (
    <div style={{ display: "flex", alignItems: "flex-end" }}>
      <div style={{ flex: 1, maxWidth: 300 }}>
        <Title level={5}>Wager</Title>
        <InputNumber
          placeholder="Enter your wager..."
          min={MINIMUM_WAGER}
          value={wager}
          status={balanceError ? "error" : ""}
          onChange={(value) => setWager(value)}
          prefix={balanceError ? <ExclamationCircleOutlined /> : <span />}
          size="large"
          style={{ padding: 0 }}
          autoFocus={true}
        />
        <Text
          style={{
            textAlign: "right",
          }}
          type={balanceError ? "danger" : "warning"}
        >
          {balanceError || "How much would you like to bet?"}
        </Text>
      </div>
      <Tabs
        tabPosition="right"
        onChange={tab => setCurrency(tab as CasinoCurrency)}
        items={[
          {
            key: "coins",
            label: <Currency kind="coins" amount={balances.coins} />,
          },
          {
            key: "procoins",
            label: <Currency kind="procoins" amount={balances.procoins} />,
          },
        ]}
      />
    </div>
  );
}
