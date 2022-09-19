import { useEffect, useState } from "react";

export function useLoggedInUser() {
  const [{ admin, id, censored }, setContext] = useState({
    id: "",
    admin: false,
    censored: true,
  });

  useEffect(() => {
    const root = document.getElementById("root");
    
    setContext({
      id: root.dataset.userId,
      admin: root.dataset.admin === "True",
      censored: root.dataset.censored === "True",
    });
  }, []);

  return { id, admin, censored };
}
