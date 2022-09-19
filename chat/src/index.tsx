import React from "react";
import { createRoot } from "react-dom/client";
import { Chat } from "./features";

const root = createRoot(document.getElementById("root"))

root.render(<Chat />);
