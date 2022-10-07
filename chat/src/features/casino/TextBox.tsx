import React, { useMemo } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { FiSend } from "react-icons/fi";
import { Button, Input, Space, Tooltip } from "antd";
import { useCasino } from "./useCasino";

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
          // margin: "0 2rem",
        }}
      />
      <Space
        direction="vertical"
        align="center"
        style={{ margin: "1rem", marginTop: 0 }}
      >
        <Tooltip title="Send">
          <Button
            size="large"
            type="ghost"
            shape="circle"
            icon={<FiSend />}
            onClick={handleSend}
          />
        </Tooltip>
        <Tooltip title="Emojis">
          <Button
            size="large"
            type="ghost"
            shape="circle"
            icon={<BsEmojiSmileFill />}
            onClick={handleSend}
          />
        </Tooltip>
      </Space>
    </div>
  );
}
