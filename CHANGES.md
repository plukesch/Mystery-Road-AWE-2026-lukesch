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
