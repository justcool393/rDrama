import React from "react";
import {
  Avatar,
  Comment,
  Dropdown,
  Menu,
  Popconfirm,
  Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ItemType } from "antd/lib/menu/hooks/useItems";
import { formatTimeAgo } from "../helpers";
import { useCasino, useRootContext } from "../hooks";

const { Text } = Typography;

export function ChatMessageBox() {
  const { id, admin } = useRootContext();
  const { state, selectors, userDeletedMessage } = useCasino();
  const chatMessages = selectors.selectChatMessages(state);

  return (
    <>
      {chatMessages.map((chatMessage) => {
        const items: ItemType[] = [
          {
            key: "react",
            label: "React",
            disabled: true,
          },
        ];
        const isOwnMessage = id.toString() === chatMessage.author.id.toString();

        if (!isOwnMessage) {
          items.unshift(
            {
              key: "reply",
              label: "Reply",
              disabled: true,
            },
            {
              key: "dm",
              label: "DM",
              disabled: true,
            }
          );
        }

        if (isOwnMessage || admin) {
          items.push(
            { key: "edit", label: "Edit", disabled: true },
            {
              key: "delete",
              label: (
                <Popconfirm
                  title="Delete this message?"
                  onConfirm={() => userDeletedMessage(chatMessage.message.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Text type="danger">Delete</Text>
                </Popconfirm>
              ),
            }
          );
        }

        const menu = <Menu items={items} />;

        return (
          <Dropdown overlay={menu} trigger={["click", "contextMenu"]}>
            <Comment
              key={chatMessage.message.id}
              avatar={
                <Avatar
                  src={chatMessage.author.account.profile_url}
                  alt={chatMessage.author.account.username}
                />
              }
              author={chatMessage.author.account.username}
              datetime={formatTimeAgo(chatMessage.message.timestamp)}
              content={chatMessage.message.text}
            />
          </Dropdown>
        );
      })}
    </>
  );
}
