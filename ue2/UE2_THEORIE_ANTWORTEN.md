# UE2 Theorie-Fragen & Antworten — Exercise 2

Laufende Sammlung, gleiches Schema wie [`../ue1/UE1_THEORIE_ANTWORTEN.md`](../ue1/UE1_THEORIE_ANTWORTEN.md).

---

## Demo 1 — Package Manager & Projekt-Metadaten

Gewählt: **npm** (eigene Vorerfahrung). `package.json` sauber ausgefüllt (siehe `UE2_CHANGES.md` für die Feld-für-Feld-Begründung), `.gitignore` um `node_modules/`/`dist/`/`.env*` erweitert, `dayjs` als erste echte Abhängigkeit installiert.

### F1: Welches Problem löst ein Package Manager wirklich, das „Bibliothek runterladen und in einen Ordner legen" nicht löst? Konkret werden.

**Einfach gesagt:** Beim reinen Runterladen musst du selbst Buch führen — welche Version hab
ich, braucht das noch was anderes, gibt's was Neueres. npm macht das automatisch, wie ein
Lagerverwalter statt eigener Zettelwirtschaft.

Ganz konkret an `dayjs`:

- **Reproduzierbarkeit über Versionen.** `package.json` sagt „irgendeine `1.x`-Version ab `1.11.23`" (`^1.11.23`), die Lockfile friert die *exakte* installierte Version ein. `npm install` liefert bei mir, bei dir, und in der CI **dieselbe** Version. Ein manuell heruntergeladenes `dayjs.min.js` sagt niemandem, welche Version das war oder ob es die neueste/eine gepatchte ist.
- **Transitive Abhängigkeiten.** `dayjs` hat zufällig keine eigenen Abhängigkeiten — die meisten echten Pakete aber schon. Lädt man „nur die eine Datei" von Hand, bekommt man *nicht* automatisch deren eigene Abhängigkeiten mit, geschweige denn in kompatiblen Versionen zueinander. npm löst diesen ganzen Baum automatisch auf.
- **Updates & Sicherheit.** `npm update` / `npm audit` sagen mir, ob eine installierte Version eine bekannte Sicherheitslücke hat und was ich upgraden müsste. Bei handkopierten Dateien weiß niemand, ob irgendwo im Projekt eine drei Jahre alte, verwundbare Kopie liegt.
- **Sauberes Entfernen.** `npm uninstall dayjs` entfernt exakt das, was `npm install dayjs` hinzugefügt hat (laut Lockfile). Von Hand kopierte Dateien hinterlassen nie ganz klar, was zu welcher „Installation" gehörte.
- **Isolation pro Projekt.** `node_modules/` ist lokal für *dieses* Projekt. Ein anderes Projekt auf demselben Rechner kann eine andere, sogar inkompatible Version derselben Bibliothek haben, ohne dass sich beide in die Quere kommen — bei einer globalen „Bibliotheks-Ordner"-Lösung wäre das nicht so einfach.

### F2: Unterschied `dependencies` vs. `devDependencies`? In welche Kategorie kommen Vite, Linter/Formatter und TypeScript — und warum?

**Einfach gesagt:** Werkzeugkiste (Hammer, Bohrmaschine — bleibt in der Werkstatt) vs. das
fertige Haus selbst (Ziegel, Fenster — steckt drin). `devDependencies` = Werkzeug zum Bauen,
`dependencies` = das, was im fertigen, ausgelieferten Produkt tatsächlich mitläuft.

- **`dependencies`**: Code, den die **ausgelieferte, laufende App** zur Laufzeit braucht — bei einer Browser-App: alles, was am Ende tatsächlich im Bundle landet, das im Browser der Nutzer:innen ausgeführt wird. `dayjs` gehört hierher, *sobald* wir es tatsächlich in App-Code importieren, der im Browser läuft.
- **`devDependencies`**: Werkzeuge, die nur **während der Entwicklung/des Builds** gebraucht werden — laufen auf meinem Rechner bzw. in der CI, aber ihr eigener Code landet nie im Browser der Nutzer:innen. **Vite** (baut/serviert die App, läuft selbst nie im Browser), **ESLint/Prettier** (prüfen/formatieren Quelltext, laufen nie im Browser), **TypeScript** (Compiler, übersetzt zu JS, das Ergebnis läuft im Browser — der Compiler selbst nie) gehören alle hierher.

