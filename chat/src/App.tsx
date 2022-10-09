import React from "react";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Kasino, CasinoProvider, Chat, store } from "./features";
import { ChatProvider, DrawerProvider, useRootContext } from "./hooks";

export function App() {
  const { mode } = useRootContext();

  if (!mode) {
    return null;
  }

  return mode === "casino" ? (
    <Provider store={store}>
      <CasinoProvider>
        <Kasino />
      </CasinoProvider>
    </Provider>
  ) : (
    <DndProvider backend={HTML5Backend}>
      <DrawerProvider>
        <ChatProvider>
          <Chat />
        </ChatProvider>
      </DrawerProvider>
    </DndProvider>
  );
}
