import throttle from "lodash.throttle";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { useDrop } from "react-dnd";
import cx from "classnames"
import { useDrawer, useChat } from "../../hooks";
import { ChatHeading } from "./ChatHeading";
import { ChatMessageList } from "./ChatMessage";
import { QuotedMessage } from "./QuotedMessage";
import { UserInput } from "./UserInput";
import { UserList } from "./UserList";
import { UsersTyping } from "./UsersTyping";

const SCROLL_CANCEL_THRESHOLD = 500;
const WINDOW_RESIZE_THROTTLE_WAIT = 250;

export function Chat() {
    const [_, dropRef] = useDrop({
      accept: "drawer",
    });
    const { open, config } = useDrawer();
    const contentWrapper = useRef<HTMLDivElement>(null);
    const initiallyScrolledDown = useRef(false);
    const { messages, quote, userToDm, updateUserToDm } = useChat();
    const [focused, setFocused] = useState(false);
    const toggleFocus = useCallback(() => {
      setTimeout(() => {
        setFocused((prev) => !prev);
      }, 0);
    }, []);
  
    // See: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    useEffect(() => {
      const updateViewportHeightUnit = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      };
      const throttledResizeHandler = throttle(
        updateViewportHeightUnit,
        WINDOW_RESIZE_THROTTLE_WAIT
      );
  
      throttledResizeHandler();
  
      window.addEventListener("resize", throttledResizeHandler);
  
      return () => {
        window.removeEventListener("resize", throttledResizeHandler);
      };
    }, []);
  
    useEffect(() => {
      if (messages.length > 0) {
        if (initiallyScrolledDown.current) {
          /* We only want to scroll back down on a new message
           if the user is not scrolled up looking at previous messages. */
          const scrollableDistance =
            contentWrapper.current.scrollHeight -
            contentWrapper.current.clientHeight;
          const scrolledDistance = contentWrapper.current.scrollTop;
          const hasScrolledEnough =
            scrollableDistance - scrolledDistance >= SCROLL_CANCEL_THRESHOLD;
  
          if (hasScrolledEnough) {
            return;
          }
        } else {
          // Always scroll to the bottom on first load.
          initiallyScrolledDown.current = true;
        }
  
        contentWrapper.current.scrollTop = contentWrapper.current.scrollHeight;
      }
    }, [messages]);
  
    useEffect(() => {
      if (!open) {
        // Scroll to the bottom after any drawer closes.
        contentWrapper.current.scrollTop = contentWrapper.current.scrollHeight;
      }
    }, [open]);
  
    return (
      <div className="App" ref={dropRef}>
        <div className="App-wrapper">
          <div className="App-heading">
            <small>v{process.env.VERSION}</small>
            <ChatHeading />
          </div>
          <div className="App-center">
            <div
              className={cx("App-content", {
                "App-content__reduced": quote || focused,
              })}
              ref={contentWrapper}
            >
              {open ? (
                <div className="App-drawer">{config.content}</div>
              ) : (
                <ChatMessageList />
              )}
            </div>
            <div className="App-side">
              <UserList />
            </div>
          </div>
          <div className="App-bottom-wrapper">
            <div className="App-bottom">
              {quote && (
                <div className="App-bottom-extra">
                  <QuotedMessage />
                </div>
              )}
              {userToDm && (
                <div
                  className="App-bottom-extra text-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <em>Directly messaging @{userToDm.username}</em>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => updateUserToDm(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <UserInput
                large={focused}
                onFocus={toggleFocus}
                onBlur={toggleFocus}
              />
              <UsersTyping />
            </div>
            <div className="App-bottom-dummy" />
          </div>
        </div>
      </div>
    );
  }
  