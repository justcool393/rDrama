import {
  UserOutlined,
  UnorderedListOutlined,
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import {
  Affix,
  Avatar,
  Button,
  Comment,
  Input,
  Layout,
  Menu,
  MenuProps,
  Select,
  Space,
  Tabs,
  Tooltip,
} from "antd";
import React from "react";
import { useCasino } from "../../hooks";
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

export const GameLayout: React.FC = () => {
  const { state, selectors, userSentMessage } = useCasino();
  const chatMessages = selectors.selectChatMessages(state);
  const usersOnline = selectors.selectUsersOnline(state);
  const usersOnlineMenu = getItem(
    `${usersOnline.length} Users Online`,
    "sub1",
    <UserOutlined />,
    usersOnline.map((user) =>
      getItem(
        <Space>
          <Avatar src={user.account.profile_url} />
          <span>@{user.account.username}</span>
        </Space>,
        user.id
      )
    )
  );
  const feedMenu = getItem("Feed", "sub2", <UnorderedListOutlined />);

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
            <Tabs
              defaultActiveKey="games"
              centered={true}
              items={[
                {
                  label: "Games",
                  key: "games",
                  children: (
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <GameSelect />
                      <Game />
                      <Wager />
                      <YourStats />
                    </Space>
                  ),
                },
                {
                  label: "Leaderboards",
                  key: "leaderboards",
                  children: (
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <GameSelect />
                    </Space>
                  ),
                },
              ]}
            ></Tabs>
          </Space>
        </Sider>
      </Affix>
      <Layout>
        <Content style={{ padding: "0 2rem 6rem 2rem" }}>
          <div style={{ marginBottom: "3rem" }}>
            {JSON.stringify(state, null, 4)}
          </div>
          {chatMessages.map((chatMessage) => {
            return (
              <Comment
                avatar={
                  <Avatar
                    src={chatMessage.author.account.profile_url}
                    alt={chatMessage.author.account.username}
                  />
                }
                author={chatMessage.author.account.username}
                datetime={chatMessage.message.timestamp}
                content={chatMessage.message.text}
              />
            );
          })}
        </Content>
        <Affix offsetBottom={0}>
          <Footer style={{ textAlign: "center" }}>
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
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SendOutlined />}
                  onClick={() => userSentMessage("Hello.")}
                />
              </Tooltip>
            </div>
          </Footer>
        </Affix>
      </Layout>
      <Affix offsetTop={90}>
        <Sider width={320} style={{ height: "95vh" }}>
          <Menu
            selectable={false}
            theme="dark"
            defaultOpenKeys={["sub1"]}
            mode="inline"
            items={[usersOnlineMenu, feedMenu]}
          />
        </Sider>
      </Affix>
    </Layout>
  );
};
