import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { EmojiPickerButton } from "./EmojiPickerButton";
import "./UserInput.css";

export function UserInput() {
  const form = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  const handleType = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  }, []);
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      console.log("Said", text);
      setText("");
    },
    [text]
  );

  return (
    <form ref={form} className="UserInput" onSubmit={handleSubmit}>
      <EmojiPickerButton />
      <textarea
        id="builtChatInput"
        className="form-control"
        minLength={1}
        maxLength={1000}
        rows={1}
        onChange={handleType}
        placeholder="Message"
        autoComplete="off"
        autoFocus={true}
        value={text}
      ></textarea>
      <button type="submit" className="btn btn-primary">
        Send
      </button>
    </form>
  );
}
