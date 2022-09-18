import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import "./Chat.css";

export function Chat() {
  const socket = useRef<null | Socket>(null);

  useEffect(() => {
    if (!socket.current) {
      socket.current = io();

      socket.current.on("speak", (stuff) => {
        console.log(stuff);
      });
    }
  });

  return <section className="Chat">Chat</section>;
}
