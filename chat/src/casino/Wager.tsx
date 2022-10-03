import React, { useMemo } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Card, InputNumber, Radio, Space, Typography } from "antd";
import { MINIMUM_WAGER, useCasino, useRootContext } from "../hooks";
import { Balances } from "./Balances";
import { Currency } from "./Currency";
import { useCasinoSelector } from "./state";

const { Title, Text } = Typography;

export function Wager() {
  const { id } = useRootContext();
  const { wager, currency, setWager, setCurrency } = useCasino();
  const balances = useCasinoSelector((state) => state.user.by_id[id]?.balances ?? {
    coins: 0,
    procoins: 0
  });
  const balanceError = useMemo(() => {
    const maximumWager = balances[currency];
    return wager > maximumWager ? "Insufficient balance." : "";
  }, [balances, wager, currency]);

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Title level={5}>Wager</Title>
          <Balances />
        </div>
      }
    >
      <Space style={{ width: "100%" }} direction="vertical">
        <InputNumber
          placeholder="Enter your wager..."
          min={MINIMUM_WAGER}
          value={wager}
          status={balanceError ? "error" : ""}
          onChange={(value) => setWager(value)}
          prefix={balanceError ? <ExclamationCircleOutlined /> : <span />}
          addonAfter={
            <Radio.Group
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <Radio value="coins">
                <Currency kind="coins" />
              </Radio>
              <Radio value="procoins">
                <Currency kind="procoins" />
              </Radio>
            </Radio.Group>
          }
        />
        {balanceError && <Text type="danger">{balanceError}</Text>}
      </Space>
    </Card>
  );
}
