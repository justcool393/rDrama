import React from "react";
import {
  GiCardAceSpades,
  GiCartwheel,
  GiHorseHead,
  GiLever,
} from "react-icons/gi";
import { Button } from "antd";
import { useCasino } from "./useCasino";
import { useActiveCasinoGame } from "./state";

interface Props {
  direction: "horizontal" | "vertical";
  block?: boolean;
  labels?: boolean;
}

export function GameList({ direction, block = false, labels = false }: Props) {
  const { userStartedGame } = useCasino();
  const activeGame = useActiveCasinoGame();

  return (
    <>
      {[
        {
          active: activeGame?.name === "slots",
          key: "slots",
          icon: <GiLever />,
          onClick: () => userStartedGame("slots"),
        },
        {
          active: activeGame?.name === "blackjack",
          key: "blackjack",
          icon: <GiCardAceSpades />,
          onClick: () => userStartedGame("blackjack"),
        },
        {
          active: activeGame?.name === "roulette",
          key: "roulette",
          icon: <GiCartwheel />,
          onClick: () => userStartedGame("roulette"),
        },
        {
          active: activeGame?.name === "racing",
          key: "racing",
          icon: <GiHorseHead />,
          onClick: () => userStartedGame("racing"),
        },
      ].map(({ active, key, icon, onClick }, index) => (
        <Button
          key={key}
          size="large"
          type={active ? "primary" : "text"}
          disabled={active}
          shape={labels ? "default" : "circle"}
          icon={icon}
          block={block}
          style={{
            marginRight: direction === "horizontal" && index < 3 ? "1rem" : 0,
            marginBottom: direction === "vertical" && index < 3 ? "1rem" : 0,
            ...(labels
              ? {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textTransform: "uppercase",
                }
              : {}),
          }}
          onClick={onClick}
        >
          {labels && key}
        </Button>
      ))}
    </>
  );
}
