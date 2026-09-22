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
