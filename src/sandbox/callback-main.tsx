import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CallbackDemo } from "./CallbackDemo";

const rootElement = document.getElementById("callback-demo-root");
if (!rootElement) {
  throw new Error("Expected #callback-demo-root to exist in callback-demo.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <CallbackDemo />
  </StrictMode>
);
