import React, { useEffect, useRef, useState } from "react";
import { TrophyOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Card, List, Space, Tooltip } from "antd";
import { Slots } from "./games";
import { useFeedItems } from "./state";

const data = Array.from({ length: 23 }).map((_, i) => ({
  href: "https://ant.design",
  title: `ant design part ${i}`,
  avatar: "https://joeschmoe.io/api/v1/random",
  description:
    "Ant Design, a design language for background applications, is refined by Ant UED Team.",
  content:
    "We supply a series of design principles, practical patterns and high quality design resources (Sketch and Axure), to help people create their product prototypes beautifully and efficiently.",
}));

export function Game() {
  const windowRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("feed");
  const feed = useFeedItems();

  useEffect(() => {
    windowRef.current.scrollTop = windowRef.current.scrollHeight;
  });

  return (
    <Card
      activeTabKey={activeTab}
      onTabChange={setActiveTab}
      tabProps={{ centered: true }}
      tabList={[
        {
          key: "feed",
          tab: "Feed",
        },
        {
          key: "leaderboards",
          tab: "Leaderboards",
        },
        {
          key: "sessions",
          tab: "Sessions",
        },
        {
          key: "guide",
          tab: "Guide",
        },
        {
          key: "stats",
          tab: "Stats",
        },
      ]}
    >
      <div
        ref={windowRef}
        style={{ height: 250, overflow: "auto", paddingTop: "6rem" }}
      >
        {activeTab === "feed" && (
          <List
            style={{ flex: 1 }}
            itemLayout="vertical"
            size="small"
            dataSource={feed}
            renderItem={(item) => (
              <List.Item key={item.id}>{item.description}</List.Item>
            )}
          />
        )}
      </div>
    </Card>
  );
}
