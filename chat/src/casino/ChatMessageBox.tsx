import React from "react";
import { Avatar, Comment } from "antd";
import { formatTimeAgo } from "../helpers";
import { useCasino } from "../hooks";

export function ChatMessageBox() {
  const { state, selectors } = useCasino();
  const chatMessages = selectors.selectChatMessages(state);

  return (
    <>
      {chatMessages.map((chatMessage) => {
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
          />
        );
      })}
    </>
  );
}
