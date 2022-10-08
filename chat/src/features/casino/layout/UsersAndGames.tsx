import { Divider } from "antd";
import React from "react";
import { GameList } from "../GameList";
import { UserList } from "./UserList";

export function UsersAndGames() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        height: "95vh",
      }}
    >
      <div style={{ flex: 1, maxHeight: "40vh", overflow: "auto" }}>
        <UserList />
      </div>
      <Divider />
      <div style={{ flex: 1, maxHeight: "40vh", overflow: "auto" }}>
        <GameList direction="vertical" labels={true} block={true} />
      </div>
    </div>
  );
}
