import React, {
  ChangeEvent,
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
  onSubmit(event: FormEvent<HTMLFormElement>): void;
}

export function UserInput({
  value,
  children = null,
  onChange,
  onSubmit,
}: UserInputProps) {
  const form = useRef<HTMLFormElement>(null);
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    []
  );

  return (
    <form ref={form} className="UserInput" onSubmit={onSubmit}>
      <EmojiPickerButton />
      <div>
        <textarea
          id="builtChatInput"
          className="form-control"
          minLength={1}
          maxLength={1000}
          rows={1}
          onChange={handleChange}
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
