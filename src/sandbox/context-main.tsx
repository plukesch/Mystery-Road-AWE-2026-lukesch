import { createRoot } from "react-dom/client";
import { ContextDemo } from "./ContextDemo";

const rootElement = document.getElementById("context-demo-root");
if (!rootElement) {
  throw new Error("Expected #context-demo-root to exist in context-demo.html");
}

// bewusst OHNE <StrictMode>: die Demo zaehlt, wie oft eine Komponente gerendert
// wird. StrictMode ruft jede Komponente in der Entwicklung absichtlich zweimal
// auf und wuerde alle Zaehler verdoppeln.
createRoot(rootElement).render(<ContextDemo />);
