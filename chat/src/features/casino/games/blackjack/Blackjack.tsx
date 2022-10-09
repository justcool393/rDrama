import React from "react";
import { Button, Card, Space } from "antd";
import key from "weak-key";
import { useUserGameSession } from "../../state";
import { useCasino } from "../../useCasino";
import { PlayingCardDeck, PlayingCard } from "../PlayingCard";

export function Blackjack() {
  const { userPlayedBlackjack } = useCasino();
  const session = useUserGameSession("blackjack");

  if (!session) {
    return null;
  }

  const blackjack = session.game_state as BlackjackGameState;
  const isPlaying =
    blackjack.game_status !== "waiting" && blackjack.status === "PLAYING";
  const dealerCards = isPlaying ? [blackjack.dealer[0]] : blackjack.dealer;

  return (
    <>
      <div style={{ position: "absolute", top: -100, left: -30 }}>
        <PlayingCardDeck count={12} />
      </div>

      <Space direction="vertical" style={{ paddingLeft: 30 }}>
        <Space>
          {dealerCards.map((card, index) => (
            <PlayingCard
              key={index}
              size="small"
              rank={card[0] as PlayingCardRank}
              suit={card[1] as PlayingCardSuit}
            />
          ))}
          {isPlaying && <PlayingCard rank="A" suit="S" flipped={true} />}
        </Space>
        <Space>
          {blackjack.player.map((card, index) => (
            <PlayingCard
              key={index}
              size="small"
              rank={card[0] as PlayingCardRank}
              suit={card[1] as PlayingCardSuit}
            />
          ))}
        </Space>
        <Space>
          {blackjack.actions.map((action) => (
            <Button
              key={action}
              type="default"
              shape="round"
              style={{ textTransform: "uppercase" }}
              onClick={() => userPlayedBlackjack(action)}
            >
              {action}
            </Button>
          ))}
        </Space>
      </Space>
    </>
  );

  return (
    <div style={{ position: "relative" }}>
      <PlayingCardDeck count={12} />
      <Card title="Dealer" extra={blackjack.dealer_value}>
        {dealerCards.map((card, index) => (
          <PlayingCard
            key={index}
            size="small"
            rank={card[0] as PlayingCardRank}
            suit={card[1] as PlayingCardSuit}
          />
        ))}
        {isPlaying && <PlayingCard rank="A" suit="S" flipped={true} />}
      </Card>
      <Card title="Player" extra={blackjack.player_value}></Card>
      <Space></Space>
    </div>
  );
}
