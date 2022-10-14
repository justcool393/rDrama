import React, { useEffect, useMemo, useRef } from "react";
import { Button, Divider, Input, Space, Tooltip } from "antd";
import { BsEmojiSmileFill } from "react-icons/bs";
import { FiSend } from "react-icons/fi";
import { useCasino } from "../useCasino";

const TEXTAREA_ROW_COUNT = 3;
const TEXTAREA_CHARACTER_LIMIT = 1000;

const { TextArea } = Input;

export function TextBox() {
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);
  const isFocused = useRef(false);
  const {
    draft,
    recipient,
    editing,
    setDraft,
    setEditing,
    userSentMessage,
    userConversed,
  } = useCasino();
  const handleSend = useMemo(
    () => (recipient ? userConversed : userSentMessage),
    [recipient, userConversed, userSentMessage]
  );

  // Listen for changes from the Emoji Modal and reflect them in draft
  useEffect(() => {
    const handleEmojiInsert = (event: CustomEvent<{ emoji: string }>) => {
      if (isFocused.current) {
        setDraft((prev) => `${prev} ${event.detail.emoji} `);
      }
    };

    document.addEventListener("emojiInserted", handleEmojiInsert);

    return () => {
      document.removeEventListener("emojiInserted", handleEmojiInsert);
    };
  }, []);

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
            <Button
              type="text"
              onClick={() => {
                setEditing(null);
                setDraft("");
              }}
            >
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
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={handleSend}
          style={{
            flex: 1,
          }}
          bordered={false}
          id="TextBox"
          onFocus={() => (isFocused.current = true)}
          onBlur={() => (isFocused.current = false)}
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
