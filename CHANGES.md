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