Der praktische Unterschied: `npm install --omit=dev` (z. B. auf einem reinen Deploy-Zielsystem) installiert nur `dependencies` — korrekt, denn ein Deployment-Ziel braucht keinen Linter. Test dafür, in welche Kategorie etwas gehört: „läuft der Code davon im Browser der Endnutzer:innen mit?" Ja → `dependencies`. Nein, nur beim Bauen/Entwickeln → `devDependencies`.

### F3: Wofür ist eine Lockfile da, und was könnte für Teammitglieder (oder die CI) schiefgehen, wenn sie nicht committet wäre?

**Einfach gesagt:** `package.json` ist ein Rezept, das nur "füg Mehl hinzu" sagt (ungenau).
Die Lockfile ist dasselbe Rezept mit exakten Grammangaben. Nur mit der Lockfile bekommen alle
garantiert denselben "Kuchen".

`package.json` gibt **Bereiche** an (`^1.11.23` erlaubt jede spätere `1.x.x`-Version). Die Lockfile (`package-lock.json`) friert den **exakt aufgelösten Baum** ein — jede einzelne (auch transitive) Version plus einen Integrity-Hash, der die heruntergeladene Datei gegen Manipulation prüft. `npm install` mit vorhandener Lockfile reproduziert exakt diesen Baum; ohne Lockfile löst npm die Bereiche bei **jedem** `install` neu auf.

**Ohne committete Lockfile**, konkret an `dayjs`: veröffentlicht dayjs morgen `1.12.0` (erlaubt durch `^1.11.23`), bekommt ein Teammitglied oder die CI beim Klonen + `npm install` eine **andere** Version als die, mit der der Code geschrieben und getestet wurde. Folgen: „geht bei mir, geht bei dir nicht"-Bugs, eine ungetestete transitive Versions-Änderung bricht etwas oder bringt eine Schwachstelle mit, ein Build ist lokal grün und in der CI rot (oder umgekehrt) — rein durch Versions-Drift, nicht durch einen echten Code-Fehler. Und: die Integrity-Hashes (Schutz gegen ein manipuliertes/kompromittiertes Registry-Paket) gehen mit verloren.

### F4: npm gewählt — was würde man bei einem größeren Projekt durch pnpm gewinnen/verlieren?

**Einfach gesagt:** pnpm hebt jeden Baustein nur **einmal** auf der ganzen Festplatte auf
(statt einmal pro Projekt) und leiht ihn sich aus, wenn ein Projekt ihn braucht — spart Platz
und Zeit. Kostet: ein Zusatzprogramm, das npm (immer mit Node dabei) nicht braucht.

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

**Einfach gesagt:** der alte Server ist ein stummer Briefträger — liefert nur Dateien aus, wie
sie daliegen. Vite ist ein schlauer Assistent — merkt Änderungen automatisch, kennt installierte
Pakete, kompiliert nur bei Bedarf.

Der alte Server (`python -m http.server` aus UE1) macht **genau eine Sache**: eine angefragte Datei byte-für-byte so ausliefern, wie sie auf der Platte liegt. Er weiß nichts von `import`-Anweisungen, npm-Paketen oder Modul-Abhängigkeiten.

Vites Dev-Server tut mehrere Dinge, die ein reiner statischer Server nicht kann — im Netzwerk-Log konkret beobachtet:
- Er liefert **`/@vite/client`** aus — eine Datei, die in unserem Quellcode **gar nicht existiert**. Vite injiziert sie beim Ausliefern von `index.html` on-the-fly. Dieses Skript baut die WebSocket-Verbindung für HMR auf.
- Er liefert **`/node_modules/vite/dist/client/env.mjs`** aus — direkt aus `node_modules`, ohne dass wir das irgendwo referenziert haben. Ein reiner Dateiserver hat kein Konzept von "installierten Paketen", die er bei Bedarf auflösen und ausliefern kann.
- Er versteht **bare imports** wie `import dayjs from "dayjs"` (kommt in Demo 6 dran) — löst den Paketnamen zu einer echten Datei in `node_modules` auf. Ein statischer Server würde bei `GET /dayjs` schlicht mit `404` antworten, weil es lokal keine Datei mit diesem Namen gibt.
- Er kompiliert/transformiert **on demand**, nur die Datei, die gerade angefragt wird — kein Vorab-Bundle des ganzen Projekts, bevor der Server überhaupt startet.

