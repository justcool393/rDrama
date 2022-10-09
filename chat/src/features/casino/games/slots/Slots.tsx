import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Grid, notification } from "antd";
import { sleep } from "../../../../helpers";
import { useCasino } from "../../useCasino";
import { useUserGameSession } from "../../state";
import { SlotReel } from "./SlotReel";
import "./Slots.css";

const REEL_DELAY = 250;
const LEVER_PULL_DURATION = 1000;

const { useBreakpoint } = Grid;

export function Slots() {
  const leverRef = useRef<HTMLDivElement>(null);
  const leverBallRef = useRef<HTMLDivElement>(null);
  const pullingLever = useRef(false);
  const { userPlayedSlots } = useCasino();
  const { sm } = useBreakpoint();
  const session = useUserGameSession("slots");
  const [rolling, setRolling] = useState([false, false, false]);
  const results = useMemo(() => {
    const emptySet = [null, null, null];

    if (session?.game_state.game_status === "done") {
      const state = session.game_state as SlotsGameState;
      return state.symbols;
    } else {
      return emptySet;
    }
  }, [session]);
  const handleLeverPull = useCallback(async (active = true) => {
    if (!pullingLever.current) {
      if (active) {
        userPlayedSlots();
      }

      pullingLever.current = true;
      leverRef.current?.classList.add("Slots-lever__pulled");
      leverBallRef.current?.classList.add("Slots-leverBall__pulled");

      await sleep(LEVER_PULL_DURATION);

      pullingLever.current = false;
      leverRef.current?.classList.remove("Slots-lever__pulled");
      leverBallRef.current?.classList.remove("Slots-leverBall__pulled");
    }
  }, []);
  const handleSlotsStart = useCallback(async () => {
    setRolling([true, false, false]);
    await sleep(REEL_DELAY);
    setRolling([true, true, false]);
    await sleep(REEL_DELAY);
    setRolling([true, true, true]);
  }, []);
  const handleSlotsStop = useCallback(async () => {
    setRolling([false, true, true]);
    await sleep(REEL_DELAY);
    setRolling([false, false, true]);
    await sleep(REEL_DELAY);
    setRolling([false, false, false]);
    await sleep(REEL_DELAY);
  }, []);

  useEffect(() => {
    if (session?.game_state.game_status === "started") {
      handleSlotsStart();

      if (!pullingLever.current) {
        handleLeverPull(false);
      }
    } else if (session?.game_state.game_status === "done") {
      handleSlotsStop();

      const state = session?.game_state as SlotsGameState;

      switch (state.outcome) {
        case "loss":
          notification.error({
            message: `You lost ${state.wager} ${state.currency}.`,
          });
          break;
        case "push":
          notification.info({
            message: `You broke even and were refunded ${state.wager} ${state.currency}.`,
          });
          break;
        case "win":
          notification.success({
            message: `You won ${state.reward} ${state.currency}!`,
          });
          break;
        case "jackpot":
          return notification.success({
            message: `You hit the jackpot and won ${state.reward} ${state.currency}!!`,
          });
          break;
      }
    }
  }, [session, handleSlotsStart, handleSlotsStop]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingRight: "3rem",
        gap: 12,
        position: "relative",
        background: "var(--gray-400)",
        border: "1px solid var(--gray-900)",
        borderRadius: 4,
        padding: "1rem",
        transform: sm ? "" : "scale(0.75)",
      }}
    >
      <SlotReel result={results[0]} rolling={rolling[0]} />
      <SlotReel result={results[1]} rolling={rolling[1]} />
      <SlotReel result={results[2]} rolling={rolling[2]} />
      <div
        style={{
          position: "absolute",
          top: 20,
          right: -40,
          width: 40,
          height: 80,
          background: "var(--gray-400)",
          border: "1px solid var(--gray-900)",
          borderRadius: 4,
        }}
      >
        <div ref={leverRef} className="Slots-lever"></div>
        <div
          ref={leverBallRef}
          className="Slots-leverBall"
          onClick={() => handleLeverPull()}
        />
      </div>
    </div>
  );
}
