import React from "react";
import {
  GiCardAceSpades,
  GiCartwheel,
  GiHorseHead,
  GiLever,
} from "react-icons/gi";
import { Button, Space } from "antd";

interface Props {
  direction: "horizontal" | "vertical";
  onLoadGame(game: CasinoGame): void;
}

export function GameIconSider({ direction, onLoadGame }: Props) {
  return (
    <Space direction={direction} align="center" style={{ width: "100%" }}>
      {[
        {
          key: "slots",
          icon: <GiLever />,
          onClick: () => onLoadGame("slots"),
        },
        {
          key: "blackjack",
          icon: <GiCardAceSpades />,
          onClick: () => onLoadGame("blackjack"),
        },
        {
          key: "roulette",
          icon: <GiCartwheel />,
          onClick: () => onLoadGame("roulette"),
        },
        {
          key: "racing",
          icon: <GiHorseHead />,
          onClick: () => onLoadGame("racing"),
        },
      ].map(({ key, icon, onClick }, index) => (
        <Button
          key={key}
          size="large"
          type="ghost"
          shape="circle"
          icon={icon}
          style={{
            marginRight: direction === "horizontal" && index < 3 ? "1rem" : 0,
            marginBottom: direction === "vertical" && index < 3 ? "1rem" : 0,
          }}
          onClick={onClick}
        />
      ))}
    </Space>
  );
}