### F2: Was ist Hot Module Replacement, und was genau hast du beobachtet (und was **nicht**, z. B. beim App-Zustand)?

**Einfach gesagt:** HMR = **H**ot **M**odule **R**eplacement, "heißer Teil-Austausch" — während
die Seite noch läuft (heiß), wird ein einzelner Baustein (Modul) ausgetauscht, ohne alles andere
anzufassen. Wie wenn jemand dir beim Lesen nur eine korrigierte Buchseite reinschiebt, statt dir
das ganze Buch wegzunehmen und du bei Seite 1 neu anfangen musst (= kompletter Reload).

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

**Einfach gesagt:** Vite muss genau wissen, welcher einzelne Baustein sich geändert hat, um nur
den auszutauschen. Das kann es nur, weil unsere App seit UE1 in benannte, über `import`/`export`
verbundene Bausteine aufgeteilt ist. Bei der alten, einen riesigen `app.js`-Datei hätte Vite
nicht erkennen können, "welcher Teil" sich geändert hat — es hätte immer alles neu laden müssen.

Vites komplettes Dev-Serving- und Bundling-Modell **basiert** auf dem nativen ES-Modul-Graphen: `<script type="module" src="…">` plus `import`/`export`-Anweisungen geben Vite einen echten, statisch analysierbaren Abhängigkeitsbaum. Dadurch kann Vite:
- jede Datei **einzeln, on demand** ausliefern (im Netzwerk-Log genau so beobachtet — 13 einzelne `js/*.js`-Requests statt einer riesigen Datei),
- bei einer Änderung **exakt wissen, welches eine Modul betroffen ist** und nur das neu schicken (die Grundlage für HMR überhaupt),
- beim Produktions-Build (Demo 3) **Tree-Shaking/Code-Splitting** machen, weil die Abhängigkeiten explizite, statische Deklarationen sind statt impliziter globaler Reihenfolge.

Die alte `app.js` (klassisches `<script src="app.js">`, eine 1000+-Zeilen-Datei ohne `import`/`export`) hätte Vite dagegen nur als **eine beliebige statische Datei** gesehen — kein Abhängigkeitsgraph, keine Modul-Grenzen, keine Möglichkeit herauszufinden, "welcher Teil hat sich geändert". Jede Änderung hätte einen kompletten Reload gebraucht, genau wie bei einem reinen Dateiserver — Vites eigentliche Stärken (granulares HMR, Dependency-Pre-Bundling, späteres Tree-Shaking) hätten schlicht nichts, woran sie andocken könnten. Der ES-Modul-Split aus UE1 ist also nicht nur "sauberer Code", sondern die **Voraussetzung**, die diese Übung überhaupt erst sinnvoll macht — genau das sagt auch die Angabe eingangs ("you need the ES-module split from that exercise finished first").

---

## Demo 3 — Produktions-Build & Preview

`npm run build` (→ `vite build`) untersucht, `dist/` inspiziert, mit `npm run preview` End-to-End getestet, Quelle vs. Build für `js/`-Bundle und `index.html` verglichen. Details in `UE2_CHANGES.md`.

### F1: Nenne mindestens drei konkrete Transformationen, die Vite beim Produktions-Build auf deinen Quellcode angewendet hat (Bundling, Minifizierung, gehashte Dateinamen — die nennen, die du wirklich beobachtet hast).

**Einfach gesagt:** aus 13 lesbaren Dateien wurde 1 kleine, unleserliche Datei mit komischem
Namen. Drei Dinge sind dabei passiert: zusammengeklebt, zusammengequetscht, umbenannt.

Konkret bei uns beobachtet:

