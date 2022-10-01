import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { Button, Input, Tooltip } from "antd";
import React from "react";
import { useCasino } from "../hooks";

const { TextArea } = Input;

export function TextBox() {
  const { draft, setDraft, userSentMessage } = useCasino();

  return (
    <div style={{ display: "flex", alignItems: "center", paddingBottom: "2rem" }}>
      <Tooltip title="emojis">
        <Button type="primary" shape="circle" icon={<SmileOutlined />} />
      </Tooltip>
      <TextArea
        allowClear={true}
        showCount={true}
        maxLength={1000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        style={{ height: 60, flex: 1, margin: "0 2rem" }}
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
