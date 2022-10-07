import React, { useEffect, useRef, useState } from "react";
import { Card, List } from "antd";
import { useFeedItems } from "./state";

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
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          height: 250,
          overflow: "auto",
          paddingTop: "6rem",
        }}
      >
        {activeTab === "feed" && (
          <List
            style={{ flex: 1 }}
            itemLayout="vertical"
            size="small"
            dataSource={feed}
            renderItem={(item) => (
              <List.Item key={item.id}>{item.text}</List.Item>
            )}
          />
        )}
      </div>
    </Card>
  );
}