1. **Bundling.** Unsere 13 einzelnen `js/*.js`-Dateien (51.197 Bytes zusammen) wurden zu **einer** Datei `dist/assets/index-B1hG0RuO.js` zusammengefasst. Statt 13 Netzwerk-Anfragen im Dev-Modus gibt's im Build nur noch 1.
2. **Minifizierung.** Diese eine Datei ist nur noch 23.269 Bytes groß (**−54 %**) und steht komplett auf **einer einzigen Zeile** (0 Zeilenumbrüche, gegenüber z. B. 111 lesbaren Zeilen in `js/data.js`). Kommentare weg, Variablennamen wie `state`/`caseRes` zu `e`/`t`/`n` eingedampft.
3. **Content-Hashing der Dateinamen.** `js/main.js` (fester Name) wird zu `index-B1hG0RuO.js` (Name hängt vom exakten Inhalt ab) — Details bei F2.
4. *(Bonus, auch beobachtet)* **Umschreiben der Referenzen in `index.html`.** `<script type="module" src="js/main.js">` (stand am Ende von `<body>`) wurde nach `<head>` verschoben und zu `<script type="module" crossorigin src="/assets/index-B1hG0RuO.js">` umgeschrieben — analog für das Stylesheet. **Nicht** umgeschrieben wurde dagegen `<img src="assets/logo/logo.svg">`, weil das eine `public/`-Datei ist (siehe Demo 2) — Vite lässt `public/`-Referenzen bewusst unangetastet.

### F2: Warum enthalten Produktions-Dateinamen typischerweise einen Content-Hash? Welches Problem löst das bei echten Deployments?

**Einfach gesagt:** wie ein Chargen-Code auf einer Lebensmittelpackung — ändert sich das Rezept,
ändert sich die Nummer. So verwechselt niemand (auch nicht der Browser) alte und neue Version.

Browser (und dazwischengeschaltete CDNs) wollen Dateien **möglichst lange zwischenspeichern**
(cachen), um bei wiederkehrenden Besucher:innen nicht ständig alles neu herunterladen zu müssen
— das spart massiv Ladezeit. Das Problem dabei: **woher weiß der Browser, wann sich eine Datei
tatsächlich geändert hat**, ohne bei jedem Besuch nachzufragen (was den Cache-Vorteil wieder
zunichtemachen würde)?

Die Lösung: der Dateiname selbst wird aus dem **exakten Inhalt** der Datei berechnet
(`index-B1hG0RuO.js`). Ändert sich am Code auch nur ein Zeichen, ändert sich der ganze Hash, also
der ganze Dateiname. Das erlaubt zwei Dinge gleichzeitig, die sich sonst widersprechen würden:
- Man kann dem Browser sagen "cache `index-B1hG0RuO.js` für immer, frag nie wieder nach" (extrem
  lange Cache-Zeiten, z. B. ein Jahr) — **ohne** Risiko, weil dieser exakte Name garantiert nie
  einen anderen Inhalt bekommt.
- Ändert sich der Code, bekommt die neue Version automatisch einen **neuen** Namen — der Browser
  hat den alten Namen zwar noch gecacht, aber `index.html` verweist jetzt auf den neuen Namen,
  also lädt er zwangsläufig frisch nach.

Ohne Hash müsste man entweder sehr kurze Cache-Zeiten setzen (langsamer für alle) oder riskieren,
dass jemand tagelang eine veraltete, kaputte Version der Seite aus dem eigenen Browser-Cache
ausgeliefert bekommt, obwohl längst ein Fix online ist.

### F3: Warum würde man den Dev-Server selbst (`vite dev`/`vite`) nie für echte Nutzer:innen deployen, auch wenn er "funktioniert"?

**Einfach gesagt:** eine Baustelle "funktioniert" auch — man kann durchlaufen und alles sehen.
Trotzdem lädt man da keine Gäste ein. Der Dev-Server ist für *dich beim Programmieren* gebaut,
nicht für fremde Besucher:innen.

