import React from "react";
import {
  Badge,
  Button,
  Card,
  Divider,
  Space,
  Statistic,
  Typography,
} from "antd";
import { ImCheckmark2 } from "react-icons/im";
import { IoMdClose } from "react-icons/io";
import { useUserGameSession } from "../../state";
import { useCasino } from "../../useCasino";
import { PlayingCardDeck, PlayingCard } from "../PlayingCard";

export function Blackjack() {
  const session = useUserGameSession("blackjack");

  if (!session) {
    return null;
  }

  const blackjack = session.game_state as BlackjackGameState;
  const isPlaying =
    blackjack.game_status !== "waiting" && blackjack.status === "PLAYING";
  const isDone = blackjack.game_status === "done";
  const winner =
    blackjack.dealer_value > blackjack.player_value
      ? "dealer"
      : blackjack.player_value > blackjack.dealer_value
      ? "player"
      : "";
  const dealerCards = isPlaying ? [blackjack.dealer[0]] : blackjack.dealer;
  const dealerValue = (
    <Statistic
      title="Dealer"
      value={
        blackjack.game_status === "waiting"
          ? "--"
          : blackjack.dealer_value === -1
          ? "Bust"
          : blackjack.dealer_value
      }
    />
  );
  const wrappedDealerValue =
    isDone && blackjack.status !== "PUSHED" ? (
      <Badge
        offset={[40, 24]}
        count={
          winner === "dealer" ? (
            <Typography.Text type="success">
              <ImCheckmark2 size={48} />
            </Typography.Text>
          ) : (
            <Typography.Text type="danger">
              <IoMdClose size={48} />
            </Typography.Text>
          )
        }
      >
        {dealerValue}
      </Badge>
    ) : (
      dealerValue
    );
  const playerValue = (
    <Statistic
      title="Player"
      value={
        blackjack.game_status === "waiting"
          ? "--"
          : blackjack.player_value === -1
          ? "Bust"
          : blackjack.player_value
      }
    />
  );
  const wrappedPlayerValue =
    isDone && blackjack.status !== "PUSHED" ? (
      <Badge
        offset={[40, 24]}
        count={
          winner === "player" ? (
            <Typography.Text type="success">
              <ImCheckmark2 size={48} />
            </Typography.Text>
          ) : (
            <Typography.Text type="danger">
              <IoMdClose size={48} />
            </Typography.Text>
          )
        }
      >
        {playerValue}
      </Badge>
    ) : (
      playerValue
    );

  return (
    <>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-evenly",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        {wrappedDealerValue}
        <Divider type="vertical" style={{ height: 48 }} />
        {wrappedPlayerValue}
      </Space>
      <div>
        <div style={{ position: "absolute", top: 70, left: -40 }}>
          <PlayingCardDeck count={12} />
        </div>
        <Space direction="vertical" style={{ paddingLeft: 30 }}>
          <Space>
            {isPlaying && <PlayingCard rank="A" suit="S" flipped={true} />}
            {dealerCards.map((card, index) => (
              <PlayingCard
                key={index}
                size="small"
                rank={card[0] as PlayingCardRank}
                suit={card[1] as PlayingCardSuit}
                style={{ marginRight: -50 }}
              />
            ))}
          </Space>
          <Space>
            {blackjack.player.map((card, index) => (
              <PlayingCard
                key={index}
                size="small"
                rank={card[0] as PlayingCardRank}
                suit={card[1] as PlayingCardSuit}
                style={{ marginRight: -50 }}
              />
            ))}
          </Space>
        </Space>
      </div>
    </>
  );
}
