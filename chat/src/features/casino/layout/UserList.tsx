import React from "react";
import { Avatar, Divider, Menu, MenuProps, Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useRootContext } from "../../../hooks";
import { useCasinoSelector } from "../state";
import { useCasino } from "../useCasino";

export function UserList() {
  const { id } = useRootContext();
  const { recipient, setRecipient } = useCasino();
  const usersOnline = useCasinoSelector((state) =>
    state.user.all
      .map((id) => state.user.by_id[id])
      .filter((user) => user.online)
  );
  const handleItemSelect = (event) => {
    const userId = event.key;
    console.log("Selected", userId, "recipient is", recipient);

    if (userId !== id) {
      const nextRecipient = userId === recipient ? "" : userId;
      setRecipient(nextRecipient);
    }
  };

  return (
    <Space direction="vertical">
      <Space style={{ paddingLeft: "2rem" }}>
        <UserOutlined style={{ position: "relative", top: -7 }} />
        <Typography.Title level={5}>
          {usersOnline.length} users online
        </Typography.Title>
      </Space>
      <Menu
        theme="dark"
        defaultOpenKeys={["sub1"]}
        selectedKeys={[recipient]}
        mode="inline"
        onSelect={handleItemSelect}
        items={[
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
          ...usersOnline,
        ]
          .sort(alphabeticalSort)
          .map((user) =>
            getMenuItem(
              <Space
                onClick={() => {
                  if (user.id === recipient) {
                    setRecipient("");
                  }
                }}
              >
                <Avatar src={user.account.profile_url} />
                <span>@{user.account.username}</span>
              </Space>,
              user.id
            )
          )}
      />
    </Space>
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
