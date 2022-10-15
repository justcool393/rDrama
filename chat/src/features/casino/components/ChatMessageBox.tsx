import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Avatar,
  Button,
  Comment,
  Dropdown,
  Menu,
  PageHeader,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ItemType } from "antd/lib/menu/hooks/useItems";
import key from "weak-key";
import { formatTimeAgo } from "../../../helpers";
import {
  useCasinoDispatch,
  useActiveEditing,
  useActiveRecipient,
  useActiveUser,
  useCasinoUser,
  useChatMessages,
  openedReactionModal,
  userReactedToMessage,
  beganEditing,
  quitEditing,
  recipientChanged,
  socketActions,
} from "../state";
import { CasinoUsername } from "./CasinoUsername";

const SCROLL_CANCEL_THRESHOLD = 500;

const { Title, Text } = Typography;

export function ChatMessageBox() {
  const dispatch = useCasinoDispatch();
  const recipient = useActiveRecipient();
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
          onBack={() => dispatch(recipientChanged(""))}
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
      datetime={formatTimeAgo({
        timestamp: first.timestamp,
        edited: first.edited,
        showTimestamp: true,
      })}
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

          <ChatMessageReactions
            messageId={first.id}
            reactions={first.reactions}
          />
        </>
      }
    >
      {rest.map((message) => (
        <Comment
          key={key(message)}
          datetime={formatTimeAgo({
            timestamp: message.timestamp,
            edited: message.edited,
            showTimestamp: false,
          })}
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

              <ChatMessageReactions
                messageId={message.id}
                reactions={message.reactions}
              />
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
  const dispatch = useCasinoDispatch();
  const { id, admin } = useActiveUser();
  const recipient = useActiveRecipient();
  const editing = useActiveEditing();
  const reactToMessage = useCallback(() => {
    dispatch(openedReactionModal());

    const handleEmojiInsert = (event: CustomEvent<{ emoji: string }>) => {
      dispatch(
        userReactedToMessage({
          messageId: message.id,
          reaction: event.detail.emoji,
        })
      );
      document.removeEventListener("emojiInserted", handleEmojiInsert);

      const dismissButton = document.querySelector(
        "[data-bs-dismiss=modal]"
      ) as HTMLButtonElement;
      dismissButton?.click();
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

  if (isOwnMessage) {
    if (editing && editing === message.id) {
      items.push({
        key: "cancel",
        label: "Cancel",
        onClick: () => dispatch(quitEditing()),
      });
    } else {
      items.push({
        key: "edit",
        label: "Edit",
        onClick: () =>
          dispatch(
            beganEditing({
              message: message.original,
              editing: message.id,
            })
          ),
      });
    }
  } else {
    items.unshift({
      key: "reply",
      label: "Reply",
      disabled: true,
    });

    if (!recipient) {
      items.push({
        key: "dm",
        label: "DM",
        onClick: () => dispatch(recipientChanged(author.id)),
      });
    }
  }

  if (isOwnMessage || admin) {
    items.push({
      key: "delete",
      label: (
        <Popconfirm
          title="Delete this message?"
          onConfirm={() => socketActions.userDeletedMessage(message.id)}
          okText="Yes"
          cancelText="No"
        >
          <Text type="danger">Delete</Text>
        </Popconfirm>
      ),
    });
  }

  return (
    <>
      <button
        ref={dumbassButton}
        style={{ display: "none" }}
        data-bs-toggle="modal"
        data-bs-target="#emojiModal"
        data-bs-placement="bottom"
        data-bs-dismiss="modal"
      />
      <input id="dumbassInput" style={{ display: "none" }} />
      <Menu items={items} />
    </>
  );
}

function ChatMessageReactions({
  messageId,
  reactions,
}: {
  messageId: string;
  reactions: MessageReactions[];
}) {
  const dispatch = useCasinoDispatch();

  return (
    <>
      <Space>
        {reactions.map(({ reaction, users }) => (
          <Tooltip
            key={reaction}
            placement="top"
            title={
              <>
                {reaction}
                <ul style={{ listStyle: "none" }}>
                  {users.map((user) => (
                    <li key={user}>{user}</li>
                  ))}
                </ul>
              </>
            }
          >
            <Button
              type="text"
              onClick={() =>
                dispatch(
                  userReactedToMessage({
                    messageId,
                    reaction,
                  })
                )
              }
            >
              <Space>
                <img
                  loading="lazy"
                  src={`/e/${reaction.replace(/\:/g, "")}.webp`}
                  width={24}
                />
                <Tag>{users.length}</Tag>
              </Space>
            </Button>
          </Tooltip>
        ))}
      </Space>
    </>
  );
}
