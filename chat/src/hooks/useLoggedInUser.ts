import { useEffect, useState } from "react";

export function useLoggedInUser() {
  const [{ admin, censored }, setContext] = useState({
    admin: false,
    censored: true,
  });

  useEffect(() => {
    const root = document.getElementById("root");
    
    setContext({
      admin: root.dataset.admin === "True",
      censored: root.dataset.censored === "True",
    });
  }, []);

  return { admin, censored };
}
