import React, { useEffect, useRef } from "react";
import cx from "classnames";
import { Username } from "./Username";
import { useChat, useLoggedInUser } from "../../../hooks";
import "./ChatMessage.css";

interface ChatMessageProps extends ChatSpeakResponse {
  showUser?: boolean;
  onDelete(): void;
  onQuote(): void;
}

export function ChatMessage({
  avatar,
  showUser = true,
  namecolor,
  username,
  hat,
  text_html,
  text_censored,
  timestamp,
  onDelete,
  onQuote,
}: ChatMessageProps) {
  const { id, admin, censored } = useLoggedInUser();
  const content = censored ? text_censored : text_html;

  return (
    <div
      className={cx("ChatMessage", {
        "chat-mention": content.includes(`id/${id}`),
      })}
    >
      {showUser && (
        <div className="ChatMessage-top">
          <Username
            avatar={avatar}
            name={username}
            color={namecolor}
            hat={hat}
          />
          <div className="ChatMessage-timestamp">{timestamp}</div>
        </div>
      )}
      <div className="ChatMessage-bottom">
        <div>
          <span
            className="ChatMessage-content"
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
          <button className="ChatMessage-button quote btn" onClick={onQuote}>
            <i className="fas fa-reply"></i>
          </button>
        </div>
        {admin && (
          <button
            className="ChatMessage-button ChatMessage-delete quote btn del"
            onClick={onDelete}
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        )}
      </div>
    </div>
  );
}

export function ChatMessageList() {
  const { messages, deleteMessage } = useChat();
  const messageWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageWrapper.current.scrollTop = messageWrapper.current.scrollHeight;
  }, [messages]);

  return (
    <div className="ChatMessageList" ref={messageWrapper}>
      {messages.map((message, index) => (
        <ChatMessage
          key={message.time}
          {...message}
          showUser={message.username !== messages[index - 1]?.username}
          onDelete={() => deleteMessage(message.text)}
          onQuote={() => {}}
        />
      ))}
    </div>
  );
}
