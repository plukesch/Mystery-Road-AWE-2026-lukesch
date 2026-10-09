// ---------------------------------------------------------------------
// REACT-ENTRY-POINT (ue3 demo 6, ue4 demo 8: router)
// wird von react.html geladen: <script type="module" src="/src/main.tsx">
// spiegelbild von js/main.ts (dem vanilla-einstiegspunkt), aber komplett
// eigenstaendig - importiert nichts aus js/, teilt sich nichts mit main.ts.
// ---------------------------------------------------------------------
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { App } from "./app/App";

// HashRouter statt BrowserRouter: die url steht nach dem "#"
// (react.html#/team/people). github pages ist ein statischer host ohne
// rewrite-regeln - bei echten pfaden (/team/people) waere ein reload ein 404,
// und die relativen asset-pfade (assets/..., data/...) wuerden brechen.
// siehe UE4_THEORIE_ANTWORTEN demo 8.
// StrictMode: ruft App() in der entwicklung absichtlich zweimal auf -
// deckt genau die seiteneffekt-im-render-koerper-probleme auf, die in
// UE3_THEORIE_ANTWORTEN demo 5 F3 besprochen wurden.
const rootElement = document.getElementById("react-root");
if (!rootElement) {
  throw new Error("Expected #react-root to exist in react.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
