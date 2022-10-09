import React, { useState } from "react";
import { Button, Divider, Modal, Space } from "antd";
import { AiOutlineTrophy } from "react-icons/ai";
import { FiHelpCircle } from "react-icons/fi";
import { ImExit } from "react-icons/im";
import {
  useActiveUserGameSession,
  useGameActions,
  useGameIcons,
} from "../state";
import { useCasino } from "../useCasino";
import { ActiveGame } from "./ActiveGame";
import { GameLeaderboard } from "./GameLeaderboard";
import { GameHelp } from "./GameHelp";
import { Wager } from "./Wager";

enum GameModalMode {
  Play,
  Leaderboard,
  Help,
}

export function GameModal() {
  const { userQuitGame } = useCasino();
  const gameActions = useGameActions();
  const session = useActiveUserGameSession();
  const [mode, setMode] = useState(GameModalMode.Play);
  const Icon = useGameIcons()[session?.game];
  const Content = {
    [GameModalMode.Play]: ActiveGame,
    [GameModalMode.Leaderboard]: GameLeaderboard,
    [GameModalMode.Help]: GameHelp,
  }[mode];

  if (!session) {
    return null;
  }

  return (
    <Modal
      open={Boolean(session)}
      title={
        <Space>
          <Button
            type="text"
            icon={
              <Icon style={{ position: "relative", top: -2, marginRight: 8 }} />
            }
            onClick={() => setMode(GameModalMode.Play)}
          >
            {session?.game.toUpperCase()}
          </Button>
          <Button
            type="text"
            icon={<AiOutlineTrophy />}
            onClick={() => setMode(GameModalMode.Leaderboard)}
          />
          <Button
            type="text"
            icon={<FiHelpCircle />}
            onClick={() => setMode(GameModalMode.Help)}
          />
        </Space>
      }
      centered={true}
      closeIcon={<ImExit />}
      onOk={() => {}}
      onCancel={userQuitGame}
      footer={
        mode === GameModalMode.Play ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Wager />
            <Divider style={{ margin: 0 }} />
            <Space>
              <Button key="exit" onClick={userQuitGame}>
                <ImExit style={{ marginRight: 8 }} /> Exit
              </Button>
              {gameActions.map(
                ({ key, title, disabled, primary, icon: Icon, onClick }) => (
                  <Button
                    key={key}
                    icon={<Icon style={{ position: "relative", top: -2 }} />}
                    type={primary ? "primary" : "default"}
                    disabled={disabled}
                    onClick={onClick}
                  >
                    {title}
                  </Button>
                )
              )}
            </Space>
          </Space>
        ) : null
      }
    >
      <Content
        game={session?.game}
        onClose={() => setMode(GameModalMode.Play)}
      />
    </Modal>
  );
}
