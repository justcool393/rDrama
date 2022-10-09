import React from "react";
import { Space } from "antd";
import { CasinoUsername } from "./CasinoUsername";
import { useOnlineUsers } from "../state";

export function UserList() {
  const onlineUsers = useOnlineUsers();

  return (
    <Space
      direction="vertical"
      style={{ width: "100%", maxHeight: "80%", overflow: "auto" }}
    >
      {onlineUsers.map((user) => (
        <CasinoUsername key={user.id} user={user.account} />
      ))}
    </Space>
  );
}
