import { Alert, Button, Modal, Space, Spin } from "antd";
import React, { useRef, useState } from "react";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";
import { Game } from "./Game";
import { Wager } from "../Wager";
import { useCasino } from "../useCasino";
import { capitalize } from "../../../helpers";

interface Props {
  session: SessionEntity;
}

export function DraggableModal({ session }: Props) {
  const [disabled, setDisabled] = useState(false);
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const draggleRef = useRef<HTMLDivElement>(null);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  return (
    <Modal
      title={
        <div
          style={{
            width: "100%",
            cursor: "move",
          }}
          onMouseOver={() => {
            if (disabled) {
              setDisabled(false);
            }
          }}
          onMouseOut={() => {
            setDisabled(true);
          }}
          // fix eslintjsx-a11y/mouse-events-have-key-events
          // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
          onFocus={() => {}}
          onBlur={() => {}}
          // end
        >
          {capitalize(session.game)}
        </div>
      }
      open={true}
      onOk={() => {}}
      onCancel={() => {}}
      mask={false}
      maskClosable={false}
      wrapClassName="no-pointer-events"
      footer={
        session.game_state.game_status === "started" ? (
          <Alert
            type="info"
            message={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Spin />
                <span>
                  {session.game_state.wager} {session.game_state.currency} are
                  at stake.
                </span>
              </div>
            }
          />
        ) : (
          <Wager />
        )
      }
      modalRender={(modal) => (
        <Draggable
          disabled={disabled}
          bounds={bounds}
          onStart={(event, uiData) => onStart(event, uiData)}
        >
          <div ref={draggleRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Game />
    </Modal>
  );
}
