import React from "react";
import { TrophyOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Card, Space, Tooltip } from "antd";
import { Slots } from "./games";

export function Game() {
  return (
    <Card
      title="Game"
      bodyStyle={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
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
    </Card>
  );
}
