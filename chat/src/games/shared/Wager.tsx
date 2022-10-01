import React, { useMemo } from "react";
import { ExclamationCircleOutlined} from "@ant-design/icons"
import { Card, InputNumber, Radio, Space, Typography } from "antd";
import { MINIMUM_WAGER, useCasino, useRootContext } from "../../hooks";

const { Text } = Typography;

export function Wager() {
  const { id } = useRootContext();
  const { state, selectors, wager, currency, setWager, setCurrency } =
    useCasino();
  const balanceError = useMemo(() => {
    const balances = selectors.selectUserBalances(state, id);
    const maximumWager = balances[currency];

    return wager > maximumWager ? "Insufficient balance." : "";
  }, [state, wager, currency]);

  return (
    <Card title="Wager">
      <Space style={{ width: "100%" }} direction="vertical" align="center">
        <InputNumber
          placeholder="Enter your wager..."
          min={MINIMUM_WAGER}
          value={wager}
          status={balanceError ? "error" : ""}
          onChange={value => setWager(value)}
          prefix={balanceError ? <ExclamationCircleOutlined /> : null}
          addonAfter={
            <Radio.Group
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <Radio value="coins">Coins</Radio>
              <Radio value="procoins">Procoins</Radio>
            </Radio.Group>
          }
        />
        {balanceError && <Text type="danger">{balanceError}</Text>}
      </Space>
    </Card>
  );
}