Konkret, direkt aus dem Vergleich unserer beiden Netzwerk-Logs:
- **Viel mehr Daten, viel mehr Requests.** Dev-Server: 13 einzelne, unminifizierte `.js`-Dateien (51 KB gesamt) plus `@vite/client` plus ein `node_modules`-Request. Preview/Produktion: 1 Datei (23 KB) plus 1 CSS-Datei. Für echte Besucher:innen (oft mit langsamerem Internet, auf dem Handy) ist das ein spürbarer Geschwindigkeitsunterschied.
- **Unnötige Entwickler-Maschinerie.** Der Dev-Server baut aktiv eine WebSocket-Verbindung für HMR auf (`[vite] connecting...`) — komplett nutzlos für jemanden, der nur deine Webseite lesen will, aber zusätzlicher Code, zusätzliche offene Verbindung, unnötige Angriffsfläche.
- **Nicht für echten Betrieb gebaut/gehärtet.** Der Dev-Server ist für den Iterations-Loop einer einzelnen Person beim Programmieren optimiert (schneller Start, hilfreiche, ausführliche Fehlermeldungen) — nicht dafür, viele gleichzeitige, fremde Besucher:innen zuverlässig und sicher zu bedienen.
- **Mehr Einblick als nötig.** Im Dev-Modus liegt der Code offen und lesbar da (mit Dateinamen, Kommentaren, Struktur) — im Produktions-Build ist er gebündelt/minifiziert. Für fremde Besucher:innen sollen nur so viele Interna wie nötig sichtbar sein.

Live beobachtet: über `vite preview` war die Konsole **komplett leer** (kein `[vite] connecting...` mehr) — der Beweis, dass die ganze Dev-Maschinerie im echten Build gar nicht mehr da ist.

---

## Demo 4 — Lint & Format

ESLint + Prettier installiert und konfiguriert, `lint`/`lint:fix`/`format`-Scripts ergänzt, eine echte ungenutzte Variable gefunden (und für die Präsentation als Ein-Klick-Demo geparkt), Prettier auf den kompletten, bisher nie formatierten Code losgelassen (13 Dateien geändert, rein kosmetisch). Details in `UE2_CHANGES.md`.

### F1: Unterschied zwischen dem, was ein Linter prüft/fixt, und dem, was ein Formatter prüft/fixt? Je einen konkreten Fund aus diesem Projekt nennen.

**Einfach gesagt:** Lektor (Linter, prüft Inhalt/Logik) vs. Schriftsetzer (Formatter, prüft nur
die Optik). Beide verbessern den Text, aus komplett unterschiedlichen Gründen.

- **Linter (ESLint) prüft Logik/Verhalten** — Dinge, die vermutlich echte Fehler sind, unabhängig
  davon, wie der Code aussieht. **Konkreter Fund hier:** `js/views/dashboard.js`, eine absichtlich
  eingebaute ungenutzte Variable → `'unreviewedCount' is assigned a value but never used
  no-unused-vars`. Das hat nichts mit Formatierung zu tun — die Zeile hätte perfekt eingerückt
  und mit den richtigen Anführungszeichen dastehen können, der Linter hätte trotzdem gemeckert.
- **Formatter (Prettier) prüft/erzwingt nur das Aussehen** — Einrückung, Zeilenumbrüche,
  Anführungszeichen, Kommas. **Konkreter Fund hier:** `js/utils.js` hatte eine Zeile, die länger
  als unser eingestelltes `printWidth: 100` war — Prettier hat sie automatisch umgebrochen und in
  Klammern gesetzt, ohne dass sich am Ergebnis (dem zurückgegebenen String) auch nur ein Zeichen
  geändert hat.

Die beiden überschneiden sich bei uns bewusst **nicht**: `eslint-config-prettier` schaltet die
paar ESLint-eigenen Optik-Regeln ab, damit die zwei Werkzeuge sich nicht gegenseitig
widersprechende Anweisungen geben.

### F2: Warum sind `lint` und `lint:fix` zwei getrennte Scripts statt einem, das immer automatisch fixt? Wann willst du bewusst die nicht-fixende Version?

**Einfach gesagt:** nicht jeder gefundene Fehler ist gefahrlos automatisch reparierbar. Eine
ungenutzte Variable könnte ein Tippfehler sein (löschen ist sicher) — oder ein Zeichen, dass du
vergessen hast, sie irgendwo zu **benutzen** (löschen würde dann einen echten Bug verstecken).
Das kann nur ein Mensch entscheiden.

