# UE2 CHANGES

Laufendes Änderungsprotokoll für Exercise 2 (Build Tooling, TypeScript & CI/CD).
Baut auf dem fertigen Stand von [`../ue1/UE1_CHANGES.md`](../ue1/UE1_CHANGES.md) auf (ES-Module-Split aus UE1 ist Voraussetzung).

---

## Demo 1 — Package Manager & Projekt-Metadaten

### Task 1 — npm oder pnpm?

**npm.** Grund: bereits Erfahrung damit (weniger neue Werkzeuge gleichzeitig lernen, während in dieser Übung schon Vite + TypeScript + GitHub Actions neu dazukommen), und npm ist Teil jeder Node.js-Installation — keine zusätzliche Installation nötig, jeder mit Node kann das Projekt sofort clonen und `npm install` ausführen. pnpm hat reale Vorteile (siehe F4), die rechtfertigen hier aber keinen Umweg.

### Task 2 — `package.json` initialisiert und sauber ausgefüllt

Befehl (im Terminal vom Nutzer ausgeführt): `npm init -y`. Das legt ein generisches `package.json` an (Name/Description/Repo-URL zieht npm automatisch aus `README.md` bzw. dem Git-Remote — daher stimmen die von Anfang an).

Danach von Hand nachgeschärft, Feld für Feld:

| Feld | npm-Default | Geändert zu | Warum |
|---|---|---|---|
| `version` | `1.0.0` | `0.1.0` | SemVer: `0.x` heißt „noch keine stabile, versprochene API/Release" — passt zu einem Coursework-Projekt, das gerade erst tooling-mäßig aufgebaut wird. `1.0.0` würde eine Stabilitätszusage vortäuschen, die es nicht gibt. |
| `private` | *(fehlt)* | `true` | Verhindert **aus Versehen** `npm publish` auf das öffentliche npm-Registry — dieses Projekt ist eine App, kein zu veröffentlichendes Paket. |
| `type` | `"commonjs"` | `"module"` | Der komplette Code läuft seit UE1 schon als native ES-Module (`import`/`export`). `"type": "module"` sagt Node dasselbe für alle `.js`-Dateien im Projekt (z. B. spätere Config-Dateien wie `vite.config.js`) — vermeidet CommonJS/ESM-Reibung, bevor sie in Demo 2 überhaupt auftreten kann. |
| `main` | `"app.js"` | *entfernt* | `main` ist der Einstiegspunkt für Pakete, die andere per `require`/`import "dieses-paket"` einbinden. Diese App wird nie als npm-Paket importiert (sie hat `index.html` als echten Einstiegspunkt, nicht `main`) — und `"app.js"` zeigte ohnehin auf die alte Vor-Refactor-Datei aus UE1, die wir nur zum Diffen behalten haben. Irreführend, also raus. |
| `license` | `"ISC"` | `"UNLICENSED"` | Kein Open-Source-Release, kein Interesse an Weiterverwendung durch Dritte. `"UNLICENSED"` + `private: true` ist die npm-Konvention dafür. |
| `scripts` | `{ "test": "echo \"Error…\" && exit 1" }` | `{}` | Der Default-Test-Script ist ein Fake (er tut nichts außer mit Fehlercode abzubrechen) — irreführend, bis es echte Scripts gibt. Echte Scripts (`dev`, `build`, `lint`, `lint:fix`, `format`) kommen ab Demo 2/4. |
| `author` | `""` | `"Patrick Lukesch"` | Leeres Feld ausgefüllt. |
| `keywords` | `[]` | `["case-study", "vanilla-js", "web-engineering-course"]` | Kurz beschreibend; für ein privates Projekt nicht funktional wichtig, aber „richtig ausgefüllt" statt leer. |
| `description`, `repository`, `bugs`, `homepage` | von npm automatisch gesetzt | unverändert (`description` leicht erweitert) | Waren schon korrekt (aus `README.md`/Git-Remote abgeleitet). |

### Task 3 — `.gitignore`

