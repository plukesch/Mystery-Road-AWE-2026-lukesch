# CHANGES

Laufendes Änderungsprotokoll für Exercise 1 (Refactoring).

---

## Demo 1 — Split der App in ES-Module

**Ziel:** reiner Refactor. Verhalten identisch, Bugs bleiben absichtlich drin.

### index.html
- `<script src="app.js"></script>` → `<script type="module" src="js/main.js"></script>`

### Neue Modulstruktur (`js/`)

| Datei | Aufgabe | Öffentlich (export) | Privat |
|---|---|---|---|
| `state.js` | zentraler mutable State + Storage-Keys | `default` = `state`, named `STORAGE_KEYS` | – |
| `utils.js` | pure Format-Helper | `formatDate`, `getStatusBadgeClass`, `getRelevanceBadgeClass` | – |
| `lookup.js` | Suche im State (nur lesen) | `findEvidenceById`, `findPersonById`, `findLocationById`, `evidenceMentionsPerson`, `countEvidenceForPerson` | – |
| `storage.js` | localStorage für bookmarks & notes | `save/loadBookmarksFromStorage`, `save/loadNoteForEvidence`, `loadNotesFromStorage`, `loadNoteAsync` | – |
| `data.js` | JSON laden + Views anstoßen | `loadAllData` | `loadCorePeopleAndLocations`, `loadEvidenceData`, `loadTimelineData`, `showLoadingOverlay`, `hideLoadingStep` |
| `navigation.js` | Hash-Routing | `navigateTo`, `handleHashChange` | – |
| `dropdowns.js` | Aggregator für 3 Dropdown-Füller | `populateAllDropdowns` | – |
| `views/dashboard.js` | Dashboard-Render | `renderDashboard` | `statCardHTML` |
| `views/evidence.js` | Evidence-Liste + Detail | `renderEvidenceList`, `populateEvidenceDropdowns`, `applyStoredBookmarkFlags`, `handleSortChange`, `clearFilters`, `handleSearchInput`, `openEvidenceDetail`, `closeEvidenceDetail`, `saveCurrentNote` | `getFilteredEvidence`, `renderEvidenceCardHTML`, `handleEvidenceListClick`, `handleBookmarkClick`, `simulateAsyncSearch`, `renderEvidenceDetail`, `statusOptionHTML` |
| `views/people.js` | People & Locations | `switchPeopleTab`, `renderPeople`, `renderLocations` | – |
| `views/timeline.js` | Timeline + Quick-View-Modal | `populateTimelineDropdowns`, `renderTimeline` | `certaintyBadgeClass`, `openEvidenceModal` |
| `views/workspace.js` | Bookmarks-/Notes-Liste + Hypothese | `renderWorkspace`, `populateHypothesisDropdowns`, `saveHypothesis` | `renderBookmarksList`, `renderNotesList`, `loadHypothesisFromStorage`, `getSelectedOptions` |
| `main.js` | Entry-Point: Event-Listener + Init | – | `setupEventListeners`, `initApp` |

### Wichtige Entscheidungen
- **State als ein Objekt** (`state.js`), nicht ~20 einzelne `export let`. Grund: importierte Bindings darf ein anderes Modul nicht neu zuweisen; Properties eines importierten Objekts schon. So bleibt auch der Referenz-Bug (`filteredEvidence = allEvidence`) 1:1 erhalten.
- **`window`-Brücke in `main.js`** für 7 Funktionen (`navigateTo`, `switchPeopleTab`, `handleSortChange`, `saveHypothesis`, `closeEvidenceDetail`, `saveCurrentNote`, `renderEvidenceList`). Grund: `index.html` nutzt noch Inline-`onclick`/`onchange`, und `app.js` setzte per `setAttribute("onchange", ...)` einen Inline-Handler. Modul-Scope ist nicht global → Inline-Handler finden die Funktion sonst nicht. Wird in einer späteren Übung auf `addEventListener` umgestellt.
- **Zirkuläre Imports** (`navigation.js` ↔ `views/*`): bewusst in Kauf genommen. Unkritisch, weil die gegenseitigen Aufrufe erst zur Laufzeit (Klick/Hashchange) passieren, nicht bei der Modul-Auswertung.

### Bewusst NICHT geändert (kommt in späteren Demos)
- Alle `var` innerhalb von Funktionen bleiben `var`.
- Keine Arrow-Function-Umstellung, keine `.then()`→`async/await`-Umstellung.
- Alle Bugs bleiben. Verifiziert reproduzierbar nach dem Refactor:
  - Evidence-Liste hängt dauerhaft auf „Loading evidence…" (`state.evidenceViewLoading` wird nie `false`).
  - `console.log("First note preview:", firstNote)` loggt ein `Promise` statt Text (kein `await`).
  - Timeline zeigt `Location: [object Object]` (ganzes Objekt statt `.name`).
  - Klick auf Nav-Button wirft `TypeError: … reading 'getAttribute'` (`var i` Closure in `setupEventListeners`).

### Verifikation
Lokaler Server, alle 12 Module + 5 JSON-Dateien laden mit `200`, alle 5 Views rendern identisch zum Original, Ladereihenfolge (case → people → locations → evidence → timeline) unverändert.

---

## Demo 2 — Mutation-/Referenz-Bug

### Datei
[`js/data.js`](js/data.js), Funktion `loadEvidenceData`.

### Der Bug
```js
state.filteredEvidence = state.allEvidence;   // vorher
```
`filteredEvidence` und `allEvidence` sind danach **dasselbe Array-Objekt** (nur zwei Namen dafür), nicht zwei Listen. Kein Kopiervorgang, nur eine zweite Referenz.

`handleSortChange` (in `js/views/evidence.js`) macht `state.filteredEvidence.sort(...)`. `Array.prototype.sort` sortiert **in-place** — es verändert das Array, auf dem es aufgerufen wird. Da beide Namen aufs selbe Array zeigen, wird damit auch `allEvidence` dauerhaft umsortiert.

