import React from "react";
import { UserOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Avatar, Menu, MenuProps, Space } from "antd";
import { useCasino } from "../hooks";

export function InformationPanel() {
  const { state, selectors } = useCasino();
  const usersOnline = selectors.selectUsersOnline(state);
  const usersOnlineMenu = getMenuItem(
    `${usersOnline.length} Users Online`,
    "sub1",
    <UserOutlined />,
    usersOnline.sort(alphabeticalSort).map((user) =>
      getMenuItem(
        <Space>
          <Avatar src={user.account.profile_url} />
          <span>@{user.account.username}</span>
        </Space>,
        user.id
      )
    )
  );
  const feedMenu = getMenuItem("Feed", "sub2", <UnorderedListOutlined />);

  return (
    <Menu
      selectable={false}
      theme="dark"
      defaultOpenKeys={["sub1"]}
      mode="inline"
      items={[usersOnlineMenu, feedMenu]}
    />
  );
}

type MenuItem = Required<MenuProps>["items"][number];

function getMenuItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

function alphabeticalSort(a: UserEntity, b: UserEntity) {
  return a.account.username.localeCompare(b.account.username);
}
