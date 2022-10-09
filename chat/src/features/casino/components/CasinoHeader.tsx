import React from "react";
import { Button, Divider, Layout, Typography } from "antd";
import { CgClose } from "react-icons/cg";
import { FiUsers } from "react-icons/fi";
import { useOnlineUserCount } from "../state";

export function CasinoHeader({
  showingUserDrawer,
  onCloseUserDrawer,
  onOpenUserDrawer,
}: {
  showingUserDrawer: boolean;
  onOpenUserDrawer(): void;
  onCloseUserDrawer(): void;
}) {
  const onlineUserCount = useOnlineUserCount();

  return (
    <Layout.Header
      style={{
        position: "fixed",
        zIndex: 1,
        width: "100%",
        background: "var(--background)",
        borderTop: "1px solid var(--primary)",
        borderBottom: "1px solid var(--primary)",
        height: "unset",
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography.Title level={5} style={{ margin: 0 }}>
        Lobby
      </Typography.Title>
      {showingUserDrawer ? (
        <Button type="text" onClick={onCloseUserDrawer}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            <CgClose style={{ position: "relative", top: -2 }} />
            Close
          </Typography.Title>
        </Button>
      ) : (
        <Button type="text" onClick={onOpenUserDrawer}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {onlineUserCount}{" "}
            <FiUsers style={{ position: "relative", top: -2 }} />
          </Typography.Title>
        </Button>
      )}
    </Layout.Header>
  );
}
