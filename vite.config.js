// demo 2 (ue2): minimal vite-config.
// braucht fast nichts, weil unser layout schon zu vite's zero-config-defaults passt:
// - index.html liegt im projekt-root      -> vite findet den einstiegspunkt automatisch
// - "public/" ist vite's default-name fuer statische dateien, die 1:1 (ungehasht,
//   unveraendert) unter derselben absoluten url ausgeliefert werden -> data/*.json
//   (per fetch() geladen) und assets/... (per <img src> aus JSON-daten gerendert)
//   passen genau in dieses schema, weil beides zur build-zeit NICHT statisch analysierbar
//   ist (fetch-pfad ist ein string, img-src wird erst zur laufzeit aus JSON gebaut).
// demo 9 (ue2): "base" ergaenzt - github pages liefert ein projekt (kein
// user/org-Pages-repo) nicht unter "/", sondern unter "/<repo-name>/" aus
// (https://plukesch.github.io/Mystery-Road-AWE-2026-lukesch/). ohne "base"
// wuerde vite alle asset-pfade im build relativ zu "/" schreiben -> 404 fuer
// js/css/bilder, sobald die seite unter dem repo-unterpfad laeuft. betrifft
// NICHT nur den build: vite haengt "base" auch beim dev-server/preview an
// die url an (z.b. localhost:5173/Mystery-Road-AWE-2026-lukesch/) - ein
// aufruf von localhost:5173/ alleine leitet automatisch dorthin um.
// ue3 demo 6: react dazu. @vitejs/plugin-react uebersetzt jsx/tsx (per esbuild,
// mit react-refresh fuer HMR bei komponenten - dieselbe rolle wie das plugin
// beim originalen "npm create vite -- --template react-ts").
// zwei html-einstiegspunkte parallel (siehe UE3_CHANGES.md demo 6): index.html
// (die bestehende vanilla-app, unveraendert) + react.html (der neue, noch leere
// react-shell). "input" sagt vite build explizit, BEIDE seiten zu bauen -
// ohne das wuerde vite build nur index.html mitnehmen, react.html waere im
// deploy (dist/) schlicht nicht vorhanden.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Mystery-Road-AWE-2026-lukesch/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        react: "react.html",
      },
    },
  },
});
