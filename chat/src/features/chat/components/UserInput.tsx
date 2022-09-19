import React, {
  ChangeEvent,
  KeyboardEvent,
  FormEvent,
  PropsWithChildren,
  useCallback,
  useRef,
} from "react";
import { EmojiPickerButton } from "./EmojiPickerButton";
import "./UserInput.css";

interface UserInputProps extends PropsWithChildren {
  value: string;
  onChange(newValue: string): void;
  onSubmit(event?: FormEvent<HTMLFormElement>): void;
  onEmojiButtonClick(): void;
}

export function UserInput({
  value,
  children = null,
  onChange,
  onSubmit,
  onEmojiButtonClick
}: UserInputProps) {
  const form = useRef<HTMLFormElement>(null);
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    []
  );
  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter") {
        onSubmit();
      }
    },
    [onSubmit]
  );

  return (
    <form ref={form} className="UserInput" onSubmit={onSubmit}>
      <EmojiPickerButton onClick={onEmojiButtonClick} />
      <div>
        <textarea
          id="builtChatInput"
          className="form-control"
          minLength={1}
          maxLength={1000}
          rows={1}
          onChange={handleChange}
          onKeyUp={handleKeyUp}
          placeholder="Message"
          autoComplete="off"
          autoFocus={true}
          value={value}
        ></textarea>
        {children}
      </div>
      <button type="submit" className="btn btn-primary">
        Send
      </button>
    </form>
  );
}
