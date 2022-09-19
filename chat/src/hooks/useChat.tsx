import React, { useContext } from "react";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

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
  const socket = useRef<null | Socket>(null);
  const [online, setOnline] = useState<string[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatSpeakResponse[]>([]);
  const [draft, setDraft] = useState("");
  const addMessage = useCallback(
    (message: ChatSpeakResponse) => setMessages((prev) => prev.concat(message)),
    []
  );
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

  // Initialize the socket.
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
    <ChatContext.Provider value={context}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const value = useContext(ChatContext);
  return value;
}
