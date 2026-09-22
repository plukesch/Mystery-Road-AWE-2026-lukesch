// demo 4 (ue2): eslint-konfiguration (flat config, das neue format ab eslint 9).
// prueft NUR echten-code-logik (typos, unused vars, unreachable code, ...) -
// alles was mit AUSSEHEN zu tun hat (anfuehrungszeichen, einrueckung, semikolons)
// macht prettier, siehe .prettierrc. eslint-config-prettier ganz am ende schaltet
// die paar eslint-eigenen stil-regeln ab, damit sich beide werkzeuge nicht in
// die quere kommen.
import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    // app.js: eingefrorene vor-refactor-datei aus ue1, nur zum diffen behalten,
    // wird nie mehr angefasst -> soll auch nicht gelintet werden.
    // dist/, public/, node_modules/: generierte bzw. daten-/bild-dateien, kein
    // code von uns. ue1/, ue2/: markdown-doku, kein js.
    ignores: ["dist/**", "public/**", "node_modules/**", "app.js", "ue1/**", "ue2/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  prettierConfig,
];
