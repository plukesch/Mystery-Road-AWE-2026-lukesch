# UE5 CHANGES

Laufendes Änderungsprotokoll für Exercise 5 (React Interactivity, State & Reactive Programming).
Baut auf dem fertigen Stand von [`../ue4/UE4_CHANGES.md`](../ue4/UE4_CHANGES.md) auf (Dashboard, People &
Locations und Timeline sind React, Router und Feature-Struktur stehen). UE5 baut die **letzten zwei Views**:
**Evidence Catalogue** und **Workspace** — die zwei zustandsreichsten (Suche, Filter, Sortierung, Bookmarks,
Notizen, Hypothesen-Formular). Ab jetzt ist Zustand erlaubt und gewollt, aber **schrittweise**: jede Demo führt
ein Konzept ein.

> **URL der lokalen App:** `http://localhost:5173/Mystery-Road-AWE-2026-lukesch/react.html#/evidence`
> (das `base` aus `vite.config.js` gehört zur Adresse).

---

## Demo 1 — Event-Handling aus vanilla-Listenern migrieren

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Ein **Event-Handler** ist eine Funktion, die der Browser aufruft, wenn der Nutzer etwas tut (klicken, tippen,
ein Formular abschicken). Die Frage ist nur: **wer hängt die Funktion wo an?**

In der vanilla-App gab es dafür **drei verschiedene Wege**, alle "von außen" an fertiges HTML geklebt:

1. `onclick="..."` **als Text im HTML-String** (`closeEvidenceDetail()`),
2. `addEventListener(...)` **im JavaScript**, nachdem das HTML in die Seite geschrieben wurde,
3. **ein einziger Listener am Container**, der bei jedem Klick nachschaut, *wer* geklickt wurde (`event.target`).

In React schreibst du den Handler **direkt an das Element**, als Prop: `<button onClick={...}>`. React kümmert
sich selbst darum, ihn anzuhängen, auszutauschen und aufzuräumen.

*Analogie:* vanilla ist ein Hotel, in dem du nach dem Bau jedem Zimmer von Hand einen Klingelknopf anschraubst
(und beim Umbau alle wieder abfallen). React ist ein Hotel, in dem der Klingelknopf **Teil der Zimmertür** ist,
wenn sie geliefert wird.

### Task 1 — Struktur beider Views + mindestens 3 Handler migriert

**Zuerst die Struktur** (die Platzhalter aus UE3 sind ersetzt):

| View | Dateien (Ordner `src/features/…`) | Rolle |
|---|---|---|
| Evidence | `evidence/EvidencePage.tsx` | **Feature**: lädt Daten, hält Bookmarks und Notizen, liest `?open=` aus der URL |
| | `EvidenceToolbar.tsx` | Suchfeld, 5 Filter, Sortierung, "Clear filters" — **sichtbar, noch nicht verdrahtet** |
| | `EvidenceCard.tsx` | eine Karte (Stern, Titel, Meta, Badges, Tags) |
| | `EvidenceDetail.tsx` | Detail-Panel (Felder, Status/Relevanz-Dropdowns, Notiz-Formular, Vorschau) |
| | `RelevanceBadge.tsx`, `evidenceHelpers.ts` | Fach-Wrapper um `Badge`; reine Helfer (Sortierung, Typen, Namen auflösen) |
| Workspace | `workspace/WorkspacePage.tsx` | **Feature**: lädt Daten, liest Bookmarks/Notizen |
| | `BookmarksList.tsx`, `NotesList.tsx` | die zwei Listen |
| | `HypothesisForm.tsx` | das Formular — **nur Struktur**, Felder noch nicht kontrolliert |
| | `workspaceHelpers.ts` | `bookmarkedEvidence()`, `noteEntries()` |
| geteilt | `shared/storage.ts` | `localStorage` für Bookmarks und Notizen (Evidence **und** Workspace brauchen ihn) |
| | `shared/FilterSelect.tsx` | das Dropdown aus der Timeline-Toolbar, **umgezogen**: die Evidence-Toolbar ist der zweite Nutzer (Regel aus UE4 Demo 6) |
| | `shared/routes.ts` | neu: `evidencePath(id)` → `/evidence?open=<id>` |

**Die fünf migrierten Handler:**

