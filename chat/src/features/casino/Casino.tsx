import React, { useEffect, useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import {
  Affix,
  Drawer,
  Grid,
  Layout,
  message,
  notification,
  Space,
  Typography,
} from "antd";
import { ChatMessageBox } from "./ChatMessageBox";
import { GameIconSider } from "./GameIconSider";
import { InformationPanel } from "./InformationPanel";
import { InteractionPanel } from "./InteractionPanel";
import { TextBox } from "./TextBox";
import { useActiveCasinoGame, useCasinoSelector } from "./state";
import { useCasino } from "./useCasino";
import "antd/dist/antd.css";
import "antd/dist/antd.dark.css";
import "./Casino.css";

const PANEL_OFFSET_TOP = 70;
const MOBILE_DRAWER_BUTTON_PADDING = 20;
const INTERACTION_PANEL_WIDTH = 560;
const INFORMATION_SIDER_WIDTH = 300;
const MESSAGE_TOP = 100;
const MESSAGE_DURATION = 2;

const { Content, Footer, Sider } = Layout;
const { useBreakpoint } = Grid;

export function Casino() {
  const breakpoints = useBreakpoint();
  const { userStartedGame } = useCasino();
  const activeGame = useActiveCasinoGame();
  const [showingInformationPanel, setShowingInformationPanel] = useState(false);
  const usersOnline = useCasinoSelector((state) =>
    state.user.all
      .map((id) => state.user.by_id[id])
      .filter((user) => user.online)
  );

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
    <Layout style={{ minHeight: "100vh" }}>
      {/* Interactions */}
      {/* == Mobile */}
      {/* {!breakpoints.lg && !activeGame && (
        <Affix
          offsetTop={PANEL_OFFSET_TOP}
          style={{
            position: "fixed",
            top: PANEL_OFFSET_TOP + MOBILE_DRAWER_BUTTON_PADDING,
            right: MOBILE_DRAWER_BUTTON_PADDING,
            zIndex: 100,
          }}
        >
          <Space>
            <Button
              type="ghost"
              shape="circle"
              icon={<CaretLeftOutlined />}
              // onClick={() => setShowingInteractionPanel(true)}
            />
            <Button
              type="ghost"
              shape="circle"
              icon={<UserOutlined />}
              onClick={() => setShowingInformationPanel(true)}
            >
              {usersOnline.length}
            </Button>
          </Space>
        </Affix>
      )}
      <Drawer
        placement="left"
        headerStyle={{ display: "none" }}
        onClose={() => setShowingInteractionPanel(false)}
        open={showingInteractionPanel && !breakpoints.lg}
        style={{ top: PANEL_OFFSET_TOP }}
      >
        <InteractionPanel onClose={() => setShowingInteractionPanel(false)} />
      </Drawer> */}

      {/* == Desktop */}
      {breakpoints.lg && (
        <Affix offsetTop={PANEL_OFFSET_TOP}>
          <Sider
            collapsible={true}
            collapsed={!activeGame}
            collapsedWidth={64}
            // onCollapse={(showing) => setShowingInteractionPanel(!showing)}
            trigger={null}
            width={INTERACTION_PANEL_WIDTH}
            style={{ height: "95vh", padding: "1rem" }}
          >
            {activeGame ? (
              <div className="Casino-fade">
                <InteractionPanel
                  // onClose={() => setShowingInteractionPanel(false)}
                  onClose={() => {}}
                />
              </div>
            ) : (
              <GameIconSider
                direction="vertical"
                onLoadGame={userStartedGame}
              />
            )}
          </Sider>
        </Affix>
      )}

      {/* Chat */}
      <Layout>
        <Content style={{ padding: "0 1rem" }}>
          <ChatMessageBox />
        </Content>
        <Affix offsetBottom={0}>
          <Footer>
            <TextBox />
          </Footer>
        </Affix>
      </Layout>

      {/* Information */}
      {/* == Mobile */}
      <Drawer
        placement="right"
        title={<>{usersOnline.length} Users Online</>}
        onClose={() => setShowingInformationPanel(false)}
        open={showingInformationPanel}
        style={{ top: PANEL_OFFSET_TOP }}
      >
        <InformationPanel />
      </Drawer>

      {/* == Desktop */}
      {breakpoints.lg && (
        <Affix offsetTop={PANEL_OFFSET_TOP}>
          <Sider width={INFORMATION_SIDER_WIDTH} style={{ height: "95vh" }}>
            <Space style={{ paddingLeft: "2rem" }}>
              <UserOutlined />
              <Typography.Title level={4}>
                {usersOnline.length} users online
              </Typography.Title>
            </Space>
            <InformationPanel />
          </Sider>
        </Affix>
      )}
    </Layout>
  );
}
