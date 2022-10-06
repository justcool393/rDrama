import React, { useCallback } from "react";
import { BsEmojiSmileFill } from "react-icons/bs";
import { FiSend } from "react-icons/fi";
import { Button, Input, Tabs, Tooltip } from "antd";
import { useCasino } from "./useCasino";

const TEXTAREA_ROW_COUNT = 3;
const TEXTAREA_CHARACTER_LIMIT = 1000;

const { TextArea } = Input;

export function TextBox() {
  const { draft, recipient, setDraft, userSentMessage, userConversed } =
    useCasino();
  const handleSend = useCallback(
    () => (recipient ? userConversed : userSentMessage),
    [recipient, userConversed, userSentMessage]
  );

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
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
          margin: "0 2rem",
        }}
      />
      <Tabs
        tabPosition="right"
        items={[
          {
            key: "send",
            label: (
              <Tooltip title="Send">
                <Button
                  size="large"
                  type="ghost"
                  shape="circle"
                  icon={<FiSend />}
                  onClick={handleSend}
                />
              </Tooltip>
            ),
          },
          {
            key: "emojis",
            label: (
              <Tooltip title="Emojis">
                <Button
                  size="large"
                  type="ghost"
                  shape="circle"
                  icon={<BsEmojiSmileFill />}
                  onClick={handleSend}
                />
              </Tooltip>
            ),
          },
        ]}
      />
    </div>
  );
}
