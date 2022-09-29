import React from "react";
import { Card, Checkbox, Comment, List, Tooltip } from "antd";

const data = [
  {
    author: "@McCoxmaul",
    avatar: "http://localhost/e/marseyheavymetal.webp",
    content: "Won 12 coins playing slots",
    datetime: (
      <Tooltip title="2016-11-22 11:22:33">
        <span>8 hours ago</span>
      </Tooltip>
    ),
  },
  {
    author: "@McCoxmaul",
    avatar: "http://localhost/e/marseyheavymetal.webp",
    content: "Won 12 coins playing slots",
    datetime: (
      <Tooltip title="2016-11-22 11:22:33">
        <span>8 hours ago</span>
      </Tooltip>
    ),
  },
];

export function Feed() {
  return (
    <Card
      title="Feed"
      actions={[
        <Checkbox.Group
          key="options"
          defaultValue={["slots", "blackjack", "roulette", "racing"]}
          options={[
            {
              label: "Slots",
              value: "slots",
            },
            {
              label: "Blackjack",
              value: "blackjack",
            },
            {
              label: "Roulette",
              value: "roulette",
            },
            {
              label: "Racing",
              value: "racing",
            },
          ]}
        />,
      ]}
    >
      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={(item) => (
          <li>
            <Comment
              author={item.author}
              avatar={item.avatar}
              content={item.content}
              datetime={item.datetime}
            />
          </li>
        )}
      ></List>
    </Card>
  );
}
