# UE2 Theorie-Fragen & Antworten — Exercise 2

Laufende Sammlung, gleiches Schema wie [`../ue1/UE1_THEORIE_ANTWORTEN.md`](../ue1/UE1_THEORIE_ANTWORTEN.md).

---

## Demo 1 — Package Manager & Projekt-Metadaten

Gewählt: **npm** (eigene Vorerfahrung). `package.json` sauber ausgefüllt (siehe `UE2_CHANGES.md` für die Feld-für-Feld-Begründung), `.gitignore` um `node_modules/`/`dist/`/`.env*` erweitert, `dayjs` als erste echte Abhängigkeit installiert.

### F1: Welches Problem löst ein Package Manager wirklich, das „Bibliothek runterladen und in einen Ordner legen" nicht löst? Konkret werden.

Ganz konkret an `dayjs`:

- **Reproduzierbarkeit über Versionen.** `package.json` sagt „irgendeine `1.x`-Version ab `1.11.23`" (`^1.11.23`), die Lockfile friert die *exakte* installierte Version ein. `npm install` liefert bei mir, bei dir, und in der CI **dieselbe** Version. Ein manuell heruntergeladenes `dayjs.min.js` sagt niemandem, welche Version das war oder ob es die neueste/eine gepatchte ist.
- **Transitive Abhängigkeiten.** `dayjs` hat zufällig keine eigenen Abhängigkeiten — die meisten echten Pakete aber schon. Lädt man „nur die eine Datei" von Hand, bekommt man *nicht* automatisch deren eigene Abhängigkeiten mit, geschweige denn in kompatiblen Versionen zueinander. npm löst diesen ganzen Baum automatisch auf.
- **Updates & Sicherheit.** `npm update` / `npm audit` sagen mir, ob eine installierte Version eine bekannte Sicherheitslücke hat und was ich upgraden müsste. Bei handkopierten Dateien weiß niemand, ob irgendwo im Projekt eine drei Jahre alte, verwundbare Kopie liegt.
- **Sauberes Entfernen.** `npm uninstall dayjs` entfernt exakt das, was `npm install dayjs` hinzugefügt hat (laut Lockfile). Von Hand kopierte Dateien hinterlassen nie ganz klar, was zu welcher „Installation" gehörte.
- **Isolation pro Projekt.** `node_modules/` ist lokal für *dieses* Projekt. Ein anderes Projekt auf demselben Rechner kann eine andere, sogar inkompatible Version derselben Bibliothek haben, ohne dass sich beide in die Quere kommen — bei einer globalen „Bibliotheks-Ordner"-Lösung wäre das nicht so einfach.

### F2: Unterschied `dependencies` vs. `devDependencies`? In welche Kategorie kommen Vite, Linter/Formatter und TypeScript — und warum?

- **`dependencies`**: Code, den die **ausgelieferte, laufende App** zur Laufzeit braucht — bei einer Browser-App: alles, was am Ende tatsächlich im Bundle landet, das im Browser der Nutzer:innen ausgeführt wird. `dayjs` gehört hierher, *sobald* wir es tatsächlich in App-Code importieren, der im Browser läuft.
- **`devDependencies`**: Werkzeuge, die nur **während der Entwicklung/des Builds** gebraucht werden — laufen auf meinem Rechner bzw. in der CI, aber ihr eigener Code landet nie im Browser der Nutzer:innen. **Vite** (baut/serviert die App, läuft selbst nie im Browser), **ESLint/Prettier** (prüfen/formatieren Quelltext, laufen nie im Browser), **TypeScript** (Compiler, übersetzt zu JS, das Ergebnis läuft im Browser — der Compiler selbst nie) gehören alle hierher.

Der praktische Unterschied: `npm install --omit=dev` (z. B. auf einem reinen Deploy-Zielsystem) installiert nur `dependencies` — korrekt, denn ein Deployment-Ziel braucht keinen Linter. Test dafür, in welche Kategorie etwas gehört: „läuft der Code davon im Browser der Endnutzer:innen mit?" Ja → `dependencies`. Nein, nur beim Bauen/Entwickeln → `devDependencies`.

### F3: Wofür ist eine Lockfile da, und was könnte für Teammitglieder (oder die CI) schiefgehen, wenn sie nicht committet wäre?

`package.json` gibt **Bereiche** an (`^1.11.23` erlaubt jede spätere `1.x.x`-Version). Die Lockfile (`package-lock.json`) friert den **exakt aufgelösten Baum** ein — jede einzelne (auch transitive) Version plus einen Integrity-Hash, der die heruntergeladene Datei gegen Manipulation prüft. `npm install` mit vorhandener Lockfile reproduziert exakt diesen Baum; ohne Lockfile löst npm die Bereiche bei **jedem** `install` neu auf.