Genau das haben wir live gesehen: `npm run lint:fix` auf unseren absichtlichen Fehler angewendet
— die Meldung blieb **trotzdem stehen**, `no-unused-vars` gehört zu den Regeln, die ESLint
bewusst **nicht** automatisch anfasst, weil eine automatische Lösung (Variable löschen ODER an
irgendeiner Stelle plötzlich "benutzen") in beide Richtungen falsch sein könnte.

**Wann willst du bewusst die nicht-fixende Version (`lint`) statt `lint:fix`?**
- **In der CI** (Demo 8): ein automatischer Prüflauf soll **nie heimlich deinen Code umschreiben**
  und das Ergebnis committen — er soll nur **melden**, dass etwas nicht stimmt, und den Build rot
  färben. Ein Mensch entscheidet dann, wie der Fix aussieht.
- **Beim Reviewen fremden Codes**, wenn du erstmal nur sehen willst, *was* gemeldet wird, bevor du
  irgendetwas automatisch veränderst.
- **Immer dann**, wenn ein gemeldetes Problem (wie eine ungenutzte Variable) mehrdeutig ist und
  eine automatische Lösung genauso gut die falsche sein könnte wie die richtige.

### F3: Was macht `npm run lint` (bzw. `pnpm lint`) eigentlich "unter der Haube"? Wo sucht npm nach dem `lint`-Kommando, und würde es funktionieren, wenn dein Linter nicht als Projekt-Abhängigkeit, sondern nur global installiert wäre?

**Einfach gesagt:** npm schaut in `package.json` unter `scripts.lint` nach, findet den Text
`"eslint ."`, und führt den aus — dabei schaut es **zuerst** im Projekt selbst nach einem
passenden Programm, nicht irgendwo auf dem ganzen Rechner.

Genauer: `npm run lint` liest den String bei `scripts.lint` in `package.json` (`"eslint ."`) und
führt ihn wie einen Terminal-Befehl aus. Damit das mit dem *unqualifizierten* Namen `eslint`
funktioniert (kein Pfad davor), hängt npm für die Dauer dieses einen Befehls den Ordner
`node_modules/.bin/` **vorne** an den Suchpfad (`PATH`) an. Genau in diesem Ordner legt npm beim
Installieren jedes Pakets, das ein Kommandozeilen-Werkzeug mitbringt (wie `eslint` oder `vite`),
automatisch eine kleine ausführbare Verknüpfung an. Deshalb findet `npm run lint` unser lokal
installiertes ESLint, ganz ohne dass wir irgendwo einen Pfad dazu angeben mussten.

**Würde es auch mit einer nur global installierten Version funktionieren?** Technisch oft ja —
wenn im Projekt selbst kein `node_modules/.bin/eslint` existiert, fällt die normale
Shell-Pfadsuche auf den Rest deines System-`PATH` zurück, und ein global installiertes `eslint`
würde dort gefunden. **Aber das wäre die falsche, fragile Lösung:**
- Ein Teammitglied oder die CI, das/die dieses globale Programm nicht installiert hat, bekommt
  schlicht `eslint: command not found` — das Projekt ist auf einmal nicht mehr „von selbst"
  lauffähig, nur noch mit stillem Vorwissen über die eigene Maschine.
- Selbst wenn alle zufällig irgendein globales ESLint haben, könnten das **unterschiedliche
  Versionen** sein — dieselbe Versions-Drift-Problematik wie bei einer fehlenden Lockfile in
  Demo 1 ("bei mir meldet der Linter das, bei dir nicht").

Deshalb installieren wir ESLint/Prettier als **`devDependencies`**: sie werden dadurch Teil des
reproduzierbaren Projekt-Setups (in `package.json` + `package-lock.json` festgehalten, genau wie
`dayjs` oder `vite`), nicht eine zufällige Eigenschaft von irgendjemandes Rechner.

---

## Demo 5 — TypeScript-Einstieg & erste Konvertierungen

