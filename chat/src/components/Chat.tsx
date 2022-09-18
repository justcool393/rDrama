import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./Chat.css";
import { UserInput } from "./UserInput";
import { UserList } from "./UserList";

enum ChatHandlers {
  CONNECT = "connect",
  ONLINE = "online",
  TYPING = "typing",
  DELETE = "delete",
  SPEAK = "speak",
}

export function Chat() {
  const socket = useRef<null | Socket>(null);
  const [online, setOnline] = useState<string[]>([]);
  const [typing, setTyping] = useState<string[]>([]);

  useEffect(() => {
    if (!socket.current) {
      socket.current = io();

      socket.current.on(ChatHandlers.ONLINE, setOnline);
      socket.current.on(ChatHandlers.TYPING, setTyping);
      socket.current.on(ChatHandlers.SPEAK, (stuff) => {
        console.log(stuff);
      });
    }
  });

  return (
    <section className="Chat">
      <div className="Chat-left">
        <div>(Chat)</div>
        <UserInput />
        {typing.length > 0 && (
          <div className="Chat-typing">
            {typing.map((who) => (
              <span>{who}</span>
            ))}
          </div>
        )}
      </div>
      <UserList users={online} />
    </section>
  );
}

function formatTypingString(typing: string[]) {

}