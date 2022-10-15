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
import { Alert, Button, Empty, Modal, message } from "antd";
import { io, Socket } from "socket.io-client";
import {
  CasinoHandlers,
  useCasinoDispatch,
  initialStateProvided,
  conversationUpdated,
  feedUpdated,
  gameUpdated,
  gamesUpdated,
  leaderboardUpdated,
  messageUpdated,
  messageDeleted,
  sessionUpdated,
  userUpdated,
  reactionUpdated,
} from "./state";

export const MINIMUM_WAGER = 5;
export const JOINED_AGAIN_EMPTY_IMAGE_URL = "/e/marseyrain.webp";

interface CasinoProviderContext {
  wager: number;
  currency: CasinoCurrency;
  draft: string;
  recipient: null | string;
  editing: null | string;
  reacting: boolean;
  setWager: React.Dispatch<React.SetStateAction<number>>;
  setCurrency: React.Dispatch<React.SetStateAction<CasinoCurrency>>;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  setRecipient: React.Dispatch<React.SetStateAction<null | string>>;
  setEditing: React.Dispatch<React.SetStateAction<null | string>>;
  setReacting: React.Dispatch<React.SetStateAction<boolean>>;
  userKickedOwnClient(): void;
  userSentMessage(): void;
  userReactedToMessage(messageId: string, reaction: string): void;
  userDeletedMessage(messageId: string): void;
  userConversed(): void;
  userStartedGame(game: CasinoGame): void;
  userQuitGame(): void;
  userPlayedSlots(): void;
  userPlayedRoulette(bet: RouletteBet, which: string): void;
  userPlayedBlackjack(action: BlackjackAction): void;
  userPlayedRacing(kind: RacingBet, selection: string[]): void;
}

const CasinoContext = createContext<CasinoProviderContext>({
  wager: MINIMUM_WAGER,
  currency: "coins",
  draft: "",
  recipient: null,
  editing: null,
  reacting: false,
  setWager() {},
  setCurrency() {},
  setDraft() {},
  setRecipient() {},
  setEditing() {},
  setReacting() {},
  userKickedOwnClient() {},
  userSentMessage() {},
  userReactedToMessage() {},
  userDeletedMessage() {},
  userConversed() {},
  userStartedGame() {},
  userQuitGame() {},
  userPlayedSlots() {},
  userPlayedRoulette() {},
  userPlayedBlackjack() {},
  userPlayedRacing() {},
});

