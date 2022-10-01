import React, { useEffect, useState } from "react";
import { CaretLeftOutlined, UserOutlined } from "@ant-design/icons";
import {
  Affix,
  Button,
  Drawer,
  Grid,
  Layout,
  message,
  Space,
  Typography,
} from "antd";
import { useCasino } from "../hooks";
import { ChatMessageBox } from "./ChatMessageBox";
import { InformationPanel } from "./InformationPanel";
import { InteractionPanel } from "./InteractionPanel";
import { TextBox } from "./TextBox";
import { GameSelect } from "./GameSelect";

const PANEL_OFFSET_TOP = 70;
const MOBILE_DRAWER_BUTTON_PADDING = 12;
const INTERACTION_PANEL_WIDTH = 560;
const INFORMATION_SIDER_WIDTH = 340;
const MESSAGE_TOP = 100;
const MESSAGE_DURATION = 2;

const { Content, Footer, Sider } = Layout;
const { useBreakpoint } = Grid;

export function Casino() {
  const breakpoints = useBreakpoint();
  const { state, selectors, loaded } = useCasino();
  const [showingInteractionPanel, setShowingInteractionPanel] = useState(false);
  const [showingInformationPanel, setShowingInformationPanel] = useState(false);
  const usersOnline = selectors.selectUsersOnline(state);

  useEffect(() => {
    message.config({
      duration: MESSAGE_DURATION,
      top: MESSAGE_TOP,
    });
  }, []);

  return loaded ? (
    <Layout>
      {/* Interactions */}
      {/* == Mobile */}
      {!breakpoints.lg && !showingInteractionPanel && (
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
              onClick={() => setShowingInteractionPanel(true)}
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
        title={<GameSelect />}
        onClose={() => setShowingInteractionPanel(false)}
        open={showingInteractionPanel && !breakpoints.lg}
        style={{ top: PANEL_OFFSET_TOP }}
      >
        <InteractionPanel />
      </Drawer>

      {/* == Desktop */}
      {breakpoints.lg && (
        <Affix offsetTop={PANEL_OFFSET_TOP}>
          <Sider
            width={INTERACTION_PANEL_WIDTH}
            style={{ height: "95vh", padding: "1rem" }}
          >
            <GameSelect />
            <InteractionPanel />
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
  ) : (
    <div>Loading...</div>
  );
}
