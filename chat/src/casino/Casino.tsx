import React from "react";
import {
  Affix,
  Layout,
} from "antd";
import { useCasino } from "../hooks";
import { ChatMessageBox } from "./ChatMessageBox";
import { InformationPanel } from "./InformationPanel";
import { InteractionPanel } from "./InteractionPanel";
import { TextBox } from "./TextBox";

const PANEL_OFFSET_TOP = 80;
const INTERACTION_SIDER_WIDTH = 600;
const INFORMATION_SIDER_WIDTH = 320;

const { Content, Footer, Sider } = Layout;

export function Casino() {
  useCasino()

  return (
    <Layout>
      {/* Interactions */}
      <Affix offsetTop={PANEL_OFFSET_TOP}>
        <Sider
          width={INTERACTION_SIDER_WIDTH}
          style={{ height: "95vh", padding: "1rem" }}
        >
          <InteractionPanel />
        </Sider>
      </Affix>

      {/* Chat */}
      <Layout>
        <Content>
          <ChatMessageBox />
        </Content>
        <Affix offsetBottom={0}>
          <Footer>
            <TextBox />
          </Footer>
        </Affix>
      </Layout>

      {/* Information */}
      <Affix offsetTop={PANEL_OFFSET_TOP}>
        <Sider width={INFORMATION_SIDER_WIDTH} style={{ height: "95vh" }}>
          <InformationPanel />
        </Sider>
      </Affix>
    </Layout>
  );
}
