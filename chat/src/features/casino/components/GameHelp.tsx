import React from "react";
import { MdOutlineArrowBackIosNew } from "react-icons/md";
import { Button, Space, Typography } from "antd";
import { capitalize } from "../../../helpers";

export function GameHelp({
  game,
  onClose,
}: {
  game: CasinoGame;
  onClose(): void;
}) {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Typography.Title level={4} style={{ display: "flex", margin: 0 }}>
          <Button
            type="text"
            icon={
              <MdOutlineArrowBackIosNew
                style={{ position: "relative", top: -2 }}
              />
            }
            onClick={onClose}
          />
          How to Play {capitalize(game)}
        </Typography.Title>
      </Space>
    </Space>
  );
}
