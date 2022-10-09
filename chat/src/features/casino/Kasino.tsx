import React, { useCallback, useEffect, useState } from "react";
import { Layout, message, notification } from "antd";
import {
  CasinoHeader,
  CasinoFooter,
  ChatMessageBox,
  GameModal,
  UserDrawer,
} from "./components";
import { useActiveUserGameSession } from "./state";

const MESSAGE_TOP = 100;
const MESSAGE_DURATION = 2;

const { Content } = Layout;

export function Kasino() {
  const session = useActiveUserGameSession();
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const openUserDrawer = useCallback(() => setUserDrawerOpen(true), []);
  const closeUserDrawer = useCallback(() => setUserDrawerOpen(false), []);

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
        {session && <GameModal />}
      </Content>
      <CasinoFooter />
    </Layout>
  );
}
