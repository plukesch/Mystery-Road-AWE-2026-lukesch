# UE2 CHANGES

Laufendes Änderungsprotokoll für Exercise 2 (Build Tooling, TypeScript & CI/CD).
Baut auf dem fertigen Stand von [`../ue1/UE1_CHANGES.md`](../ue1/UE1_CHANGES.md) auf (ES-Module-Split aus UE1 ist Voraussetzung).

---

## Demo 1 — Package Manager & Projekt-Metadaten

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Bevor wir an Vite, TypeScript oder automatische Deployment-Skripte (spätere Demos) überhaupt
rankönnen, brauchen wir ein **Fundament**: einen Weg, fremden Code sauber ins Projekt zu holen,
und eine Art „Ausweis" für unser eigenes Projekt. Genau das ist Demo 1.

**Was ist ein Package Manager?** Stell dir vor, du baust ein Möbelstück. Du könntest jede
Schraube selbst schmieden — dauert ewig, fehleranfällig. Oder du bestellst fertige Teile aus
einem Katalog. Ein **Package Manager** (hier: **npm**) ist genau so ein Bestellsystem für
fertigen Programmier-Code („Pakete"/„Bibliotheken" — Code, den andere geschrieben haben und
du einfach benutzt, statt ihn selbst zu schreiben). npm merkt sich dabei genau, welche Version
du hast, holt automatisch mit, was ein Paket selbst wieder braucht, und sagt dir, wenn's was
Neueres/Sichereres gibt. Reines "Datei runterladen und in Ordner legen" kann das alles nicht —
da müsstest du händisch Buch führen.

**Warum npm und nicht pnpm?** Beide machen im Kern dasselbe. npm ist automatisch da, sobald
Node.js installiert ist — kein Extra-Programm nötig. pnpm spart Festplattenplatz, ist aber ein
Zusatzwerkzeug, das man separat installieren müsste. Wir nehmen npm, weil du damit schon
Erfahrung hast, und wir in dieser Übung eh schon genug Neues lernen (Vite, TypeScript, CI/CD).

**Was ist `package.json`?** Eine Zutatenliste + Ausweis für dein Projekt, alles in einer Datei.
Jedes Werkzeug in der Kette (npm selbst, später Vite, später TypeScript) liest diese eine Datei:
wie heißt das Projekt, welche Version, und — am wichtigsten — welche Bausteine braucht es.

**Was ist `node_modules/`?** Wenn npm ein Paket runterlädt, landet der **tatsächliche Code**
dieses Pakets hier — das "physisch ausgepackte" Paket. Kann tausende Dateien sein, lässt sich
aber jederzeit exakt neu erzeugen (`npm install`). Deshalb landet es **nie** in Git — wie die
leere Versandverpackung, die man nicht für immer aufhebt, wenn man das Produkt jederzeit neu
bestellen kann.

**Was ist `package-lock.json`?** Die wichtigste, am wenigsten offensichtliche Datei. In
`package.json` steht nicht "exakt Version 1.11.23", sondern "`^1.11.23`" — das `^` heißt "diese
oder auch gern eine neuere, solange sie noch mit `1.` anfängt". Das ist wie ein Rezept, das
"füg Mehl hinzu" sagt, ohne Menge/Marke zu nennen. `package-lock.json` ist das Rezept mit
**exakten Grammangaben**: genau diese Version, dieser Anbieter, dieser Prüf-Code. Wird sie mit
committet, bekommen alle — du, Teamkolleg:innen, später ein automatischer Prüf-Computer (CI) —
**garantiert exakt dieselbe** Version. Ohne sie: jeder könnte eine leicht andere Version
bekommen, je nachdem wann er installiert hat — "bei mir geht's, bei dir nicht", obwohl "derselbe
Code" da ist.

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

### 🎤 Live-Demo — was du im Unterricht herzeigst

Reihenfolge, mit der du 10–15 Min füllst, ohne dich zu verhaspeln:

