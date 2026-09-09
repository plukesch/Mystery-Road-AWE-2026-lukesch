# Demo 7 — DevTools-Tour (Console / Network / Application / Elements)

Keine Code-Änderung. Ablauf für die Live-Vorführung. Server: `py -3 -m http.server 8137 --bind 127.0.0.1`,
Seite öffnen, **F12**.

---

## 1 — Console

1. Tab **Console**. Oben die Leiste: **Default levels ▾** (bzw. die Buttons „Errors / Warnings / Info / Verbose").
2. **Nur Errors:** Dropdown → nur „Errors" anhaken. Jetzt sind alle `console.log`-Zeilen weg, nur `console.error`/rote Meldungen bleiben.
3. **Nur Warnings:** stattdessen nur „Warnings". Zeigt z. B. `Could not read stored notes, starting empty` (nachdem man `remotion_notes` kaputtgemacht hat, siehe Teil 3).
4. **Textfilter:** ins **Filter**-Feld `stored notes` tippen → nur Zeilen mit diesem Text.
5. **Preserve log:** Häkchen **„Preserve log"** setzen. Ohne Häkchen wird die Console bei jedem Reload / jeder Navigation geleert. Mit Häkchen bleiben die alten Meldungen stehen — nötig, um Fehler zu sehen, die *beim* Reload oder direkt vor einem Seitenwechsel auftreten (z. B. der `Uncaught (in promise)` beim 404 aus Teil 2).

## 2 — Network

1. Tab **Network**. **Preserve log** dort auch anhaken. Seite neu laden (`Strg+R`).
2. Filter auf **Fetch/XHR** stellen → man sieht die 5 Datendateien in Ladereihenfolge:
   `case.json` → `people.json` → `locations.json` → `evidence.json` → `timeline.json`.
3. **Eine Request anklicken**, z. B. `evidence.json`:
   - **Headers**-Tab: `Status Code: 200 OK`, `Request Method: GET`.
   - **Response**-Tab (bzw. **Preview**): das JSON-Array mit 18 Objekten (`E01`…`E18`).
   - **Timing**-Tab: Aufschlüsselung *Queueing → Stalled → Request sent → Waiting (TTFB) → Content Download*. Auf localhost ~1–5 ms.
4. **Spalten Status / Type / Time** in der Liste: siehe Fragen unten.
5. **Throttling:** oben das Dropdown **„No throttling" → „Slow 3G"**. Seite neu laden. Beobachten (siehe F4):
   - Overlay „Loading case file…" hängt lange.
   - Dashboard rendert mehrfach mit Teildaten: kurz `People 6 / Locations 6`, aber **`Evidence items 0`** und **„0% of evidence reviewed"**, leere Panels „Recent evidence" / „Recent timeline".
   - `timeline.json` ist kleiner als `evidence.json` → Overlay kann verschwinden, **während `evidence.json` noch lädt** → für einen Moment Timeline-Einträge sichtbar, aber „Evidence items: 0".
   - Danach: Zähler springt auf 18, Panels füllen sich.
   - Zum Schluss Throttling wieder auf **„No throttling"**.

### 404 vorführen (optional, eindrucksvoll)
`data/people.json` kurz umbenennen (`people.json` → `people.json.bak`), Seite neu laden:
- Network: `people.json` mit **`404`** (rot).
- Konsole: `Failed to load resource: … 404` **und** `Uncaught (in promise) SyntaxError: Unexpected token '<', "<!DOCTYPE "… is not valid JSON`.
- App: Overlay „Loading case file…" **hängt für immer**, Dashboard/Evidence/People/Timeline leer.
- Grund: `fetch()` wirft bei einem 404 **nicht** — es liefert `res.ok === false`. Der Code prüft das nicht und ruft direkt `res.json()`, das die 404-HTML-Seite des Servers zu parsen versucht → `SyntaxError`. Diese Rejection läuft durch `loadCorePeopleAndLocations` → `loadAllData` → `initApp`, und **dort gibt es kein `.catch`** → unbehandelt, `handleHashChange()` läuft nie, `hideLoadingStep()` wird nie erreicht.
- Danach `people.json.bak` → `people.json` zurückbenennen.
- Zum Vergleich: 404 auf `evidence.json` → `loadEvidenceData` hat ein `.catch` → `console.error` + `alert(...)` + leere Liste; 404 auf `timeline.json` → nur `console.log("timeline load error", …)`, sonst still.

## 3 — Application (Chrome) / Storage (Firefox)

1. Tab **Application** → links **Storage → Local Storage → `http://127.0.0.1:8137`**.
2. In der App vorher einmal: ein Beweisstück bookmarken, eine Notiz speichern, eine Hypothese speichern. Dann erscheinen 3 Keys:

| Key | Form | Beispielwert | geschrieben von / gelesen von |
|---|---|---|---|
| `remotion_bookmarks` | JSON-**Array** von Evidence-IDs | `["E14"]` | `saveBookmarksToStorage` / `loadBookmarksFromStorage` |
| `remotion_notes` | JSON-**Objekt** `{evidenceId: text}` | `{"E14":"check the timestamp drift"}` | `saveNoteForEvidence` / `loadNotesFromStorage` |
| `remotion_hypothesis` | JSON-**Objekt** (ganzer Draft) | `{"suspectId":"kernel-colt","nature":"","evidenceIds":[],"confidence":"70","explanation":"","alternative":"","savedAt":"…Z"}` | `saveHypothesis` / `loadHypothesisFromStorage` |

3. **Wert bearbeiten:** Doppelklick auf den Wert von `remotion_bookmarks`, z. B. auf `["E01","E02"]` ändern, Enter, Seite neu laden → E01 und E02 sind jetzt gebookmarkt (Sterne aktiv, Workspace-Liste zeigt sie).
4. **Kaputt machen:** Wert von `remotion_notes` auf `hello` (kein JSON) setzen, Reload:
   - **Aktueller Stand (nach Demo-5-Fix):** App lädt normal, in der Konsole **eine** `console.warn("Could not read stored notes, starting empty", …)`, Notizen sind leer. Grund: `loadNotesFromStorage` hat jetzt ein `try/catch` um `JSON.parse` und fällt auf `{}` zurück.
   - **Vor dem Demo-5-Fix (Commit vor `cbf1f87`):** derselbe Eingriff wirft eine `Uncaught SyntaxError` synchron in `initApp`, **vor** `loadAllData()` → komplette App leer.

## 4 — Elements

1. Tab **Elements**. Werkzeug oben links (Pfeil im Kasten, `Strg+Shift+C`) → im Evidence-View auf eine **Evidence-Karte** klicken.
2. Im DOM sieht man:
   ```html
   <div class="evidence-card" data-id="E14">
     <button class="bookmark-btn " data-action="bookmark" data-id="E14" aria-label="Toggle bookmark for …">
       <span class="bookmark-icon">☆</span>
     </button>
     <h3>Production calibration-service checksum</h3>
     <div class="evidence-meta">E14 · system-log · 16. Okt. 2026 09:15</div>
     <div class="evidence-summary">…</div>
     <span class="badge badge-critical">Critical</span>
     <span class="badge badge-unreviewed">unreviewed</span>
     <span class="badge badge-unreviewed">unknown</span>
     <div><span class="tag-chip">deployment</span>…</div>
   </div>
   ```
3. Zurück zum Code: das erzeugt **`renderEvidenceCardHTML(ev)`** in [`js/views/evidence.js`](js/views/evidence.js) — String-Konkatenation, am Ende `container.innerHTML = html` in `renderEvidenceList`. Konkrete Verbindungen:
   - `data-id="E14"` ← `ev.id`; wird in `handleEvidenceListClick` per `card.getAttribute("data-id")` wieder ausgelesen.
   - `data-action="bookmark"` am `<button>`, aber das Klick-Ziel ist oft das innere `<span class="bookmark-icon">` — genau der Demo-5.4-Bug; Fix nutzt jetzt `target.closest("[data-action='bookmark']")`.
   - `badge-critical` erscheint nur, wenn `ev.tags` `"critical"` enthält; `getStatusBadgeClass(ev.status)` / `getRelevanceBadgeClass(ev.relevance)` liefern die anderen beiden Badge-Klassen.
4. Dasselbe für eine **Person-Karte** (People-View): `<div class="person-card">` mit `person-card-header` (`img.person-avatar` ← `person.avatar`, `h3` ← `person.name`, `.person-role` ← `person.role`), `<ul><li>` ← `person.responsibilities`, `.person-statement` ← `person.statement`. Erzeugt von **`renderPeople()`** in [`js/views/people.js`](js/views/people.js).
