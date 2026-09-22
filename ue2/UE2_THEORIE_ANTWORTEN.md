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
