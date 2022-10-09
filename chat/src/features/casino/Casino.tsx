import React, { useEffect, useState } from "react";
import { Affix, Button, Grid, Layout, message, notification, Tabs } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { AiOutlineMenuUnfold } from "react-icons/ai";
import {
  GiCardAceSpades,
  GiCartwheel,
  GiHorseHead,
  GiLever,
} from "react-icons/gi";
import { TiMessage } from "react-icons/ti";
import { useActiveCasinoGame, useOnlineUserCount, useUserGameSession } from "./state";
import { DraggableModal, Game, Lobby, UserList, UsersAndGames } from "./layout";
import { useCasino } from "./useCasino";
import "antd/dist/antd.css";
import "antd/dist/antd.dark.css";
import "./Casino.css";

const PANEL_OFFSET_TOP = 68;
const GAME_PANEL_WIDTH = 440;
const MESSAGE_TOP = 100;
const MESSAGE_DURATION = 2;

const { useBreakpoint } = Grid;

export function Casino() {
  const { lg } = useBreakpoint();
  const { userQuitGame } = useCasino();
  const game = useActiveCasinoGame();
  const session = useUserGameSession(game?.name as CasinoGame);
  const [showingSider, setShowingSider] = useState(false);

  useEffect(() => {
    message.config({
      duration: MESSAGE_DURATION,
      top: MESSAGE_TOP,
    });
  }, []);

  useEffect(() => {
    notification.config({
      top: 120,
    });
  }, []);

  useEffect(() => {
    if (game) {
      setShowingSider(false);
    }
  }, [game])

  return (
    <Layout
      style={{ minHeight: "100vh", position: "relative" }}
      hasSider={true}
    >
      <Layout.Content>
        {session && <DraggableModal session={session} onClose={userQuitGame} />}
        <Lobby />
      </Layout.Content>
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth={0}
        collapsible={true}
        collapsed={!showingSider}
        trigger={null}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          right: 0,
          top: PANEL_OFFSET_TOP,
          bottom: 0,
          zIndex: 10
        }}
      >
        <UsersAndGames />
      </Layout.Sider>
      {!showingSider && (
        <Button
          type="text"
          icon={<AiOutlineMenuUnfold />}
          onClick={() => setShowingSider(true)}
        />
      )}
    </Layout>
  );

  return lg ? (
    <Layout style={{ minHeight: "100vh" }}>
      {game && (
        <Layout.Sider
          width={GAME_PANEL_WIDTH}
          breakpoint="lg"
          collapsedWidth={0}
          collapsible={true}
          trigger={null}
        >
          <Affix offsetTop={PANEL_OFFSET_TOP} offsetBottom={PANEL_OFFSET_TOP}>
            <Game />
          </Affix>
        </Layout.Sider>
      )}
      <Layout.Content>
        <Lobby />
      </Layout.Content>
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth={0}
        collapsible={true}
        trigger={null}
      >
        <Affix offsetTop={PANEL_OFFSET_TOP}>
          <UsersAndGames />
        </Affix>
      </Layout.Sider>
    </Layout>
  ) : (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Content>
        <MobileNavTabs />
      </Layout.Content>
    </Layout>
  );
}

function MobileNavTabs() {
  const { userStartedGame } = useCasino();
  const usersOnline = useOnlineUserCount();
  const game = useActiveCasinoGame();

  return (
    <Tabs
      items={[
        {
          key: "lobby",
          label: <TiMessage />,
          children: <Lobby />,
        },
        {
          active: game?.name === "slots",
          key: "slots",
          label: <GiLever onClick={() => userStartedGame("slots")} />,
          children: <Game />,
        },
        {
          active: game?.name === "blackjack",
          key: "blackjack",
          label: (
            <GiCardAceSpades onClick={() => userStartedGame("blackjack")} />
          ),
          children: <Game />,
        },
        {
          active: game?.name === "roulette",
          key: "roulette",
          label: <GiCartwheel onClick={() => userStartedGame("roulette")} />,
          children: <Game />,
        },
        {
          active: game?.name === "racing",
          key: "racing",
          label: <GiHorseHead onClick={() => userStartedGame("racing")} />,
          children: <Game />,
        },
        {
          key: "users",
          label: (
            <>
              <UserOutlined /> {usersOnline} users
            </>
          ),
          children: <UserList />,
        },
      ]}
    />
  );
}
