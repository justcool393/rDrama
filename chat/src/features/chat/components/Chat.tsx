import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChat } from "../../../hooks";
import { EmojiDrawer } from "../../emoji";
import { ChatMessage } from "./ChatMessage";
import { UserInput } from "./UserInput";
import { UserList } from "./UserList";
import "./Chat.css";

export function Chat() {
  const messageWrapper = useRef<HTMLDivElement>(null);
  const {
    online,
    typing,
    messages,
    draft,
    sendMessage,
    deleteMessage,
    updateDraft,
  } = useChat();
  const usersTyping = useMemo(() => formatTypingString(typing), [typing]);
  const [emojiDrawerOpen, setEmojiDrawerOpen] = useState(false);
  const handleSendMessage = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  }, [])

  useEffect(() => {
    messageWrapper.current.scrollTop = messageWrapper.current.scrollHeight;
  }, [messages]);

  return (
    <section className="Chat">
      <div className="Chat-left">
        <div className="Chat-online">
          <i className="far fa-user fa-sm" /> {online.length}
        </div>
        <div className="Chat-messagelist" style={{ position: "relative" }}>
          {emojiDrawerOpen && <EmojiDrawer />}
          <div className="Chat-messagewrapper" ref={messageWrapper}>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.time}
                {...message}
                showUser={message.username !== messages[index - 1]?.username}
                onDelete={() => deleteMessage(message.text)}
                onQuote={() => {}}
              />
            ))}
          </div>

          <UserInput
            value={draft}
            onChange={updateDraft}
            onSubmit={handleSendMessage}
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
