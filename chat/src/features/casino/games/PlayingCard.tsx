import React from "react";
import { Tooltip } from "antd";

type PlayingCardSize = "small" | "large";

interface PlayingCardProps {
  rank: PlayingCardRank;
  suit: PlayingCardSuit;
  size?: PlayingCardSize;
  flipped?: boolean;
  style?: React.HTMLAttributes<HTMLImageElement>["style"];
}

const RANK_TO_RANK_TEXT: Record<PlayingCardRank, string> = {
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  "10": "Ten",
  X: "Ten",
  J: "Jack",
  Q: "Queen",
  K: "King",
  A: "Ace",
};

const SUIT_TO_SUIT_TEXT: Record<PlayingCardSuit, string> = {
  C: "Clubs",
  H: "Hearts",
  D: "Diamonds",
  S: "Spades",
};

const CARD_SIZES: Record<PlayingCardSize, number> = {
  small: 96,
  large: 128,
};

export function PlayingCard({
  rank,
  suit,
  size = "small",
  flipped = false,
  style = {},
}: PlayingCardProps) {
  const title = flipped
    ? ""
    : `${RANK_TO_RANK_TEXT[rank]} of ${SUIT_TO_SUIT_TEXT[suit]}`;
  const width = CARD_SIZES[size];
  const faceImage = `/i/cards/${rank === "X" ? "10" : rank}${suit}.svg`;
  const flippedImage = "/i/cards/BLUE_BACK.svg";

  return (
    <Tooltip title={title}>
      <img
        alt={title}
        src={flipped ? flippedImage : faceImage}
        style={{ ...style, width }}
      />
    </Tooltip>
  );
}

interface PlayingCardDeckProps {
  count: number;
}

export function PlayingCardDeck({ count }: PlayingCardDeckProps) {
  return (
    <div style={{ position: "relative" }}>
      {Array.from({ length: count }, (_, index) => (
        <PlayingCard
          key={index}
          flipped={true}
          rank="2"
          suit="C"
          style={{
            position: "absolute",
            top: index * -2,
            left: index * -2,
          }}
        />
      ))}
    </div>
  );
}
