import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useRootContext } from "./useRootContext";
import { useWindowFocus } from "./useWindowFocus";

enum ChatHandlers {
  CONNECT = "connect",
  CATCHUP = "catchup",
  ONLINE = "online",
  TYPING = "typing",
  DELETE = "delete",
  SPEAK = "speak",
}

interface ChatProviderContext {
  online: string[];
  typing: string[];
  messages: ChatSpeakResponse[];
  draft: string;
  updateDraft(to: string): void;
  sendMessage(): void;
  deleteMessage(withText: string): void;
}

const ChatContext = createContext<ChatProviderContext>({
  online: [],
  typing: [],
  messages: [],
  draft: "",
  updateDraft() {},
  sendMessage() {},
  deleteMessage() {},
});

export function ChatProvider({ children }: PropsWithChildren) {
  const { siteName } = useRootContext();
  const socket = useRef<null | Socket>(null);
  const [online, setOnline] = useState<string[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatSpeakResponse[]>([]);
  const [draft, setDraft] = useState("");
  const focused = useWindowFocus();
  const [notifications, setNotifications] = useState<number>(0);
  const addMessage = useCallback((message: ChatSpeakResponse) => {
    setMessages((prev) => prev.concat(message));
    setNotifications((prev) => prev + 1);
  }, []);
  const sendMessage = useCallback(() => {
    socket.current?.emit(ChatHandlers.SPEAK, draft);
    setDraft("");
  }, [draft]);
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
  const context = useMemo<ChatProviderContext>(
    () => ({
      online,
      typing,
      messages,
      draft,
      sendMessage,
      deleteMessage: requestDeleteMessage,
      updateDraft: setDraft,
    }),
    [online, typing, messages, draft, sendMessage, deleteMessage]
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

  useEffect(() => {
    if (focused) {
      setNotifications(0);
    }
  }, [focused]);

  useEffect(() => {
    const title = document.getElementsByTagName("title")[0];
    const favicon = document.getElementById("favicon") as HTMLLinkElement;
    const escape = (window as any).escapeHTML;
    const alertedWhileAway = notifications > 0 && !focused;
    const pathIcon = alertedWhileAway ? "alert" : "icon";

    favicon.href = escape(`/assets/images/${siteName}/${pathIcon}.webp?v=3`);
    title.innerHTML = alertedWhileAway ? `[+${notifications}] Chat` : "Chat";
  }, [notifications, focused]);

  return (
    <ChatContext.Provider value={context}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const value = useContext(ChatContext);
  return value;
}
