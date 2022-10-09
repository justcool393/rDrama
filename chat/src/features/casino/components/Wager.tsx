import React, { useMemo } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, InputNumber, Spin, Tabs, Typography } from "antd";
import { useRootContext } from "../../../hooks";
import { Currency } from "./Currency";
import { useActiveUserGameSession, useCasinoSelector } from "../state";
import { MINIMUM_WAGER, useCasino } from "../useCasino";

const { Text } = Typography;

export function Wager() {
  const { id } = useRootContext();
  const session = useActiveUserGameSession();
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

  if (session?.game_state.game_status === "started") {
    return (
      <Alert
        type="info"
        showIcon={true}
        style={{ width: "100%" }}
        message={`${session.game_state.wager} ${session.game_state.currency} are at stake.`}
      />
    );
  } else {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1, maxWidth: 300 }}>
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
          onChange={(tab) => setCurrency(tab as CasinoCurrency)}
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
}
