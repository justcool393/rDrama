import React, { useCallback, useMemo } from "react";
import { useEmojis } from "../../../hooks";
import { FixedSizeList as List } from "react-window";
import "./EmojiDrawer.css";

const BASE_WIDTH = 60;
const PER_ROW = 7;

export function EmojiDrawer() {
  const [error, emojis] = useEmojis();
  const emojiRows = useMemo(() => {
    const classes = new Set();
    const tags = new Set();
    const rows = [];
    let tempRow = [];

    for (let i = 0; i < emojis.length; i++) {
      const emoji = emojis[i];

      if (emoji.class) {
        classes.add(emoji.class);
      }

      for (const tag of emoji.tags ?? []) {
        tags.add(tag);
      }

      tempRow.push(emoji.name);

      if (i % PER_ROW === 0) {
        rows.push([...tempRow]);
        tempRow = [];
      }
    }

    return rows;
  }, [emojis]);

  const Row = useCallback(
    ({ index, style }) => {
      return (
        <div>
          {emojiRows[index].map((marsey) => (
            <img
              key={marsey}
              width="60"
              src={`/e/${marsey}.webp`}
              alt={marsey}
            />
          ))}
        </div>
      );
    },
    [emojiRows]
  );

  return (
    <div className="EmojiDrawer sliding-in">
      <List
        width={BASE_WIDTH * PER_ROW}
        height={400}
        itemCount={emojiRows.length}
        itemSize={BASE_WIDTH}
      >
        {Row}
      </List>
    </div>
  );
}
