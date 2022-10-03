import React from "react";
import { TrophyOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tooltip } from "antd";
import { RouletteBet, useCasino } from "../hooks";
import { useCasinoSelector } from "./state";

export function Game() {
  const { userPlayedRoulette } = useCasino();
  const result = useCasinoSelector(state => state.game.by_id.roulette?.state)

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
        <Button
          type="default"
          onClick={() => userPlayedRoulette(RouletteBet.STRAIGHT_UP_BET, "4")}
        >
          Pull
        </Button>
      </Space>
    </Card>
  );
}
