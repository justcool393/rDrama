import { useMemo } from "react";
import { IconType } from "react-icons";
import {
  GiCardAceSpades,
  GiCartwheel,
  GiHorseHead,
  GiHouse,
  GiLever,
} from "react-icons/gi";
import { shallowEqual, TypedUseSelectorHook, useSelector } from "react-redux";
import { capitalize, formatMessageGroups } from "../../../helpers";
import { RootState } from "./store";
import { useSocketActions } from "./socket";

const useCasinoSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useActiveRecipient() {
  return useCasinoSelector((state) => state.active.recipient);
}

export function useActiveEditing() {
  return useCasinoSelector((state) => state.active.editing);
}

export function useActiveDraft() {
  return useCasinoSelector((state) => state.active.draft);
}

export function useActiveReacting() {
  return useCasinoSelector((state) => state.active.reacting);
}

export function useActiveConversation() {
  const { id } = useActiveUser();
  const recipient = useActiveRecipient();

  return useCasinoSelector((state) => {
    const conversationKey = [id, recipient].sort().join("#");
    return state.conversation.by_id[conversationKey];
  }, shallowEqual);
}

export function useActiveUser() {
  return useCasinoSelector((state) => state.active.user, shallowEqual);
}

export function useCasinoUserLookup(): Record<string, UserEntity> {
  return useCasinoSelector((state) => state.user.by_id, shallowEqual);
}

export function useFeedItems() {
  return useCasinoSelector(
    (state) => state.feed.all.map((feedId) => state.feed.by_id[feedId]),
    shallowEqual
  );
}

export function useCasinoGameNames() {
  return useCasinoSelector((state) => state.game.all, shallowEqual);
}

export function useCasinoGames() {
  return useCasinoSelector(
    (state) => state.game.all.map((id) => state.game.by_id[id]),
    shallowEqual
  );
}

export function useActiveCasinoGame() {
  const { id } = useActiveUser();
  const games = useCasinoGames();
  const activeGame = useMemo(
    () => games.find((game) => game.user_ids.includes(id)) || null,
    [games]
  );

  return activeGame;
}

export function useUserGameSession(game: CasinoGame) {
  const { id } = useActiveUser();
  const userGameSession = useCasinoSelector(
    (state) => state.session.by_id[`${id}#${game}`] || null,
    shallowEqual
  );

  return userGameSession;
}

export function useActiveUserGameSession() {
  const activeGame = useActiveCasinoGame();
  const activeSession = useUserGameSession(activeGame?.name as CasinoGame);

  return activeSession;
}

export function useGameIcons(): Record<CasinoGame, IconType> {
  const icons = useMemo(
    () => ({
      blackjack: GiCardAceSpades,
      crossing: GiHouse,
      racing: GiHorseHead,
      roulette: GiCartwheel,
      slots: GiLever,
    }),
    []
  );

  return icons;
}

export function useOnlineUserCount() {
  const users = useOnlineUsers();
  const userCount = useMemo(() => users.length, [users]);

  return userCount;
}

export function useOnlineUsers() {
  return useCasinoSelector(
    (state) =>
      state.user.all
        .map((id) => state.user.by_id[id])
        .filter((user) => user.online),
    shallowEqual
  );
}

export function useCasinoUser(userId: string) {
  const lookup = useCasinoUserLookup();
  const user = useMemo(() => lookup[userId] ?? null, [lookup]);

  return user;
}

const getMessageReactions = (
  message: ProcessedMessageEntity,
  userLookup: Record<string, UserEntity>,
  reactionLookup: Record<string, ReactionEntity>
) => {
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
      users: userIds.map((id) => userLookup[id].account.username),
    }));
  }

  return [];
};

export function useMessageReactions(messages: ProcessedMessageEntity[]) {
  const userLookup = useCasinoUserLookup();
  const reactionLookup = useReactionLookup();
  const messagesWithReactions = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        reactions: getMessageReactions(message, userLookup, reactionLookup),
      })),
    [messages, userLookup, reactionLookup]
  );

  return messagesWithReactions;
}

export function useReactionLookup(): Record<string, ReactionEntity> {
  return useCasinoSelector((state) => state.reaction.by_id, shallowEqual);
}

export function usePublicMessages(): ProcessedMessageEntity[] {
  const { censored } = useActiveUser();

  return useCasinoSelector(
    (state) =>
      state.message.all
        .map((messageId) => state.message.by_id[messageId])
        .sort((messageA, messageB) => messageA.timestamp - messageB.timestamp)
        .map((message) => ({
          ...message,
          reactions: [],
          content: censored
            ? message.content.html_censored
            : message.content.html,
          original: censored
            ? message.content.text_censored
            : message.content.text,
        })),
    shallowEqual
  );
}

export function useConversationMessages(): ProcessedMessageEntity[] {
  const { censored } = useActiveUser();
  const conversation = useActiveConversation();

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
        original: censored
          ? message.content.text_censored
          : message.content.text,
      }));
  } else {
    return [];
  }
}

export function useChatMessages() {
  const recipient = useActiveRecipient();
  const users = useCasinoUserLookup();
  const publicMessages = usePublicMessages();
  const conversationMessages = useConversationMessages();
  const messagesToUse = useMemo(
    () => (recipient ? conversationMessages : publicMessages),
    [recipient, conversationMessages, publicMessages]
  );
  const messagesWithReactions = useMessageReactions(messagesToUse);
  const formattedMessageGroups = useMemo(
    () => formatMessageGroups(users, messagesWithReactions),
    [users, messagesWithReactions]
  );

  return formattedMessageGroups;
}

export function useGameActions() {
  const { userPlayedSlots, userPlayedBlackjack } = useSocketActions();
  const session = useActiveUserGameSession();
  const gameActions = useMemo(() => {
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
  }, [session, userPlayedSlots, userPlayedBlackjack]);

  return gameActions;
}

export function useActiveUserBalances() {
  const { id } = useActiveUser();
  const balances = useCasinoSelector(
    (state) =>
      state.user.by_id[id]?.balances ?? {
        coins: 0,
        procoins: 0,
      },
    shallowEqual
  );

  return balances;
}

export function useActiveBet() {
  return useCasinoSelector((state) => state.active.bet, shallowEqual);
}

export function useActiveConfirmingDelete() {
  return useCasinoSelector((state) => state.active.confirmingDeleteMessage);
}
