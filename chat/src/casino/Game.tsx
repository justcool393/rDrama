import React from "react";
import { TrophyOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tooltip } from "antd";
import { useCasino, useRootContext } from "../hooks";

export function Game() {
  const { id } = useRootContext();
  const { state, selectors, userPulledSlots } = useCasino();
  const result = selectors.selectGameSession(state, id, "slots");

  return (
    <Card
      title="Game"
      style={{ height: 400 }}
      extra={
        <Space>
          <Tooltip title="How to play">
            <Button
              type="default"
              shape="circle"
              icon={<QuestionCircleOutlined />}
              onClick={() => {}}
            />
          </Tooltip>
          <Tooltip title="Leaderboard">
            <Button
              type="default"
              shape="circle"
              icon={<TrophyOutlined />}
              onClick={() => {}}
            />
          </Tooltip>
        </Space>
      }
    >
      <Space direction="vertical">
        <div>Result</div>
        <div>{JSON.stringify(result, null, 2)}</div>
        <Button type="default" onClick={userPulledSlots}>Pull</Button>
      </Space>
    </Card>
  );
}
