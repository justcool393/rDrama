import React from "react";
import {
  GiCardAceSpades,
  GiCartwheel,
  GiHorseHead,
  GiLever,
} from "react-icons/gi";
import { Button, Space } from "antd";
import { useCasino } from "./useCasino";

interface Props {
  direction: "horizontal" | "vertical";
}

export function GameIconSider({ direction }: Props) {
  const { userStartedGame } = useCasino();

  return (
    <Space direction={direction} align="center" style={{ width: "100%" }}>
      {[
        {
          key: "slots",
          icon: <GiLever />,
          onClick: () => userStartedGame("slots"),
        },
        {
          key: "blackjack",
          icon: <GiCardAceSpades />,
          onClick: () => userStartedGame("blackjack"),
        },
        {
          key: "roulette",
          icon: <GiCartwheel />,
          onClick: () => userStartedGame("roulette"),
        },
        {
          key: "racing",
          icon: <GiHorseHead />,
          onClick: () => userStartedGame("racing"),
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
