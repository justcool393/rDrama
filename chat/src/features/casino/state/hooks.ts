import cloneDeep from "lodash.clonedeep";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./store";

export const useCasinoDispatch: () => AppDispatch = useDispatch;

export const useCasinoSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useCasinoUserLookup() {
  return useCasinoSelector((state) => state.user.by_id);
}

export function useChatMessageGroups() {
  const userLookup = useCasinoUserLookup();
  const messages = useCasinoSelector((state) =>
    state.message.all
      .map((messageId) => state.message.by_id[messageId])
      .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp)
  );
  const chatMessageGroups = [] as Array<{
    author: UserEntity;
    messages: MessageEntity[];
  }>;

  if (messages.length === 0) {
    return chatMessageGroups;
  } else {
    const chatMessageGroup = {
      author: userLookup[messages[0].user_id],
      messages: [] as MessageEntity[],
    };

    for (const message of messages) {
      if (message.user_id === chatMessageGroup.author.id) {
        // Same user: group in with previous messages.
        chatMessageGroup.messages.push(message);
      } else {
        // New user: Finish off the previous batch and start a new one.
        chatMessageGroups.push(cloneDeep(chatMessageGroup));
        chatMessageGroup.author = userLookup[message.user_id];
        chatMessageGroup.messages = [message];
      }
    }

    chatMessageGroups.push(cloneDeep(chatMessageGroup));

    return chatMessageGroups;
  }
}