Ergänzt (`.gitignore`, neuer Abschnitt „Node / npm"):
```gitignore
node_modules/
dist/        # vite-build-output, kommt in demo 3 - schon vorausschauend drin
.env
.env.local
```
`node_modules/` ist Pflicht (siehe F1). `dist/` schon jetzt mit rein, obwohl es erst in Demo 3 entsteht — spart eine zweite `.gitignore`-Änderung später. `.env*` als Vorgriff auf mögliche Secrets (aktuell ungenutzt, aber Standard-Praxis, bevor man sie braucht statt danach).

### Task 4 — eine echte Abhängigkeit installiert

Befehl: `npm install dayjs`. Gewählt statt eines Wegwerf-Beispiels, weil die App mit `formatDate()` in `js/utils.js` schon echten Datums-Formatierungscode hat — dayjs ist also eine Abhängigkeit mit echtem Bezug zur App, kein Selbstzweck. (Vite selbst installieren wir bewusst *nicht* hier, sondern erst in Demo 2 — dort gehört es laut Angabe hin.)

Ergebnis in `package-lock.json` (`lockfileVersion: 3`):
```json
"node_modules/dayjs": {
  "version": "1.11.23",
  "resolved": "https://registry.npmjs.org/dayjs/-/dayjs-1.11.23.tgz",
  "integrity": "sha512-QDTCU0M0MxR3hQfnlDJfwekQiaanm1ubOD231u73WBckQ/fsamwRLiE2GBz6D3a/xF1NgfiDLJjXBa1hYOYTtQ==",
  "license": "MIT"
}
```
dayjs hat **null eigene Abhängigkeiten** (nur ein einziger `node_modules/…`-Eintrag neben dem Wurzelpaket) — bewusst simpel für den Einstieg, aber die Lockfile-Mechanik (exakte Version + Integrity-Hash) gilt genauso für Pakete mit hundert transitiven Abhängigkeiten.

### Verifikation
`package.json` und `package-lock.json` gegengelesen: `dependencies.dayjs` in beiden konsistent (`^1.11.23` in `package.json`, aufgelöst auf exakt `1.11.23` im Lockfile). `node_modules/` + `package-lock.json` + `package.json` waren vor der `.gitignore`-Änderung alle als „untracked" gelistet (`git status`) — nach der Änderung verschwindet nur `node_modules/` aus der Liste, `package.json`/`package-lock.json` bleiben sichtbar zum Committen (genau das will die Aufgabe: Lockfile **committet**, `node_modules` **nicht**).

---

## Demo 2 — Vite als Dev-Server

### Task 1 — Vite installiert + Projekt umstrukturiert

Befehl (Nutzer): `npm install -D vite` → `devDependencies.vite: "^8.3.0"`. **`-D`**, nicht `-S`/ohne Flag: Vite läuft nur beim Entwickeln/Bauen, ihr eigener Code landet nie im ausgelieferten Bundle (siehe Demo-1-Frage 2 zu `dependencies`/`devDependencies`).

**Umstrukturierung** — neuer Ordner `public/`, `data/` und `assets/` reingeschoben (per `git mv`, Historie bleibt):
```
public/
├── data/          (case.json, evidence.json, locations.json, people.json, timeline.json)
└── assets/        (logo/logo.svg, people/*.png)
```
`resources/` (die alten, nie referenzierten Doppel-Bilder aus der Zeit vor UE1) bleibt bewusst **außerhalb** von `public/` und außerhalb des Repos-Layouts, das Vite kennen muss — nichts im Code referenziert diesen Ordner, also muss ihn auch niemand "finden". Weiterhin unbenutzter Alt-Ballast, kein Teil dieser Übung.

**Warum `public/` und keine Code-Änderung nötig war:** `public/` ist Vites Konvention für Dateien, die **unverändert, ungehasht, unter genau demselben absoluten Pfad** ausgeliefert werden — nicht Teil von Vites Modul-Graph/Bundling. Das passt exakt auf unseren Fall: `fetch("data/case.json")` in `js/data.js` ist ein zur Build-Zeit nicht analysierbarer String, `<img src="…">` für Personen-Avatare wird erst zur Laufzeit aus `people.json` zusammengebaut — beides kann Vite beim Build nicht "sehen" und würde es sonst (ohne `public/`) beim `vite build` in Demo 3 stillschweigend **nicht** mit ausliefern. Weil `public/`-Inhalte 1:1 unter demselben Pfad landen, funktionieren `fetch("data/case.json")` und `<img src="assets/logo/logo.svg">` unverändert weiter — **kein einziges Byte** in `index.html` oder `js/` musste angefasst werden.

**`vite.config.js`** neu angelegt — fast leer (`defineConfig({})`), weil unser Layout (`index.html` im Projekt-Root, `public/` unter Standardnamen) schon exakt zu Vites Zero-Config-Vorgaben passt. Existiert trotzdem schon jetzt als fester Platz für spätere Config (z. B. `base` für GitHub Pages in Demo 9).

**`package.json`**: `"dev": "vite"` als Script ergänzt.

### Task 2 — Dev-Server läuft, jede View geprüft

Befehl (Nutzer): `npm run dev` → Vite startet auf `http://localhost:5173`. Im Browser durchgecheckt:
- Dashboard (`18/6/6/0/1`-Stats), Evidence (18 Karten), People (6 Karten, Avatar-Bild lädt aus `public/assets/`, `naturalWidth: 64` bestätigt „ist wirklich ein geladenes Bild, kein kaputter Link"), Timeline (15 Events, kein `[object Object]`), Workspace (Hypothesen-Dropdowns gefüllt) — alle funktionieren identisch zum alten `python -m http.server`-Setup aus UE1.
- Netzwerk-Log zeigt: `/data/*.json` und `/assets/**` werden exakt unter denselben Pfaden wie vorher ausgeliefert (aus `public/`), **jede** `js/*.js`-Datei wird **einzeln** angefragt (kein Bundling im Dev-Modus — natives ESM direkt vom Browser geladen), zusätzlich `/@vite/client` und `/node_modules/vite/dist/client/env.mjs` — beides Dateien, die **nicht** in unserem Quellcode existieren, sondern von Vite selbst on-the-fly in `index.html` injiziert bzw. aus `node_modules` ausgeliefert werden.
- Konsole sauber bis auf `[vite] connecting... / connected.` — Vites eigener HMR-Client baut eine WebSocket-Verbindung zum Dev-Server auf.

### Task 3 — HMR ausgelöst und beobachtet

**Versuch 1 — CSS-Änderung** (`styles.css`, `--color-accent` testweise auf `#e0392b`, danach zurückgesetzt): Konsole zeigt `[vite] css hot updated: /styles.css`, Netzwerk zeigt einen einzelnen neuen Request `GET /styles.css?t=<timestamp>` (Cache-Busting-Query, kein Navigations-Request). Dabei geprüft, was **nicht** passiert ist: eine vorher gesetzte globale JS-Variable (`window.__hmrMarker`) war danach **immer noch da**, `state.bookmarks` unverändert, aktueller Hash unverändert — der komplette JS-Ausführungskontext blieb am Leben, nur die Stylesheet-Regel wurde live ausgetauscht.

**Versuch 2 — JS-Modul-Änderung** (`js/views/dashboard.js`, ein Kommentar ergänzt, danach zurückgesetzt): dieses Mal loggt die Konsole erneut `[vite] connecting... / connected.` — der Vite-Client baut seine WebSocket-Verbindung **neu** auf, was nur bei einem echten Full-Reload passiert. Bestätigt: die zuvor gesetzte `window.__hmrMarker2`-Variable war **weg** (`undefined`), und ein zuvor geöffnetes Beweisstück-Detail (nicht-persistenter State, `state.selectedEvidence`) war **wieder geschlossen** — der komplette Zustand ist bei diesem Reload verloren gegangen (der Hash in der URL blieb zwar erhalten, weil er Teil der Adresse ist, aber alles, was nur im JS-Speicher lebte, ist weg).

**Fazit aus dem Kontrast:** unsere Module haben keinerlei `import.meta.hot.accept()`-Code — deshalb fällt Vite bei JS-Änderungen auf einen Full-Reload zurück. CSS-HMR bekommt man bei Vite dagegen automatisch, ganz ohne eigenen Opt-in-Code.

### Verifikation
Voller Feature-Durchlauf über den Vite-Dev-Server (nicht mehr `python -m http.server`): alle 5 Views, Konsole sauber, Netzwerk-Log zeigt öffentliche Assets korrekt ausgeliefert. Beide HMR-Teständerungen im Nachhinein vollständig zurückgesetzt (`git diff` auf `styles.css`/`js/views/dashboard.js` leer) — bleiben nicht im Commit.