| # | Aktion | vanilla | React |
|---|---|---|---|
| 1 | Stern anklicken (Bookmark) | `data-action="bookmark"` am Button, **ein** Listener am Container, `event.target.closest("[data-action='bookmark']")` | `onClick={handleBookmarkClick}` direkt am Button (`EvidenceCard`), mit `event.stopPropagation()` |
| 2 | Karte anklicken (Detail öffnen) | derselbe Container-Listener, zweiter Zweig (`closest(".evidence-card")`) | `onClick={() => onOpen(evidence.id)}` an der Karte |
| 3 | "Close" im Detail | `onclick="closeEvidenceDetail()"` als Text im HTML-String + `window.closeEvidenceDetail = …` | `onClick={onClose}` (`EvidenceDetail`) |
| 4 | "Save note" | `onclick="saveCurrentNote()"` im String; die Evidence-ID wurde mit `getAttribute("data-evidence-id")` **aus dem DOM zurückgelesen** | `onSubmit={handleSubmit}` am `<form>`; die ID steht einfach in `evidence.id` (Closure) |
| 5 | "Open" im Workspace | `addEventListener("click")` pro Button → `navigateTo("evidence")` → `setTimeout(() => openEvidenceDetail(id), 0)` | **gar kein Handler**: ein `<Link to={evidencePath(id)}>` — der Router navigiert, die Evidence-Seite liest die ID aus der URL |

Zusätzlich: der Sortier-`<select>` hatte `onchange="handleSortChange()"` im HTML — er ist jetzt ein `FilterSelect`
(noch ohne Handler, kommt in Demo 7).

### Task 2 — Bestätigen, dass die vanilla-Attribute weg sind

Live im Browser gemessen (Detail von E03 geöffnet), dieselbe Abfrage auf beiden Seiten:

| Messung | vanilla (`index.html#evidence`) | React (`react.html#/evidence?open=E03`) |
|---|---|---|
| Elemente mit `onclick="…"` | **14** (2 davon im Detail-Panel) | **0** |
| Elemente mit `onchange="…"` | **1** (`#sortEvidence`) | **0** |
| Elemente mit `data-action` | **18** (eines pro Karte) | **0** |
| `window.saveCurrentNote` / `closeEvidenceDetail` / `handleSortChange` / `saveHypothesis` / `navigateTo` | alle **`function`** (global, nur wegen der Inline-Attribute) | alle **`undefined`** |
| `addEventListener` im Quellcode von `src/` | — | **keiner** (Textsuche) |

Die globalen `window.…`-Funktionen sind der eigentliche Preis der Inline-Attribute: ein `onclick="foo()"` im
HTML-Text kann nur eine **globale** Funktion aufrufen. Deshalb musste `js/main.ts` sie an `window` hängen und
mit `declare global { interface Window { … } }` dem Compiler beibringen. In React gibt es nichts Globales mehr.

### Entscheidungen unterwegs (ehrlich dokumentiert)

| Entscheidung | Gewählt | Warum | Wohin es später geht |
|---|---|---|---|
| **Wo steht das geöffnete Detail?** | in der **URL** (`?open=E04`), kein `useState` | Der "Open"-Button im Workspace braucht sonst geteilten Zustand oder einen `setTimeout`-Trick. Mit der URL ist er ein `<Link>`, "Zurück" schließt das Detail, der Link ist teilbar. Dasselbe Muster wie `?person=` in UE4 Demo 10 | bleibt so |
| **Notiz-Formular** | `<form onSubmit>` + `FormData`, Textarea mit `defaultValue` (unkontrolliert) | Die Angabe verlangt kontrollierte Eingaben für Suche und Hypothesen-Formular (Demo 2), nicht für die Notiz. `FormData` liest den Wert beim Abschicken, ohne dass jede Taste in React durchläuft | bleibt |
| **Bookmarks/Notizen: `useState` schon in Demo 1** | ja, in `EvidencePage`, gestartet aus dem `localStorage` | Ein Handler ohne etwas, das er ändert, wäre leer. `useState` wird in Demo 2 formal erklärt, Demo 5 zieht den State nach oben | Demo 5 |
| **Status-/Relevanz-Dropdowns im Detail** | sichtbar, **stumm** | Sie verändern ein Beweisstück — das braucht ein unveränderliches Update (Demo 3) | Demo 3 |
| **Workspace liest `localStorage` separat** | `useState(loadBookmarks)` ohne Setter | provisorisch: **zweiter Leser** derselben Tatsache (dazu `features/dashboard/bookmarks.ts` als dritter) | Demo 4/5/9 |
| **Scrollen zum Detail** | Ref-Callback mit `scrollIntoView` | vanilla scrollte nach dem Öffnen. Der Callback ist eine Funktion auf Modul-Ebene (stabile Identität), sonst würde er bei **jedem** Render erneut scrollen | Demo 10 (als bewusste Ausnahme benennen) |

