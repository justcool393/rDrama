import React from "react";
import { createRoot } from "react-dom/client";
import "antd/dist/antd.css";
import "antd/dist/antd.dark.css";
import { App } from "./App";

const root = createRoot(document.getElementById("root"));

root.render(<App />);
