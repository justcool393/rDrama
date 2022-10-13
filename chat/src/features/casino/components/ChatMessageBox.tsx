import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from "react";
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

const SCROLL_CANCEL_THRESHOLD = 500;

const { Title, Text } = Typography;

export function ChatMessageBox() {
  const { recipient, setRecipient } = useCasino();
  const recipientUser = useCasinoUser(recipient);
  const chatMessageGroups = useChatMessages();
  const initiallyScrolledDown = useRef(false);

  // Autoscroll.
  useEffect(() => {
    if (chatMessageGroups.length > 0) {
      // Always scroll to the bottom on first load.
      // if (initiallyScrolledDown.current) {
      //   /* We only want to scroll back down on a new message
      //    if the user is not scrolled up looking at previous messages. */
      //   const scrollableDistance =
      //     document.body.scrollHeight - document.body.clientHeight;
      //   const scrolledDistance = document.body.scrollTop;
      //   const hasScrolledEnough =
      //     scrollableDistance - scrolledDistance >= SCROLL_CANCEL_THRESHOLD;

      //   if (hasScrolledEnough) {
      //     return;
      //   }
      // } else {
      //   initiallyScrolledDown.current = true;
      // }

      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [chatMessageGroups]);

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
  messages: ProcessedMessageEntity[];
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
        <>
          <div style={{ position: "relative" }}>
            <div
              dangerouslySetInnerHTML={{ __html: first.content }}
              data-testid="first-message"
            />

            <Dropdown.Button
              style={{ position: "absolute", top: 0, right: 0 }}
              type="text"
              overlay={<ChatMessageMenu author={author} message={first} />}
            />
          </div>
          {first.reactions.map((each) => JSON.stringify(each, null, 2))}
        </>
      }
    >
      {rest.map((message) => (
        <Comment
          key={key(message)}
          content={
            <>
              <div style={{ position: "relative" }}>
                <div
                  dangerouslySetInnerHTML={{ __html: message.content }}
                  data-testid="subsequent-message"
                />

                <Dropdown.Button
                  style={{ position: "absolute", top: 0, right: 0 }}
                  type="text"
                  overlay={
                    <ChatMessageMenu author={author} message={message} />
                  }
                />
              </div>
              {message.reactions.map((each) => JSON.stringify(each, null, 2))}
            </>
          }
        />
      ))}
    </Comment>
  );
}

interface ChatMessageMenuProps {
  author: UserEntity;
  message: ProcessedMessageEntity;
}

export function ChatMessageMenu({ author, message }: ChatMessageMenuProps) {
  const dumbassButton = useRef<null | HTMLButtonElement>(null);
  const { id, admin } = useRootContext();
  const { recipient, setRecipient, userReactedToMessage, userDeletedMessage } =
    useCasino();
  const reactToMessage = useCallback(() => {
    const handleEmojiInsert = (event: CustomEvent<{ emoji: string }>) => {
      userReactedToMessage(message.id, event.detail.emoji);
      document.removeEventListener("emojiInserted", handleEmojiInsert);
      dumbassButton.current?.click();
    };

    document.addEventListener("emojiInserted", handleEmojiInsert);

    const whatever = window as any;
    whatever.loadEmojis("dumbassInput");

    dumbassButton.current?.click();
  }, [message, userReactedToMessage]);
  const items: ItemType[] = [
    {
      key: "react",
      label: "React",
      onClick: reactToMessage,
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

  return (
    <>
      <button
        ref={dumbassButton}
        style={{ display: "none" }}
        data-bs-toggle="modal"
        data-bs-target="#emojiModal"
        data-bs-placement="bottom"
      />
      <input id="dumbassInput" style={{ display: "none" }} />
      <Menu items={items} />
    </>
  );
}
