import React from "react";
import { TrophyOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tooltip } from "antd";
import {
  BlackjackAction,
  useCasino,
  useRootContext,
} from "../hooks";
import { useCasinoSelector } from "./state";

export function Game() {
  const { id } = useRootContext();
  const { userPlayedBlackjack } = useCasino();
  const result = useCasinoSelector((state) => {
    const sessionKey = `${id}#blackjack`;

    return state.session.by_id[sessionKey]?.game_state ?? null;
  });

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
          onClick={() => userPlayedBlackjack(BlackjackAction.DEAL)}
        >
          Deal
        </Button>
      </Space>
    </Card>
  );
}
