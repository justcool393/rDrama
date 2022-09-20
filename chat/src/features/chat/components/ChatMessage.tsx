import React, { useEffect, useRef } from "react";
import cx from "classnames";
import { Username } from "./Username";
import { useChat, useRootContext } from "../../../hooks";
import "./ChatMessage.css";
import key from "weak-key";

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
  const {
    id,
    username: loggedInUsername,
    admin,
    censored,
    themeColor,
  } = useRootContext();
  const content = censored ? text_censored : text_html;
  const hasMention = content.includes(loggedInUsername);
  const mentionStyle = hasMention ? { backgroundColor: `#${themeColor}55` } : {};

  return (
    <div className={cx("ChatMessage")} style={mentionStyle}>
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
          key={key(message)}
          {...message}
          showUser={message.username !== messages[index - 1]?.username}
          onDelete={() => deleteMessage(message.text)}
          onQuote={() => {}}
        />
      ))}
    </div>
  );
}
