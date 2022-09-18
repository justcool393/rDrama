import React from "react";
import { Username } from "./Username";
import "./ChatMessage.css";

export function ChatMessage({
  avatar,
  namecolor,
  username,
  hat,
  text_html,
  timestamp,
}: ChatSpeakResponse) {
  return (
    <div className="ChatMessage">
      <div className="ChatMessage-top">
        <Username avatar={avatar} name={username} color={namecolor} hat={hat} />
        <div className="ChatMessage-timestamp">{timestamp}</div>
      </div>
      <div className="ChatMessage-bottom">
        <span
          className="ChatMessage-content"
          dangerouslySetInnerHTML={{ __html: text_html }}
        />
        <button className="quote btn">
          <i className="fas fa-reply"></i>
        </button>
      </div>
    </div>
  );
}
