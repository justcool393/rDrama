/** @desc The lobby is the central chatroom that everyone participates in. */
import React from "react";
import { Layout, Affix } from "antd";
import { Content, Footer } from "antd/lib/layout/layout";
import { ChatMessageBox } from "../ChatMessageBox";
import { TextBox } from "../TextBox";

export function Lobby() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "2rem" }}>
        <ChatMessageBox />
      </Content>
      <Affix offsetBottom={0}>
        <TextBox />
      </Affix>
    </Layout>
  );
}
