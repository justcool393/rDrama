import React from "react";
import { TrophyOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tooltip } from "antd";
import { useRootContext } from "../hooks";
import { useCasinoSelector } from "./state";
import { useCasino } from "./useCasino";

export function Game() {
  const { id } = useRootContext();
  const { userPlayedRacing } = useCasino();
  // const result = useCasinoSelector((state) => {
  //   const sessionKey = `${id}#blackjack`;

  //   return state.session.by_id[sessionKey]?.game_state ?? null;
  // });
  const result = useCasinoSelector((state) => state.game.by_id.racing?.state ?? null);

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
          onClick={() => userPlayedRacing('WIN', [''])}
        >
          Race
        </Button>
      </Space>
    </Card>
  );
}
