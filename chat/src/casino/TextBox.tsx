import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { Button, Input, Tooltip } from "antd";
import React from "react";
import { useCasino } from "../hooks";

const TEXTAREA_ROW_COUNT = 3;
const TEXTAREA_CHARACTER_LIMIT = 1000;

const { TextArea } = Input;

export function TextBox() {
  const { draft, setDraft, userSentMessage } = useCasino();

  return (
    <div
      style={{ display: "flex", alignItems: "center", paddingBottom: "2rem" }}
    >
      <Tooltip title="emojis">
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
        onPressEnter={userSentMessage}
        style={{
          flex: 1,
          margin: "0 2rem",
        }}
      />
      <Tooltip title="send">
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          onClick={userSentMessage}
        />
      </Tooltip>
    </div>
  );
}
