import React, { useState } from "react";
import { Button, Col, Grid, Row, Space, Statistic } from "antd";
import chunk from "lodash.chunk";
import key from "weak-key";
import {
  useUserGameSession,
  userPlayedRoulette,
  useCasinoDispatch,
} from "../../state";
import Countdown from "antd/lib/statistic/Countdown";
import "./Roulette.css";

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];
const CELL_SIZE = 42;
const RED = "#FE020E";
const BLACK = "#413E40";
const GREEN = "#176D36";
const WHITE = "#E1D3D8";
const COMMON_STYLES = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${WHITE}`,
  background: GREEN,
};

const { useBreakpoint } = Grid;

export function Roulette() {
  const { md } = useBreakpoint();
  const dispatch = useCasinoDispatch();
  const [finished, setFinished] = useState(false);
  const session = useUserGameSession("roulette");

  if (!session) {
    return null;
  }
  const roulette = session.game_state as RouletteGameState;
  const isSpinning = roulette.game_status === "started";
  const wheelStyle: React.HTMLAttributes<HTMLImageElement>["style"] = md
    ? {
        flex: 1,
        position: "relative",
        left: 36,
        overflow: "auto",
      }
    : {
        flex: "1 1 0%",
        position: "relative",
        left: -55,
        overflow: "auto",
        top: -30,
      };

  return (
    <Space align="start" style={{ marginBottom: "-10rem" }}>
      <Board onFinish={() => setFinished(true)} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 180,
        }}
      >
        <img
          className={finished ? "Roulette-wheel" : ""}
          style={wheelStyle}
          src="/i/roulette_wheel.webp"
        />
      </div>
    </Space>
  );
}

function Bet({
  height,
  text,
  background = GREEN,
}: {
  height: number;
  text: string;
  background?: string;
}) {
  return (
    <div
      style={{
        ...COMMON_STYLES,
        background,
        minWidth: CELL_SIZE,
        width: CELL_SIZE,
        height,
      }}
    >
      <span
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg)",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function LowBet() {
  return <Bet height={CELL_SIZE * 2} text="1-18" />;
}

function EvenBet() {
  return <Bet height={CELL_SIZE * 2} text="EVEN" />;
}

function BlackBet() {
  return <Bet height={CELL_SIZE * 2} text="" background={BLACK} />;
}

function RedBet() {
  return <Bet height={CELL_SIZE * 2} text="" background={RED} />;
}

function OddBet() {
  return <Bet height={CELL_SIZE * 2} text="ODD" />;
}

function HighBet() {
  return <Bet height={CELL_SIZE * 2} text="19-36" />;
}

function ExoticBets() {
  return (
    <div>
      <LowBet />
      <EvenBet />
      <BlackBet />
      <RedBet />
      <OddBet />
      <HighBet />
    </div>
  );
}

function DozenBets() {
  return (
    <div>
      {Array.from({ length: 3 }, (_, i) => (
        <Bet
          key={i}
          height={CELL_SIZE * 4}
          text={`${["1st", "2nd", "3rd"][i]} Dozen`}
        />
      ))}
    </div>
  );
}

function Numbers() {
  return (
    <div>
      <Row>
        <Col
          span={24}
          style={{
            ...COMMON_STYLES,
            background: GREEN,
            height: CELL_SIZE,
          }}
        >
          0
        </Col>
      </Row>
      {chunk(
        Array.from({ length: 36 }, (_, i) => (
          <Col
            key={i}
            span={8}
            style={{
              ...COMMON_STYLES,
              width: CELL_SIZE,
              height: CELL_SIZE,
              background: RED_NUMBERS.includes(i + 1) ? RED : BLACK,
            }}
          >
            {i + 1}
          </Col>
        )),
        3
      ).map((row) => (
        <Row key={key(row)}>{row}</Row>
      ))}
    </div>
  );
}

function Board({ onFinish }) {
  const { md } = useBreakpoint();
  const style: React.HTMLAttributes<HTMLDivElement>["style"] = md
    ? {
        overflowY: "auto",
        transform: "scale(0.85) rotate(313deg)",
        position: "absolute",
        left: 130,
        top: 0,
      }
    : {
        transform: "scale(0.75) rotate(313deg)",
        position: "absolute",
        top: 0,
        left: 85,
      };

  return (
    <>
      <div style={{ minWidth: 240, height: 400, visibility: "hidden" }} />
      <div
        style={{
          position: "relative",
          top: -140,
        }}
      >
        <Space direction="vertical">
          <Countdown
            title="Next Roll"
            value={Date.now() + 10 * 1000}
            onFinish={onFinish}
          />
          <Statistic title="At Stake" value={30001} />
          <Button type="default">View Bets</Button>
        </Space>
      </div>

      <div style={style}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <ExoticBets />
          <DozenBets />
          <div>
            <Numbers />
            <Row>
              {Array.from({ length: 3 }, (_, i) => (
                <Col
                  key={i}
                  style={{
                    ...COMMON_STYLES,
                    minWidth: CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: GREEN,
                  }}
                >
                  2to1
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </div>
    </>
  );
}
