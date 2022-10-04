import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { Button, Input, Tooltip } from "antd";
import React, { useMemo } from "react";
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
    <div
      style={{ display: "flex", alignItems: "center", paddingBottom: "2rem" }}
    >
      <Tooltip title="View emojis">
        <Button type="primary" shape="circle" icon={<SmileOutlined />} />
      </Tooltip>
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
      <Tooltip title="Send message">
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          onClick={handleSend}
        />
      </Tooltip>
    </div>
  );
}
