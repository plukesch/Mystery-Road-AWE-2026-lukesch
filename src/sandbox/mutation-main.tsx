import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MutationDemo } from "./MutationDemo";

const rootElement = document.getElementById("mutation-demo-root");
if (!rootElement) {
  throw new Error("Expected #mutation-demo-root to exist in mutation-demo.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <MutationDemo />
  </StrictMode>
);
