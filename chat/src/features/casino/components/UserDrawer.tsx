import React from "react";
import { Divider, Drawer, Typography } from "antd";
import { useOnlineUserCount } from "../state";
import { UserList } from "./UserList";

export function UserDrawer({ onClose }: { onClose(): void }) {
  const onlineUserCount = useOnlineUserCount();

  return (
    <Drawer
      placement="right"
      closable={false}
      onClose={onClose}
      open={true}
      getContainer={false}
      style={{ position: "fixed", top: 97 }}
    >
      <Typography.Title level={4} style={{ margin: 0 }}>
        {onlineUserCount} Users Online
      </Typography.Title>
      <Divider />
      <UserList />
    </Drawer>
  );
}
