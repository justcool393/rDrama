import React, { useCallback, useState } from "react";
import { Button, Divider, Drawer, Layout, Menu, Space, Typography } from "antd";
import { CgClose } from "react-icons/cg";
import { FiUsers } from "react-icons/fi";
import {
    GiCardAceSpades,
    GiCartwheel,
    GiHorseHead,
    GiHouse,
    GiLever,
  } from "react-icons/gi";
import { CasinoUsername } from "./CasinoUsername";
import { ChatMessageBox } from "./ChatMessageBox";
import { TextBox } from "./TextBox";
import {
  useActiveCasinoGame,
  useCasinoGameNames,
  useOnlineUserCount,
  useOnlineUsers,
} from "./state";
import { useCasino } from "./useCasino";
import { IconType } from "react-icons";

const { Header, Content, Footer } = Layout;

export function Kasino() {
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const openUserDrawer = useCallback(() => setUserDrawerOpen(true), []);
  const closeUserDrawer = useCallback(() => setUserDrawerOpen(false), []);

  return (
    <Layout style={{ minHeight: "calc(100vh - 66px)" }}>
      <CasinoHeader
        showingUserDrawer={userDrawerOpen}
        onOpenUserDrawer={openUserDrawer}
        onCloseUserDrawer={closeUserDrawer}
      />
      <Content
        style={{
          padding: "0 12px",
          marginTop: 48,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ChatMessageBox />
        {userDrawerOpen && <UserDrawer onClose={closeUserDrawer} />}
      </Content>
      <CasinoFooter />
    </Layout>
  );
}

function CasinoHeader({
  showingUserDrawer,
  onCloseUserDrawer,
  onOpenUserDrawer,
}: {
  showingUserDrawer: boolean;
  onOpenUserDrawer(): void;
  onCloseUserDrawer(): void;
}) {
  const onlineUserCount = useOnlineUserCount();

  return (
    <Header style={{ position: "fixed", zIndex: 1, width: "100%", padding: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 12,
        }}
      >
        <Typography.Title level={5} style={{ margin: 0 }}>
          Lobby
        </Typography.Title>
        {showingUserDrawer ? (
          <Button type="text" onClick={onCloseUserDrawer}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              <CgClose style={{ position: "relative", top: -2 }} />
              Close
            </Typography.Title>
          </Button>
        ) : (
          <Button type="text" onClick={onOpenUserDrawer}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {onlineUserCount}{" "}
              <FiUsers style={{ position: "relative", top: -2 }} />
            </Typography.Title>
          </Button>
        )}
      </div>
      <Divider style={{ margin: 0 }} />
    </Header>
  );
}

function CasinoFooter() {
  const { userStartedGame } = useCasino();
  const activeGame = useActiveCasinoGame();
  const availableGames = useCasinoGameNames();
  const gamesToIcons: Record<CasinoGame, IconType> = {
    "blackjack": GiCardAceSpades,
    "crossing": GiHouse,
    "racing": GiHorseHead,
    "roulette": GiCartwheel,
    "slots": GiLever
  }

  return (
    <Footer
      style={{
        position: "fixed",
        bottom: 0,
        zIndex: 1,
        width: "100%",
        padding: 0,
      }}
    >
      <Divider style={{ margin: 0 }} />
      <TextBox />
      <Menu
        theme="dark"
        mode="horizontal"
        items={availableGames.map((game) => {
            const Icon = gamesToIcons[game];

            return {
                key: game,
                label: <Icon />,
                onClick: () => userStartedGame(game as CasinoGame),
                disabled: activeGame?.name === game,
              }
        })}
      />
    </Footer>
  );
}

function UserDrawer({ onClose }: { onClose(): void }) {
  const onlineUserCount = useOnlineUserCount();

  return (
    <Drawer
      placement="right"
      closable={false}
      onClose={onClose}
      open={true}
      getContainer={false}
      style={{ position: "absolute", top: 4 }}
    >
      <Typography.Title level={4} style={{ margin: 0 }}>
        {onlineUserCount} Users Online
      </Typography.Title>
      <Divider />
      <UserList />
    </Drawer>
  );
}

function UserList() {
  const onlineUsers = useOnlineUsers();

  return (
    <Space
      direction="vertical"
      style={{ width: "100%", maxHeight: "80%", overflow: "auto" }}
    >
      {onlineUsers.map((user) => (
        <CasinoUsername key={user.id} user={user.account} />
      ))}
    </Space>
  );
}
