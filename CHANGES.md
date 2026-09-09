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