TypeScript installiert, `tsconfig.json` mit bewusst gewählten Einstellungen, `js/utils.ts` + `js/lookup.ts` konvertiert (0 Fehler, kein `any`), `tsc --noEmit` in `npm run build` eingehängt. Unterwegs 7 echte, lehrreiche Typfehler gefunden und sauber gelöst (nicht mit `any` übertüncht). Details in `UE2_CHANGES.md`.

### F1: Was schaltet `strict` in `tsconfig.json` eigentlich ein? Mindestens zwei einzelne Prüfungen nennen, sagen ob du es an gelassen hast und warum.

**Einfach gesagt:** `strict` ist ein Sammelschalter für ca. acht einzelne strengere Prüfungen auf
einmal. Wir haben ihn an gelassen, weil genau zwei davon in unserem Code sofort real etwas
gebracht haben.

`strict: true` schaltet unter anderem ein:
- **`strictNullChecks`** — `null`/`undefined` werden nicht mehr stillschweigend als Teil von
  *jedem* Typ akzeptiert; ein Wert, der fehlen kann, muss das explizit im Typ tragen
  (`string | undefined`), und jede Stelle, die ihn benutzt, muss das vorher abfangen.
  **Direkt bei uns erlebt:** `evidenceMentionsPerson` hat `personIds?: string[]` (optional) im
  Interface. Ohne `strictNullChecks` wäre `ev.personIds.indexOf(...)` einfach so durchgegangen;
  **mit** hätte TypeScript diese Zeile abgelehnt, wenn der vorhandene `if (!ev.personIds) return
  false;`-Guard nicht schon dagestanden hätte. Der Guard war schon vorher aus JS-Vorsicht da — mit
  `strictNullChecks` wird er vom "guten Stil" zur **Pflicht**.
- **`noImplicitAny`** — jeder Wert ohne erkennbaren Typ (z. B. ein Funktionsparameter ohne
  Annotation) wird zum Fehler, statt still zu `any` zu werden. **Direkt relevant:** genau das
  hätte uns gestoppt, wenn wir in `formatDate` vergessen hätten, `ts` zu typisieren — Demo 5s
  eigene "kein `any`"-Vorgabe ist im Grunde `noImplicitAny` in Textform.
- (auch dabei, bei uns aber praktisch wirkungslos, weil wir keine Klassen benutzen:
  `strictPropertyInitialization`, `strictBindCallApply`, `noImplicitThis`, `alwaysStrict`.)

**An gelassen**, weil ein Projekt, das gerade erst mit TypeScript anfängt, von Anfang an die
strengste sinnvolle Basis haben sollte — nachträglich `strict` einzuschalten, wenn schon viel
lockerer Code existiert, ist deutlich schmerzhafter als von Anfang an strikt zu sein und Fälle wie
unseren `never[]`-Fund sofort zu sehen, statt sie Monate später zu entdecken.

### F2: Unterschied zwischen einem Compile-Zeit-Typfehler und den Laufzeit-Bugs, die du in Übung 1 gefixt hast? Hätte TypeScript allein einen dieser konkreten Bugs fangen können? Warum (nicht)?

**Einfach gesagt:** ein Typfehler heißt "die FORM eines Werts widerspricht dem, was irgendwo
erwartet wird" — komplett unabhängig davon, ob dein Programm zur Laufzeit das *Richtige* tut. Code
kann 100 % typkorrekt sein und trotzdem jeden Bug aus UE1 enthalten.

Konkret durchgegangen:
- **Demo 2 (Referenz-Bug, `filteredEvidence = allEvidence`):** **Nein**, TypeScript hätte das
  nicht gefangen. Beide Variablen haben denselben, korrekten Typ (ein Array von Evidence-Objekten)
  — eine Referenz einer anderen Variablen zuzuweisen ist völlig gültiges, typkorrektes JavaScript.
  Der Bug ist eine Frage der **Objekt-Identität zur Laufzeit** (zwei Namen zeigen auf dasselbe
  Array), nicht der Form der Daten — dafür hat TypeScripts Typsystem kein Konzept.
