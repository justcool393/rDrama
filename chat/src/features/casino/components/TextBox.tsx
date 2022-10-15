import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Button, Divider, Input, Space, Tooltip } from "antd";
import { BsEmojiSmileFill } from "react-icons/bs";
import { FiSend } from "react-icons/fi";
import cloneDeep from "lodash.clonedeep";
import {
  useChatMessages,
  useActiveDraft,
  useActiveRecipient,
  useActiveEditing,
  useActiveReacting,
  userConversed,
  userSentMessage,
  beganEditing,
  useActiveUser,
  useCasinoDispatch,
  draftChanged,
  quitEditing,
} from "../state";

const TEXTAREA_ROW_COUNT = 3;
const TEXTAREA_CHARACTER_LIMIT = 1000;

const { TextArea } = Input;

export function TextBox() {
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);
  const dispatch = useCasinoDispatch();
  const { id } = useActiveUser();
  const draft = useActiveDraft();
  const recipient = useActiveRecipient();
  const editing = useActiveEditing();
  const reacting = useActiveReacting();
  const chatMessageGroups = useChatMessages();
  const handleSend = useCallback(() => {
    const action = recipient ? userConversed : userSentMessage;
    dispatch(action());
  }, [dispatch, recipient, userConversed, userSentMessage]);
  
  const handleEditLastMessage = useCallback(() => {
    for (const messageGroup of cloneDeep(chatMessageGroups).reverse()) {
      if (messageGroup.author.id === id) {
        const mostRecentMessage = messageGroup.messages.pop();

        dispatch(
          beganEditing({
            message: mostRecentMessage.original,
            editing: mostRecentMessage.id,
          })
        );

        setTimeout(() => {
          const messageLength = mostRecentMessage.original.length;
          const input = document.getElementById(
            "TextBox"
          ) as HTMLTextAreaElement;
          input.setSelectionRange(messageLength, messageLength);
        }, 0);
      }
    }
  }, [dispatch, chatMessageGroups]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "ArrowUp") {
        handleEditLastMessage();
      }
    },
    [handleEditLastMessage]
  );

  // Listen for changes from the Emoji Modal and reflect them in draft
  useEffect(() => {
    const handleEmojiInsert = (event: CustomEvent<{ emoji: string }>) => {
      if (!reacting) {
        dispatch(draftChanged(`${draft} ${event.detail.emoji} `));
      }
    };

    document.addEventListener("emojiInserted", handleEmojiInsert);

    return () => {
      document.removeEventListener("emojiInserted", handleEmojiInsert);
    };
  }, [dispatch, draft, reacting]);

  // When "Edit" is selected, re-focus the textbox.
  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
    }
  }, [editing]);

  return (
    <>
      {editing && (
        <>
          <Space size="small" style={{ padding: "0 1rem" }}>
            <em>Editing a message</em>
            <Button type="text" onClick={() => dispatch(quitEditing())}>
              Cancel
            </Button>
          </Space>
          <Divider style={{ margin: 0 }} />
        </>
      )}
      <div style={{ display: "flex", alignItems: "center", padding: "1rem" }}>
        <TextArea
          ref={textareaRef}
          autoSize={{
            minRows: TEXTAREA_ROW_COUNT,
            maxRows: TEXTAREA_ROW_COUNT,
          }}
          allowClear={true}
          showCount={true}
          maxLength={TEXTAREA_CHARACTER_LIMIT}
          value={draft}
          onChange={(e) => dispatch(draftChanged(e.target.value))}
          onPressEnter={handleSend}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
          }}
          bordered={false}
          id="TextBox"
        />
        <Space
          direction="vertical"
          align="center"
          style={{ marginLeft: "1rem", marginBottom: "1rem" }}
        >
          <Tooltip title="Send">
            <Button
              size="small"
              type="text"
              icon={<FiSend />}
              onClick={handleSend}
            />
          </Tooltip>
          <Tooltip title="Emojis">
            <Button
              size="small"
              type="text"
              data-bs-toggle="modal"
              data-bs-target="#emojiModal"
              data-bs-placement="bottom"
              icon={<BsEmojiSmileFill />}
              onClick={() => {
                const whatever = window as any;
                whatever.loadEmojis("TextBox");
              }}
            />
          </Tooltip>
        </Space>
      </div>
    </>
  );
}
