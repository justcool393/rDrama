import React, { useMemo } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { FiSend } from "react-icons/fi";
import { Button, Input, Space, Tooltip } from "antd";
import { useCasino } from "../useCasino";

const TEXTAREA_ROW_COUNT = 3;
const TEXTAREA_CHARACTER_LIMIT = 1000;

const { TextArea } = Input;

export function TextBox() {
  const { draft, recipient, setDraft, userSentMessage, userConversed } =
    useCasino();
  const handleSend = useMemo(
    () => (recipient ? userConversed : userSentMessage),
    [recipient, userConversed, userSentMessage]
  );

  return (
    <div style={{ display: "flex", alignItems: "center", padding: "1rem" }}>
      <TextArea
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
  );
}
