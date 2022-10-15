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
  sendMessage(message: string): void;
  reactToMessage(messageId: string, reaction: string): void;
  converse(message: string, recipient: string): void;
  playSlots(): void;
  playBlackjack(
    action: BlackjackAction,
    currency?: CasinoCurrency,
    wager?: number
  ): void;
  playRoulette(bet: RouletteBet, which: string): void;
  playRacing(
    kind: RacingBet,
    selection: string[],
    currency: CasinoCurrency,
    wager: number
  ): void;
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
  const handleUserSentMessage = useCallback(() => {
    if (editing) {
      if (draft.length === 0) {
        setConfirmingDelete(true);
      } else {
        // userEditedMessage(editing, draft)
      }
    } else {
      // userSentMessage(draft)
    }

    setTimeout(() => setDraft(""), 0);
  }, [draft, editing]);

  const handleUserReactedToMessage = useCallback(
    (messageId: string, reaction: string) => {
      setReacting(false);
      // userReactedToMessage(messageId: string, reaction: string)
    },
    [
      /* userReactedToMessage */
    ]
  );

  const handleUserConversed = useCallback(() => {
    setTimeout(() => setDraft(""), 0);
    // userConversed(draft, recipient)
  }, [draft, recipient]);

  const handleUserPlayedSlots = useCallback(() => {
    // userPlayedSlots(currency, wager)
  }, [currency, wager]);

  const handleUserPlayedBlackjack = useCallback(
    (action: BlackjackAction) => {
      // userPlayedBlackjack(action, currency, wager)
    },
    [currency, wager]
  );

  const handleUserPlayedRoulette = useCallback(
    (bet: RouletteBet, which: string) => {
      // userPlayedRoulette(bet, which, currency, wager)
    },
    [currency, wager]
  );

  const handleUserPlayedRacing = useCallback(
    (kind: RacingBet, selection: string[]) => {
      // userPlayedRacing(kind, selection, currency, wager)
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
    }),
    [wager, currency, recipient, draft, editing, reacting]
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