export function CasinoProvider({ children }: PropsWithChildren) {
  const socket = useRef<null | Socket>(null);
  const [joinedAgain, setJoinedAgain] = useState(false);
  const [currency, setCurrency] = useState<CasinoCurrency>("coins");
  const [wager, setWager] = useState(MINIMUM_WAGER);
  const [draft, setDraft] = useState("");
  const [recipient, setRecipient] = useState<null | string>(null);
  const [editing, setEditing] = useState<null | string>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reacting, setReacting] = useState(false);
  const dispatch = useCasinoDispatch();

  // Callbacks
  // - Internal
  const finishConfirmingDelete = useCallback(() => {
    setConfirmingDelete(false);
    setEditing(null);
    setDraft("");
  }, []);

  // - Socket Event Wrappers
  const userKickedOwnClient = useCallback(() => {
    socket.current?.emit(CasinoHandlers.UserKickedOwnClient);
  }, []);

  const userReactedToMessage = useCallback(
    (messageId: string, reaction: string) => {
      socket.current?.emit(CasinoHandlers.UserReactedToMessage, {
        id: messageId,
        reaction,
      });

      setReacting(false);
    },
    []
  );

  const userSentMessage = useCallback(() => {
    if (editing) {
      if (draft.length === 0) {
        setConfirmingDelete(true);
      } else {
        socket.current?.emit(CasinoHandlers.UserEditedMessage, {
          id: editing,
          content: draft,
        });
      }
    } else {
      socket.current?.emit(CasinoHandlers.UserSentMessage, {
        message: draft,
      });
    }

    setTimeout(() => setDraft(""), 0);
  }, [draft, editing]);

  const userDeletedMessage = useCallback(
    (messageId: string) =>
      socket.current?.emit(CasinoHandlers.UserDeletedMessage, {
        id: messageId,
      }),
    []
  );

  const userConversed = useCallback(() => {
    if (recipient) {
      socket.current?.emit(CasinoHandlers.UserConversed, {
        message: draft,
        recipient,
      });

      setTimeout(() => setDraft(""), 0);
    }
  }, [draft, recipient]);

  const userStartedGame = useCallback((game: CasinoGame) => {
    socket.current?.emit(CasinoHandlers.UserStartedGame, { game });
  }, []);

  const userQuitGame = useCallback(() => {
    socket.current?.emit(CasinoHandlers.UserQuitGame);
  }, []);

  const userPlayedSlots = useCallback(() => {
    socket.current?.emit(CasinoHandlers.UserPlayedSlots, {
      currency,
      wager,
    });
  }, [currency, wager]);

  const userPlayedRoulette = useCallback(
    (bet: RouletteBet, which: string) => {
      socket.current?.emit(CasinoHandlers.UserPlayedRoulette, {
        bet,
        which,
        currency,
        wager,
      });
    },
    [currency, wager]
  );

  const userPlayedBlackjack = useCallback(
    (action: BlackjackAction) => {
      const payload =
        action === "DEAL" ? { action, currency, wager } : { action };

      socket.current?.emit(CasinoHandlers.UserPlayedBlackjack, payload);
    },
    [currency, wager]
  );

  const userPlayedRacing = useCallback(
    (kind: RacingBet, selection: string[]) => {
      socket.current?.emit(CasinoHandlers.UserPlayedRacing, {
        kind,
        selection,
        currency,
        wager,
      });
    },
    [currency, wager]
  );

  // Memoized Value
  const value = useMemo<CasinoProviderContext>(
    () => ({
      wager,
      currency,
      recipient,
      draft,
      editing,
      reacting,
      setWager,
      setCurrency,
      setDraft,
      setRecipient,
      setEditing,
      setReacting,
      userKickedOwnClient,
      userSentMessage,
      userReactedToMessage,
      userDeletedMessage,
      userConversed,
      userStartedGame,
      userQuitGame,
      userPlayedSlots,
      userPlayedRoulette,
      userPlayedBlackjack,
      userPlayedRacing,
    }),
    [
      wager,
      currency,
      recipient,
      draft,
      editing,
      reacting,
      userKickedOwnClient,
      userSentMessage,
      userReactedToMessage,
      userDeletedMessage,
      userConversed,
      userStartedGame,
      userQuitGame,
      userPlayedSlots,
      userPlayedRoulette,
      userPlayedBlackjack,
      userPlayedRacing,
    ]
  );

  // Effects
  useEffect(() => {
    if (!socket.current) {
      socket.current = io("/casino");

      socket.current
        .on(CasinoHandlers.ErrorOccurred, (error) => {
          console.error(`Error Occurred: ${error}`);
          setTimeout(() => message.error(error), 0);
        })
        .on(CasinoHandlers.ConfirmationReceived, (confirmation) => {
          console.info(`Confirmation Received: ${confirmation}`);
          setTimeout(() => message.success(confirmation), 0);
        })
        .on(CasinoHandlers.Refresh, () =>
          setTimeout(() => window.location.reload(), 2000)
        )
        .on(CasinoHandlers.JoinedAgain, () => setJoinedAgain(true))
        .on(CasinoHandlers.InitialStateProvided, (state: CasinoState) =>
          dispatch(initialStateProvided(state))
        )
        .on(
          CasinoHandlers.ConversationUpdated,
          (conversation: ConversationEntity) =>
            dispatch(conversationUpdated({ conversation }))
        )
        .on(CasinoHandlers.ReactionUpdated, (reaction: ReactionEntity) =>
          dispatch(reactionUpdated({ reaction }))
        )
        .on(CasinoHandlers.FeedUpdated, (feed: FeedEntity) =>
          dispatch(feedUpdated({ feed }))
        )
        .on(CasinoHandlers.GameUpdated, (game: PossibleGameEntity) =>
          dispatch(gameUpdated({ game }))
        )
        .on(
          CasinoHandlers.GamesUpdated,
          (games: Normalized<PossibleGameEntity>) =>
            dispatch(gamesUpdated({ games }))
        )
        .on(
          CasinoHandlers.LeaderboardUpdated,
          (leaderboard: LeaderboardEntity) =>
            dispatch(leaderboardUpdated({ leaderboard }))
        )
        .on(CasinoHandlers.MessageUpdated, (message: MessageEntity) =>
          dispatch(messageUpdated({ message }))
        )
        .on(CasinoHandlers.MessageDeleted, (message_id: string) =>
          dispatch(messageDeleted({ message_id }))
        )
        .on(CasinoHandlers.SessionUpdated, (session: SessionEntity) =>
          dispatch(sessionUpdated({ session }))
        )
        .on(CasinoHandlers.UserUpdated, (user: UserEntity) =>
          dispatch(userUpdated({ user }))
        );
    }
  });

  // When the "Confirm Delete?" modal appear, focus the Yep button.
  useEffect(() => {
    if (confirmingDelete) {
      setTimeout(() => {
        const yep = document.getElementById("confirmDeleteYep");
        yep?.focus();
      }, 0);
    } else {
      const input = document.getElementById("TextBox");
      input?.focus();
    }
  }, [confirmingDelete]);

  if (joinedAgain) {
    return (
      <div
        style={{
          position: "fixed",
          top: 90,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty
          description={
            <Alert
              type="error"
              message="You are already signed into the casino from somewhere else."
            />
          }
          image={JOINED_AGAIN_EMPTY_IMAGE_URL}
        >
          <Button type="primary" onClick={userKickedOwnClient}>
            I want to sign in here
          </Button>
        </Empty>
      </div>
    );
  } else {
    return (
      <>
        <CasinoContext.Provider value={value}>
          {children}
        </CasinoContext.Provider>
        <Modal
          title="Really delete?"
          open={confirmingDelete}
          onOk={() => {
            userDeletedMessage(editing);
            finishConfirmingDelete();
          }}
          okButtonProps={{
            id: "confirmDeleteYep",
          }}
          onCancel={finishConfirmingDelete}
          okText="Yep"
          cancelText="Nope"
        >
          <p>Do you want to delete this message?</p>
        </Modal>
      </>
    );
  }
}

export function useCasino() {
  return useContext(CasinoContext);
}
