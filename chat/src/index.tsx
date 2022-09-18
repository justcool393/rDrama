import React from "react";
import { createRoot } from "react-dom/client";
import { Chat } from "./components";

const root = createRoot(document.getElementById("root"))

root.render(<Chat />);
