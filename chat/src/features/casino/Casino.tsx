import React, { useCallback, useEffect, useState } from "react";
import { Layout, Modal, message, notification } from "antd";
import {
  CasinoHeader,
  CasinoFooter,
  ChatMessageBox,
  GameModal,
  UserDrawer,
} from "./components";
import {
  useActiveUserGameSession,
  useActiveConfirmingDelete,
  socketActions,
  useActiveEditing,
  useCasinoDispatch,
  confirmedDeleteMessage,
  userLoaded,
} from "./state";
import { useRootContext } from "../../hooks";
import "antd/dist/antd.css";
import "antd/dist/antd.dark.css";
import "./Casino.css";

const MESSAGE_TOP = 100;
const MESSAGE_DURATION = 2;

const { Content } = Layout;

export function Casino() {
  const user = useRootContext();
  const dispatch = useCasinoDispatch();
  const session = useActiveUserGameSession();
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const openUserDrawer = useCallback(() => setUserDrawerOpen(true), []);
  const closeUserDrawer = useCallback(() => setUserDrawerOpen(false), []);
  const confirmingDelete = useActiveConfirmingDelete();
  const editing = useActiveEditing();

  useEffect(() => {
    message.config({
      duration: MESSAGE_DURATION,
      top: MESSAGE_TOP,
    });
  }, []);

  useEffect(() => {
    notification.config({
      top: 120,
    });
  }, []);

  // Initially load the user.
  useEffect(() => {
    dispatch(userLoaded(user));
  }, [user, dispatch]);

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

  return (
    <>
      <Layout style={{ minHeight: "calc(100vh - 66px)" }}>
        <CasinoHeader
          showingUserDrawer={userDrawerOpen}
          onOpenUserDrawer={openUserDrawer}
          onCloseUserDrawer={closeUserDrawer}
        />
        <Content
          style={{
            padding: 4,
            marginTop: 60,
            marginBottom: 170,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ChatMessageBox />
          {userDrawerOpen && <UserDrawer onClose={closeUserDrawer} />}
          {session && <GameModal />}
        </Content>
        <CasinoFooter />
      </Layout>
      <Modal
        title="Really delete?"
        open={confirmingDelete}
        onOk={() => {
          socketActions.userDeletedMessage(editing);
          dispatch(confirmedDeleteMessage());
        }}
        okButtonProps={{
          id: "confirmDeleteYep",
        }}
        onCancel={() => dispatch(confirmedDeleteMessage())}
        okText="Yep"
        cancelText="Nope"
      >
        <p>Do you want to delete this message?</p>
      </Modal>
    </>
  );
}
