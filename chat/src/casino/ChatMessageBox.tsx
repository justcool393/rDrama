import React from "react";
import { Avatar, Comment, Dropdown, Menu, Popconfirm, Typography } from "antd";
import type { ItemType } from "antd/lib/menu/hooks/useItems";
import { formatTimeAgo } from "../helpers";
import { useCasino, useRootContext } from "../hooks";
import { useCasinoSelector } from "./state";

const { Text } = Typography;

export function ChatMessageBox() {
  const { id, admin } = useRootContext();
  const { userDeletedMessage } = useCasino();
  const chatMessages = useCasinoSelector((state) =>
    state.message.all.map((messageId) => {
      const message = state.message.by_id[messageId];

      return {
        message,
        author: state.user.by_id[message.user_id],
      };
    })
  );

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
          <div style={{ minHeight: "100vh" }}>
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
          </div>
        );
      })}
    </>
  );
}
