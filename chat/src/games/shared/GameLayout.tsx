import { UserOutlined, SendOutlined, SmileOutlined } from "@ant-design/icons";
import {
  Affix,
  Avatar,
  Button,
  Col,
  Input,
  Layout,
  Menu,
  MenuProps,
  Row,
  Select,
  Space,
  Tabs,
  Tooltip,
} from "antd";
import React, { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Feed } from "./Feed";
import { Game } from "./Game";
import { Wager } from "./Wager";
import { YourStats } from "./YourStats";

const { Content, Footer, Sider } = Layout;
const { TextArea } = Input;
const { Option } = Select;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("Users Online", "sub1", <UserOutlined />, [
    getItem(
      <Space>
        <Avatar src="http://localhost/e/marseyheavymetal.webp" />
        <span>@McCoxmaul</span>
      </Space>,
      "3"
    ),
  ]),
];

enum CasinoHandlers {
  Ping = "ping",
  StateChanged = "state-changed",
  UserSentMessage = "user-sent-message"
}

export const GameLayout: React.FC = () => {
  const socket = useRef<null | Socket>(null);

  useEffect(() => {
    if (!socket.current) {
      socket.current = io();

      socket.current.on(CasinoHandlers.Ping, console.info);

      socket.current.emit(CasinoHandlers.UserSentMessage, {
        message: "This is a message."
      });

      socket.current.on(CasinoHandlers.StateChanged, console.info);
    }
  });

  function GameSelect() {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <Select defaultValue="slots" style={{ width: 180 }}>
          <Option value="slots">Slots</Option>
          <Option value="blackjack">Blackjack</Option>
          <Option value="roulette">Roulette</Option>
          <Option value="racing">Racing</Option>
          <Option value="crossing">Crossing</Option>
        </Select>
      </div>
    );
  }

  return (
    <Layout>
      <Affix offsetTop={80}>
        <Sider width={600} style={{ height: "95vh", padding: "1rem" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Tabs defaultActiveKey="game" centered={true}>
              <Tabs.TabPane tab="Games" key="games">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <GameSelect />
                  <Game />
                  <Wager />
                  <YourStats />
                </Space>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Feed" key="feed">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Feed />
                </Space>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Leaderboards" key="leaderboard">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <GameSelect />
                </Space>
              </Tabs.TabPane>
            </Tabs>
          </Space>
        </Sider>
      </Affix>
      <Layout>
        <Content style={{ paddingBottom: "20rem" }}></Content>
        <Affix offsetBottom={0}>
          <Footer style={{ textAlign: "center", margin: "3rem 0" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Tooltip title="emojis">
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SmileOutlined />}
                />
              </Tooltip>
              <TextArea
                allowClear={true}
                showCount={true}
                maxLength={1000}
                style={{ height: 60, flex: 1, margin: "0 1rem" }}
              />
              <Tooltip title="send">
                <Button type="primary" shape="circle" icon={<SendOutlined />} />
              </Tooltip>
            </div>
          </Footer>
        </Affix>
      </Layout>
      <Affix offsetTop={90}>
        <Sider width={320} style={{ height: "95vh" }}>
          <Menu
            theme="dark"
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            mode="inline"
            items={items}
          />
        </Sider>
      </Affix>
    </Layout>
  );
};
