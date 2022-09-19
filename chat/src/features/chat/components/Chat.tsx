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
import { ChatMessageList } from "./ChatMessage";
import { UserInput } from "./UserInput";
import { UserList } from "./UserList";
import "./Chat.css";

export function Chat() {
  const { online, typing, draft, sendMessage, updateDraft } = useChat();
  const usersTyping = useMemo(() => formatTypingString(typing), [typing]);
  const [emojiDrawerOpen, setEmojiDrawerOpen] = useState(false);
  const handleSendMessage = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      sendMessage();
    },
    [sendMessage]
  );

  return (
    <section className="Chat">
      <div className="Chat-left">
        <div className="Chat-online">
          <i className="far fa-user fa-sm" /> {online.length}
        </div>
        {emojiDrawerOpen && <EmojiDrawer />}
        <div style={{ width: 600, position: "relative" }}>
          <ChatMessageList />
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

function autoExpand(input: HTMLTextAreaElement) {
  const convert = (from: string) => parseInt(from, 10);
  const [x, y] = [window.scrollX, window.scrollY];
  const computedStyle = window.getComputedStyle(input);
  const elements = [
    "border-top-width",
    "border-bottom-width",
    "padding-top",
    "padding-bottom",
  ].map((element) => convert(computedStyle.getPropertyValue(element)));
  const elementHeight = elements.reduce((prev, next) => prev + next, 0);

  input.style.height = `${elementHeight + input.scrollHeight}px`;

  window.scrollTo(x, y);
}
