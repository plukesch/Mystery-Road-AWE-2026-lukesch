import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RenderEffectDemo } from "./RenderEffectDemo";

const rootElement = document.getElementById("render-effect-demo-root");
if (!rootElement) {
  throw new Error("Expected #render-effect-demo-root to exist in render-effect-demo.html");
}

// ?strict=0 mountet OHNE <StrictMode>. so sieht man, was die Seite in einer
// Produktions-Seite tun wuerde (dort gibt es kein doppeltes Rendern) - und dass
// der Fehler im Beispiel trotzdem da ist: StrictMode macht ihn nur SICHTBAR.
const strict = new URLSearchParams(location.search).get("strict") !== "0";

createRoot(rootElement).render(
  strict ? (
    <StrictMode>
      <RenderEffectDemo strict />
    </StrictMode>
  ) : (
    <RenderEffectDemo strict={false} />
  )
);
