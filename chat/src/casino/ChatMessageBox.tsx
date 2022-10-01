import React from "react";
import { Avatar, Button, Comment, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { formatTimeAgo } from "../helpers";
import { useCasino } from "../hooks";

export function ChatMessageBox() {
  const { state, selectors, userDeletedMessage } = useCasino();
  const chatMessages = selectors.selectChatMessages(state);

  return (
    <>
      {chatMessages.map((chatMessage) => {
        const actions: React.ReactNode[] = [];

        actions.push(
          <Tooltip key="delete" title="Delete message">
            <Button
              type="ghost"
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={() => userDeletedMessage(chatMessage.message.id)}
            />
          </Tooltip>
        );

        return (
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
            actions={actions}
          />
        );
      })}
    </>
  );
}
