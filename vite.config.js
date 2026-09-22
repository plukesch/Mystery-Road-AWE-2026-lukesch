// demo 2 (ue2): minimal vite-config.
// braucht fast nichts, weil unser layout schon zu vite's zero-config-defaults passt:
// - index.html liegt im projekt-root      -> vite findet den einstiegspunkt automatisch
// - "public/" ist vite's default-name fuer statische dateien, die 1:1 (ungehasht,
//   unveraendert) unter derselben absoluten url ausgeliefert werden -> data/*.json
//   (per fetch() geladen) und assets/... (per <img src> aus JSON-daten gerendert)
//   passen genau in dieses schema, weil beides zur build-zeit NICHT statisch analysierbar
//   ist (fetch-pfad ist ein string, img-src wird erst zur laufzeit aus JSON gebaut).
// diese datei existiert trotzdem schon jetzt als fester platz fuer spaetere config
// (z.b. "base" fuer github pages in demo 9).
import { defineConfig } from "vite";

export default defineConfig({});
