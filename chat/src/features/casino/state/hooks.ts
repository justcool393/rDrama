import { useMemo } from "react";
import { IconType } from "react-icons";
import {
  GiCardAceSpades,
  GiCartwheel,
  GiHorseHead,
  GiHouse,
  GiLever,
} from "react-icons/gi";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { capitalize, formatMessageGroups } from "../../../helpers";
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

export function useMessageReactions(
  useMessageHook: () => ProcessedMessageEntity[]
) {
  const messages = useMessageHook();
  const reactionLookup = useReactionLookup();
  const getMessageReactions = (message: ProcessedMessageEntity) => {
    const messageReactionData = reactionLookup[message.id];

    if (messageReactionData) {
      const { user_ids, reactions } = messageReactionData;
      const emojis = Object.values(reactions).reduce((prev, next) => {
        if (!prev[next]) {
          prev[next] = [];
        }

        return prev;
      }, {} as Record<string, string[]>);

      for (const userId of user_ids) {
        const emoji = reactions[userId];
        emojis[emoji].push(userId);
      }

      return Object.entries(emojis).map(([emoji, userIds]) => ({
        reaction: emoji,
        user_ids: userIds,
      }));
    }

    return [];
  };

  return messages.map((message) => ({
    ...message,
    reactions: getMessageReactions(message),
  }));
}

export function usePublicMessages(): ProcessedMessageEntity[] {
  const { censored } = useRootContext();

  return useCasinoSelector((state) =>
    state.message.all
      .map((messageId) => state.message.by_id[messageId])
      .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp)
      .map((message) => ({
        ...message,
        reactions: [],
        content: censored
          ? message.content.html_censored
          : message.content.html,
      }))
  );
}

export function useConversationMessages(): ProcessedMessageEntity[] {
  const { id, censored } = useRootContext();
  const { recipient } = useCasino();
  const conversation = useCasinoSelector((state) => {
    const conversationKey = [id, recipient].sort().join("#");
    return state.conversation.by_id[conversationKey];
  });

  if (conversation) {
    return conversation.messages.all
      .map((messageId) => conversation.messages.by_id[messageId])
      .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp)
      .map((message) => ({
        ...message,
        reactions: [],
        content: censored
          ? message.content.html_censored
          : message.content.html,
      }));
  } else {
    return [];
  }
}

export function useChatMessages() {
  const { recipient } = useCasino();
  const users = useCasinoUserLookup();
  const publicMessages = useMessageReactions(usePublicMessages);
  const conversationMessages = useMessageReactions(useConversationMessages);
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

export function useCasinoGameNames() {
  return useCasinoSelector((state) => state.game.all);
}

export function useCasinoGames() {
  return useCasinoSelector((state) =>
    state.game.all.map((id) => state.game.by_id[id])
  );
}

export function useActiveCasinoGame() {
  const { id } = useRootContext();
  const games = useCasinoGames();

  return games.find((game) => game.user_ids.includes(id)) || null;
}

export function useUserGameSession(game: CasinoGame) {
  const { id } = useRootContext();

  return (
    useCasinoSelector((state) => state.session.by_id[`${id}#${game}`]) || null
  );
}

export function useActiveUserGameSession() {
  const activeGame = useActiveCasinoGame();
  const activeSession = useUserGameSession(activeGame?.name as CasinoGame);

  return activeSession;
}

export function useOnlineUsers() {
  return useCasinoSelector((state) =>
    state.user.all
      .map((id) => state.user.by_id[id])
      .filter((user) => user.online)
  );
}

export function useOnlineUserCount() {
  return useOnlineUsers().length;
}

export function useGameIcons(): Record<CasinoGame, IconType> {
  return {
    blackjack: GiCardAceSpades,
    crossing: GiHouse,
    racing: GiHorseHead,
    roulette: GiCartwheel,
    slots: GiLever,
  };
}

export function useGameActions() {
  const { userPlayedSlots, userPlayedBlackjack } = useCasino();
  const session = useActiveUserGameSession();

  if (!session) {
    return [];
  }

  const game = session?.game;

  if (game === "slots") {
    const state = session?.game_state as SlotsGameState;

    return [
      {
        key: "pull",
        icon: GiLever,
        primary: true,
        title: "Pull",
        onClick: userPlayedSlots,
        disabled: state.game_status === "started",
      },
    ];
  } else if (game === "blackjack") {
    const state = session?.game_state as BlackjackGameState;

    return state.actions.map((action) => ({
      key: action,
      icon: () => null,
      primary: false,
      title: action
        .split("_")
        .map((word) => capitalize(word.toLowerCase()))
        .join(" "),
      onClick: () => userPlayedBlackjack(action),
    }));
  } else {
    return [];
  }
}

export function useReactionLookup() {
  return useCasinoSelector((state) => state.reaction.by_id);
}