- **Demo 3 (async-Bug, `evidenceViewLoading` nie auf `false` gesetzt):** **Nein.** Das ist eine
  fehlende Zeile, keine Typverletzung. `evidenceViewLoading: boolean` ist ein gültiger Typ, ob der
  Wert *irgendwann* auf `false` gesetzt wird, ist eine Frage des **Kontrollflusses zur Laufzeit**,
  die TypeScript nicht verfolgt.
- **Demo 4 (stiller Bug, Promise geloggt statt `await`-etem Wert):** **Auch hier nein** — in der
  Form, wie der Bug tatsächlich auftrat (`console.log("...", loadNoteAsync(...))`). `console.log`
  akzeptiert *jeden* Typ anstandslos, ein `Promise<string>` ist ein zulässiger Typ, kein Fehler.
  TypeScript *hätte* geholfen, wenn der Rückgabewert danach als `string` weiterverwendet worden
  wäre (`firstNote.toUpperCase()` z. B. hätte TS abgelehnt) — aber genau das ist hier nicht
  passiert, der Wert wurde nur geloggt.
- **Demo 5.5 (kaputtes `localStorage` legt die App lahm, `JSON.parse` ohne `try/catch`):**
  Ebenfalls **nein**, und das aus einem besonders lehrreichen Grund: `JSON.parse` ist in
  TypeScripts eigener Standardbibliothek mit Rückgabetyp **`any`** deklariert — TypeScript kann
  beim Parsen von Text, dessen Inhalt es unmöglich vorher kennen kann, grundsätzlich nichts über
  die Form des Ergebnisses aussagen. Dass der String überhaupt gültiges JSON ist, ist eine
  Laufzeit-Frage (`try/catch`), keine, die ein Typsystem beantworten kann.

**Fazit:** keiner der konkreten UE1-Bugs war ein Typfehler — sie waren Aliasing-, Kontrollfluss-,
Timing- und Eingabe-Validierungs-Probleme. TypeScript ist eine **andere Achse** der
Fehlerprävention als das, was UE1s Bug-Hunting-Demos gebraucht haben; es ersetzt Testen/Debuggen
nicht, es ergänzt es um eine Kategorie von Fehlern, die diese vier Bugs zufällig alle nicht waren.

### F3: Was macht `any` mit TypeScripts Prüfung für einen Wert, und warum hast du es in diesem ersten Durchgang vermieden, obwohl es schneller gewesen wäre, die Fehler einfach damit zum Schweigen zu bringen?

**Einfach gesagt:** `any` heißt "prüf hier gar nichts mehr" — sieht aus wie TypeScript, ist aber
an dieser Stelle (und überall, wohin der Wert von da an fließt) einfach wieder JavaScript ohne
Netz.

`any` schaltet für einen Wert **jede** Typprüfung ab: er darf jedem beliebigen Typ zugewiesen
werden, jede Eigenschaft/Methode darf ungeprüft auf ihm aufgerufen werden, und diese
"Prüfungslosigkeit" **wandert mit** — verbindet man einen `any`-Wert mit einem sauber getypten
Wert, wird an dieser Stelle oft auch die Prüfung für den sauberen Wert stillschweigend ausgehebelt
("`any` ist ansteckend"). Man schreibt zwar `.ts`, aber genau dieser eine Wert ist wieder
komplett ungeprüftes JavaScript.

**Warum hier vermieden, obwohl schneller:** hätten wir `stateJs as any` statt des engen `stateJs
as AppState` geschrieben, wären alle sieben echten Fehler aus Task 2 **sofort verschwunden** —
nicht behoben, nur **unsichtbar gemacht**. Und ab dann hätte TypeScript uns bei jedem künftigen
echten Fehler an genau dieser Stelle (z. B. `evidence.id` versehentlich mit einer Zahl statt einem
Text verglichen, ein Feldname vertippt) ebenfalls nichts mehr gesagt — falsche Sicherheit ("hat ja
kompiliert!"), ohne einen einzigen der eigentlichen Vorteile von TypeScript. Der enge Type-Assertion
(`as AppState`) hat genauso viel "Vertrauensvorschuss" gebraucht, prüft aber weiterhin **strukturell**
mit — ein Tippfehler im Feldnamen oder eine falsche Form wäre dort immer noch aufgefallen.