### Was bewusst NICHT verdrahtet ist (kommt in den nächsten Demos)

| Element | Zustand jetzt | Demo |
|---|---|---|
| Suchfeld | sichtbar, unkontrolliert, ändert nichts | 2 |
| 5 Filter + Sortierung + "Clear filters" | sichtbar, ändern nichts; Liste ist fest "neueste zuerst" | 4, 7 |
| Hypothesen-Formular (6 Felder, Regler-Zahl, Speichern-Knopf) | sichtbar, Zahl fest "50", Knopf tut nichts | 2 |
| Status/Relevanz im Detail | sichtbar, ändern nichts | 3 |

### Verifikation

- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler. `npm run format:check` → zuerst 2 Dateien
  gemeldet (`src/shared/routes.ts`, `src/shared/storage.ts`): meine umbrochenen Ternaries passten mit genau
  100 Zeichen in eine Zeile, Prettier wollte sie zusammenziehen. Behoben, Wiederholung sauber.
  `npm run build` → grün (150 Module, `react.html` und `index.html` werden beide gebaut).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | Ende UE4 | 272,31 KB | 85,79 KB | 139 |
  | **UE5 Demo 1** | **283,88 KB** | **88,06 KB** | **150** |
  | Unterschied | **+11,6 KB** | **+2,3 KB** | +11 |

  Der Zuwachs sind zwei komplette Views (Evidence und Workspace) mit 11 neuen Dateien (+11 Module); die vanilla-App bleibt
  bei 20,11 KB.
- **Vergleich mit vanilla (Prüfsumme über Titel, Meta, Summary, Badges, Tags aller 18 Karten, in Reihenfolge):**
  React und vanilla liefern **dieselbe Prüfsumme**. Dito für alle Dropdown-Optionen der Toolbar (Typ 15, Person
  7, Ort 7, Status 4, Relevanz 4, Sortierung 4). Erste Karten: E14, E03, E04 (neueste zuerst).
- **Stern (Klick auf das innere `<span>`):** 1 aktiver Stern, `localStorage.remotion_bookmarks` = `["E14"]`,
  die URL bleibt `#/evidence`, **kein** Detail geöffnet → `stopPropagation()` wirkt.
- **Karte öffnen:** `#/evidence?open=E03`, Panel "Calibration profile comparison", Status "unreviewed",
  Relevanz "unknown", Warn-Banner (kritisch). Alle Felder **textgleich** mit dem vanilla-Detail.
- **Notiz speichern:** `localStorage.remotion_notes` = `{"E03": "…"}`, die Vorschau zeigt den Text. Die URL
  bleibt (`event.preventDefault()` verhindert den Seiten-Reload).
- **Notiz mit HTML** (`Test <img src=x onerror="window.__xss=1"> <b>fett</b>`):
  - **React:** Vorschau zeigt den Text **wörtlich**, `0` `<img>`-Elemente, `window.__xss` = **0**.
  - **vanilla (live nachgestellt, gleicher `localStorage`):** Vorschau enthält ein echtes `<img>`, `<b>` wird
    fett ("Test fett"), `window.__xss` = **1** — das `onerror` wurde **ausgeführt**. Das ist der XSS-Smell
    aus UE2 Demo 8, jetzt bewiesen.
- **Anderes Beweisstück öffnen:** Textarea und Vorschau sind **leer** (E04) — `key={selected.id}` erzwingt ein
  neues Panel, `defaultValue` gilt sonst nur beim ersten Rendern.
