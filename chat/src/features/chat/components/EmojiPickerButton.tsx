import React from "react";

export function EmojiPickerButton() {
  return (
    <>
      <button
        type="button"
        className="btn btn-secondary UserInput-emojiPickerButton"
        onClick={() => (window as any).loadEmojis("builtChatInput")}
      >
        <i className="fas fa-smile-beam"></i>
      </button>
    </>
  );
}
