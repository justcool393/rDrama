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