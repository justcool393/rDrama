import React from "react";
import { Username } from "./Username";
import "./ChatMessage.css";

interface ChatMessageProps extends ChatSpeakResponse {
  showUser?: boolean;
  onDelete(): void;
}

export function ChatMessage({
  avatar,
  showUser = true,
  namecolor,
  username,
  hat,
  text_html,
  timestamp,
  onDelete
}: ChatMessageProps) {
  return (
    <div className="ChatMessage">
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
            dangerouslySetInnerHTML={{ __html: text_html }}
          />
          <button className="ChatMessage-button quote btn">
            <i className="fas fa-reply"></i>
          </button>
        </div>
        <button className="ChatMessage-button ChatMessage-delete quote btn del" onClick={onDelete}>
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  );
}
