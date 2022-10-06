import { useMemo } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { formatMessageGroups } from "../../../helpers";
import { useRootContext } from "../../../hooks";
import { useCasino } from "../useCasino";
import { AppDispatch, RootState } from "./store";

export const useCasinoDispatch: () => AppDispatch = useDispatch;

export const useCasinoSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useCasinoUserLookup() {
  return useCasinoSelector((state) => state.user.by_id);
}

export function useCasinoUser(userId: string) {
  const lookup = useCasinoUserLookup();
  return userId ? lookup[userId] : null;
}

export function usePublicMessages() {
  return useCasinoSelector((state) =>
    state.message.all
      .map((messageId) => state.message.by_id[messageId])
      .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp)
  );
}

export function useConversationMessages() {
  const { id } = useRootContext();
  const { recipient } = useCasino();
  const conversation = useCasinoSelector((state) => {
    const conversationKey = [id, recipient].sort().join("#");
    return state.conversation.by_id[conversationKey];
  });

  if (conversation) {
    return conversation.messages.all
      .map((messageId) => conversation.messages.by_id[messageId])
      .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp);
  } else {
    return [];
  }
}

export function useChatMessages() {
  const { recipient } = useCasino();
  const users = useCasinoUserLookup();
  const publicMessages = usePublicMessages();
  const conversationMessages = useConversationMessages();
  const messages = useMemo(
    () => (recipient ? conversationMessages : publicMessages),
    [recipient, publicMessages, conversationMessages]
  );

  return formatMessageGroups(users, messages);
}

export function useFeedItems() {
  return useCasinoSelector((state) =>
    state.feed.all.map((feedId) => state.feed.by_id[feedId])
  );
}
