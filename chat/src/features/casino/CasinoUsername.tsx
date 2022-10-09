import React from "react";
import { Avatar, Space, Typography } from "antd";

interface Props {
  user: UserEntity["account"];
}

export function CasinoUsername({ user }: Props) {
  return (
    <Space>
      <Avatar src={user.profile_url} />
      <Typography.Title level={5}>{user.username}</Typography.Title>
    </Space>
  );
}
