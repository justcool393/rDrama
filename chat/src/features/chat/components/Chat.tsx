import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { EmojiDrawer } from "../../emoji";
import { ChatMessage } from "./ChatMessage";
import { UserInput } from "./UserInput";
import { UserList } from "./UserList";
import "./Chat.css";

enum ChatHandlers {
  CONNECT = "connect",
  CATCHUP = "catchup",
  ONLINE = "online",
  TYPING = "typing",
  DELETE = "delete",
  SPEAK = "speak",
}

export function Chat() {
  const socket = useRef<null | Socket>(null);
  const [online, setOnline] = useState<string[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatSpeakResponse[]>([]);
  const [draft, setDraft] = useState("");
  const [emojiDrawerOpen, setEmojiDrawerOpen] = useState(false);
  const usersTyping = useMemo(() => formatTypingString(typing), [typing]);
  const addMessage = useCallback(
    (message: ChatSpeakResponse) => setMessages((prev) => prev.concat(message)),
    []
  );
  const sendMessage = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      socket.current?.emit(ChatHandlers.SPEAK, draft);
      setDraft("");
    },
    [draft]
  );
  const requestDeleteMessage = useCallback((withText: string) => {
    socket.current?.emit(ChatHandlers.DELETE, withText);
  }, []);
  const deleteMessage = useCallback(
    (withText: string) =>
      setMessages((prev) =>
        prev.filter((prevMessage) => prevMessage.text !== withText)
      ),
    []
  );

  useEffect(() => {
    if (!socket.current) {
      socket.current = io();

      socket.current
        .on(ChatHandlers.CATCHUP, setMessages)
        .on(ChatHandlers.ONLINE, setOnline)
        .on(ChatHandlers.TYPING, setTyping)
        .on(ChatHandlers.SPEAK, addMessage)
        .on(ChatHandlers.DELETE, deleteMessage);
    }
  });

  useEffect(() => {
    socket.current?.emit(ChatHandlers.TYPING, draft);
  }, [draft]);

  return (
    <section className="Chat">
      <div className="Chat-left">
        <div className="Chat-online">
          <i className="far fa-user fa-sm" /> {online.length}
        </div>
        <div className="Chat-messagelist" style={{ position: "relative" }}>
          {emojiDrawerOpen && <EmojiDrawer />}
          {messages.map((message, index) => (
            <ChatMessage
              key={message.time}
              {...message}
              showUser={message.username !== messages[index - 1]?.username}
              onDelete={() => requestDeleteMessage(message.text)}
            />
          ))}
          <UserInput
            value={draft}
            onChange={setDraft}
            onSubmit={sendMessage}
            onEmojiButtonClick={() => setEmojiDrawerOpen((prev) => !prev)}
          >
            <small className="Chat-typing">{usersTyping}</small>
          </UserInput>
        </div>
      </div>
      <UserList users={online} />
    </section>
  );
}

function formatTypingString(typing: string[]) {
  const [first, second, third, ...rest] = typing.map((user) => (
    <strong key={user}>{user}</strong>
  ));

  switch (typing.length) {
    case 0:
      return "";
    case 1:
      return <div>{first} is typing...</div>;
    case 2:
      return (
        <div>
          {first} and {second} are typing...
        </div>
      );
    case 3:
      return (
        <div>
          {first}, {second} and {third} are typing...
        </div>
      );
    default:
      return (
        <div>
          {first}, {second}, {third} and {rest.length} more are typing...
        </div>
      );
  }
}