### Reproduktion (kalt, im Browser bestätigt)
1. Seite frisch laden. `allEvidence`-Reihenfolge = `E01 … E18`.
2. Im Evidence-View das Sort-Dropdown auf „Title (A–Z)" stellen (`onchange="handleSortChange()"`).
3. `allEvidence` ist danach `E12,E03,E10,E16,…` — die **Master-Liste** wurde durch das Sortieren der „gefilterten Ansicht" zerlegt.
4. Sichtbare Folge: Dashboard-Panel „Recent evidence" (`allEvidence.slice(-5).reverse()`) zeigt danach `E18, E02, E09, E14, E15` statt korrekt `E18, E17, E16, E15, E14`.

> Anmerkung: `filteredEvidence` bleibt hier ausnahmsweise dauerhaft `=== allEvidence`, weil der Evidence-View wegen des Demo-3-Bugs (`evidenceViewLoading` nie `false`) nie `getFilteredEvidence()` erreicht, das sonst ein frisches Array zuweisen würde. Die beiden Bugs verstärken sich → Thema für Demo 5.

### Fix
```js
state.filteredEvidence = state.allEvidence.slice();   // flache kopie
```
`.slice()` ohne Argumente gibt ein **neues** Array mit denselben Elementen zurück. Sortieren von `filteredEvidence` fasst `allEvidence` jetzt nicht mehr an.

### Verifikation des Fixes
- Nach dem Fix: `filteredEvidence === allEvidence` → `false` direkt beim Laden.
- Sort nach Titel **und** nach Datum ausgelöst → `allEvidence` bleibt `E01 … E18`.
- Dashboard „Recent evidence" bleibt korrekt (`E18, E17, E16, E15, E14`).
- Regressions-Sweep: People (6 Karten), Timeline (15 Events), Workspace, Dashboard-Stats (`18/6/6/0/1`) unverändert. Console nur der bekannte `First note preview: Promise`-Log, nichts Neues.

### Folgebefund (NICHT hier gefixt, gehört zu Demo 5 / später)
Der „Sort" sortierte die sichtbare Liste vorher nur, *weil* er über die geteilte Referenz `allEvidence` umbaute und `getFilteredEvidence` danach in dieser neuen Reihenfolge iterierte. Mit dem Fix ist Sort faktisch ein No-op, sobald die Liste wirklich rendert (`getFilteredEvidence` baut `filteredEvidence` jedes Mal frisch aus `allEvidence` auf). Das Sortier-Feature *richtig* zu machen ist ein eigenes Thema und nicht Teil von Demo 2 (= Mutationsbug beseitigen).

---

## Demo 3 — Asynchron-/Promise-Handling-Bug

### Datei
[`js/data.js`](js/data.js) → `loadEvidenceData` (State-Flag lebt in [`js/state.js`](js/state.js), gelesen in [`js/views/evidence.js`](js/views/evidence.js) → `renderEvidenceList`).

### Die async-Operation
`fetch("data/evidence.json")` → `.json()` → liefert das Array der 18 Evidenz-Objekte. Zwei-Stufen-Promise (erst Response, dann Body-Parse), am Ende landet das Ergebnis im `.then(function(data){…})`.

### Der Bug
`state.evidenceViewLoading` wird **genau einmal** gesetzt — im Initializer auf `true` — und **nie wieder**. `renderEvidenceList` macht ganz am Anfang:
```js
if (state.evidenceViewLoading) { /* spinner zeigen */ return; }
```
Der Erfolgs-Callback des `fetch` setzt zwar `state.allEvidence = data`, aber **nicht** `evidenceViewLoading = false`. Ergebnis: die Evidenz-Liste hängt dauerhaft auf „Loading evidence…", obwohl die Daten längst im Speicher sind. Jeder spätere `renderEvidenceList` (Filter, Sort, Suche, Tab-Wechsel) springt sofort wieder mit Spinner raus.

**Zeitpunkt im Lebenszyklus:** der Fehler passiert **on success** — das Update, das *nach* dem Auflösen des Promise hätte passieren müssen (Flag zurücksetzen), fehlt schlicht. „Before it starts" ist der Zustand korrekt (`true` = lädt noch), „pending" ist korrekt, nur der Übergang „resolved → nicht mehr am Laden" wird nie geschrieben.

### Reproduktion (kalt bestätigt)
1. App laden, auf „Evidence" klicken, beliebig lange warten.
2. Liste zeigt permanent den Spinner, 0 Karten.
3. Beweis, dass die Daten da sind: Dashboard sagt „18 Evidence items", Network-Tab zeigt `evidence.json` → `200`. Konsole: `state.evidenceViewLoading === true`, `state.allEvidence.length === 18`, `#evidenceList` leer.
4. `grep evidenceViewLoading` über `js/` → nur der Initializer (`true`) und der Lese-Check. **Keine** Zuweisung auf `false`.

### Fix
In `loadEvidenceData`:
- **im `.then` (Erfolg):** `state.evidenceViewLoading = false;` — als **erste** Zeile im Callback, damit der `renderEvidenceList()`-Aufruf am Ende desselben Callbacks nicht mehr am Frueh-Return hängenbleibt.
- **im `.catch` (Fehler):** ebenfalls `state.evidenceViewLoading = false;` + `renderEvidenceList()` — sonst hängt der Spinner z. B. bei einem 404 ewig; jetzt zeigt die Liste stattdessen ihren Leer-Zustand.

Kein Delay, kein Retry, kein Polling — nur das fehlende State-Update an der richtigen Stelle im Promise-Lifecycle.

### Verifikation des Fixes
- Nach dem Laden: `state.evidenceViewLoading === false`, Spinner versteckt, **18 Karten** im DOM.
- Filter „Reviewed" → 1 Karte (E12), Filter leeren → wieder 18. Suche/Filter/Sort erreichen jetzt `getFilteredEvidence`.
- Konsole sauber (nur der bekannte `First note preview: Promise`-Log → Demo 4).
- Regression: Dashboard/People/Timeline/Workspace unverändert.

