import React from "react";
import { Avatar, Menu, MenuProps, Space } from "antd";
import { useCasinoSelector } from "./state";
import { useCasino, useRootContext } from "../hooks";

export function InformationPanel() {
  const { id } = useRootContext();
  const { setRecipient } = useCasino();
  const usersOnline = useCasinoSelector((state) =>
    state.user.all
      .map((id) => state.user.by_id[id])
      .filter((user) => user.online)
  );

  return (
    <Menu
      selectable={false}
      theme="dark"
      defaultOpenKeys={["sub1"]}
      mode="inline"
      items={usersOnline.sort(alphabeticalSort).map((user) =>
        getMenuItem(
          <Space
            onClick={() => {
              if (user.id !== id) {
                setRecipient(user.id);
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
