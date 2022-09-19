import React from "react";
import { Activity, Chat } from "./features";
import { ChatProvider } from "./hooks";
import "./Layout.css";

export function Layout() {
  return (
    <div className="Layout">
      <ChatProvider>
        <Activity />
        <Chat />
      </ChatProvider>
    </div>
  );
}
