import React, { useRef, useState, useEffect } from "react";
import { useChance } from "../../../../hooks";

interface SlotReelProps {
  result: string;
  rolling: boolean;
}

const REEL_SIZE = 96;
const REEL_SYMBOLS = [
  "👣",
  "🍀",
  "🌈",
  "⭐️",
  "🍎",
  "🔞",
  "⚛️",
  "☢️",
  "✡️",
  "⚔️",
  "🍆",
  "🍒",
  "🐱",
];
const REEL_SWITCH_SPEED = 66;

export function SlotReel({ result, rolling }: SlotReelProps) {
  const chance = useChance();
  const order = useRef(chance.shuffle(REEL_SYMBOLS));
  const [which, setWhich] = useState(0);

  useEffect(() => {
    const switchSymbol = () => {
      if (rolling) {
        setWhich((prev) => {
          const nextSymbol = prev + 1;
          return order.current[nextSymbol] ? nextSymbol : 0;
        });
      }

      switchingSymbol = setTimeout(switchSymbol, REEL_SWITCH_SPEED);
    };
    let switchingSymbol = setTimeout(switchSymbol, REEL_SWITCH_SPEED);

    return () => {
      clearTimeout(switchingSymbol);
    };
  }, [rolling]);

  return (
    <div
      style={{
        minWidth: REEL_SIZE,
        width: REEL_SIZE,
        minHeight: REEL_SIZE,
        height: REEL_SIZE,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        className="Casino-fade SlotReel-inner"
        style={{
          minWidth: REEL_SIZE,
          width: REEL_SIZE,
          minHeight: REEL_SIZE,
          height: REEL_SIZE,
          border: "1px solid black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 80,
          background:
            "radial-gradient(circle, rgba(248,248,250,1) 0%, rgba(214,206,255,1) 100%)",
        }}
      >
        {rolling ? order.current[which] : result || order.current[which]}
      </div>
    </div>
  );
}
