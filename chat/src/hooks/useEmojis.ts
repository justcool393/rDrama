import { useEffect, useState } from "react";

export function useEmojis() {
  const [error, setError] = useState("");
  const [emojis, setEmojis] = useState([]);

  useEffect(() => {
    fetch("/marsey_list.json")
      .then((res) => res.json())
      .then(setEmojis)
      .catch(setError);
  }, []);

  return [error, emojis];
}
