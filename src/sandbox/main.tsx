import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { KeyDemo } from "./KeyDemo";

const rootElement = document.getElementById("key-demo-root");
if (!rootElement) {
  throw new Error("Expected #key-demo-root to exist in key-demo.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <KeyDemo />
  </StrictMode>
);
