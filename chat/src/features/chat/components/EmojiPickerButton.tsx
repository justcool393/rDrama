import React from "react";

interface EmojiPickerButtonProps {
  onClick(): void;
}

export function EmojiPickerButton({ onClick }: EmojiPickerButtonProps) {
  return (
    <button
      type="button"
      className="btn btn-secondary UserInput-emojiPickerButton"
      onClick={onClick}
    >
      <i className="fas fa-smile-beam"></i>
    </button>
  );
}
