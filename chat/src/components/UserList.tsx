import React from "react";
import "./UserList.css";

interface UserListProps {
  users: string[];
}

export function UserList({ users }: UserListProps) {
  return (
    <div className="UserList">
      <h4>Users in chat right now</h4>
      <ul>
        {users.map((user) => (
          <li key={user}>
            <a href={`/@${user}`}>@{user}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