1. **`package.json` im Editor aufmachen.** Zeig jedes Feld, sag in einem Satz wofür (Zutatenliste-Analogie). Zeig gezielt `private: true`, `type: "module"`, `license: "UNLICENSED"` — das sind die drei, die npm **nicht** automatisch richtig gesetzt hat.
2. **Terminal:** `npm init -y` kurz erklären (nicht nochmal ausführen, nur den Screenshot/die Erinnerung zeigen) — "hat mir eine Standard-`package.json` gebaut, Name/Beschreibung/Repo-Link hat npm sich automatisch aus `README.md` und dem Git-Remote gezogen."
3. **`package-lock.json` aufmachen**, zum `"node_modules/dayjs"`-Eintrag scrollen. Zeig `version`, `resolved` (die genaue Download-URL), `integrity` (der Prüf-Hash) — sag: "das ist das Rezept mit exakten Grammangaben."
4. **Terminal, live:** `git status` — zeig, dass `node_modules/` **nicht** auftaucht (dank `.gitignore`), aber `package.json`/`package-lock.json` schon. Dann optional im Explorer/VS Code den `node_modules`-Ordner aufklappen — "hunderte Dateien, alle reproduzierbar, alle bewusst nicht im Repo."
5. **GitHub im Browser öffnen** (euer Repo, „Commits"-Historie), den Demo-1-Commit anklicken → zeigt den Diff von `package.json`/`.gitignore` farbig (rot = vorher, grün = nachher) — sehr überzeugend fürs Publikum, weil man Vorher/Nachher in einem Bild sieht.

### DevTools brauchst du für Demo 1 nicht — kommt erst ab Demo 2.

---

## Demo 2 — Vite als Dev-Server

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

In UE1 lief ein ganz simpler "Briefträger" (`python -m http.server`): ein Programm, das nur eine
Sache kann — "du fragst nach einer Datei, ich geb sie dir, unverändert." Mehr nicht.

**Vite** ist auch so ein Briefträger-Programm — zeigt dir deine Webseite im Browser, während du
programmierst. Aber viel schlauer: es merkt automatisch, wenn du eine Datei änderst, und schickt
die Änderung **live** an den Browser (das ist HMR, dazu unten mehr). Später (Demo 3) kann es
deine ganze Webseite außerdem für den echten, öffentlichen Einsatz "verpacken".

**Warum mussten wir Ordner verschieben (`data/`, `assets/` → `public/`)?** Vite schaut sich
`index.html` an und verfolgt automatisch alles, was dort direkt verlinkt ist. Was **erst zur
Laufzeit** im JavaScript nachgeladen wird (unser `fetch("data/case.json")`, oder Bilder, die erst
beim Rendern aus JSON-Daten zusammengebaut werden) — das sieht Vite **im Voraus nicht**. Der
Ordner `public/` ist Vites Sonderregel dafür: alles darin liefert Vite **einfach unverändert
aus**, egal ob es's "sieht" oder nicht — wie ein Zimmerservice, der alles auf den Tresen im Foyer
stellt, egal wer wann danach fragt. Weil `public/`-Inhalte unter demselben Pfad landen wie
vorher, musste im Code selbst **nichts** geändert werden.

**Was ist `vite.config.js`?** Eine Einstellungs-Datei fürs Vite-Programm, so wie die
"Einstellungen"-Seite an einem Handy. Unsere ist fast leer, weil Vite von sich aus schon richtig
rät, was wir brauchen.

**Was hat `npm install -D vite` gemacht?** Dasselbe Prinzip wie bei `dayjs` in Demo 1 — Vite
wird heruntergeladen und lokal abgelegt. Das `-D` heißt "ich brauche das nur beim Entwickeln,
nie im Browser der späteren Besucher:innen" (siehe Demo-1-Frage 2).

**Was macht `npm run dev`?** Startet Vite tatsächlich — wie ein Doppelklick auf ein
Programm-Icon. Ab dann läuft die App unter `http://localhost:5173`.

**Was ist HMR?** **H**ot **M**odule **R**eplacement — auf Deutsch grob "heißer Teil-Austausch".
„Hot" = während das Programm noch **läuft** (nicht aus- und wieder einschalten). „Module" = ein
einzelner Baustein deines Codes. „Replacement" = austauschen. Also: **während die Seite läuft,
wird ein einzelner Baustein ausgetauscht, ohne alles andere anzufassen.**

*Analogie:* Du liest ein Buch, bist auf Seite 150. Jemand tauscht nur Seite 47 aus (ein
Tippfehler wurde korrigiert), du liest einfach auf Seite 150 weiter. Das ist HMR. Ein
**komplettes Neuladen** (Browser-F5) wäre dagegen: jemand nimmt dir das ganze Buch weg, klappt es
zu, du musst wieder bei Seite 1 anfangen — auch wenn sich nur eine Seite geändert hat. Du
verlierst deine Stelle, dein Lesezeichen, alles.

Wir haben beide Fälle getestet: **CSS-Änderung** → nur die eine "Seite" (das Stylesheet) wird
getauscht, alles bleibt erhalten. **JS-Änderung** → bei uns (weil unsere Module keinen
Extra-Code dafür haben) macht Vite lieber einen sauberen Komplett-Neustart, als zu riskieren,
den Programm-Zustand kaputt zu machen — Zustand geht dabei verloren.

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

### 🎤 Live-Demo — was du im Unterricht herzeigst

**Vorbereitung:** zwei Fenster nebeneinander — Editor (VS Code) links, Browser rechts, im Browser **DevTools offen** (`F12`).

**1. Server starten, App zeigen (Task 1+2)**
```bash
npm run dev
```
Zeig kurz die bunte Vite-Startmeldung im Terminal (Version, "ready in X ms", die `Local:`-URL). Öffne `http://localhost:5173` im Browser, klick einmal durch alle 5 Views (Dashboard → Evidence → People → Timeline → Workspace) — "läuft identisch wie vorher mit dem Python-Server."

**2. DevTools → Network-Tab, den Unterschied zu einem simplen Server zeigen**
- `F12` → Tab **Network** → Seite neu laden (`Strg+R`).
- Zeig in der Liste: `/@vite/client` und `/node_modules/vite/dist/client/env.mjs` — Dateien, die es in `js/`/`index.html` **gar nicht gibt**. Sag: "das injiziert Vite selbst, ein normaler Dateiserver könnte das nicht."
- Zeig: jede `js/*.js`-Datei einzeln als eigener Request (kein Bundle) — "Vite liefert jedes Modul einzeln aus, genau weil unser Code seit UE1 in echte ES-Module gesplittet ist."
- Zeig: `data/*.json` und `assets/*.png` laden ganz normal, exakt wie vorher — "aus dem neuen `public/`-Ordner, ohne dass ich am Code was ändern musste."

**3. DevTools → Console-Tab**
- Zeig `[vite] connecting...` / `connected.` — "das ist Vites eigener Verbindungsaufbau für Live-Updates."

**4. HMR live vorführen — CSS (der Beweis, dass NICHTS neu lädt)**
- Im Editor: `styles.css` öffnen, `--color-accent: #2f6fed;` kurz auf eine andere Farbe ändern (z. B. `#e0392b`), speichern.
- Im Browser: die Akzentfarbe (Buttons, aktiver Nav-Reiter) ändert sich **sofort**, ohne dass die Seite flackert/neu lädt.
- DevTools-Console zeigt **`[vite] css hot updated: /styles.css`**.
- DevTools-Network zeigt einen **neuen** Request `styles.css?t=…`, aber **keinen** neuen Dokument-Request (kein weißer Blitz, kein "Navigation" in der Waterfall-Ansicht).
- **Zustand als Beweis:** vorher in der Evidence-Liste ein Beweisstück bookmarken (Stern anklicken) — nach der CSS-Änderung ist der Stern **immer noch aktiv**. Farbe zurücksetzen, wieder speichern.

**5. HMR live vorführen — JS (der Kontrast: Full-Reload)**
- Im Browser: ein Beweisstück öffnen (Detail-Ansicht), damit sichtbarer, nicht-gespeicherter Zustand existiert.
- Im Editor: `js/views/dashboard.js` öffnen, irgendwo einen harmlosen Kommentar hinzufügen, speichern.
- Im Browser: diesmal lädt die **ganze Seite neu** (kurzes Aufblitzen/Reset), das offene Beweisstück-Detail ist wieder zu.
- DevTools-Console zeigt **erneut** `[vite] connecting...` / `connected.` — "der Client baut seine Verbindung neu auf, das passiert nur bei einem echten Reload."
- Kommentar wieder entfernen.

**6. Eine Zeile für den Vergleich, laut aussprechen:** "CSS-Änderungen tauscht Vite live aus, ganz automatisch. JavaScript-Änderungen nicht — weil unser Code keinen speziellen Zusatz-Code dafür hat, macht Vite lieber sauber neu, statt den Zustand zu riskieren."
