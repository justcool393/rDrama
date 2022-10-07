import { notification } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCasino } from "../../useCasino";
import { useUserGameSession } from "../../state";
import { SlotReel } from "./SlotReel";

const REEL_DELAY = 250;
const REEL_DURATION = 3000;
const LEVER_PULL_DURATION = 1000;

export function SlotMachine() {
  const leverRef = useRef<HTMLDivElement>(null);
  const leverBallRef = useRef<HTMLDivElement>(null);
  const pullingLever = useRef(false);
  const { userPlayedSlots } = useCasino();
  const session = useUserGameSession("slots");
  const [active, setActive] = useState(false);
  const [rolling, setRolling] = useState([false, false, false]);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState([null, null, null]);
  const handleLeverPull = useCallback(() => {
    if (!active && !pullingLever.current) {
      userPlayedSlots();
    }
  }, []);

  // Effect: Once the first reel starts, show the others.
  useEffect(() => {
    if (active && !finishing) {
      let stagger;
      const [first, second, third] = rolling;

      if (!first) {
        stagger = setTimeout(
          () => setRolling([true, false, false]),
          REEL_DELAY
        );
      } else if (first && !second) {
        stagger = setTimeout(() => setRolling([true, true, false]), REEL_DELAY);
      } else if (first && second && !third) {
        stagger = setTimeout(() => setRolling([true, true, true]), REEL_DELAY);
      } else if (first && second && third && !finishing) {
        setFinishing(true);
      }

      return () => {
        clearTimeout(stagger);
      };
    }
  }, [active, rolling, finishing]);

  useEffect(() => {
    if (active && finishing) {
      let stagger;
      const symbols = (session?.game_state.symbols ?? ",,").split(",");
      const [first, second, third] = rolling;

      if (first) {
        stagger = setTimeout(() => {
          setRolling([false, true, true]);
          setResult([symbols[0], null, null]);
        }, REEL_DURATION);
      } else if (second) {
        stagger = setTimeout(() => {
          setRolling([false, false, true]);
          setResult([symbols[0], symbols[1], null]);
        }, REEL_DELAY);
      } else if (third) {
        stagger = setTimeout(() => {
          setRolling([false, false, false]);
          setResult(symbols);
        }, REEL_DELAY);
      } else {
        setFinishing(false);
        setActive(false);
      }

      return () => {
        clearTimeout(stagger);
      };
    }
  }, [session, active, rolling, finishing]);

  // Effect: When the session changes, it means a new game has been decided.
  useEffect(() => {
    notification.info({
      message: "Hi",
      description: "Hi",
    });

    // Staggered slots
    setActive(true);

    // Lever animation
    pullingLever.current = true;

    leverRef.current?.classList.add("Slots-lever__pulled");
    leverBallRef.current?.classList.add("Slots-leverBall__pulled");

    const removingClass = setTimeout(() => {
      pullingLever.current = false;

      leverRef.current?.classList.remove("Slots-lever__pulled");
      leverBallRef.current?.classList.remove("Slots-leverBall__pulled");
    }, LEVER_PULL_DURATION);

    return () => {
      clearTimeout(removingClass);
    };
  }, [session]);

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
      <SlotReel result={result[0]} rolling={rolling[0]} />
      <SlotReel result={result[1]} rolling={rolling[1]} />
      <SlotReel result={result[2]} rolling={rolling[2]} />
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
