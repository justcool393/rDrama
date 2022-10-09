import React, { useState } from "react";
import { MdOutlineArrowBackIosNew } from "react-icons/md";
import { Button, Card, Space, Switch, Table, Typography } from "antd";
import { formatTimeAgo } from "../../../helpers";

enum GameLeaderboardCategories {
  Winners = "Winners",
  Losers = "Losers",
}

enum GameLeaderboardTimeframe {
  Today = "Today",
  AllTime = "All Time",
}

const LEADERBOARD_TAB_LIST = [
  {
    key: GameLeaderboardCategories.Winners,
    tab: GameLeaderboardCategories.Winners,
  },
  {
    key: GameLeaderboardCategories.Losers,
    tab: GameLeaderboardCategories.Losers,
  },
];

const EXAMPLE_DATA = Array.from({ length: 10 }, () => {
  return {
    username: "111",
    bet: "20 coins",
    timestamp: formatTimeAgo(new Date().getTime() / 1000),
  };
});

const EXAMPLE_DATA_COLUMNS = [
  {
    key: "username",
    dataIndex: "username",
    title: "User",
  },
  {
    key: "bet",
    dataIndex: "bet",
    title: "Bet",
  },
  {
    key: "timestamp",
    dataIndex: "timestamp",
    title: "When",
  },
];

export function GameLeaderboard({ onClose }: { onClose(): void }) {
  const [tab, setTab] = useState(GameLeaderboardCategories.Winners);
  const [timeframe, setTimeframe] = useState(GameLeaderboardTimeframe.Today);
  const toggleTimeframe = () =>
    setTimeframe((prev) =>
      prev === GameLeaderboardTimeframe.Today
        ? GameLeaderboardTimeframe.AllTime
        : GameLeaderboardTimeframe.Today
    );

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Typography.Title level={4} style={{ display: "flex", margin: 0 }}>
          <Button
            type="text"
            icon={
              <MdOutlineArrowBackIosNew
                style={{ position: "relative", top: -2 }}
              />
            }
            onClick={onClose}
          />
          Leaderboard
        </Typography.Title>
        <div>
          <Switch
            checked={timeframe === GameLeaderboardTimeframe.Today}
            checkedChildren={GameLeaderboardTimeframe.Today}
            unCheckedChildren={GameLeaderboardTimeframe.Today}
            onChange={toggleTimeframe}
          />
          <Switch
            checked={timeframe === GameLeaderboardTimeframe.AllTime}
            checkedChildren={GameLeaderboardTimeframe.AllTime}
            unCheckedChildren={GameLeaderboardTimeframe.AllTime}
            onChange={toggleTimeframe}
          />
        </div>
      </Space>
      <Card
        tabList={LEADERBOARD_TAB_LIST}
        onTabChange={(tab) => setTab(tab as GameLeaderboardCategories)}
      >
        <Table
          size="small"
          dataSource={EXAMPLE_DATA}
          columns={EXAMPLE_DATA_COLUMNS}
          pagination={false}
        />
      </Card>
    </Space>
  );
}
