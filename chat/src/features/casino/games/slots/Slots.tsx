import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sleep } from "../../../../helpers";
import { useCasino } from "../../useCasino";
import { useUserGameSession } from "../../state";
import { SlotReel } from "./SlotReel";
import "./Slots.css";

const REEL_DELAY = 250;
const LEVER_PULL_DURATION = 1000;

export function Slots() {
  const leverRef = useRef<HTMLDivElement>(null);
  const leverBallRef = useRef<HTMLDivElement>(null);
  const pullingLever = useRef(false);
  const { userPlayedSlots } = useCasino();
  const session = useUserGameSession("slots");
  const [rolling, setRolling] = useState([false, false, false]);
  const results = useMemo(() => {
    const emptySet = [null, null, null];

    if (session?.game_state.game_status === "done") {
      const state = session.game_state as SlotsGameState;
      return state.symbols
    } else {
      return emptySet;
    }
  }, [session]);

  const handleLeverPull = useCallback(async () => {
    if (!pullingLever.current) {
      userPlayedSlots();

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
  }, []);

  useEffect(() => {
    if (session?.game_state.game_status === "started") {
      handleSlotsStart();
    } else if (session?.game_state.game_status === "done") {
      handleSlotsStop();
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
          onClick={handleLeverPull}
        />
      </div>
    </div>
  );
}
