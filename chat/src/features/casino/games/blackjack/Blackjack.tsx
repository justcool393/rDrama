import React from "react";
import { Button } from "antd";
import { useUserGameSession } from "../../state";
import { useCasino } from "../../useCasino";

export function Blackjack() {
  const { userPlayedBlackjack } = useCasino();
  const session = useUserGameSession("blackjack");

  if (!session) {
    return null;
  }

  const blackjack = session.game_state as BlackjackGameState;

  return (
    <div>
      {JSON.stringify(session, null, 2)}

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
    </div>
  );
}
