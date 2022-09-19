import React from "react";
import { Activity, Chat, UserInput } from "./features";
import "./Layout.css";

export function Layout() {
  return (
    <div className="Layout">
        <Activity />
        <Chat />
    </div>
  );
}