**Ohne committete Lockfile**, konkret an `dayjs`: veröffentlicht dayjs morgen `1.12.0` (erlaubt durch `^1.11.23`), bekommt ein Teammitglied oder die CI beim Klonen + `npm install` eine **andere** Version als die, mit der der Code geschrieben und getestet wurde. Folgen: „geht bei mir, geht bei dir nicht"-Bugs, eine ungetestete transitive Versions-Änderung bricht etwas oder bringt eine Schwachstelle mit, ein Build ist lokal grün und in der CI rot (oder umgekehrt) — rein durch Versions-Drift, nicht durch einen echten Code-Fehler. Und: die Integrity-Hashes (Schutz gegen ein manipuliertes/kompromittiertes Registry-Paket) gehen mit verloren.

### F4: npm gewählt — was würde man bei einem größeren Projekt durch pnpm gewinnen/verlieren?

**Gewinn durch pnpm:**
- **Ein globaler, inhaltsadressierter Store** auf der Platte: eine physische Kopie von z. B. `dayjs@1.11.23` liegt **einmal** auf dem Rechner und wird über Hardlinks in jedes Projekt „eingehängt", das genau diese Version braucht — statt (wie bei npm klassisch) in jedem Projekt eine eigene volle Kopie von `node_modules` zu haben. Bei vielen Node-Projekten auf einer Maschine: massiv weniger Plattenplatz, spürbar schnellere Installs.
- **Striktes `node_modules`-Layout**: pnpm verlinkt so, dass ein Paket nur das sehen kann, was es *selbst* explizit als Abhängigkeit deklariert hat. Das deckt sogenannte „Phantom Dependencies" auf — Code, der nur zufällig funktioniert, weil irgendein *anderes* Paket dieselbe Bibliothek zufällig mitbringt, obwohl man sie selbst nie in `package.json` eingetragen hat. Bei npm's klassisch „flachem" `node_modules` ist das unsichtbar und bricht überraschend, sobald sich die andere Abhängigkeit ändert — bei größeren Teams ein reales, wiederkehrendes Problem.

**Verlust/Kosten:**
- pnpm ist ein **zusätzliches Werkzeug**, das separat installiert und in der CI genauso verfügbar gemacht werden muss — npm ist dagegen mit jeder Node-Installation garantiert vorhanden (genau das Argument aus Task 1 für npm).
- Vereinzelt (selten, aber real) Kompatibilitätsprobleme mit älteren Tools, die stillschweigend ein *flaches* `node_modules` voraussetzen.
- Migration später ist mechanisch möglich (`package.json`-Semantik bleibt gleich, nur `package-lock.json` → `pnpm-lock.yaml`), aber jedes Teammitglied + die CI-Konfiguration müssen mitgezogen werden.

---

## Demo 2 — Vite als Dev-Server

`public/`-Umzug (`data/`, `assets/`), `vite.config.js`, `"dev": "vite"`, Dev-Server auf allen 5 Views geprüft, HMR mit CSS- und JS-Änderung live gegenübergestellt. Details in `UE2_CHANGES.md`.

### F1: Unterschied zwischen dem alten statischen Server und Vites Dev-Server? Mindestens eine Sache nennen, die Vite tut und ein reiner statischer Server nicht.

Der alte Server (`python -m http.server` aus UE1) macht **genau eine Sache**: eine angefragte Datei byte-für-byte so ausliefern, wie sie auf der Platte liegt. Er weiß nichts von `import`-Anweisungen, npm-Paketen oder Modul-Abhängigkeiten.

Vites Dev-Server tut mehrere Dinge, die ein reiner statischer Server nicht kann — im Netzwerk-Log konkret beobachtet:
- Er liefert **`/@vite/client`** aus — eine Datei, die in unserem Quellcode **gar nicht existiert**. Vite injiziert sie beim Ausliefern von `index.html` on-the-fly. Dieses Skript baut die WebSocket-Verbindung für HMR auf.
- Er liefert **`/node_modules/vite/dist/client/env.mjs`** aus — direkt aus `node_modules`, ohne dass wir das irgendwo referenziert haben. Ein reiner Dateiserver hat kein Konzept von "installierten Paketen", die er bei Bedarf auflösen und ausliefern kann.
- Er versteht **bare imports** wie `import dayjs from "dayjs"` (kommt in Demo 6 dran) — löst den Paketnamen zu einer echten Datei in `node_modules` auf. Ein statischer Server würde bei `GET /dayjs` schlicht mit `404` antworten, weil es lokal keine Datei mit diesem Namen gibt.
- Er kompiliert/transformiert **on demand**, nur die Datei, die gerade angefragt wird — kein Vorab-Bundle des ganzen Projekts, bevor der Server überhaupt startet.

