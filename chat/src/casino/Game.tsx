import React from "react";
import { TrophyOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tooltip } from "antd";
import { PlayingCardDeck } from "./PlayingCard";

export function Game() {
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
      <PlayingCardDeck count={10} />
    </Card>
  );
}