- **Close:** Panel weg, URL `#/evidence`.
- **Unbekannte ID** (`?open=zzz`): ignoriert, 18 Karten, kein Panel (wie `?person=` in UE4).
- **Workspace:** Bookmarks-Liste mit E14 und Link `#/evidence?open=E14`, Notizen-Liste mit E02 und E03
  (kein `<img>`), Formular: 7 Personen-, 4 Art-Optionen, 18 Beweisstücke (`multiple`, `size=6`), Regler 50,
  2 Textareas. Klick auf "Open" → `#/evidence?open=E14`, Stern aktiv, Detail offen. "Zurück" geht auf
  `#/workspace`.
- **Dashboard:** zeigt "1 Bookmarked" (liest beim Einblenden den `localStorage`).
- **Timeline nach dem `FilterSelect`-Umzug:** weiter 15 Events und Dropdowns mit 2 / 7 / 7 / 12 Optionen.
- **Konsole:** zwischen zwei Markern (Evidence, Workspace, Timeline, Detail, People durchgeklickt) **keine**
  Meldung. (Ein einzelnes 404 im Puffer stammt von meiner ersten Test-URL ohne das `base`-Präfix.)
- **Abhängigkeitsrichtung (Demo 6) erneut geprüft:** kein Feature importiert aus `app/` oder aus einem anderen
  Feature; `app/` kennt Features nur in `PageRouter.tsx`.
- **Direkte DOM-Zugriffe in `evidence/` und `workspace/`:** Textsuche nach `innerHTML`, `createElement`,
  `appendChild`, `classList`, `querySelector`, `getElementById`, `addEventListener`, `onclick=` → nur
  Treffer in **Kommentaren**.
- **Test-Daten aufgeräumt:** `remotion_bookmarks` und `remotion_notes` wieder entfernt.

**Eine Grenze der Prüfung (ehrlich):** das **Scrollen** zum Detail konnte ich nicht sehen. Der Ref-Callback
wird aufgerufen (zweimal pro Öffnen — das ist `StrictMode`, das Anhängen/Abhängen/Anhängen simuliert) und ruft
`scrollIntoView({ behavior: "smooth", block: "start" })` auf. Im Test-Browser läuft die *sanfte* Animation aber
nicht (auch ein von Hand ausgelöstes `smooth` blieb bei 0, ein `auto` sprang korrekt auf 1524 px). Das ist eine
Eigenheit des Test-Fensters, nicht des Codes; im echten Browser lässt sich das mit einem Klick auf eine Karte
prüfen.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Die Struktur zeigen:** `react.html#/evidence` — 18 Karten, Toolbar, Sortierung "neueste zuerst". Sag: "die
Toolbar ist sichtbar komplett, aber noch nicht verdrahtet — das kommt in Demo 2, 4 und 7."

**2. Den Stern-Handler zeigen:** `EvidenceCard.tsx` öffnen, auf `onClick={handleBookmarkClick}` zeigen. Im
Browser auf einen Stern klicken: Stern wird gelb, **das Detail öffnet sich nicht**. Sag: "`stopPropagation`,
weil der Stern *in* der Karte sitzt — der Klick würde sonst nach oben durchblubbern."

**3. Den Vergleich zu vanilla beweisen:** in beiden Apps in der Konsole (`F12`) ausführen:
```js
document.querySelectorAll("[onclick]").length
```
→ vanilla **14**, React **0**. Und `typeof window.saveCurrentNote` → vanilla `"function"`, React `"undefined"`.
Sag: "ein Inline-`onclick` kann nur eine *globale* Funktion aufrufen — React braucht nichts Globales."

**4. Karte öffnen + URL zeigen:** Klick auf eine Karte → Adressleiste `…#/evidence?open=E03`. Sag: "das
geöffnete Detail steht in der URL, nicht in einer Variablen — deshalb ist der Workspace-Button nur ein Link."

**5. Den XSS-Unterschied zeigen (stark):** im Detail die Notiz `<img src=x onerror="alert('XSS')">`
speichern. React zeigt den Text. Dann in vanilla dieselbe Notiz öffnen und speichern → ein `alert` poppt auf.
Sag: "React setzt `{note}` als Text, vanilla schrieb es per `innerHTML`."

**6. Workspace → "Open":** `#/workspace`, "Open" klicken → Detail öffnet sich. Sag: "vanilla brauchte dafür einen
Listener, `navigateTo` und einen `setTimeout`. Hier ist es ein Link."

---