### F2: Was ist Hot Module Replacement, und was genau hast du beobachtet (und was **nicht**, z. B. beim App-Zustand)?

**HMR** heißt: wenn sich eine Datei ändert, schickt der Dev-Server über die schon offene WebSocket-Verbindung **nur das geänderte Modul** (bzw. bei CSS: das geänderte Stylesheet) an die bereits laufende Seite, und der im Browser laufende Vite-Client tauscht es **an Ort und Stelle** aus — ohne das Dokument neu zu laden. Der komplette JS-Ausführungskontext (Variablen, In-Memory-Zustand, aktuelle Ansicht) bleibt dabei erhalten.

**Beobachtet (CSS-Änderung, `--color-accent` in `styles.css`):**
- Konsole: `[vite] css hot updated: /styles.css`.
- Netzwerk: genau ein neuer Request, `GET /styles.css?t=<timestamp>` (Cache-Busting-Query) — kein Navigations-Request.
- Die neue Farbe war sofort sichtbar.
- **Was nicht passiert ist:** eine vorher gesetzte globale Variable (`window.__hmrMarker`) war danach immer noch da, `state.bookmarks` (In-Memory-App-Zustand) unverändert, aktueller Hash (`#evidence`) unverändert. Kein Reload — der JS-Kontext lief einfach weiter.

**Beobachtet (JS-Modul-Änderung, Kommentar in `js/views/dashboard.js`):**
- Konsole: **erneut** `[vite] connecting... / connected.` — der Client baut seine WebSocket-Verbindung neu auf. Das passiert nur bei einem echten Full-Reload.
- **Was diesmal verloren ging:** die vorher gesetzte Marker-Variable war weg (`undefined`), ein zuvor geöffnetes Beweisstück-Detail (`state.selectedEvidence`, nie in `localStorage` gespeichert) war nach dem Reload wieder geschlossen.

**Warum der Unterschied:** unsere Module haben keinerlei `import.meta.hot.accept()`-Code. CSS-HMR bekommt man bei Vite automatisch ohne eigenes Zutun; JS-HMR mit Zustandserhalt braucht dagegen explizites Opt-in im Modul selbst (oder ein Framework, das das für einen erledigt — z. B. React/Vue über ihre Vite-Plugins). Ohne das fällt Vite bewusst auf einen sauberen Full-Reload zurück, statt ein Modul zu ersetzen und dabei möglicherweise einen inkonsistenten Zustand zu riskieren.

### F3: Warum integriert sich eine schon in ES-Module gesplittete App natürlich mit einem Tool wie Vite, verglichen mit der ursprünglichen Ein-`<script>`-Version?

Vites komplettes Dev-Serving- und Bundling-Modell **basiert** auf dem nativen ES-Modul-Graphen: `<script type="module" src="…">` plus `import`/`export`-Anweisungen geben Vite einen echten, statisch analysierbaren Abhängigkeitsbaum. Dadurch kann Vite:
- jede Datei **einzeln, on demand** ausliefern (im Netzwerk-Log genau so beobachtet — 12 einzelne `js/*.js`-Requests statt einer riesigen Datei),
- bei einer Änderung **exakt wissen, welches eine Modul betroffen ist** und nur das neu schicken (die Grundlage für HMR überhaupt),
- beim Produktions-Build (Demo 3) **Tree-Shaking/Code-Splitting** machen, weil die Abhängigkeiten explizite, statische Deklarationen sind statt impliziter globaler Reihenfolge.

Die alte `app.js` (klassisches `<script src="app.js">`, eine 1000+-Zeilen-Datei ohne `import`/`export`) hätte Vite dagegen nur als **eine beliebige statische Datei** gesehen — kein Abhängigkeitsgraph, keine Modul-Grenzen, keine Möglichkeit herauszufinden, "welcher Teil hat sich geändert". Jede Änderung hätte einen kompletten Reload gebraucht, genau wie bei einem reinen Dateiserver — Vites eigentliche Stärken (granulares HMR, Dependency-Pre-Bundling, späteres Tree-Shaking) hätten schlicht nichts, woran sie andocken könnten. Der ES-Modul-Split aus UE1 ist also nicht nur "sauberer Code", sondern die **Voraussetzung**, die diese Übung überhaupt erst sinnvoll macht — genau das sagt auch die Angabe eingangs ("you need the ES-module split from that exercise finished first").
