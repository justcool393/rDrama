import React, { PropsWithChildren } from "react";
import {
  Avatar,
  Comment,
  Dropdown,
  Menu,
  PageHeader,
  Popconfirm,
  Space,
  Typography,
} from "antd";
import type { ItemType } from "antd/lib/menu/hooks/useItems";
import key from "weak-key";
import { formatTimeAgo } from "../../../helpers";
import { useRootContext } from "../../../hooks";
import { useCasino } from "../useCasino";
import { useCasinoUser, useChatMessages } from "../state";
import { CasinoUsername } from "./CasinoUsername";

const { Title, Text } = Typography;

export function ChatMessageBox() {
  const { recipient, setRecipient } = useCasino();
  const recipientUser = useCasinoUser(recipient);
  const chatMessageGroups = useChatMessages();

  return (
    <div
      style={{
        backgroundImage: recipientUser
          ? recipientUser.account.bannerurl
          : "initial",
      }}
    >
      {recipientUser && (
        <PageHeader
          onBack={() => setRecipient("")}
          title={
            <Space>
              <CasinoUsername user={recipientUser.account} />
              <Title level={4}>'s Suite</Title>
            </Space>
          }
        />
      )}

      {chatMessageGroups.map((chatMessageGroup) => (
        <ChatMessageGroup
          key={key(chatMessageGroup)}
          author={chatMessageGroup.author}
          messages={chatMessageGroup.messages}
        />
      ))}
    </div>
  );
}

interface ChatMessageGroupProps extends PropsWithChildren {
  author: UserEntity;
  messages: MessageEntity[];
}

export function ChatMessageGroup({ author, messages }: ChatMessageGroupProps) {
  const [first, ...rest] = messages;

  return (
    <Comment
      avatar={
        <Avatar
          src={author.account.profile_url}
          alt={author.account.username}
        />
      }
      author={author.account.username}
      datetime={formatTimeAgo(first.timestamp)}
      content={
        <div style={{ position: "relative" }}>
          {first.text}

          <Dropdown.Button
            style={{ position: "absolute", top: 0, right: 0 }}
            type="text"
            overlay={<ChatMessageMenu author={author} message={first} />}
          />
        </div>
      }
    >
      {rest.map((message) => (
        <Comment
          key={key(message)}
          content={
            <div style={{ position: "relative" }}>
              {message.text}

              <Dropdown.Button
                style={{ position: "absolute", top: 0, right: 0 }}
                type="text"
                overlay={<ChatMessageMenu author={author} message={message} />}
              />
            </div>
          }
        />
      ))}
    </Comment>
  );
}

interface ChatMessageMenuProps {
  author: UserEntity;
  message: MessageEntity;
}

export function ChatMessageMenu({ author, message }: ChatMessageMenuProps) {
  const { id, admin } = useRootContext();
  const { recipient, setRecipient, userDeletedMessage } = useCasino();
  const items: ItemType[] = [
    {
      key: "react",
      label: "React",
      disabled: true,
    },
  ];
  const isOwnMessage = id.toString() === author.id.toString();

  if (!isOwnMessage) {
    items.unshift({
      key: "reply",
      label: "Reply",
      disabled: true,
    });

    if (!recipient) {
      items.push({
        key: "dm",
        label: "DM",
        onClick: () => setRecipient(author.id),
      });
    }
  }

  if (isOwnMessage || admin) {
    items.push(
      { key: "edit", label: "Edit", disabled: true },
      {
        key: "delete",
        label: (
          <Popconfirm
            title="Delete this message?"
            onConfirm={() => userDeletedMessage(message.id)}
            okText="Yes"
            cancelText="No"
          >
            <Text type="danger">Delete</Text>
          </Popconfirm>
        ),
      }
    );
  }

  return <Menu items={items} />;
}