### Wechselwirkung mit Demo 2 (→ Demo 5)
Jetzt wo die Liste wirklich rendert, ist sichtbar: das **Sort-Dropdown bewirkt nichts** (`getFilteredEvidence` baut `filteredEvidence` jedes Mal frisch aus `allEvidence` auf, die Sortierung wird sofort überschrieben). Vorher „funktionierte" Sort nur als Nebeneffekt des Referenz-Bugs aus Demo 2. Das Beheben von Demo 2 + Demo 3 hat also einen dritten Defekt *freigelegt* (Sort ist nie korrekt implementiert worden). Nicht hier gefixt — Eintrag für Demo 5.

---

## Demo 4 — Stiller Bug (nur Konsole, keine sichtbare UI-Änderung)

### Datei
[`js/main.js`](js/main.js) → `initApp` (die Funktion in [`js/storage.js`](js/storage.js) → `loadNoteAsync`).

### Konsolen-Output (vorher, exakt)
```
First note preview: Promise {<fulfilled>: ''}
```
Erscheint bei **jedem Seiten-Load**, ohne jede Interaktion. In der UI passiert nichts — nirgends wird eine „first note preview" angezeigt.

### Ursache
```js
var firstNote = loadNoteAsync("E01");        // main.js
console.log("First note preview:", firstNote);
```
`loadNoteAsync` ist `return new Promise(function (resolve) { resolve(state.notesStore[id] || ""); })` — gibt also ein **Promise** zurück, keinen String. `firstNote` ist die Promise-Hülle, wird nie ausgepackt (`await` / `.then` fehlt). `console.log` druckt die Hülle: `Promise {<fulfilled>: ''}`. Der eigentlich gemeinte Wert wäre `""` (für E01 ist keine Notiz gespeichert). Gleiche Fehlklasse wie Demo 3: ein Promise wird behandelt, als wäre es schon der fertige Wert.

Bestätigt: `loadNoteAsync("E01") instanceof Promise === true`, `await loadNoteAsync("E01") === ""`. Der Aufruf steht app-weit nur an dieser einen Stelle (`grep loadNoteAsync`).

### Fix
Die zwei Zeilen (`var firstNote = …` + `console.log`) ersatzlos aus `initApp` entfernt und `loadNoteAsync` aus dem `import` in `main.js` gestrichen. Es ist ein Debug-Rest ohne Zweck (rendert nirgends). `loadNoteAsync` in `storage.js` ist damit toter Code → mit `TODO demo 8` markiert.

