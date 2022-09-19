import React from "react";
import { App } from "./App";
import { ChatProvider } from "./hooks";
import "./Layout.css";

export function Layout() {
  return (
    <ChatProvider>
      <div className="Layout">
        <App />
      </div>
    </ChatProvider>
  );
}
