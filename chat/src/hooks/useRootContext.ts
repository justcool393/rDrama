import { useEffect, useState } from "react";

type ChatMode = "chat" | "casino";

export function useRootContext() {
  const [
    {
      mode,
      admin,
      id,
      username,
      censored,
      themeColor,
      siteName,
      nameColor,
      avatar,
      hat,
    },
    setContext,
  ] = useState({
    mode: null,
    id: "",
    username: "",
    admin: false,
    censored: true,
    themeColor: "#ff66ac",
    siteName: "",
    nameColor: "",
    avatar: "",
    hat: "",
  });

  useEffect(() => {
    const root = document.getElementById("root");

    setContext({
      mode: root.dataset.mode?.toLowerCase() as ChatMode,
      id: root.dataset.id,
      username: root.dataset.username,
      admin: root.dataset.admin === "True",
      censored: root.dataset.censored === "True",
      themeColor: root.dataset.themecolor,
      siteName: root.dataset.sitename,
      nameColor: root.dataset.namecolor,
      avatar: root.dataset.avatar,
      hat: root.dataset.hat,
    });
  }, []);

  return {
    mode,
    id,
    admin,
    username,
    censored,
    themeColor,
    siteName,
    nameColor,
    avatar,
    hat,
  };
}
