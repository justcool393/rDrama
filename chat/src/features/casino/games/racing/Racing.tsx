import React from "react";
import { Carousel, Divider, Space } from "antd";
import chunk from "lodash.chunk";
import { useUserGameSession } from "../../state";
import key from "weak-key";
import Countdown from "antd/lib/statistic/Countdown";

export function Racing() {
  return (
    <div>
      <Divider orientation="left" style={{ marginTop: 0 }}>
        <Space>
          <span>Race starts in</span>
          <Countdown value={Date.now() + 10 * 1000} />
        </Space>
      </Divider>
      <Stable />
    </div>
  );
}

function Stable() {
  const session = useUserGameSession("racing");

  if (!session) {
    return null;
  }

  const racing = session.game_state as unknown as RacingGameState;
  const racers = chunk(racing.marseys.all, 5);

  return (
    <Carousel autoplay={true} autoplaySpeed={1500} dots={false}>
      {racers.map((group) => (
        <div key={key(group)}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            {group.map((marsey) => (
              <img
                key={marsey}
                src={`/e/${marsey}.webp`}
                style={{
                  objectFit: "contain",
                  width: 64,
                  height: 64,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </Carousel>
  );
}
