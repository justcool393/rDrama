import React, { useEffect, useRef, useState } from "react";
import { Card, List } from "antd";
import { useFeedItems } from "./state";

export function GameData() {
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
          key: "stats",
          tab: "Stats",
        },
        {
          key: "leaderboards",
          tab: "Leaderboards",
        },
        {
          key: "help",
          tab: "Help",
        },
      ]}
    >
      <div
        ref={windowRef}
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          overflow: "auto",
          height: 300,
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
