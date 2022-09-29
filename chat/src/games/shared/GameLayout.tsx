import { UserOutlined } from "@ant-design/icons";
import {
  Affix,
  Avatar,
  Input,
  Layout,
  Menu,
  MenuProps,
  Select,
  Space,
  Tabs,
} from "antd";
import React from "react";
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

export const GameLayout: React.FC = () => {
  return (
    <Layout>
      <Affix offsetTop={80}>
        <Sider width={600} style={{ height: "95vh", padding: "1rem" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Tabs defaultActiveKey="game" centered={true}>
              <Tabs.TabPane tab="Games" key="games">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space style={{ width: "100%" }} align="end">
                    <Select defaultValue="slots" style={{ width: 180 }}>
                      <Option value="slots">Slots</Option>
                      <Option value="blackjack">Blackjack</Option>
                      <Option value="roulette">Roulette</Option>
                      <Option value="racing">Racing</Option>
                      <Option value="crossing">Crossing</Option>
                    </Select>
                  </Space>
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
                  Leaderboards
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
            <TextArea showCount={true} maxLength={1000} />
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
