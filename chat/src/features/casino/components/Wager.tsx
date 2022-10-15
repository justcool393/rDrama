import React, { useMemo } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, InputNumber, Tabs, Typography } from "antd";
import { Currency } from "./Currency";
import {
  MINIMUM_WAGER,
  useActiveUserGameSession,
  useActiveUserBalances,
  useActiveBet,
  useCasinoDispatch,
  betChanged,
} from "../state";

const { Text } = Typography;

export function Wager() {
  const dispatch = useCasinoDispatch();
  const session = useActiveUserGameSession();
  const { wager, currency } = useActiveBet();
  const balances = useActiveUserBalances();
  const balanceError = useMemo(() => {
    const maximumWager = balances[currency];
    return wager > maximumWager ? "Insufficient balance." : "";
  }, [balances, wager, currency]);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {session?.game_state.game_status === "started" ? (
        <Alert
          type="info"
          showIcon={true}
          style={{ width: "100%" }}
          message={`${session.game_state.wager} ${session.game_state.currency} are at stake.`}
        />
      ) : (
        <div style={{ flex: 1, maxWidth: 300 }}>
          <InputNumber
            placeholder="Enter your wager..."
            min={MINIMUM_WAGER}
            value={wager}
            status={balanceError ? "error" : ""}
            onChange={(value) =>
              dispatch(betChanged({ wager: value, currency }))
            }
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
      )}

      <Tabs
        tabPosition="right"
        onChange={(tab) =>
          dispatch(betChanged({ wager, currency: tab as CasinoCurrency }))
        }
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
