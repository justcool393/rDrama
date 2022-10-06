import React, { useCallback } from "react";
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
  onLoadGame(game: CasinoGame): void;
}

export function GameIconSider({ direction, onLoadGame }: Props) {
  const { userStartedGame } = useCasino();
  const handleLoadGame = useCallback((game: CasinoGame) => {
    userStartedGame(game);
    onLoadGame(game);
  }, []);

  return (
    <Space direction={direction} align="center" style={{ width: "100%" }}>
      {[
        {
          key: "slots",
          icon: <GiLever />,
          onClick: () => handleLoadGame("slots"),
        },
        {
          key: "blackjack",
          icon: <GiCardAceSpades />,
          onClick: () => handleLoadGame("blackjack"),
        },
        {
          key: "roulette",
          icon: <GiCartwheel />,
          onClick: () => handleLoadGame("roulette"),
        },
        {
          key: "racing",
          icon: <GiHorseHead />,
          onClick: () => handleLoadGame("racing"),
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
