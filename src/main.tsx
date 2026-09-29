// ---------------------------------------------------------------------
// REACT-ENTRY-POINT (ue3 demo 6)
// wird von react.html geladen: <script type="module" src="/src/main.tsx">
// spiegelbild von js/main.ts (dem vanilla-einstiegspunkt), aber komplett
// eigenstaendig - importiert nichts aus js/, teilt sich nichts mit main.ts.
// ---------------------------------------------------------------------
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// StrictMode: ruft App() in der entwicklung absichtlich zweimal auf -
// deckt genau die seiteneffekt-im-render-koerper-probleme auf, die in
// UE3_THEORIE_ANTWORTEN demo 5 F3 besprochen wurden.
const rootElement = document.getElementById("react-root");
if (!rootElement) {
  throw new Error("Expected #react-root to exist in react.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