### Verifikation
Seite laden + durch alle 5 Views navigieren → **Konsole komplett leer** („No console logs"). Vorher/nachher-Diff ist eindeutig.

### Zweiter stiller Bug gefunden (NICHT hier gefixt → Demo 8 / Demo 5)
Klick auf einen **Nav-Button** wirft `Uncaught TypeError: Cannot read properties of undefined (reading 'getAttribute')` (`js/main.js`, im `setupEventListeners`-Nav-Loop). Ursache: `for (var i …)` + Closure — beim Klick ist `i === navButtons.length`, also `navButtons[i] === undefined`. Navigation funktioniert trotzdem (Inline-`onclick`/hashchange). Das ist genau das `var`-Scoping-Beispiel für Demo 8, daher dort gefixt.

---

## Demo 5 — Voller Durchlauf: weitere Bugs

Alle über die App-Bedienung + Konsole gefunden und im Browser (frischer Port pro Test wegen Modul-Cache) bestätigt.

### Übersicht

| # | Bug | sichtbar? | gefixt in |
|---|---|---|---|
| 5.1 | Timeline zeigt `Location: [object Object]` | ja | Demo 5 |
| 5.2 | Sort-Dropdown bewirkt nichts (durch Demo-2/3-Fixes freigelegt) | ja | Demo 5 |
| 5.3 | Dashboard-Stats frieren nach dem ersten Rendern ein | ja | Demo 5 |
| 5.4 | Klick auf den ★-Stern öffnet das Detail statt zu bookmarken | ja | Demo 5 |
| 5.5 | Kaputter `localStorage`-Eintrag legt die GANZE App lahm | ja (App leer) | Demo 5 |
| 5.6 | Timeline-Quick-View-Modal: click-listener bei jedem Öffnen neu + Konsolen-Spam | halb | Demo 5 |
| 5.7 | Nav-Button-Klick wirft `TypeError` (`var i` closure) | nur Konsole | **Demo 8** |

Untersucht, **kein** Bug (wichtig für die Reflexionsfrage):
- Doppeltes `container.addEventListener("click", handleEvidenceListClick)` bei jedem Render — der Browser dedupliziert gleiche `(typ, listener, capture)`-Tripel, es entsteht **kein** zweiter Listener. Nur ein Stil-Thema → Kommentar für Demo 8.
- Confidence `0` nach Reload → 50? Nein. Gespeichert wird `hypConfidence.value`, also der **String** `"0"`, und `"0"` ist truthy → `draft.confidence || 50` liefert `"0"`.
- `getRelevanceBadgeClass` hat keinen `irrelevant`-Zweig → rein kosmetisch, es gibt keine CSS-Klasse `badge-irrelevant`, und CSS ist out of scope.

---

### 5.1 Timeline `Location: [object Object]`
- **Repro:** Timeline öffnen → jedes Event mit Ort zeigt `Location: [object Object]`.
- **Erwartet / tatsächlich:** erwartet den Ortsnamen; tatsächlich die `toString()`-Ausgabe eines Objekts.
- **Ursache:** `renderTimeline` → `eventLocationNames.push(evtLoc || item.locationIds[el])`. `evtLoc` ist das komplette Location-**Objekt** aus `findLocationById`. `join(", ")` ruft `String(obj)` → `"[object Object]"`.
- **Fix** (`js/views/timeline.js`): `push(evtLoc ? evtLoc.name : item.locationIds[el])`.
- **Verifiziert:** Timeline-Zeile lautet jetzt z. B. `Location: Human-Robot Interaction Laboratory`, `innerText.includes('[object Object]') === false`.

### 5.2 Sort-Dropdown ist wirkungslos
- **Repro:** Evidence öffnen → Sort auf „Title (A–Z)" → Kartenreihenfolge ändert sich nicht.
- **Erwartet / tatsächlich:** erwartet alphabetische Sortierung der Liste; tatsächlich keine Änderung.
- **Ursache:** `handleSortChange` sortierte `state.filteredEvidence` einmalig; `renderEvidenceList` ruft danach `getFilteredEvidence`, das `state.filteredEvidence` **frisch aus `allEvidence`** (unsortiert) neu aufbaut → Sortierung sofort überschrieben. Vor den Demo-2/3-Fixes „funktionierte" Sort nur als Nebeneffekt: der Referenz-Bug (Demo 2) ließ die `sort()`-Mutation auf `allEvidence` durchschlagen, und der Loading-Bug (Demo 3) verhinderte, dass `getFilteredEvidence` je lief. Beide Fixes zusammen haben den Defekt sichtbar gemacht.
- **Fix** (`js/views/evidence.js`): neue Helper-Funktion `sortEvidenceInPlace(list)`, aufgerufen in `renderEvidenceList` **nach** `getFilteredEvidence()` (das Ergebnis-Array ist frisch → in-place-`sort` fasst `allEvidence` nicht an). `handleSortChange` ist jetzt nur noch `renderEvidenceList()`.
- **Verifiziert:** Sort ändert die Liste, `allEvidence` bleibt `E01…E18`, Sortierung überlebt einen Re-Render durch Filterwechsel.

### 5.3 Dashboard friert nach dem ersten Rendern ein
- **Repro:** Evidence → Karte bookmarken → zurück aufs Dashboard → Stat „Bookmarked" steht weiter auf `0`. Erst ein Reload zeigt `1`.
- **Erwartet / tatsächlich:** erwartet, dass die Stats den aktuellen Stand zeigen; tatsächlich eingefroren auf den Stand des ersten Rendervorgangs.
- **Ursache:** `handleHashChange`: `if (hash === "dashboard" && !state.viewRendered.dashboard)`. Nach dem ersten Rendern ist `viewRendered.dashboard === true` → beim Wiederbesuch wird `renderDashboard()` nie erneut aufgerufen.
- **Fix** (`js/navigation.js`): Guard `&& !state.viewRendered.dashboard` entfernt → Dashboard rendert bei jedem Besuch neu (wie `workspace` es schon tut).
- **Verifiziert:** Bookmark setzen → Dashboard → „Bookmarked" zeigt sofort `1`.
- Anmerkung: People-/Timeline-Views haben denselben Guard, aber **keinen** sichtbaren Staleness-Bug (ihre Inhalte hängen an keinem veränderlichen Zustand). Inkonsistenz notiert für Demo 8.

### 5.4 Klick auf den ★-Stern öffnet das Detail
- **Repro:** Evidence → präzise auf das ★/☆-Zeichen einer Karte klicken (nicht auf den Button-Rand).
- **Erwartet / tatsächlich:** erwartet Bookmark an/aus; tatsächlich öffnet sich die Detailansicht der Karte.
- **Ursache:** `handleEvidenceListClick` prüfte `target.dataset.action === "bookmark"`. Das `data-action` sitzt am `<button>`, das Klick-Ziel ist aber oft das innere `<span class="bookmark-icon">` → `dataset.action` ist `undefined` → Code fällt durch zu `target.closest(".evidence-card")` → `openEvidenceDetail`.
- **Fix** (`js/views/evidence.js`): `var bookmarkBtn = target.closest("[data-action='bookmark']")` — läuft vom Klick-Ziel nach oben und findet den Button auch bei Klick aufs Icon.
- **Verifiziert:** Stern-Klick → `state.bookmarks` enthält die ID, Detail bleibt zu.

### 5.5 Kaputter `localStorage`-Eintrag legt die ganze App lahm  ← **Präsentations-Bug**
- **Repro:**
  1. App laden (läuft normal).
  2. DevTools → Application → Local Storage → den Origin auswählen.
  3. Wert von `remotion_notes` auf etwas setzen, das kein JSON ist, z. B. `hello` oder `{{{`. (Falls der Key fehlt: vorher in der App eine Notiz speichern, dann den Wert überschreiben — oder den Key direkt anlegen.)
  4. Seite neu laden.
- **Erwartet / tatsächlich:** erwartet, dass die App lädt und die Notizen halt leer sind; tatsächlich ist die **komplette App leer** — Dashboard `0/0/0/0/0`, Evidence/People/Timeline ohne Inhalt.
- **Ursache:** `loadNotesFromStorage` (und `loadHypothesisFromStorage`) machen `JSON.parse(raw)` **ohne** `try/catch` — anders als `loadBookmarksFromStorage`, das eins hat. `loadNotesFromStorage` läuft **synchron in `initApp`, vor `loadAllData()`**. Der `SyntaxError` bricht `initApp` komplett ab → `setupEventListeners()` und `loadAllData()` laufen nie → keine Fetches, keine Daten, keine Listener. Konsole: `Uncaught SyntaxError: … is not valid JSON at initApp (main.js:79)`.
- **Fix** (`js/storage.js` + `js/views/workspace.js`): `JSON.parse` in `try/catch`, im Fehlerfall `console.warn` + leerer Fallback (`{}` bzw. Draft ignorieren). Zusätzlich Typ-Check (`typeof parsed === "object"`), damit z. B. `"5"` (valides JSON, aber kein Objekt) auch abgefangen wird.
- **Verifiziert:** beide Keys mit Müll gefüllt → Reload → App lädt alle 18 Evidenzen, alle Views funktionieren, Konsole zeigt **zwei `console.warn`** statt eines `Uncaught SyntaxError`.

### 5.6 Timeline-Modal: Listener-Leak + Konsolen-Spam
- **Repro:** Timeline → mehrfach „View Exx" klicken (Quick-View-Modal öffnen). Konsole zeigt bei jedem Öffnen `modal opened, active close listeners: 1, 2, 3, …`.
- **Erwartet / tatsächlich:** erwartet ein Modal mit genau einem Klick-Handler; tatsächlich wird bei jedem Öffnen ein weiterer `click`-Listener auf demselben (wiederverwendeten) `#quickViewModal`-Node registriert, dazu Debug-Logs.
- **Ursache:** `openEvidenceModal` erstellt den Modal-Node nur beim ersten Mal (`if (!modal) { … }`), hängt den `addEventListener("click", …)` aber **außerhalb** dieses `if` — also bei jedem Aufruf erneut. `modalCloseListenerCount` + `console.log` sind stehengebliebene Debug-Instrumentierung.
- **Fix** (`js/views/timeline.js` + `js/state.js`): Handler in eine benannte Funktion `handleModalClick` ausgelagert und `addEventListener` **in** das `if (!modal)` verschoben (einmalig). `modalCloseListenerCount` und der `console.log` entfernt.
- **Verifiziert:** Modal 5× öffnen → keine Konsolen-Ausgabe, `'modalCloseListenerCount' in state === false`, „Open full evidence" löst genau eine Navigation aus.

### 5.7 Nav-Button-Klick wirft `TypeError` → Fix in Demo 8
Dokumentiert unter Demo 4. `for (var i …)` + Closure in `setupEventListeners`. Wird in Demo 8 mit der `var`→`let`/`const`-Umstellung behoben, weil es genau das dortige Lehrbeispiel ist.

### Präsentations-Bug & Pre-Fix-Commit
Für die Live-Demo gewählt: **5.5**. Vor dem Anwenden der Demo-5-Fixes den Stand committen (`git commit -m "Demo 5: pre-fix state"` bzw. Commit-Hash notieren), damit broken↔fixed live diffbar ist.

### Wechselwirkungen zwischen den Fixes (Reflexion)
- **Demo 3 → legt 5.2 frei:** ohne den Loading-Fix rendert die Evidenz-Liste nie, also war nie sichtbar, dass Sort nichts tut.
- **Demo 2 → ändert das Symptom von 5.2:** vor dem `.slice()`-Fix „sortierte" das Dropdown scheinbar — aber nur, weil es über die geteilte Referenz `allEvidence` umbaute. Der Fix nimmt diesen unabsichtlichen Nebeneffekt weg → Sort tut jetzt *sichtbar* nichts, bis 5.2 es richtig implementiert.
- **Demo 3 → aktiviert die Cross-Links** People→Evidence und Timeline→Evidence (sie setzen `filterPerson.value` und rufen `renderEvidenceList`, was vorher am Frueh-Return hing). Kein Bugfix, aber vorher toter Code.
- **Demo 4** (stray `console.log` entfernt) ist isoliert — nichts hängt an der Zeile.
- **5.1 / 5.3 / 5.4 / 5.5 / 5.6** sind untereinander isoliert: je eine andere Funktion in einem anderen Modul. Nach dem Anwenden aller sechs: kompletter Feature-Durchlauf (jede View, Suche, Filter, Sort, Bookmark, Detail, Tab-Wechsel, Timeline-Filter, Hypothese speichern + Reload-Persistenz) grün, Konsole sauber.

---

## Demo 6 — Debugger-Session

**Keine Code-Änderung.** Reine Werkzeug-Demo. Vollständiges Live-Skript in
[`DEMO6_DEBUGGER.md`](DEMO6_DEBUGGER.md).

Kurz: am Commit `6377dd0` (Demo1 done, noch kein Bugfix) wird der **Demo-2-Bug** in
`handleSortChange` (`js/views/evidence.js`, Z. 162–182) mit dem Chrome-Debugger seziert:
Breakpoint auf Z. 163, Watch-Ausdrücke `state.allEvidence === state.filteredEvidence` (`true`)
und `state.allEvidence.map(e=>e.id).join()`, Step over / Step into (Komparator Z. 167) /
Step out, Conditional Breakpoint `a.title.startsWith("Legacy")`, Call Stack
(`handleSortChange` ← inline `onchange` des `<select>` ← `change`-Event), und zum Schluss
`state.filteredEvidence = state.allEvidence.slice()` **live in der Console** eingeben, um den
`.slice()`-Fix im laufenden Programm zu beweisen, bevor er in den Quellcode wandert.

---

## Demo 7 — DevTools-Tour

**Keine Code-Änderung.** Werkzeug-Tour durch Console / Network / Application / Elements.
Vollständiges Skript in [`DEMO7_DEVTOOLS.md`](DEMO7_DEVTOOLS.md).

Im Browser überprüft:
- **Network:** Ladereihenfolge `case → people → locations → evidence → timeline` (5 `fetch`-Requests, alle `200`), `evidence.json` Response = JSON-Array mit 18 Objekten.
- **404-Verhalten** (mit umbenanntem `data/people.json` getestet): Overlay „Loading case file…" **hängt für immer**, alle Views leer, Konsole `Failed to load resource: 404` + `Uncaught (in promise) SyntaxError: … is not valid JSON`. Ursache: `fetch()` wirft bei 404 nicht → `res.json()` parst die 404-HTML-Seite → `SyntaxError`, und in der `case/people/locations`-Kette gibt es kein `.catch`. (404 auf `evidence.json` dagegen → `.catch` mit `console.error` + `alert`; 404 auf `timeline.json` → nur `console.log`.)
- **localStorage-Keys** (Werte live ausgelesen): `remotion_bookmarks` = `["E14"]` (Array), `remotion_notes` = `{"E14":"…"}` (Objekt), `remotion_hypothesis` = voller Draft-Objekt inkl. `savedAt`.
- **Elements:** `renderEvidenceCardHTML` → `.evidence-card[data-id]` mit `.bookmark-btn`/`.bookmark-icon`, `.evidence-meta`, Badges; `renderPeople` → `.person-card` mit `.person-avatar`/`.person-role`/`.person-statement`.

---

## Demo 8 — Clean Coding: Globals, `var`/`let`/`const`, Code Smells

### Task 1 — Top-level `var` in der originalen `app.js`

18 direkt am Dateianfang (`app.js` Z. 4–35) + `var latestSearchRequestId` (Z. 498, modulweit):

```
allEvidence, filteredEvidence, selectedEvidence, bookmarks, currentPage,
allPeople, allLocations, allTimeline, caseData,
currentPeopleTab, loadingStepsRemaining, evidenceViewLoading, viewRendered,
notesStore, modalCloseListenerCount,
STORAGE_KEY_BOOKMARKS, STORAGE_KEY_NOTES, STORAGE_KEY_HYPOTHESIS,
latestSearchRequestId
```

Alle waren im **einen Script-Scope** von `app.js` — also faktisch global-ähnlich: von jeder Funktion les- und schreibbar, `var` erlaubt stilles Re-Deklarieren ohne Fehler.

**Kollisionsrisiko an drei Beispielen:**
- **`currentPage`** — sehr generischer Name. Baut später jemand ein Pagination-Widget mit `var currentPage`, teilen sich Navigation und Paginator dieselbe Variable. Zur Seite blättern verstellt die View, View-Wechsel verstellt die Seite — **ohne Fehlermeldung**, weil `var currentPage` einfach die bestehende Bindung wiederverwendet.
- **`bookmarks`** — ein „Zuletzt angesehen"- oder „Browser-Bookmarks-Import"-Feature will natürlich auch `bookmarks`. Beide `push`en rein, beide `JSON.stringify`en in *unterschiedliche* localStorage-Keys → Daten des einen Features landen im Storage des anderen.
- **`loadingStepsRemaining`** — ein Zähler. Zwei unabhängige Lader machen je `loadingStepsRemaining--` → er unterschreitet 0 zu früh → das Lade-Overlay verschwindet, während der zweite Lader noch läuft.

**Was der Modul-Split aus Demo 1 verhindert / noch nicht verhindert:**
- *Verhindert:* Jedes Modul hat seinen eigenen Top-Level-Scope. Ein privates `let x` in `timeline.js` kann mit einem `let x` in `people.js` nicht kollidieren — man sieht es gar nicht, ohne es zu importieren. Namen müssen explizit über `import` angefordert werden.
- *Noch nicht:* Der gesamte veränderliche Zustand liegt bewusst in **einem** `state`-Objekt (`state.js`). `state.currentPage` und ein hypothetisches `state.currentPage` eines anderen Features würden sich weiterhin in die Quere kommen, *wenn beide auf `state` schreiben*. Der Split hat die Kollisionsfläche von „ganzer Script-Scope" auf „Properties des einen geteilten `state`-Objekts" verkleinert (kleiner + explizit), aber nicht auf null. Strenger wäre: jedes View-Modul hält seinen eigenen privaten Zustand und bekommt Daten per Funktionsargument.

### Task 2 — `var` → `const`/`let` überall

Alle **171** `var`-Vorkommen in `js/` ersetzt (0 `var` übrig, nur noch in Kommentaren). Regeln:
- `const` als Default — DOM-Referenzen (`const container = document.getElementById(...)`), Zwischenwerte, `const results = []` + `.push` (Mutation ist keine Neuzuweisung).
- `let` nur bei echter Neuzuweisung: HTML-Akkumulatoren (`let html = ""`), `let matches` in `getFilteredEvidence`, `let events` (in `renderTimeline` neu zugewiesen: `events = events.slice().sort(...)`), `let modal` (in `openEvidenceModal`: `modal = document.createElement(...)`), `let draft` (in `try` zugewiesen), `let hash` (ggf. auf `"dashboard"` gesetzt).
- **Schleifenzähler `for (var i …)` → `for (let i …)`** — behebt nebenbei den Nav-Button-Bug, siehe Smell 4.

### Task 3 — Weitere Code Smells (behoben)

**Smell 1 — toter Code `loadNoteAsync`** (`js/storage.js`). Seit dem Demo-4-Fix nirgends mehr aufgerufen (`grep` bestätigt). Sieht aus wie eine echte Async-API, ist aber ein Fake (`new Promise(r => r(...))`) und irreführend. → Funktion + Import entfernt.

**Smell 2 — `filterStatus` doppelt verdrahtet** (`js/main.js`, `setupEventListeners`). Es standen *zwei* Handler für dasselbe `change`-Event da:
```js
document.getElementById("filterStatus").addEventListener("change", renderEvidenceList);
document.getElementById("filterStatus").setAttribute("onchange", "renderEvidenceList()");
```
→ `renderEvidenceList` lief **2×** pro Statusfilter-Änderung (verschwendet, und inkonsistent zu den anderen Filtern). Außerdem war die `setAttribute("onchange", …)`-Zeile der **einzige** Grund für `window.renderEvidenceList`. → `setAttribute`-Zeile entfernt, `window.renderEvidenceList` entfernt.

**Smell 3 — Fake-Async-Debounce in der Suche** (`js/views/evidence.js`). `simulateAsyncSearch(term)` = ein 300 ms-`setTimeout`, das eine Netzwerksuche *vortäuscht*, plus `latestSearchRequestId` als Race-Guard dafür. Es gibt aber keinen Server — und `getFilteredEvidence` liest den Suchbegriff ohnehin *live* aus dem DOM, jeder andere Filter rendert sofort mit. Der Fake-Delay hat das Tippen nur träge gemacht (Cargo-Cult-Debouncing). → `simulateAsyncSearch` + Race-Guard entfernt, `handleSearchInput` macht jetzt dasselbe wie die anderen Filter: direkt `renderEvidenceList()`. `latestSearchRequestId` aus `state.js` entfernt.

**Smell 4 — toter Debug-Loop mit `var i`-Closure-Bug** (`js/main.js`, `setupEventListeners`). Der Block
```js
for (var i = 0; i < navButtons.length; i++) {
  navButtons[i].addEventListener("click", function () {
    var targetView = navButtons[i].getAttribute("data-view");
    console.log("nav clicked:", targetView);
  });
}
```
war (a) **toter Debug-Code** — die Navigation läuft über die Inline-`onclick` + `hashchange`, dieser Listener hat nur geloggt — und (b) ein **Bug**: `var i` ist funktions-scoped, alle Closures teilen sich *dieselbe* `i`. Beim Klick ist die Schleife längst durch, `i === navButtons.length`, also `navButtons[i] === undefined` → `Uncaught TypeError: Cannot read properties of undefined (reading 'getAttribute')` bei **jedem** Nav-Button-Klick (Demo 4/5.7). → Block ersatzlos entfernt. (`for (let i …)` hätte den Bug auch behoben — jede Iteration bekommt ihr eigenes `i` — aber der Code hatte keinen Zweck.)

### Identifiziert, NICHT behoben (bewusst)
**Notiz-Text via `innerHTML`** (`saveCurrentNote`, `renderNotesList`, `renderEvidenceDetail`). Vom Nutzer getippter Notiztext wird per String-Konkatenation in `innerHTML` gerendert (`preview.innerHTML = text`, `<div id="noteText-…">' + entry.text + '</div>`) → klassischer XSS-Vektor. Nicht in Demo 8 gefixt, weil ein sauberer Fix eine konsistente Escaping-/`textContent`-Umstellung über ~4 Stellen (inkl. Textarea-Befüllung) braucht und die Datenquelle hier lokal/vertrauenswürdig ist. Mit `// TODO code smell` markiert.

### Verifikation
Frischer Server, voller Durchlauf: Daten laden `6/18/15`, **Nav-Button-Klicks werfen keinen Fehler mehr** (`navClickErrors: []`), Suche filtert (jetzt ohne 300 ms-Verzögerung), Statusfilter rendert ohne Fehler, Sort funktioniert + `allEvidence` bleibt intakt, People-Cross-Link / Timeline-Modal / „Open full evidence" / Workspace-Speichern+Reload alle grün, **Konsole leer** (kein `nav clicked:`-Spam mehr).

---

## Demo 9 — Verschachtelte Promises → `async`/`await`

Alle Änderungen in [`js/data.js`](js/data.js). Verhalten 1:1 erhalten (inkl. sequenziell + Fehlerbehandlung).

### Task 1 — Die tiefste `.then()`-Kette (Skizze vorher)

`loadCorePeopleAndLocations` — **6 Ebenen** tief:

```
fetch("data/case.json")            .then(caseRes =>        [1] auf case-response warten
  caseRes.json()                   .then(caseJson => {     [2] case-body parsen -> state.caseData
    fetch("data/people.json")      .then(peopleRes =>      [3] startet ERST jetzt
      peopleRes.json()             .then(peopleJson => {   [4] people-body parsen -> state.allPeople
        fetch("data/locations.json").then(locRes =>        [5] startet ERST jetzt
          locRes.json()            .then(locJson => {      [6] locations-body parsen -> state.allLocations
            hideLoadingStep(); renderDashboard(); populateAllDropdowns();
```

Was vor der nächsten Ebene fertig sein muss: Ebene *n+1* startet erst, wenn die Promise aus Ebene *n* resolved ist. Jedes `fetch` wartet also auf das **vollständige Parsen** der vorigen Datei → strikt nacheinander, kein Overlap. **Kein `.catch`** in der ganzen Kette (deshalb hängt ein 404 die App — Demo 7).

### Task 2 — als `async` mit `await` (Verhalten identisch)

```js
async function loadCorePeopleAndLocations() {
  const caseRes = await fetch("data/case.json");
  state.caseData = await caseRes.json();
  const peopleRes = await fetch("data/people.json");
  state.allPeople = await peopleRes.json();
  const locationsRes = await fetch("data/locations.json");
  state.allLocations = await locationsRes.json();
  hideLoadingStep(); renderDashboard(); populateAllDropdowns();
}
```

Jedes `await` = ein Punkt, an dem die vorige Stufe fertig sein **muss**, bevor die nächste Zeile läuft → identische Reihenfolge, identisch sequenziell. Kein `try/catch` hinzugefügt — das Original hatte keins.

### Task 3 — weitere `.then()`/`.catch()`/`.finally()`-Stellen

- **`loadEvidenceData`**: `.then(res=>res.json()).then(data=>{…}).catch(err=>{…})` → `async` mit `try/catch`. Der `catch`-Inhalt (Flag `false`, `console.error`, `alert`, ggf. Re-Render) **unverändert**.
- **`loadTimelineData`**: `.then().then().catch().finally()` → `async` mit `try/catch/finally`. `catch` = `console.log("timeline load error", err)` wie im Original, `finally` = `hideLoadingStep()`.
- **`loadAllData`**: `.then(cb)` → `await loadCorePeopleAndLocations();` dann `loadEvidenceData(); loadTimelineData();` **ohne `await`** — genau wie vorher (die beiden laufen im Hintergrund weiter, `loadAllData` ist „fertig", sobald core da ist).

### Task 4 — Verifikation mit dem Debugger

Live: Breakpoint auf die erste Zeile von `loadCorePeopleAndLocations` (`const caseRes = await fetch(...)`), Seite neu laden. Dann Schritt für Schritt:
- **Step over** über `await fetch("data/case.json")` → der Debugger „verschwindet" kurz (Funktion suspendiert), kcommt zurück wenn die Response da ist; `caseRes` im Scope ist jetzt ein `Response`.
- Weiter über `await caseRes.json()` → `state.caseData` wird gesetzt.
- **Call Stack** an dem Breakpoint: `loadCorePeopleAndLocations` ← `loadAllData` ← `initApp` ← `DOMContentLoaded`-Listener. Nach dem ersten `await` zeigt der Stack nur noch `loadCorePeopleAndLocations` (async continuation) — der Rest ist abgewickelt, das Programm lief weiter.
- Beobachtung: `state.caseData` → `state.allPeople` → `state.allLocations` werden **in genau dieser Reihenfolge** gesetzt, jedes erst nach dem `await` davor. Gegenprobe über die Performance-Timeline: `case.json` @57ms → `people.json` @61ms → `locations.json` @64ms → `evidence.json`+`timeline.json` @68ms — **identisch zum `.then()`-Original**.

### Verifikation (Browser)
- Normaler Load: `case/people/locations` strikt sequenziell, dann `evidence`+`timeline` zusammen (fire-and-forget) — Fetch-Reihenfolge unverändert.
- Alle Views: 18 Evidenz-Karten, 6 Personen, 15 Timeline-Events, Dashboard `18/6/6/0/1`, Konsole leer.
- `loadAllData() instanceof Promise` → `true`.
- **Fehlerpfad** (mit umbenanntem `evidence.json` getestet): `try/catch` fängt wie vorher — `console.error("Failed to load evidence.json", …)` + `alert(...)`, `evidenceViewLoading` wird `false`, Liste zeigt „No evidence matches…" (kein hängender Spinner), core + timeline laden unabhängig weiter, Overlay verschwindet.

---

## Demo 10 — Arrow Functions

Kein `this`, kein `arguments`, kein `new`-Konstruktor irgendwo im Code (`grep` bestätigt) → alle Kandidaten waren technisch konvertierbar; ausgewählt wurden die, wo eine Arrow *besser liest*.

### Task 1 — benannte / Expression-Funktionen → Arrow

- **`js/utils.js`**: `formatDate`, `getStatusBadgeClass`, `getRelevanceBadgeClass` → `export const … = (x) => { … }`. Pure Helfer ohne `this`, werden nur zur Laufzeit aus anderen Funktionen aufgerufen (Hoisting egal).
- **`js/lookup.js`**: `evidenceMentionsPerson` → `export const evidenceMentionsPerson = (ev, person) => { … }`. (`findXById` + `countEvidenceForPerson` bewusst als `function`-Declarations gelassen — siehe Task 3.)
- **Comparator-/Callback-Expressions** (als Argument übergeben):
  - `js/views/evidence.js` `sortEvidenceInPlace`: 4× `.sort(function (a, b) { … })` → `.sort((a, b) => …)`.
  - `js/views/evidence.js` `handleBookmarkClick`: `.filter(function (id) { return id !== evidenceId; })` → `.filter((id) => id !== evidenceId)`.
  - `js/views/timeline.js` `renderTimeline`: `.sort(function (a, b) { … })` → `.sort((a, b) => { … })` (Block-Body wegen `diff`).
  - `js/views/workspace.js` `renderBookmarksList`: `.filter(function (ev) { return ev.bookmarked; })` → `.filter((ev) => ev.bookmarked)`.
  - diverse `setTimeout(function () { … }, N)` → `setTimeout(() => …, N)`.

### Task 2 — anonyme `function(e)`-Callbacks in `addEventListener` → Arrow

- `js/views/evidence.js` `renderEvidenceDetail`: die zwei `addEventListener("change", function (e) { … })` (Status- und Relevanz-Select) → `(e) => { … }`.
- `js/main.js` `setupEventListeners`: `hypConfidence` `addEventListener("input", function (e) { … })` → `(e) => { … }`.
- `js/views/people.js` / `timeline.js` / `workspace.js`: die `click`-Listener `function (e) { … }` → `(e) => { … }`.
- `js/main.js` `initApp`: `loadAllData().then(function () { … })` → `.then(() => { … })`.

Alle diese Callbacks lesen `e.target`, **nicht `this`** → die fehlende `this`-Bindung von Arrows stört nicht; im Gegenteil erben sie `ev` / `state` / `renderEvidenceDetail` sauber lexikalisch.

### Task 3 — bewusst NICHT konvertiert

**Alle Top-Level-`function`-Declarations der Modul-API** (`renderDashboard`, `renderEvidenceList`, `handleHashChange`, `renderTimeline`, `renderPeople`, `renderLocations`, `openEvidenceDetail`, `findEvidenceById`/`findPersonById`/`findLocationById`, `countEvidenceForPerson`, die `async`-Data-Loader …) bleiben `function`-Declarations. Begründung:
1. **Hoisting-Freiheit** — man ordnet eine Datei nach Wichtigkeit statt nach „erst definieren, dann benutzen". Bsp: `evidence.js` `renderEvidenceList` steht oben und ruft `sortEvidenceInPlace` / `renderEvidenceCardHTML`, die *darunter* stehen; `data.js` `loadAllData` steht unten und ruft die Loader darüber.
2. **Echter Name im Stack-Trace / Debugger** — `function renderTimeline` zeigt immer `renderTimeline`; wichtig für die Debugging-Demos.
3. **Kein Gewinn** — keine nutzt `this`, keine ist ein Callback. Umbauen wäre reiner Diff-Lärm.

**„Würde ich ablehnen":** ein Event-Handler, der `this === das Element` braucht, z. B.
```js
modal.addEventListener("click", function () { this.innerHTML = ""; });
```
Als **Arrow** hätte `this` keinen eigenen Wert, sondern den des umgebenden Modul-Scopes (`undefined`) → `this.innerHTML` würde werfen. Genau deshalb ist `handleModalClick` *als Arrow konvertierbar* — es benutzt `document.getElementById(...)` statt `this`. Sobald man `this` = das Element will, ist die reguläre `function` Pflicht. Gleiches gilt für Objekt-Methoden mit dynamischem `this` und für Funktionen, die ihr eigenes `arguments` brauchen.

### Verifikation
Frischer Server, voller Durchlauf: Daten `6/18/15`; **konvertierter Comparator** → Sort E12/E03/E10; **`.filter`-Arrow** in `handleBookmarkClick` → Bookmark an/aus; **Detail-`change`-Arrow** → Status „reviewed" übernommen; **People-Cross-Link-Arrow + `setTimeout`-Arrow** → 3 Karten für signal-scholar; **Timeline-Link-Arrow + Modal-`setTimeout`-Arrow** → „Open full evidence" öffnet Detail; **Workspace-`.filter`-Arrow + `saveHypothesis`-`setTimeout`-Arrow** → „Saved"-Meldung erscheint und verschwindet nach 2 s. Konsole leer.
