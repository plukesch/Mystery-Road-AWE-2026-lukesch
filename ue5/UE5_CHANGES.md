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

## Demo 2 — `useState` und kontrollierte Formulare

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Ein Eingabefeld hat **zwei mögliche "Chefs"**:

- **Unkontrolliert:** der **Browser** ist der Chef. Er merkt sich, was im Feld steht; React fragt nur bei Bedarf nach
  (so war das Notiz-Feld in Demo 1 und so war *alles* in vanilla: `getElementById(...).value`).
- **Kontrolliert:** **React** ist der Chef. Der Text steht in einer Variable (`useState`), das Feld **zeigt** sie nur
  an, und jede Taste sagt React Bescheid ("hier ist ein neuer Text"). React speichert ihn, rendert neu und gibt dem
  Feld den neuen Wert zurück.

*Analogie:* ein **Gästebuch**. Unkontrolliert: die Gäste schreiben direkt ins Buch, du blätterst nur nach, wenn du
etwas wissen willst. Kontrolliert: ein **Empfangschef** schreibt jeden Eintrag selbst ins Buch, jeder Gast diktiert
ihm. Du weißt immer sofort, was drinsteht — aber ohne Diktat (`onChange`) schreibt der Empfangschef nichts, und das
Buch bleibt leer.

`useState` ist dabei das Gedächtnis des Empfangschefs: `const [text, setText] = useState("")` heißt "ein Wert `text`,
anfangs leer, und eine Funktion `setText`, mit der man ihn ändert **und React zum Neurendern auffordert**".

### Task 1 — das Evidence-Suchfeld ist kontrolliert

| Datei | Änderung |
|---|---|
| `evidence/EvidencePage.tsx` | `const [searchTerm, setSearchTerm] = useState("")` — der **Zustand** |
| `evidence/EvidenceToolbar.tsx` | neue Props `searchTerm` und `onSearchChange`; am `<input>`: `value={searchTerm}` und `onChange={(event) => onSearchChange(event.target.value)}` |

**Der Kreislauf bei jeder Taste:**

| Schritt | Was passiert |
|---|---|
| 1 | Nutzer tippt "a" |
| 2 | `onChange` feuert, `event.target.value` ist `"a"` |
| 3 | `onSearchChange("a")` → `setSearchTerm("a")` |
| 4 | React merkt: Zustand hat sich geändert → `EvidencePage` rendert **neu** |
| 5 | `<input value={searchTerm}>` bekommt `"a"` → das Feld zeigt `"a"` |

Die Toolbar **hält nichts selbst**: sie bekommt Text und Funktion als Props (Presentational, siehe UE4 Demo 5).

**Wichtig, ehrlich:** die Suche **filtert noch nicht**. Der Text wird gespeichert, aber die Liste benutzt ihn
erst in Demo 4 (abgeleitete Liste). Die Angabe verlangt hier nur das kontrollierte Feld.

### Task 2 — das ganze Hypothesen-Formular ist kontrolliert

Alle sechs Felder (+ die Zahl neben dem Regler) lesen aus **einem** Zustandsobjekt:

| Feld | Element | Wert im State | `onChange` liest |
|---|---|---|---|
| Verdächtige Person | `<select>` | `values.suspectId` (string) | `event.target.value` |
| Art des Vorfalls | `<select>` | `values.nature` (string) | `event.target.value` |
| Beweisstücke | `<select multiple>` | `values.evidenceIds` (**string[]**) | `Array.from(event.target.selectedOptions, o => o.value)` |
| Confidence | `<input type="range">` | `values.confidence` (string `"0"`–`"100"`) | `event.target.value` |
| Erklärung | `<textarea>` | `values.explanation` (string) | `event.target.value` |
| Alternative | `<textarea>` | `values.alternative` (string) | `event.target.value` |
| Zahl neben dem Regler | `<output>` | zeigt **denselben** `values.confidence` | — (kein Handler nötig) |

**Ein State-Objekt statt sechs `useState`** (Begründung: Theorie F2):

```tsx
const [values, setValues] = useState<HypothesisFields>(loadHypothesis);

function setField<K extends keyof HypothesisFields>(field: K, value: HypothesisFields[K]) {
  setValues((previous) => ({ ...previous, [field]: value }));
}
```

| Baustein | Bedeutung |
|---|---|
| `useState(loadHypothesis)` | eine **Funktion** als Startwert: React ruft sie nur beim **ersten** Rendern auf ("lazy initial state"). So wird der `localStorage` einmal gelesen, nicht bei jedem Rendern |
| `setField("nature", "deliberate")` | ein Setter für alle Felder |
| `<K extends keyof HypothesisFields>` | der **Typ passt zum Feld**: `setField("evidenceIds", "x")` ist ein Compiler-Fehler (es muss `string[]` sein) |
| `{ ...previous, [field]: value }` | neues Objekt: alles vom alten **kopiert**, nur dieses eine Feld ersetzt (mehr dazu in Demo 3) |

**Die zwei Dateien:**

| Datei | Rolle |
|---|---|
| `workspace/HypothesisForm.tsx` | besitzt jetzt den Zustand. Ist **keine reine Darstellung** mehr (siehe unten) |
| `workspace/hypothesisStorage.ts` (neu) | `loadHypothesis()` und `saveHypothesis()`: dieselbe `localStorage`-Key (`remotion_hypothesis`) und dieselbe Form wie vanilla |

**Warum dieselbe Form wie vanilla?** Ein in einer App gespeicherter Entwurf lädt in der anderen. Live bestätigt (s. u.).

### Task 3 — "Save hypothesis draft" liest den Zustand und speichert

| | vanilla (`saveHypothesis()` in `js/views/workspace.ts`) | React |
|---|---|---|
| Wie kommen die Werte zusammen? | 6× `requireElement(...).value` — jedes Feld wird **einzeln aus dem DOM gelesen** | `saveHypothesis(values)` — der Entwurf **ist schon ein Objekt** |
| Auslöser | `onclick="saveHypothesis()"` im HTML (global) | `<form onSubmit={handleSubmit}>` + `event.preventDefault()` |
| Fehlerfall | `alert(...)` + `return` | dasselbe (`saveHypothesis` liefert `false`, die Komponente zeigt `alert`) |
| "Saved"-Hinweis | `classList.remove("hidden")` + `setTimeout(() => classList.add("hidden"), 2000)` | `showSaved` (`useState(false)`), `{showSaved && <span className="saved-msg">Saved</span>}`, nach 2 s `setShowSaved(false)` |
| Zahl neben dem Regler | **extra** `input`-Listener in `js/main.ts`, der `hypConfidenceValue.textContent` von Hand nachführt (zwei Orte für dieselbe Tatsache) | `{values.confidence}` im JSX — derselbe Zustand wie der Regler |
| Laden | `loadHypothesisFromStorage()`: schreibt jedes Feld per `.value = …` zurück in den DOM | der Startwert von `useState(loadHypothesis)` — React rendert die Felder damit |

### Was bewusst anders / noch offen ist

| Punkt | Zustand | Warum |
|---|---|---|
| **`HypothesisForm` ist jetzt Stateful** | statt Presentational (UE4 Demo 5) | Der Entwurf wird von **keiner anderen Stelle** gebraucht → niedrigster gemeinsamer Besitzer ist das Formular selbst (Regel für Demo 5). Die Einordnung steht in `ARCHITECTURE.md` |
| **Suchtext geht beim Seitenwechsel verloren** | React: nach "Dashboard → Evidence" ist das Feld **leer**. vanilla: bleibt **"abc"** | In vanilla wird der DOM nur versteckt/gezeigt, in React wird die Komponente beim Verlassen **entmountet** und ihr State verworfen. Liegt der State später weiter oben (Demo 5/7), bleibt er erhalten |
| **Suche filtert nicht** | React: 18 Karten bleiben. vanilla (live): "abc" → 0 Karten | kommt in Demo 4 |
| **"Saved" nach 2 s per `setTimeout`** | wie vanilla | Zwei schnelle Klicks starten zwei Timer; der erste blendet früher aus. Das hat vanilla auch; bewusst nicht gelöst (wäre ein `useRef` für die Timer-ID) |
| **Zahl `"80"` ist ein String** | wie vanilla (`range.value`) | gleiches Speicherformat, `HypothesisDraft.confidence` ist ein `string` |

### Verifikation

- **Alle sechs Felder live bedient** (echte Eingaben ins Formular):
  Person "Nova Byte", Art "Deliberate", Regler auf 80, Erklärung "Erklaerung A", Beweisstücke per Strg-Klick
  (zwei markiert). Die Zahl neben dem Regler folgt dem Regler (`80`).
- **Speichern:** URL bleibt `#/workspace` (`preventDefault` verhindert den Seiten-Reload), der Hinweis "Saved"
  erscheint und ist nach 2 s **weg**. `localStorage.remotion_hypothesis`:
  ```json
  { "suspectId": "nova-byte", "nature": "deliberate", "evidenceIds": ["E05", "E07"],
    "confidence": "80", "explanation": "Erklaerung A", "alternative": "", "savedAt": "2026-10-19T…Z" }
  ```
  — **dieselben sieben Felder und Typen** wie der vanilla-Entwurf (`HypothesisDraft`).
- **Neu laden:** alle Felder kommen wieder (Person, Art, Regler 80 samt Zahl, Erklärung, beide Beweisstücke).
- **Kompatibilität mit vanilla:** der in React gespeicherte Entwurf lädt in der vanilla-App (Person, Art, Regler 80,
  Erklärung). **Nebenbefund, kein React-Fehler:** beim **Direktaufruf** von `index.html#workspace` blieb die
  Mehrfach-Auswahl der Beweisstücke in vanilla **leer**, nach Wechsel Dashboard → Workspace waren `E05`/`E07`
  markiert. Ursache (aus dem Code abgeleitet, nicht einzeln nachgemessen): `loadEvidenceData()`/`loadTimelineData()` in `js/data.ts` laufen **nicht awaited** im
  Hintergrund und rufen am Ende `populateAllDropdowns()` auf, das die Beweis-Optionen **neu aufbaut** (und die
  Auswahl damit löscht), nachdem `renderWorkspace()` sie schon gesetzt hat. Ein echter **Stale-State**-Fall der
  vanilla-App (relevant für Demo 9).
- **Suchfeld getippt** (echte Tasten): "abc" erscheint, 18 Karten bleiben (filtert noch nicht). Ein Klick auf einen
  Stern ändert den Text nicht (State bleibt beim Neurendern).
- **Das Feld OHNE `onChange`** (testweise entfernt, Grundlage für Theorie F1): "abc" getippt → das Feld bleibt
  **leer** (`value === ""`), und die Konsole meldet:
  ```
  You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field.
  If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
  ```
  Danach `onChange` wieder eingesetzt, "abc" lässt sich wieder tippen.
- **Aufräumen:** `remotion_bookmarks`, `remotion_notes`, `remotion_hypothesis` aus dem `localStorage` entfernt.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler (auch `setField` mit dem generischen `K` und
  `{ ...previous, [field]: value }` kompilieren). `npm run format:check` → sauber (beim ersten Versuch).
  `npm run build` → grün (151 Module).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | UE5 Demo 1 | 283,88 KB | 88,06 KB | 150 |
  | **UE5 Demo 2** | **285,67 KB** | **88,63 KB** | **151** |
  | Unterschied | **+1,8 KB** | **+0,6 KB** | +1 (`hypothesisStorage.ts`) |

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Das kontrollierte Suchfeld zeigen:** `react.html#/evidence`, etwas ins Suchfeld tippen. In `EvidenceToolbar.tsx` auf
`value={searchTerm}` und `onChange=…` zeigen. Sag: "das Feld **zeigt** nur den State; jede Taste geht erst durch
React und kommt als Wert zurück."

**2. Den Chef-Wechsel beweisen (Theorie F1):** in `EvidenceToolbar.tsx` die Zeile `onChange=…` löschen, speichern,
Seite neu laden, tippen → **nichts passiert**, in der Konsole steht die rote Warnung. Sag: "ohne `onChange` kommt
kein neuer Wert in den State, React rendert das Feld jedes Mal mit dem **alten** `""` zurück — es ist
schreibgeschützt." Zeile wieder einsetzen.

**3. Das Formular zeigen:** `#/workspace`, alle Felder ausfüllen, Regler bewegen (die Zahl folgt), **Save**, "Saved"
erscheint. Seite neu laden → alles ist wieder da.

**4. In die Konsole schauen (Beweis, dass State und Anzeige zusammenhängen):**
```js
JSON.parse(localStorage.getItem("remotion_hypothesis"))
```
→ das Objekt mit den sieben Feldern.

**5. Den Entwurf in vanilla öffnen:** `index.html#workspace` → dieselben Werte stehen in den Feldern (gleiche
`localStorage`-Form).

**6. Die Frage "ein Objekt oder sechs `useState`?" beantworten (F2):** `HypothesisForm.tsx` öffnen, `setField` zeigen.

---

## Demo 3 — Unveränderliche Updates

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

React erkennt "da hat sich etwas geändert" **nicht**, indem es in den Inhalt schaut. Es fragt nur: **ist das ein
anderes Objekt als vorher?** (Genauer: `Object.is(alt, neu)`, also dieselbe **Referenz** oder nicht.)

Daraus folgt eine Regel: einen State **nie umbauen**, immer **ein neues Exemplar** an React geben.

*Analogie:* ein **Etikett am Aktenordner**. React schaut nur aufs Etikett (die Ordner-Nummer). Wenn du Blätter in
den **alten** Ordner legst, bleibt die Nummer gleich — React denkt "derselbe Ordner, nichts passiert" und schaut
nicht hinein. Legst du die Blätter in einen **neuen** Ordner mit neuer Nummer, merkt React es sofort.

| | Mutieren (falsch) | Ersetzen (richtig) |
|---|---|---|
| Array | `list.push(x)` | `[...list, x]` |
| Entfernen | `list.splice(i, 1)` | `list.filter(...)` |
| Objekt-Feld | `obj.status = "reviewed"` | `{ ...obj, status: "reviewed" }` |
| Sortieren | `list.sort(...)` | `[...list].sort(...)` |

### Task 1 — Stellen, an denen der erste Instinkt mutieren würde

Gefunden und unveränderlich geschrieben (Zeile "erster Instinkt" = wie es in vanilla stand bzw. wie man es
spontan schreiben würde):

| # | Stelle | Erster Instinkt (falsch) | Jetzt (richtig) |
|---|---|---|---|
| 1 | **Bookmark an/aus** (`toggleBookmark`) | `bookmarks.push(id); setBookmarks(bookmarks)` bzw. `ev.bookmarked = true` (vanilla `handleBookmarkClick`: `state.bookmarks.push(...)` **und** `ev.bookmarked = true`) | `bookmarks.includes(id) ? bookmarks.filter(...) : [...bookmarks, id]` — beide Zweige liefern ein **neues** Array |
| 2 | **Review-Status ändern** (neu in dieser Demo, `handleChangeReview`) | `evidence.status = "reviewed"` (vanilla: `ev.status = …` mit dem Kommentar "direct mutation of the loaded evidence object") | `setReviewEdits(previous => ({ ...previous, [id]: { ...previous[id], ...edit } }))` — **zwei Ebenen**, beide neu |
| 3 | **Sortieren** (`sortEvidence`; in Demo 3 noch `sortNewestFirst`) | `evidence.sort(...)` (vanilla UE1 Demo 2: sortierte die Master-Liste mit) | `[...evidence].sort(...)` — Kopie |
| 4 | **Hypothesen-Feld** (`setField`, Demo 2) | `values.nature = "x"; setValues(values)` | `setValues(previous => ({ ...previous, [field]: value }))` |
| 5 | **Notiz speichern** (`handleSaveNote`, Demo 1) | `notes[id] = text; setNotes(notes)` | `{ ...notes, [id]: text }` |

### Task 2 — der Bookmark-Fall, der das gezielt prüft

**Die reine Funktion** (`features/evidence/evidenceHelpers.ts`; seit Demo 5 in `shared/bookmarks.ts`, gleicher Code):

```ts
export function toggleBookmark(bookmarks: readonly string[], evidenceId: string): string[] {
  return bookmarks.includes(evidenceId)
    ? bookmarks.filter((id) => id !== evidenceId)
    : [...bookmarks, evidenceId];
}
```

Der **Fall**, der prüft, dass sie nichts mutiert: **die Eingabe einfrieren** (`Object.freeze`). Ein eingefrorenes
Array lässt kein `push`, `splice` oder Zuweisen zu — eine mutierende Implementierung würde sofort einen
`TypeError` werfen. Live in der Konsole ausgeführt (die Funktion per `import()` aus dem Dev-Server geladen):

| Aufruf | Ergebnis |
|---|---|
| `toggleBookmark(Object.freeze(["E01","E02"]), "E03")` | `["E01","E02","E03"]` — **ein neues Array** (`!== original`) |
| `toggleBookmark(Object.freeze(["E01","E02"]), "E01")` | `["E02"]` — **ein neues Array** (`!== original`) |
| das Original danach | unverändert `["E01","E02"]` |
| zum Vergleich `frozen.push("E99")` | wirft `TypeError: Cannot add property 2, object is not extensible` |
| `applyReviewEdits(eingefrorene Liste mit eingefrorenen Objekten, { A: { status: "reviewed" } })` | neue Liste; `A` ist ein **neues** Objekt (`status: "reviewed"`), das Original-`A` bleibt `"unreviewed"`; `B` ist **dasselbe** Objekt wie vorher (was sich nicht ändert, wird nicht kopiert) |
| `sortNewestFirst(eingefrorene Liste)` (damals gemessen; heute `sortEvidence`, gleiche Kopie-Technik) | sortiert, wirft nicht (arbeitet auf einer Kopie) |

### Der Review-Status: wie die Änderung gespeichert wird

Der Status eines Beweisstücks ist in den **geladenen Daten** (`useCaseData`) und gehört dort nicht verändert. Statt
die ganze Liste in einen eigenen State zu **kopieren**, speichert `EvidencePage` nur die **Änderungen**:

```ts
const [reviewEdits, setReviewEdits] = useState<Record<string, ReviewEdit>>({});   // { E03: { status: "reviewed" } }
const evidence = applyReviewEdits(caseDataState.data.evidence, reviewEdits);         // jeden Render neu berechnet
```

| Baustein | Aufgabe |
|---|---|
| `reviewEdits` (State) | nur das, was der Nutzer **geändert** hat |
| `applyReviewEdits(...)` (reine Funktion) | legt die Änderungen über die geladene Liste → **neue** Liste; unveränderte Einträge bleiben dieselben Objekte, geänderte sind neu (`{ ...item, ...edit }`) |
| `EvidenceDetail` | Dropdowns sind kontrolliert (`value` + `onChange`) und melden `onChangeReview(id, { status })` nach oben. Die Komponente ändert nie das Beweisstück selbst |
| `isReviewStatus(value)` / `isRelevance(value)` | **Type Guards**: ein `<select>` liefert immer `string`; die Prüfung macht daraus einen `ReviewStatus`. vanilla schrieb `as ReviewStatus` (blind zugesichert) |

**Warum Änderungen statt Listen-Kopie?** Eine Kopie der geladenen Liste im State wäre "dieselbe Tatsache an zwei
Stellen" (geladene Liste **und** Kopie davon); sobald die Daten neu geladen würden, stimmten beide nicht mehr
überein. Die Änderungen sind **neue** Information, die es sonst nirgends gibt. Mehr dazu in Demo 4 (abgeleitete
Werte statt gespeicherter).

**`readonly` als Compiler-Schutz.** Die lesenden Helfer (`sortEvidence` — in Demo 3 `sortNewestFirst` —, `toggleBookmark`, `applyReviewEdits`,
`uniqueTypes`) nehmen `readonly Evidence[]` bzw. `readonly string[]`. Auf einem `readonly`-Array **gibt es kein
`push`, `sort`, `splice`** — ein versehentliches Mutieren ist ein Typfehler, bevor die Seite läuft. Echt vom Compiler
(mit der installierten TypeScript-Version, an einer Test-Datei **außerhalb** des Projekts):

```
scratch.ts(8,19):  error TS2339: Property 'sort' does not exist on type 'readonly Evidence[]'.
scratch.ts(12,13): error TS2339: Property 'push' does not exist on type 'readonly string[]'.
scratch.ts(17,8):  error TS2540: Cannot assign to 'status' because it is a read-only property.
```

### Die Wegwerf-Sandbox: was React wirklich vergleicht

Wie in UE4 Demo 4 eine Sandbox **außerhalb** der App (`mutation-demo.html`, `src/sandbox/MutationDemo.tsx`; nicht in
`vite.config.js` → nie gebaut). Dieselbe Aktion "Bookmark hinzufügen" zweimal nebeneinander, dazu eine
`memo`-Komponente ("Summary") und ein Knopf "Unabhängiges Neurendern" (ändert nur einen fremden Zähler).

| Aktion | Links: `push` + `setState(dieselbe Referenz)` | Rechts: `[...alt, neu]` |
|---|---|---|
| Hinzufügen, 2× | **Liste leer, Summary 0** — es passiert sichtbar **nichts** (React sieht dieselbe Referenz, rendert nicht) | sofort `E01`, Summary "1 Bookmark(s) - E01" |
| Danach "Unabhängiges Neurendern" | Liste zeigt plötzlich `E01, E02` ("es funktioniert"), **aber Summary bleibt bei 0** | — |

Das ist die ganze Antwort auf F1 in einem Bild: das Mutieren "funktioniert" **manchmal** (sobald irgendetwas anderes
neu rendert, liest die Liste das mutierte Array), aber alles, was auf **Referenz-Gleichheit** setzt (`memo`,
`useMemo`, `useEffect`-Abhängigkeiten, Reacts eigener State-Vergleich), sieht die Änderung **nie**.

### Was bewusst anders / noch offen ist (ehrlich)

| Punkt | Zustand | Warum |
|---|---|---|
| **Status-Änderungen gehen beim Seitenwechsel verloren** | live gemessen: E03 auf "reviewed" → Dashboard → zurück zu Evidence: wieder "unreviewed" (nur noch 1 reviewed-Karte statt 2) | `reviewEdits` lebt in `EvidencePage`; beim Verlassen wird die Seite entmountet, ihr State verworfen. In vanilla blieb die Änderung im Speicher (`ev.status` am geladenen Objekt) — allerdings **ohne** Dashboard-Aktualisierung. Wird in Demo 5 behoben (State nach oben) |
| **Dashboard zeigt die Änderung nicht** | live: nach der Änderung zeigt das Dashboard weiter `1 Reviewed` (E12) | `DashboardPage` lädt **eigene** Daten (`useCaseData`); die Änderungen existieren nur in `EvidencePage`. Genau das Problem aus der Einleitung der Angabe ("ein Dashboard-Zähler, der veralten kann"); Demo 4/5 |
| **Status-Änderungen werden nicht gespeichert** | nur im Speicher, nach `F5` weg | wie vanilla (dort ebenfalls nur im Speicher). Bookmarks/Notizen landen im `localStorage`, Status nicht |
| `toggleBookmark` ist feature-lokal | in `evidenceHelpers.ts` | heute nur `EvidencePage` benutzt es; zieht in Demo 5 um, falls der State nach oben wandert (**ist passiert**: nach `shared/bookmarks.ts`, ebenso `applyReviewEdits` nach `shared/reviewEdits.ts`) |

### Verifikation

- **Review-Status live bedient** (echte Dropdown-Eingaben im Detail von E03): "Reviewed" → die Karte im Raster
  zeigt sofort `badge-reviewed`, das Panel bleibt offen; Relevanz "Relevant" → Karte zeigt `badge-relevant`. Beide
  Dropdowns bleiben beim Wechsel zu E12 und zurück zu E03 erhalten (`reviewed` / `relevant`).
- **E12** (in den Daten `"Reviewed"` mit großem R): das Dropdown zeigt trotzdem `reviewed` (der Wert wird mit
  `toLowerCase()` angeglichen).
- **Sandbox** (`mutation-demo.html`) mit den Klicks aus der Tabelle oben durchgespielt, Werte exakt wie dort.
- **Unveränderlichkeit** per eingefrorener Eingabe (Tabelle in Task 2).
- **Compiler** für `readonly` (Block oben).
- **Konsole:** keine Fehler. **Aufräumen:** `remotion_*`-Keys wieder entfernt.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler (die Type Guards, das verschachtelte
  `{ ...previous[id], ...edit }` und die `readonly`-Parameter kompilieren). `npm run format:check` → sauber (beim
  ersten Versuch). `npm run build` → grün (151 Module; die Sandbox ist nicht in `rollupOptions.input`, taucht also
  weder in den Modulen noch in `dist/` auf).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | UE5 Demo 2 | 285,67 KB | 88,63 KB | 151 |
  | **UE5 Demo 3** | **286,17 KB** | **88,76 KB** | **151** |
  | Unterschied | **+0,5 KB** | **+0,1 KB** | 0 (Helfer, Handler und Guards in bestehenden Dateien) |

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Die Sandbox zeigen (beste Demo):** `http://localhost:5173/Mystery-Road-AWE-2026-lukesch/mutation-demo.html`.
Links **2×** "Bookmark hinzufügen (push)" klicken → **nichts** passiert. Dann "Unabhängiges Neurendern" → links
erscheinen plötzlich beide Einträge, **die Summary bleibt bei 0**. Rechts klicken → sofort richtig. Sag: "React
vergleicht nur die **Referenz**. Dasselbe Array = nichts zu tun."

**2. Den Bookmark-Fall zeigen:** `shared/bookmarks.ts`, `toggleBookmark` (4 Zeilen; in Demo 3 stand er noch in
`evidenceHelpers.ts`). In der Konsole:
```js
const m = await import("/Mystery-Road-AWE-2026-lukesch/src/shared/bookmarks.ts");
const original = Object.freeze(["E01", "E02"]);
const next = m.toggleBookmark(original, "E03");
[next, next !== original, original]
```
→ `["E01","E02","E03"]`, `true`, das Original unverändert. Sag: "eingefroren — hätte die Funktion mutiert, wäre hier ein
Fehler geflogen."

**3. Den Status ändern:** `#/evidence?open=E03`, im Detail "Review status" auf **Reviewed**. Die Karte oben im Raster
wird sofort grün. Sag: "das Beweisstück selbst habe ich **nie** verändert — nur die Änderung gespeichert und die
Liste daraus abgeleitet."

**4. Den Compiler-Schutz zeigen:** in `evidenceHelpers.ts` in `sortEvidence` `[...evidence].sort(` testweise zu
`evidence.sort(` ändern,
```bash
npm run typecheck
```
→ `Property 'sort' does not exist on type 'readonly Evidence[]'`. Sag: "`readonly` macht das Mutieren zu einem
Compilerfehler." Zeile wieder zurücksetzen.

**5. Die ehrliche Schwäche zeigen:** Status ändern, zum Dashboard, zurück: die Änderung ist weg. Sag: "der State
liegt noch in der Seite — das löst Demo 5."

---

## Demo 4 — Abgeleitete Werte statt gespeicherter

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Es gibt zwei Arten von Wissen in einer Seite:

- **Gespeichert (State):** Dinge, die nur der Nutzer bestimmt und die man sich **merken** muss (was im Suchfeld steht,
  welche Sterne gesetzt sind).
- **Abgeleitet:** Dinge, die man **ausrechnen** kann, wenn man das Gemerkte kennt (welche Karten bei diesem Filter
  sichtbar sind, wie viele Sterne es gibt).

Die Regel: **was man ausrechnen kann, speichert man nicht.**

*Analogie:* eine **Excel-Tabelle**. Die Zelle "Summe" enthält eine **Formel** (`=SUMME(A1:A5)`), keine eingetippte Zahl.
Ändert sich A3, stimmt die Summe sofort. Hätte jemand die Summe **eingetippt**, müsste er bei jeder Änderung daran
denken, sie nachzutragen — und irgendwann stimmt sie nicht mehr. In vanilla stand an vielen Stellen die eingetippte
Zahl; in React steht überall die Formel.

### Task 1 — Filtern und Sortieren: die Liste wird abgeleitet

**Die Kette, jedes Rendern neu** (`EvidencePage.tsx`):

```
geladene Liste ──▶ applyReviewEdits ──▶ filterEvidence ──▶ sortEvidence ──▶ sichtbare Karten
(useCaseData)      (+ Status-Änderungen)  (7 Filter)         (4 Sortierungen)
```

| Schritt | Funktion | Eingaben | Ausgabe |
|---|---|---|---|
| 1 | `applyReviewEdits` (Demo 3) | geladene Liste, `reviewEdits` | neue Liste mit den Änderungen |
| 2 | `filterEvidence` (neu) | Liste, die 7 Filterwerte, `people` | **neues** Array nur mit den passenden Beweisstücken |
| 3 | `sortEvidence` (neu, ersetzt `sortNewestFirst`) | gefilterte Liste, Sortierung | **Kopie**, sortiert |

**Was gespeichert wird und was nicht:**

| | |
|---|---|
| **State (7× `useState`)** | `search`, `typeFilter`, `personFilter`, `locationFilter`, `statusFilter`, `relevanceFilter`, `sort` — nur, was der Nutzer gewählt hat |
| **Abgeleitet (kein State)** | `visibleEvidence` — die Liste, die man sieht |
| | `filters` — die 7 Werte als **ein** Objekt, nur zum Weiterreichen |
| | `types` für das Typ-Dropdown (`uniqueTypes` aus der **vollen** Liste, schrumpft also nicht mit den Filtern) |

```tsx
const visibleEvidence = sortEvidence(filterEvidence(evidence, filters, people), sort);
```

**Die sieben Filter** (`filterEvidence`, Spiegelbild von `getFilteredEvidence()` in vanilla):

| Filter | Regel | Daten-Eigenheit |
|---|---|---|
| Suche | Titel + Summary + Tags, klein geschrieben, `trim()` | — |
| Typ | `item.type.toLowerCase() === Filterwert` | `evidence.json` mischt `test-report` und `Test-Report` → mit `toLowerCase()` vergleichen |
| Person | über `evidenceMentionsPerson` (ID **oder** Anzeigename) | **E04** hat "Nova Byte" statt `nova-byte`. Die Prüfung steht jetzt in `shared/personEvidence.ts`, damit Detailseite und Filter nie unterschiedlich zählen |
| Ort | `item.locationIds.includes(...)` | — |
| Status | `item.status.toLowerCase() === Filterwert` | **E12** hat `"Reviewed"` mit großem R |
| Relevanz | wie Status | **E12** hat `"Unknown"` |
| Sortierung | Tabelle `COMPARATORS: Record<SortOrder, …>` (Datum auf/ab, Titel A–Z/Z–A) | — |

**Die Änderungen an der Toolbar:**

| Datei | Änderung |
|---|---|
| `shared/FilterSelect.tsx` | kann jetzt **kontrolliert** sein (`value` + `onChange`). Die Props sind ein Union-Typ: **entweder** `defaultValue` **oder** `value` + `onChange`, nie gemischt (Compiler-Fehler, siehe unten) |
| `evidence/EvidenceToolbar.tsx` | alle 7 Elemente sind kontrolliert, bekommen `filters` und melden `onFilterChange(feld, wert)`; "Clear filters" ruft `onClearFilters` |
| `evidence/EvidencePage.tsx` | 7 `useState`, `handleFilterChange` (ein `switch` mit sieben Fällen), `handleClearFilters`, die abgeleitete `visibleEvidence`, Leer-Zustand "No evidence matches the current filters." |

**Bewusst "verbose" (die Vorlage für Demo 7):** sieben einzelne `useState` und ein `switch` mit sieben Fällen sind
absichtlich der "Haufen" aus Demo 7. Hier sieht man die Schreibarbeit, die ein Reducer später spart.

**"Clear filters" wie in vanilla:** leert Suche und die fünf Filter, die **Sortierung bleibt** (live in beiden Apps
geprüft: nach Klick `sortEvidence=title-asc`).

### Task 2 — Dashboard-Zähler und Workspace-Liste aus derselben Quelle

**Vorher** (vier Darstellungen derselben Tatsache "welche Beweisstücke sind gemerkt"):

| Wo | Wie |
|---|---|
| `EvidencePage` | State `bookmarks` (ID-Liste) |
| `WorkspacePage` | **Kopie** davon: `useState(loadBookmarks)`, beim Einblenden gezogen und eingefroren |
| `DashboardPage` | `getBookmarkCount()` in `features/dashboard/bookmarks.ts` — ein **zweiter Parser** mit **kopiertem** Key-String `"remotion_bookmarks"` |
| vanilla (zum Vergleich) | `state.bookmarks` **und** ein Extra-Feld `ev.bookmarked` an jedem Beweisstück |

**Nachher:**

| Wo | Wie |
|---|---|
| `shared/bookmarks.ts` (neu) | `bookmarkedEvidence(evidence, bookmarks)` — **eine** Funktion: ID-Liste → Beweisstücke |
| `WorkspacePage` | kein `useState` mehr; `bookmarkedEvidence(evidence, loadBookmarks())` bei jedem Rendern |
| `DashboardPage` | `bookmarkedEvidence(evidence, loadBookmarks()).length` — der Zähler ist die **Länge derselben Liste** |
| `features/dashboard/bookmarks.ts` | **gelöscht** (`git rm`): ein Parser und ein Key-String weniger |
| `shared/personEvidence.ts` | aus `people-locations/` hierher umgezogen (zweiter Nutzer: Evidence-Filter) |

**Ehrlich zur "einen Quelle":** die Quelle der Wahrheit ist hier die **ID-Liste** (`remotion_bookmarks` im
`localStorage`); Zähler und Liste werden mit **derselben Funktion** daraus abgeleitet und können nicht
auseinanderlaufen. Der State in `EvidencePage` bleibt aber vorerst ein **Spiegel** davon (er schreibt in den
`localStorage`, beide Seiten lesen von dort). **Wirklich eine** Quelle entsteht erst in Demo 5, wenn der State nach
oben wandert. Der Render liest dabei den `localStorage` (Zugriff auf die Außenwelt im Render) — auch das ist
provisorisch bis Demo 5.

### Verifikation

- **Vergleich mit vanilla, 22 Kombinationen** (Suche mit Trim und Groß/Klein, Tag-Suche, Typ, Person inkl. E04, Ort,
  Status inkl. E12, Relevanz, Kombinationen, alle 4 Sortierungen, leere Ergebnisse): in beiden Apps dieselben
  Eingaben gesetzt (Werte + `change`/`input`-Events), **22 von 22** liefern **dieselbe ID-Reihenfolge** und
  denselben Leer-Text. Beispiele: Person `nova-byte` → `E04,E18,E05,E06,E17` (E04 über den Anzeigenamen), Typ
  `test-report` → `E03,E01` (E03 hat `Test-Report`), Status `unreviewed` → 17 Karten (ohne E12).
- **"Clear filters":** vanilla und React geben nach dem Klick 18 Karten, alle sechs Werte leer, Sortierung
  `title-asc` bleibt.
- **Abgeleitet, nicht gespeichert (live):** Filter "unreviewed" (17 Karten) → im Detail den Status von E03 auf
  "reviewed" → die Karte **verschwindet von selbst** (16), ohne dass irgendwo "neu filtern" aufgerufen wird; das Detail
  bleibt offen. Filter auf "reviewed" → `E03,E12`.
- **Detail trotz Filter:** `#/evidence?open=E14` bei aktivem Filter "reviewed" → das Detail von E14 öffnet (gesucht
  wird in der **vollen** Liste), die Karte ist nicht im Raster.
- **Typ-Dropdown schrumpft nicht** mit den Filtern (15 Optionen).
- **Zähler und Liste stimmen überein** (Bookmarks E03, E12 gesetzt in Evidence): Dashboard "2 Bookmarked",
  Workspace-Liste `E03, E12`; Stern zurück → Dashboard "1", Workspace `E12`.
- **Der entscheidende Gegenbeweis (veralteter Eintrag):** `localStorage.remotion_bookmarks = ["E12","ZZ99"]`
  (`ZZ99` gibt es nicht).
  - **vanilla:** Dashboard **"2 Bookmarked"**, Workspace-Liste **1** Eintrag → **Zähler und Liste widersprechen sich**
    (zwei Darstellungen: `state.bookmarks.length` gegen die gefilterte Liste).
  - **React:** Dashboard **"1"**, Workspace **1** (`E12`) → dieselbe Funktion, dasselbe Ergebnis.
- **Compiler-Schutz für die `FilterSelect`-Props** (installierte TypeScript-Version, Test-Datei **außerhalb** des
  Projekts):
  ```
  error TS2345: … Property 'onChange' is missing in type '{ id: string; value: string; }' but required in type 'Controlled'.
  error TS2345: … Types of property 'value' are incompatible. Type 'string' is not assignable to type 'undefined'.
  ```
  `value` ohne `onChange` (Demo 2: eine **Laufzeit**-Warnung) und `defaultValue` zusammen mit `value` sind jetzt
  **Compiler**-Fehler.
- **Timeline** nach dem Umbau von `FilterSelect`: weiter 2 / 7 / 7 / 12 Optionen, `?person=nova-byte` → 3 Events,
  Dropdown "nova-byte".
- **Konsole:** zwischen zwei Markern (Dashboard, Evidence, Workspace, Timeline, People, Detail) keine Meldung.
- **Dev-Server-Beobachtung (ehrlich):** nach mehreren schnellen Änderungen an derselben Datei lieferte Vite kurz
  einen **Zwischenstand** (`searchTerm is not defined` in `EvidencePage`, `getBookmarkCount is not defined` in
  `DashboardPage`), obwohl die Dateien auf der Platte korrekt waren — derselbe Effekt wie in UE4 Demo 7. Behoben durch
  erneutes Schreiben der Dateien und ein Neuladen; kein Codefehler.
- **Aufräumen:** `remotion_*`-Keys im `localStorage` wieder entfernt.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler (der Union-Typ der `FilterSelect`-Props, das
  `switch` über `keyof EvidenceFilters`, die Type Guards und die `Record<SortOrder, …>`-Tabelle kompilieren).
  `npm run format:check` → sauber (beim ersten Versuch). `npm run build` → grün (151 Module).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | UE5 Demo 3 | 286,17 KB | 88,76 KB | 151 |
  | **UE5 Demo 4** | **287,64 KB** | **89,25 KB** | **151** |
  | Unterschied | **+1,5 KB** | **+0,5 KB** | 0 (`dashboard/bookmarks.ts` weg, `shared/bookmarks.ts` neu) |

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Die Kette zeigen:** `EvidencePage.tsx`, die Zeile
```tsx
const visibleEvidence = sortEvidence(filterEvidence(evidence, filters, people), sort);
```
Sag: "die Liste, die man sieht, steht **nirgends** im State — sie wird bei jedem Rendern aus Eingaben ausgerechnet."

**2. Das live beweisen:** `#/evidence`, Status-Filter auf "Unreviewed" (17 Karten). Karte E03 öffnen, im Detail
"Review status" auf **Reviewed** → die Karte **verschwindet von selbst**. Sag: "ich habe nirgends 'Liste neu filtern'
aufgerufen. Es gibt keine zweite Liste, die ich nachführen müsste."

**3. Den vanilla-Bug zeigen (stark):** in der Konsole (`F12`) in **beiden** Apps:
```js
localStorage.setItem("remotion_bookmarks", JSON.stringify(["E12", "ZZ99"]))
```
dann Dashboard und Workspace ansehen. **vanilla:** "2 Bookmarked", aber 1 Eintrag in der Liste. **React:** beides 1.
Sag: "vanilla hat dieselbe Tatsache zweimal gespeichert; React leitet beides aus derselben Funktion ab."

**4. Den Typ-Schutz zeigen:** in `EvidenceToolbar.tsx` bei einem `FilterSelect` die Zeile `onChange=…` löschen,
```bash
npm run typecheck
```
→ Fehler "Property 'onChange' is missing … required in type 'Controlled'". Zeile wieder einsetzen.

**5. "Clear filters":** Suche + Filter setzen, Sortierung auf "Title (A–Z)", Clear → Filter leer, Sortierung bleibt.

---

## Demo 5 — State zum nächsten gemeinsamen Besitzer nach oben ziehen

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Wenn **zwei Komponenten dasselbe wissen müssen**, darf keine von beiden es allein "besitzen". Sonst haben beide ihre
**eigene Kopie** — und die Kopien laufen auseinander. Die Lösung heißt **"State nach oben ziehen"** (*lifting state up*):
das Wissen wandert zu dem **nächsten gemeinsamen Vorfahren** der Komponenten, die es brauchen. Der gibt es per
**Props** nach unten.

*Analogie:* eine Familie und der **Einkaufszettel**. Führt jedes Kind seinen **eigenen** Zettel, kauft einer Milch, der
andere nicht — und niemand weiß, was fehlt. Hängt **ein** Zettel am Kühlschrank (bei den Eltern), liest jeder davon.
Will ein Kind etwas draufschreiben, sagt es den Eltern Bescheid (eine **Callback-Funktion**, Demo 6), die Eltern
schreiben es auf, und der Zettel ist für alle neu.

### Task 1 — den niedrigsten gemeinsamen Vorfahren finden und den State dorthin ziehen

**Wer liest oder ändert was?** (Zustand **vor** Demo 5)

| Wissen | Liest | Ändert | Wo es lag |
|---|---|---|---|
| **Bookmarks** (ID-Liste) | Evidence (Stern), **Workspace** (Liste), **Dashboard** (Zähler) | Evidence | `EvidencePage` hielt sie als State; Workspace und Dashboard lasen den `localStorage` **zusätzlich selbst** |
| **Notizen** | Evidence (Detail), **Workspace** (Liste) | Evidence | `EvidencePage` als State, Workspace las den `localStorage` |
| **Status-/Relevanz-Änderungen** | Evidence, **Dashboard** ("Reviewed", Fortschritt, "Recent"), **People-Detail** (Status-Badge) | Evidence | **nur** in `EvidencePage` — die anderen sahen sie nie |

**Der Komponentenbaum** (nur die relevanten Teile):

```
App
 ├─ Header, NavBar            (brauchen nichts davon)
 └─ PageRouter                ◀── niedrigster Vorfahre, der ALLE Seiten enthält
      ├─ DashboardPage         liest bookmarks, reviewEdits
      ├─ EvidencePage          liest + ändert alles
      ├─ TeamLayout            liest reviewEdits  (→ PeopleTab, PersonDetail über den Outlet-Context)
      ├─ TimelinePage          braucht nichts davon
      └─ WorkspacePage         liest bookmarks, notes
```

**Antwort:** der niedrigste gemeinsame Vorfahre ist **`PageRouter`**. `App` ist auch ein Vorfahre, aber nicht der
**niedrigste**; `Header` und `NavBar` brauchen den State nicht und sollen ihn nicht kennen.

**Was gezogen wurde** (alles, was von mehr als einer Seite gelesen wird):

| State | von | nach |
|---|---|---|
| `bookmarks` | `EvidencePage` | **`PageRouter`** |
| `notes` | `EvidencePage` | **`PageRouter`** |
| `reviewEdits` | `EvidencePage` | **`PageRouter`** |

**Was bewusst unten bleibt** (Regel: State lebt beim **niedrigsten** Besitzer, der ihn braucht):

| State | bleibt in | Warum |
|---|---|---|
| die 7 Filterwerte | `EvidencePage` | nur diese Seite braucht sie (Demo 7: Reducer) |
| Hypothesen-Entwurf | `HypothesisForm` | nur das Formular braucht ihn |
| geöffnetes Detail | URL (`?open=`) | siehe Demo 1 |

**Die mechanischen Schritte:**

| # | Schritt | Wo |
|---|---|---|
| 1 | Die drei `useState` samt Startwert (`useState(loadBookmarks)` usw.) aus `EvidencePage` **ausschneiden** und in `PageRouter` einfügen | `app/PageRouter.tsx` |
| 2 | Die drei Änderungs-Funktionen (`handleToggleBookmark`, `handleSaveNote`, `handleChangeReview`) mitnehmen, **dort** steht jetzt der echte Setter | `app/PageRouter.tsx` |
| 3 | Den Seiten die **Werte** als Props geben (`bookmarks`, `notes`, `reviewEdits`) | Route-Elemente in `PageRouter` |
| 4 | `EvidencePage` die **Callbacks** als Props geben (`onToggleBookmark`, `onSaveNote`, `onChangeReview`) | dito |
| 5 | In `DashboardPage`, `WorkspacePage` das **eigene Lesen** des `localStorage` entfernen (ersetzt durch Props); `TeamLayout` legt `reviewEdits` über die Daten | die Seiten |

**Die Props im Überblick:**

| Seite | bekommt (Werte) | bekommt (Callbacks) |
|---|---|---|
| `DashboardPage` | `bookmarks`, `reviewEdits` | — |
| `EvidencePage` | `bookmarks`, `notes`, `reviewEdits` | `onToggleBookmark`, `onSaveNote`, `onChangeReview` |
| `TeamLayout` | `reviewEdits` | — |
| `WorkspacePage` | `bookmarks`, `notes` | — |

**Was sich sonst bewegt hat** (Regel aus UE4 Demo 6 — "shared/ nur bei mindestens zwei Nutzern"):

| Datei | von | nach | neue Nutzer |
|---|---|---|---|
| `toggleBookmark` | `features/evidence/evidenceHelpers.ts` | `shared/bookmarks.ts` | `app/PageRouter.tsx` (die Shell darf keine Feature-Interna importieren) |
| `ReviewEdit`, `applyReviewEdits` | `features/evidence/evidenceHelpers.ts` | `shared/reviewEdits.ts` | Dashboard, People & Locations, Evidence |

**Ehrlich zu zwei Dingen:**

- **`PageRouter` ist jetzt nicht mehr nur eine Routen-Tabelle**, sondern hält auch State. Das ist die Folge der Regel
  "niedrigster Vorfahre". Demo 8 prüft, ob Context das besser löst.
- **Demo 6 überschneidet sich:** die Callbacks (`onToggleBookmark`, …) müssen mit dem Hochziehen mitkommen, sonst
  könnte die Evidence-Seite nichts mehr ändern. Demo 6 **erklärt und verfolgt** sie dann (Wie viele Ebenen? Zu viel?).

### Task 2 — Bookmark in Evidence ist sofort im Dashboard sichtbar

Live im Browser **ohne Neuladen** (alles per Klick durch die Navigation):

| Schritt | Ergebnis |
|---|---|
| in Evidence zwei Sterne setzen (E14, E03), E03 auf "reviewed" stellen, Notiz speichern | `localStorage`: `["E14","E03"]` und `{"E03":"Notiz zu E03"}` |
| **Dashboard** | **"2 Bookmarked"** und **"2 Reviewed"** (E12 aus den Daten + das gerade geänderte E03) |
| **Workspace** | Bookmarks `E03, E14`, Notiz zu E03 |
| zurück zu **Evidence** | E03 weiter `reviewed`, 2 aktive Sterne |
| **Personen-Detail** (`patch-vector`) | E03 mit Status `reviewed` |

### Was damit verschwunden ist (die zwei offenen Punkte aus Demo 3 und 4)

| Schwäche | Zustand vorher | jetzt |
|---|---|---|
| Status-Änderung geht beim Seitenwechsel verloren (Demo 3) | E03 "reviewed" → Dashboard → zurück: wieder "unreviewed" | bleibt `reviewed` (der State lebt in `PageRouter`, das beim Seitenwechsel eingehängt bleibt) |
| Dashboard zeigt die Änderung nicht (Demo 3) | "1 Reviewed" trotz Änderung | **"2 Reviewed"** |
| Die Quelle der Wahrheit ist doppelt (State + `localStorage`) (Demo 4) | zwei Leser | **ein** State; der `localStorage` ist nur noch **Speicher** (wird beim Start gelesen, bei jeder Änderung geschrieben) |
| `localStorage` wird im Render gelesen (Demo 4) | `loadBookmarks()` in Dashboard und Workspace bei **jedem** Rendern | gemessen: während Navigieren Dashboard → Workspace → Evidence → People **0** Lesezugriffe auf `remotion_bookmarks`/`remotion_notes` (nur `remotion_hypothesis`, 2× beim Einhängen des Formulars — `StrictMode` ruft Initialisierer doppelt auf) |

### Was bewusst offen bleibt

| Punkt | Zustand |
|---|---|
| **Filter und Suchtext gehen beim Seitenwechsel verloren** | live: "calibration" gesucht (7 Treffer), Dashboard, zurück → Suchfeld leer, 18 Karten. Die Filter sind **lokaler** State von `EvidencePage` (nur sie braucht ihn); in vanilla blieb der Text stehen (DOM wurde nur versteckt). Wäre ein Wunsch, könnte man sie nach oben ziehen oder in die URL legen |
| **Status-Änderungen überleben keinen Neustart** | nur im Speicher (wie vanilla); Bookmarks und Notizen liegen zusätzlich im `localStorage` |
| **Prop-Weitergabe wächst** | `PageRouter` reicht heute bis zu 6 Props an eine Seite; die Frage, ob das schon zu viel ist, stellt Demo 6/8 |

### Verifikation

- **Alles Obige live** (Tabelle Task 2): Dashboard "2 Bookmarked / 2 Reviewed" sofort, Workspace-Liste und Notiz,
  Rückkehr zu Evidence mit erhaltener Änderung, Personen-Detail mit dem neuen Status.
- **`localStorage`-Lesezugriffe** während der Navigation gezählt (`Storage.prototype.getItem` umhüllt): nur
  `remotion_hypothesis`, 2×.
- **Konsole:** zwischen zwei Markern (Evidence → Dashboard → Evidence → Workspace → Timeline → Locations →
  Dashboard) keine Meldung.
- **Aufräumen:** `remotion_*`-Keys wieder entfernt.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler (die neuen Props-Typen mit `readonly`,
  `Readonly<Record<…>>` und die verschobenen Imports kompilieren). `npm run format:check` → sauber (beim ersten
  Versuch). `npm run build` → grün (152 Module).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | UE5 Demo 4 | 287,64 KB | 89,25 KB | 151 |
  | **UE5 Demo 5** | **287,99 KB** | **89,34 KB** | **152** |
  | Unterschied | **+0,35 KB** | **+0,1 KB** | +1 (`shared/reviewEdits.ts`) |

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Den Baum zeichnen / zeigen:** `PageRouter.tsx` öffnen. Sag: "alle Seiten, die Bookmarks, Notizen oder Status brauchen,
hängen unter `PageRouter` — also wohnt der State dort."

**2. Den Beweis: sofort im Dashboard:** `react.html#/evidence`, einen Stern setzen, einen Status im Detail ändern,
**ohne Neuladen** zum Dashboard klicken → "1 Bookmarked", "2 Reviewed". Dann Workspace → dieselbe Liste.
Sag: "vorher (Demo 3) stand hier noch 1 Reviewed. Jetzt gibt es nur **einen** Besitzer."

**3. Den Beweis: Änderung bleibt beim Seitenwechsel:** Status ändern, zum Dashboard, **zurück** zu Evidence → der
Status ist noch da. Sag: "der State lebt im `PageRouter`, der beim Seitenwechsel nicht ausgehängt wird."

**4. Den Preis zeigen (ehrlich):** im Suchfeld etwas tippen, zum Dashboard, zurück → leer. Sag: "die Filter sind
bewusst **lokal**, weil nur diese Seite sie braucht. Sie verschwinden mit der Seite."

**5. Die Regel erklären:** "State lebt beim **niedrigsten** Vorfahren, der ihn braucht — die Filter in `EvidencePage`, den
Formular-Entwurf im Formular, Bookmarks/Notizen/Status im `PageRouter`."

---

## Demo 6 — Callbacks nach unten reichen

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

In Demo 5 haben wir den State **nach oben** gezogen. Jetzt das Gegenstück: wie ändert ein **Kind** etwas, das dem
**Elternteil** gehört? **Gar nicht direkt.** Das Elternteil gibt dem Kind eine **Funktion** ("ruf das an, wenn etwas
passiert"), und das Kind **ruft sie auf**. Die Daten fließen **nach unten** (Props), die Meldungen **nach oben** (Callbacks).

*Analogie:* ein **Amt**. Du darfst nicht ins Archiv gehen und selbst in der Akte schreiben. Du gibst am **Schalter** ein
Formular ab (`onToggleBookmark("E03")`). Der **Beamte** (das Elternteil) führt die Akte nach den Regeln (neue Liste
berechnen, speichern) und alle Schalter zeigen danach denselben Stand. Wüsstest du selbst, wie man die Akte führt,
führte jeder Besucher sie ein bisschen anders.

### Task 1 — Callback für Bookmarks bis zu jedem Auslöser

Der Besitzer ist `PageRouter` (Demo 5). Die Änderungs-Funktion dort kennt als Einzige den **Setter**:

```tsx
function handleToggleBookmark(evidenceId: string) {
  const next = toggleBookmark(bookmarks, evidenceId);   // neue Liste berechnen (Demo 3)
  setBookmarks(next);                                     // State ändern  -> React rendert neu
  saveBookmarks(next);                                    // speichern (localStorage)
}
```

**Der Weg dieses Callbacks** (live aus dem React-Baum ausgelesen, siehe Verifikation):

| Ebene | Komponente | Was sie mit `onToggleBookmark` macht |
|---|---|---|
| 0 | `PageRouter` | **definiert** die Funktion (hier steckt `setBookmarks`) und gibt sie als Prop an `EvidencePage` |
| 1 | `EvidencePage` | **reicht sie unverändert weiter** an `EvidenceCard` (ruft sie selbst nie auf) |
| 2 | `EvidenceCard` | **ruft sie auf**, in `handleBookmarkClick`, beim Klick auf den Stern: `onToggleBookmark(evidence.id)` |

Dazwischen liegen noch `RenderedRoute` und `Routes` — das sind Komponenten **aus React Router**, die unser Element
nur halten; sie bekommen keine Props von uns.

**Nur wer etwas ändern muss, bekommt einen Callback:**

| Komponente | liest | ändert | bekommt |
|---|---|---|---|
| `EvidenceCard` | `isBookmarked` | Bookmark | `onToggleBookmark` |
| `EvidenceDetail` | Notiz, Status | Notiz, Status | `onSaveNote`, `onChangeReview` |
| `DashboardPage`, `WorkspacePage`, `TeamLayout` | Bookmarks / Notizen / Änderungen | **nichts** | **keinen** Callback, nur Werte |

Der Workspace **kann** Bookmarks lesen, aber nicht ändern — auch nicht aus Versehen. (In vanilla konnte jedes Modul, das
`state` importiert, `state.bookmarks` verändern: `dashboard.ts`, `workspace.ts`, `evidence.ts`, `storage.ts` — heute
schreiben nur `evidence.ts` und `storage.ts`, aber nichts **verhindert** es.)

**Die Verträge sind typisiert** (ein Callback ist eine Signatur, kein `any`):

| Callback | Typ |
|---|---|
| `onToggleBookmark` | `(evidenceId: string) => void` |
| `onSaveNote` | `(evidenceId: string, text: string) => void` |
| `onChangeReview` | `(evidenceId: string, edit: ReviewEdit) => void` |

### Task 2 — mindestens eine weitere Interaktion

Zwei weitere Interaktionen ändern **vom Elternteil besessenen** State (sie wurden in Demo 5 mit hochgezogen und laufen
nach demselben Muster):

| Interaktion | Auslöser | Callback | Besitzer-Funktion in `PageRouter` |
|---|---|---|---|
| **Notiz speichern** | `EvidenceDetail.handleSubmit` | `onSaveNote(id, text)` | `handleSaveNote`: `{ ...notes, [id]: text }` + `saveNotes` |
| **Status / Relevanz ändern** | `EvidenceDetail.handleStatusChange` / `handleRelevanceChange` | `onChangeReview(id, { status })` bzw. `{ relevance }` | `handleChangeReview`: zweistufiges unveränderliches Update |

Beide haben **dieselbe Gestalt**: das Kind **meldet** ("für E03 ist die Notiz jetzt …"), das Elternteil **entscheidet**,
wie der State neu aussieht.

Dazu gibt es **Callbacks, die nicht in den gemeinsamen State gehen**, sondern in den lokalen State der Seite
(Filter) oder in die URL (Detail): `onOpen`/`onClose` (→ `?open=`), `onFilterChange`/`onClearFilters` (→ die 7 `useState`).
Sie folgen demselben Muster, nur dass der Besitzer `EvidencePage` ist.

### Die Wegwerf-Sandbox: Callback gegen durchgereichten Setter

Wie in den früheren Demos eine Sandbox **außerhalb** der App (`callback-demo.html`, `src/sandbox/CallbackDemo.tsx`; nicht
in `vite.config.js` → nie gebaut). Dieselbe Aktion zweimal: links bekommen die Kinder einen **Callback**, rechts den
**Setter**. "Gespeichert" steht für den `localStorage`.

| Klick | Links (Callback) | Rechts (Setter durchgereicht) |
|---|---|---|
| Kind B | State `[E01]`, Gespeichert `[E01]` | State `[E01]`, Gespeichert **`[]`** (Kind B vergisst das Speichern) |
| Kind B nochmal | State `[]`, Gespeichert `[]` (toggelt richtig) | State **`[E01, E01]`** (Kind B hängt nur an, kein Umschalten) |
| Kind A | State `[E01]`, Gespeichert `[E01]` | State `[]`, Gespeichert `[]` (Kind A schaltet um und speichert) |

Rechts hat **jedes Kind seine eigene Regel** — Kind B die falsche. Links gibt es **eine** Regel (`handleToggle`), die
Kinder können sie nicht verbiegen.

### Verifikation

- **Callback-Weg live aus dem React-Baum gelesen** (über die interne Fiber-Struktur des Stern-Buttons, jeweils die
  Funktionskomponenten nach oben):
  - Kette: `EvidenceCard → EvidencePage → RenderedRoute → Routes → PageRouter`.
  - `onToggleBookmark` steht als Prop auf **zwei** Ebenen (`EvidenceCard`, `EvidencePage`), und es ist auf beiden
    **dieselbe Funktion** (`===`).
  - Für `onSaveNote` und `onChangeReview` (vom Formular bzw. Dropdown im Detail): Kette
    `EvidenceDetail → EvidencePage → RenderedRoute → Routes → PageRouter`, Props auf `EvidenceDetail` und
    `EvidencePage`.
- **Prop-Anzahl gemessen:** `EvidencePage` 6, `EvidenceDetail` 7, `EvidenceCard` 4. `EvidencePage` **benutzt** drei Props
  selbst (`bookmarks`, `notes`, `reviewEdits`) und **reicht nur** die drei Callbacks weiter.
- **Echte Compiler-Fehler** für den Vertrag (installierte TypeScript-Version, Test-Datei **außerhalb** des Projekts):
  ```
  error TS2552: Cannot find name 'setBookmarks'. Did you mean 'bookmarks'?   // an den Setter kommt das Kind nicht
  error TS2339: Property 'push' does not exist on type 'readonly string[]'.   // den Prop-Wert mutieren geht nicht
  error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.   // onToggleBookmark(42)
  error TS2554: Expected 1 arguments, but got 0.   // onToggleBookmark()
  ```
- **Sandbox** mit den Klicks aus der Tabelle oben durchgespielt, Werte exakt wie dort.
- **Funktioniert in der App** (gleicher Code wie Demo 5, dort live geprüft): Stern, Notiz speichern und Status ändern
  sind im Dashboard, Workspace und der Personen-Detailseite sichtbar.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler (inklusive der neuen Sandbox, die `tsc` über
  `src/**/*.tsx` mitprüft). `npm run format:check` → sauber (beim ersten Versuch, auch `callback-demo.html`).
  `npm run build` → grün (152 Module). Es gab in Demo 6 **keine Änderung am App-Code**, nur die Sandbox kam dazu
  (Callbacks und Props standen seit Demo 5): das Bundle ist **byte-identisch** zu Demo 5 (`react-*.js` 287,99 KB,
  gzip 89,34 KB, gleicher Datei-Hash `B6JqClwE`), und die Sandbox taucht in `dist/` nicht auf.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Den Callback verfolgen (die Frage, die kommt):** `PageRouter.tsx` → `handleToggleBookmark` (hier steckt `setBookmarks`)
→ `<EvidencePage onToggleBookmark=…>` → in `EvidencePage.tsx` `onToggleBookmark={onToggleBookmark}` an die Karte →
`EvidenceCard.tsx` → `handleBookmarkClick` ruft `onToggleBookmark(evidence.id)`. Sag: "drei Dateien, zwei Props-Hops."

**2. Die Sandbox zeigen:** `http://localhost:5173/Mystery-Road-AWE-2026-lukesch/callback-demo.html`. In beiden Spalten Kind B
zweimal, dann Kind A klicken. Links bleibt alles gleich. Rechts laufen State und "Gespeichert" auseinander und es
entsteht `[E01, E01]`. Sag: "wer den Setter hat, muss die Regel kennen. Wer nur einen Callback hat, kann sie nicht
verbiegen."

**3. Den Typschutz zeigen:** in `EvidenceCard.tsx` `onToggleBookmark(42)` schreiben,
```bash
npm run typecheck
```
→ `Argument of type 'number' is not assignable to parameter of type 'string'`. Zeile wieder entfernen.

**4. Das Prinzip-Minimum zeigen:** `WorkspacePage.tsx` hat **keinen** Callback. Sag: "die Seite zeigt nur. Sie kann Bookmarks nicht
ändern — auch nicht aus Versehen."

**5. Die Prop-Drilling-Frage ehrlich beantworten:** `EvidencePage.tsx` öffnen, auf die Prop-Liste zeigen (6). Sag: "drei
benutzt die Seite selbst, drei reicht sie nur weiter. Das ist eine Ebene Durchreichen, noch kein Problem."

---

## Demo 7 — `useReducer` für den Filter-Zustand

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Bisher hat die Seite für jeden der sieben Filterwerte ein eigenes `useState`, und für jede Änderung gab es einen eigenen
Setter. Das ist wie eine **Fernbedienung, bei der man jeden Wert einzeln einstellen muss**. Mit `useReducer` gibt es
**Tasten mit festen Bedeutungen**: man drückt "setze Typ auf X", "andere Sortierung", "Standardbild" — und **ein**
Schaltplan (der **Reducer**) legt fest, was jede Taste mit den Einstellungen macht.

*Analogie:* die **"Standardbild"-Taste** am Fernseher. Sie setzt Helligkeit, Kontrast und Farbe **auf einmal** zurück
(und lässt die Lautstärke, wie sie ist). Niemand muss sich merken, welche Regler dazugehören — das steht **einmal** im
Gerät. Bei sieben einzelnen Schiebereglern müsste der Bediener jeden selbst zurückstellen und könnte einen vergessen.

`useReducer(reducer, startwert)` gibt zwei Dinge zurück: den **aktuellen Zustand** und eine Funktion **`dispatch`**, mit
der man eine **Aktion** abschickt. React ruft dann `reducer(alterZustand, aktion)` auf und nimmt das Ergebnis als neuen
Zustand.

### Task 1 — die sieben Filterwerte als **eine** Zustands-Domäne

Die sieben Werte gehören zusammen: sie werden **immer gemeinsam gelesen** (die Liste hängt von allen ab), ändern sich
**als Gruppe** (Clear) und werden **zusammen** an die Toolbar gegeben.

| Wert | Typ | Startwert |
|---|---|---|
| `search` | string | `""` |
| `type` | string | `""` |
| `person` | string | `""` |
| `location` | string | `""` |
| `status` | string | `""` |
| `relevance` | string | `""` |
| `sort` | `SortOrder` (`"date-desc"`, `"date-asc"`, `"title-asc"`, `"title-desc"`) | `"date-desc"` |

**Vorher (Demo 4/5)** — sieben `useState`, ein `switch` mit sieben Fällen, sechs Setter für Clear, ein Objekt von Hand
zusammengesteckt:

```tsx
const [search, setSearch] = useState("");
const [typeFilter, setTypeFilter] = useState("");
... (fünf weitere)
function handleFilterChange(field, value) { switch (field) { case "search": setSearch(value); break; ... } }
function handleClearFilters() { setSearch(""); setTypeFilter(""); ... (sechs Setter) }
const filters = { search, type: typeFilter, ... };
```

**Nachher (Demo 7):**

```tsx
const [filters, dispatch] = useReducer(filterReducer, INITIAL_FILTERS);   // EvidencePage.tsx

function handleFilterChange(field, value) {
  if (field === "sort") { if (isSortOrder(value)) dispatch({ type: "SET_SORT", sort: value }); }
  else dispatch({ type: "SET_FILTER", field, value });
}
function handleClearFilters() { dispatch({ type: "CLEAR_FILTERS" }); }
```

| Neue/geänderte Datei | Rolle |
|---|---|
| `evidence/filterReducer.ts` (neu) | der **Reducer**: Typen `FilterField`, `FilterAction`, der `INITIAL_FILTERS` und die Funktion `filterReducer` — **eine reine Funktion**, kein React, kein DOM |
| `evidence/EvidencePage.tsx` | `useReducer` statt 7× `useState`; die Handler schicken nur noch Aktionen |
| `evidence/EvidenceToolbar.tsx` | **unverändert** (bekommt weiter `filters`, `onFilterChange`, `onClearFilters`) |

**Gemessen (Codezeilen ohne Kommentare und Leerzeilen):**

| | vorher | nachher |
|---|---|---|
| Filter-Code in `EvidencePage` | **49** (7 `useState` + `handleFilterChange` 25 + `handleClearFilters` 8 + Objekt 9) | **11** (`useReducer` 1 + `handleFilterChange` 7 + `handleClearFilters` 3) |
| Reducer-Datei | — | **25** |
| **zusammen** | **49** | **36** |
| `EvidencePage.tsx` insgesamt | 217 Zeilen | 174 Zeilen |

Ehrlich: es wird **nicht** dramatisch weniger Code (36 gegen 49). Der Gewinn liegt in der **Struktur**: die Seite ist um 38 Zeilen
leichter, und **alle** Zustandsübergänge stehen an **einer** Stelle.

### Task 2 — mindestens 3 Aktionstypen

| Aktion | Felder | Was der Reducer macht | Wann abgeschickt |
|---|---|---|---|
| **`SET_FILTER`** | `field` (eines der 6 String-Felder), `value` | `{ ...state, [field]: value }` | Suche getippt, Typ/Person/Ort/Status/Relevanz gewählt |
| **`SET_SORT`** | `sort` (ein `SortOrder`) | `{ ...state, sort }` | Sortierung gewählt |
| **`CLEAR_FILTERS`** | — | `{ ...INITIAL_FILTERS, sort: state.sort }` | "Clear filters" geklickt |

```ts
export type FilterAction =
  | { type: "SET_FILTER"; field: FilterField; value: string }
  | { type: "SET_SORT"; sort: SortOrder }
  | { type: "CLEAR_FILTERS" };
```

**Der Weg einer Eingabe:**

| Schritt | Was passiert |
|---|---|
| 1 | Nutzer wählt im Typ-Dropdown `access-log` |
| 2 | `FilterSelect` ruft `onChange("access-log")` → die Toolbar `onFilterChange("type", "access-log")` |
| 3 | `handleFilterChange` macht daraus `dispatch({ type: "SET_FILTER", field: "type", value: "access-log" })` |
| 4 | React ruft `filterReducer(alterZustand, aktion)` auf → neuer Zustand mit `type: "access-log"` |
| 5 | `EvidencePage` rendert neu → die abgeleitete Liste (`visibleEvidence`, Demo 4) wird mit dem neuen Zustand berechnet |

**Zwei Typ-Entscheidungen, die Fehler verhindern:**

- `FilterField` ist `Exclude<keyof EvidenceFilters, "sort">`: **`sort` ist bei `SET_FILTER` ausgenommen**. Die Sortierung ist ein
  geschlossener Typ und hat ihre eigene Aktion; mit `SET_FILTER` kann man keine beliebige Zeichenkette als Sortierung
  einschleusen.
- Der Reducer hat **kein `default`**: TypeScript prüft, dass **jede** Aktion behandelt ist.

### Verifikation

- **Parität mit vanilla (dieselben 22 Kombinationen wie in Demo 4)** nach dem Umbau erneut durchgespielt: **22 von 22**
  identisch (inklusive E04 über den Anzeigenamen, `Test-Report`/`test-report`, E12, Leer-Text).
- **"Clear filters"** (Suche `log`, alle fünf Filter gesetzt, Sortierung `title-asc` → 1 Karte): nach dem Klick 18 Karten,
  alle sechs Werte leer, **Sortierung bleibt `title-asc`** (wie vanilla).
- **Der Reducer als reine Funktion** (direkt aus dem Dev-Server importiert, mit **eingefrorenem** Zustand):
  - `SET_FILTER` → neues Objekt, nur `person` geändert, **Original unverändert**.
  - `SET_SORT` → nur `sort` geändert, alle anderen Felder bleiben.
  - `CLEAR_FILTERS` → alle Filter `""`, `sort` bleibt `title-desc`; Ergebnis ist ein **neues** Objekt (weder das alte noch
    `INITIAL_FILTERS`).
- **Echte Compiler-Fehler** (installierte TypeScript-Version, Test-Datei **außerhalb** des Projekts, dort ein achtes Feld
  `tag` und eine vierte Aktion `RESET_SEARCH` ergänzt):
  ```
  error TS2741: Property 'tag' is missing in type '{ search: string; type: string; sort: "date-desc"; }' but required in type 'EvidenceFilters'.
  error TS2366: Function lacks ending return statement and return type does not include 'undefined'.
  error TS2322: Type '"sort"' is not assignable to type 'FilterField'.
  error TS2322: Type '"CLEAR"' is not assignable to type '"CLEAR_FILTERS" | "RESET_SEARCH" | "SET_FILTER" | "SET_SORT"'.
  error TS2322: Type '"newest"' is not assignable to type 'SortOrder'.
  ```
- **React-Quelltext nachgesehen** (installiert: React 19.3.0, `react-dom-client.development.js`): `useState` ist auf demselben
  Mechanismus gebaut wie `useReducer` (Grundlage für Theorie F3), siehe dort.
- **Konsole:** zwischen zwei Markern (alle fünf Seiten, Detail, Filter setzen, Clear) keine Meldung.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler (der Union-Typ `FilterAction`, die ausschließende
  `switch`-Prüfung ohne `default` und `{ ...state, [action.field]: action.value }` kompilieren).
  `npm run format:check` → sauber (beim ersten Versuch). `npm run build` → grün (153 Module).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | UE5 Demo 6 | 287,99 KB | 89,34 KB | 152 |
  | **UE5 Demo 7** | **287,90 KB** | **89,37 KB** | **153** |
  | Unterschied | **−0,09 KB** | **+0,03 KB** | +1 (`filterReducer.ts`) |

  Das Bundle bleibt praktisch gleich groß: der Reducer ersetzt den Code, den er aus der Seite herausnimmt.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Den Reducer zeigen:** `filterReducer.ts` öffnen. Sag: "alle **Zustandsübergänge** der Filter stehen hier, drei
Zweige, eine reine Funktion."

**2. Den Weg einer Eingabe zeigen:** `EvidencePage.tsx` → `handleFilterChange` (sieben Zeilen) und
`dispatch({ type: "SET_FILTER", … })`. Sag: "vorher ein `switch` mit sieben Fällen, jetzt zwei Zweige."

**3. Clear zeigen (Theorie F2):** Filter und Sortierung setzen, "Clear filters" → Filter leer, Sortierung bleibt.
`CLEAR_FILTERS` im Reducer zeigen: `{ ...INITIAL_FILTERS, sort: state.sort }`.

**4. Den Reducer ohne React ausprobieren (stark):** in der Konsole
```js
const m = await import("/Mystery-Road-AWE-2026-lukesch/src/features/evidence/filterReducer.ts");
const s = m.filterReducer(m.INITIAL_FILTERS, { type: "SET_FILTER", field: "person", value: "nova-byte" });
m.filterReducer(s, { type: "CLEAR_FILTERS" })
```
Sag: "eine reine Funktion: Zustand rein, Aktion rein, neuer Zustand raus. Kein Browser, kein React nötig."

**5. Den Compiler-Schutz zeigen:** in `filterReducer.ts` bei `INITIAL_FILTERS` die Zeile `relevance: "",` löschen,
```bash
npm run typecheck
```
→ `Property 'relevance' is missing …`. Zeile wieder einsetzen. Sag: "ein neues Filterfeld **kann** gar nicht in `CLEAR_FILTERS`
vergessen werden."

---

## Demo 8 — Context, und wann man ihn nicht benutzt

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Bisher gab `PageRouter` den Bookmark-State per **Props** nach unten: Seite für Seite, jede bekam `bookmarks` (und
`EvidencePage` zusätzlich den Callback). **Context** ist eine Art **Durchsage-Anlage**: der Besitzer spricht **einmal**
hinein (`<BookmarksProvider>`), und **jede Komponente darunter** kann mithören (`useBookmarks()`), ohne dass jemand
dazwischen den Zettel weiterreicht.

*Analogie:* **Staffelstab** (Props: jeder gibt dem nächsten die Hand) gegen **Lautsprecherdurchsage im Gebäude** (Context: wer
im Gebäude ist, hört sie). Praktisch, wenn viele Leute in vielen Stockwerken dasselbe wissen müssen — aber auch ein
Lautsprecher, den **jeder** hört, ob er will oder nicht, und wer hört, merkt man nicht an der Tür (der Signatur) der Komponente.

**Wichtig:** Context **speichert nichts**. Der State steht weiter in einem ganz normalen `useState`; Context ist nur der
**Transportweg** vom Besitzer zu den Lesern.

### Task 1 — die Bookmarks über Context, die Props-Version ersetzt

| Datei | Änderung |
|---|---|
| `shared/BookmarksContext.tsx` (neu, 30 Codezeilen) | `BookmarksProvider` (besitzt den `useState`, die Regel zum Umschalten und Speichern) und `useBookmarks()` (liest den Wert, wirft einen klaren Fehler außerhalb des Providers) |
| `app/PageRouter.tsx` | der Bookmark-State, der Handler und die Imports sind **weg**; die Routen sind in `<BookmarksProvider>` gewickelt; Props `bookmarks` und `onToggleBookmark` fallen weg |
| `DashboardPage`, `WorkspacePage`, `EvidencePage` | lesen `const { bookmarks } = useBookmarks()` (Evidence zusätzlich `toggle`) |
| `EvidenceCard` | **unverändert**: bekommt weiter `isBookmarked`/`onToggleBookmark` als Props (bleibt reine Darstellung, siehe F2) |

```tsx
// shared/BookmarksContext.tsx (Kern)
const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);
const value = useMemo(() => ({ bookmarks, toggle: (id) => { /* neue Liste, State, speichern */ } }), [bookmarks]);
return <BookmarksContext value={value}>{children}</BookmarksContext>;

// in jeder Seite:
const { bookmarks } = useBookmarks();
```

**Was sich an den Props geändert hat** (live aus dem React-Baum gemessen):

| Seite | Props vorher (Demo 7) | Props jetzt |
|---|---|---|
| `DashboardPage` | `bookmarks`, `reviewEdits` (2) | `reviewEdits` (**1**) |
| `EvidencePage` | `bookmarks`, `notes`, `reviewEdits`, `onToggleBookmark`, `onSaveNote`, `onChangeReview` (6) | `notes`, `reviewEdits`, `onSaveNote`, `onChangeReview` (**4**) |
| `WorkspacePage` | `bookmarks`, `notes` (2) | `notes` (**1**) |
| `TeamLayout` | `reviewEdits` (1) | `reviewEdits` (1) |
| **zusammen von `PageRouter` nach unten** | **11** | **7** (−4) |

Der Weg des Bookmark-Callbacks: vorher `PageRouter → EvidencePage → EvidenceCard` (2 Props-Ebenen), jetzt liest
`EvidencePage` die Funktion **selbst** aus dem Context und gibt sie an die Karte (**1** Ebene). Der Baum zeigt es:
`EvidenceCard → EvidencePage [liest Context] → … → BookmarksProvider → PageRouter`.

**Bewusst bei Props geblieben:** Notizen und Status-Änderungen (siehe die Entscheidung unten).

### Task 2 — die ehrliche Entscheidung: ist Context hier richtig?

**Kurz:** **knapp, und nur für die Bookmarks.** Für diese App in ihrer heutigen Größe wären Lifting + Props **auch gut
genug** gewesen. Ich behalte den Context für die Bookmarks, weil der Wechsel billig ist und sie der einzige State sind, den
**alle drei Daten-Seiten** lesen. Ich würde ihn **nicht** auf Notizen und Status-Änderungen ausweiten.

**Die Abwägung mit Zahlen** (gemessen):

| | Für Context | Gegen Context |
|---|---|---|
| Props | **−4** (11 → 7), `EvidencePage` von 6 auf 4 | — |
| Callback-Weg | 2 Ebenen → 1 | — |
| Code | `PageRouter` −12 Zeilen | **+30** neue Datei, Seiten +1 +1 −2 → netto **+18** Codezeilen |
| Lesbarkeit | `PageRouter` ist wieder schlanker | **Abhängigkeit unsichtbar**: an `DashboardPage(reviewEdits)` sieht man nicht mehr, dass sie Bookmarks liest |
| Robustheit | — | `useBookmarks()` **wirft**, wenn der Provider fehlt; jeder Test braucht einen Provider-Rahmen |
| Konsistenz | — | **zwei Mechanismen** für dasselbe Muster: Bookmarks per Context, Notizen/Status per Props |
| Neurendern | — | **alle** Leser rendern bei **jeder** Änderung des Werts neu (kein "Auswählen", siehe Sandbox) |

**Meine Schwellen aus Demo 6, noch einmal angelegt:**

| Zeichen | Hier? |
|---|---|
| ≥ 3 Ebenen, auf denen eine Komponente eine Prop **nur** weiterreicht | **nein** (eine) |
| dieselbe Prop an **vielen** weit entfernten Stellen | **nein** (alle drei Leser hängen direkt unter `PageRouter`) |
| Komponenten außerhalb des Routers brauchen den Wert (z. B. ein Zähler in der Kopfzeile) | **noch nicht** |
| Props-Liste so lang, dass man den Überblick verliert | **an der Grenze** (6 bei `EvidencePage`) |

Strenge Anwendung der Schwellen: **Lifting + Props reicht**. Dass ich den Context trotzdem behalte, hat drei Gründe: (1) er löst
**genau** den einen Punkt, den Demo 6 als Kandidaten für Entlastung nannte (die Prop-Menge), (2) die Bookmarks sind der
einzige State, der **von allen drei Daten-Seiten** gelesen wird und **app-weit** ist (wie Thema oder Sprache), (3) mit mehr
Lesern (etwa ein Zähler im Header, der **außerhalb** des Routers hängt) würde die Props-Variante deutlich teurer.

**Warum nicht auch Notizen und Status?** Notizen lesen nur **zwei** Seiten (Evidence, Workspace). Die Status-Änderungen werden
nicht "gelesen", sondern über die Daten **gelegt** (`applyReviewEdits`) und beeinflussen die **Daten selbst** — das gehört
besser in eine Datenschicht (die UE5 nicht verlangt). Und: **jeder weitere Context** bringt wieder Indirektion mit.

**Die Rückfall-Option:** wer das anders sieht, macht es mit einem Handgriff rückgängig: `BookmarksProvider` entfernen, die
drei Props und den State zurück in `PageRouter` (so stand es in Demo 7).

### Wegwerf-Sandbox: was Context nicht ist

Wie in den früheren Demos eine Sandbox **außerhalb** der App (`context-demo.html`, `src/sandbox/ContextDemo.tsx`; nicht
in `vite.config.js` → nie gebaut; bewusst **ohne** `StrictMode`, weil `StrictMode` jede Komponente zweimal aufruft und die
Zähler verdoppeln würde). Der Context-Wert ist **ein** Objekt `{ a, b }`; zwei Leser lesen je **nur ein** Feld.

| Klick | A (liest nur `a`) | B (liest nur `b`) | A in `memo()` |
|---|---|---|---|
| Start | gerendert 1× | 1× | 1× |
| `a + 1` | `a = 1`, **2×** | `b = 0`, **2×** | **2×** |
| `a + 1` | `a = 2`, 3× | `b = 0`, **3×** | 3× |
| `b + 1` | `a = 2`, 4× | `b = 1`, 4× | **4×** |

**B liest nur `b` und rendert trotzdem bei jeder Änderung von `a` neu**, und `memo()` hilft nicht (ein geänderter
Context-Wert ist keine Prop). Dazu: eine Komponente **außerhalb** des Providers bekommt `null` ("kein Wert").

### Verifikation

- **Verhalten unverändert** (gleicher Ablauf wie in Demo 5, ohne Neuladen): zwei Sterne gesetzt (`["E14","E03"]`), E03 auf
  "reviewed", Notiz gespeichert → **Dashboard** "2 Bookmarked / 2 Reviewed", **Workspace** E03, E14 samt Notiz, zurück zu
  **Evidence** (2 Sterne, E03 `reviewed`); ein Stern zurück → Dashboard "1 Bookmarked", `localStorage` `["E03"]`.
- **Props und Leser live aus dem Baum gelesen:** `DashboardPage` `["reviewEdits"]`, `EvidencePage`
  `["notes","reviewEdits","onSaveNote","onChangeReview"]`, `WorkspacePage` `["notes"]`; alle drei sind als "liest Context"
  markiert. Kette vom Stern: `EvidenceCard → EvidencePage → (Router-Interna) → BookmarksProvider → PageRouter`.
  (Auch `Routes` und `RenderedRoute` aus React Router "lesen Context": React Router selbst ist auf Context gebaut.)
- **Code gezählt** (Codezeilen ohne Kommentare/Leerzeilen): `BookmarksContext.tsx` 30; `PageRouter` 74 → 62; `DashboardPage`
  31 → 32; `WorkspacePage` 49 → 50; `EvidencePage` 114 → 112.
- **Sandbox** mit den Klicks aus der Tabelle durchgespielt, Werte exakt wie dort.
- **Der Fehlerfall ohne Provider** (testweise `<BookmarksProvider>` aus `PageRouter` entfernt, danach wiederhergestellt):
  die Seite bleibt **leer**, die Konsole meldet `Uncaught Error: useBookmarks() must be used inside <BookmarksProvider>` mit
  dem Stack `useBookmarks → EvidencePage`. Es gibt keinen Error Boundary in der App, der Fehler stoppt also das Rendern.
  Nach dem Wiederherstellen: 18 Karten, alles wie vorher.
- **Konsole:** zwischen zwei Markern (alle Seiten, Personen-Detail, Evidence-Detail) keine Meldung.
- **Aufräumen:** `remotion_*`-Keys wieder entfernt.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler (der Context-Typ mit `null`, `useMemo<…>` und der Provider
  `<BookmarksContext value=…>` aus React 19 kompilieren). `npm run format:check` → sauber (beim ersten Versuch, auch
  `context-demo.html`). `npm run build` → grün (154 Module).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | UE5 Demo 7 | 287,90 KB | 89,37 KB | 153 |
  | **UE5 Demo 8** | **288,16 KB** | **89,42 KB** | **154** |
  | Unterschied | **+0,26 KB** | **+0,05 KB** | +1 (`BookmarksContext.tsx`) |

  Der Context kostet praktisch nichts im Bundle; die Kosten liegen bei Lesbarkeit und unsichtbarer Abhängigkeit (siehe oben).
  Die Sandbox taucht in `dist/` nicht auf.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Den Provider zeigen:** `PageRouter.tsx` — `<BookmarksProvider>` um die Routen; dann `BookmarksContext.tsx` (30 Zeilen). Sag: "der
State ist ein ganz normales `useState`. Context ist nur der Transportweg."

**2. Die Leser zeigen:** in `DashboardPage`, `WorkspacePage`, `EvidencePage` die Zeile `const { bookmarks } = useBookmarks()`. Sag:
"keine Zwischen-Komponente reicht `bookmarks` mehr durch."

**3. Die Sandbox zeigen (beste Demo für F1):** `http://localhost:5173/Mystery-Road-AWE-2026-lukesch/context-demo.html`. Auf `a + 1`
klicken: **B** (liest nur `b`) zählt trotzdem hoch, `memo()` hilft nicht. Sag: "Context hat keine Auswahl. Wer ihn liest,
wird bei **jeder** Änderung neu gerendert."

**4. Die Entscheidung vortragen (Task 2):** "knapp. Props hätten gereicht (Tiefe 2, drei Leser direkt unter dem Router). Ich
behalte Context für die **Bookmarks**, weil er die Prop-Menge entlastet (6 → 4) und sie der einzige app-weite State sind. Notizen
und Status bleiben bei Props. Preis: +18 Codezeilen, unsichtbare Abhängigkeit, zwei Mechanismen."

**5. Den Fehlerfall zeigen:** in `PageRouter.tsx` `<BookmarksProvider>` und `</BookmarksProvider>` testweise entfernen → die Seite bricht
mit `useBookmarks() must be used inside <BookmarksProvider>` ab. Wieder einsetzen.

---

## Demo 9 — Häufige State-Probleme finden und beheben

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Fast alle Fehler in Oberflächen mit State stammen aus **fünf** wiederkehrenden Mustern. Diese Demo ist ein **Gesundheitscheck
des eigenen Codes**: durchgehen, ob eines davon vorkommt, und die echten Funde beheben.

| # | Problem | In einem Satz | Alltagsbild |
|---|---|---|---|
| 1 | **Duplizierter State** | dieselbe Tatsache steht an **mehreren** Orten | zwei Kalender, in beiden steht derselbe Termin, einer wird gepflegt |
| 2 | **Veralteter State** | ein Wert ändert sich **nicht**, wenn er es müsste | die Uhr, die stehengeblieben ist |
| 3 | **Zu viel Prop-Drilling** | Werte werden durch viele Komponenten geschleust, die sie nicht brauchen | eine Postkette, in der jeder nur weiterreicht |
| 4 | **Unnötiger globaler State** | etwas ist überall erreichbar, obwohl nur eine Stelle es braucht | ein Hausschlüssel für alle Nachbarn |
| 5 | **Direktes Mutieren** | ein bestehender Wert wird verändert statt ersetzt | in einem Buch radieren, das andere gerade lesen |

### Task 1 — das eigene Code-Review

Ich habe `src/` (ohne die Sandbox) nach jedem der fünf Muster durchsucht: Textsuche (`grep`), Zählen von Aufrufen, und im
Browser Netzwerk-Anfragen und Verhalten **gemessen**.

| # | Problem | Befund | Wie gefunden | Folge |
|---|---|---|---|---|
| 1 | Duplizierter State | **JA, zweimal** (Fälle 1 und 2) | Textsuche: `useCaseData()` in **5** Seiten, `applyReviewEdits(` an **3** Stellen. Danach Netzwerk-Messung | **behoben** |
| 2 | Veralteter State | **JA** (Fall 3), dazu der alte Dashboard-Zähler (schon in Demo 5 behoben) | Beim Wiederlesen der eigenen Notiz aus Demo 2 ("zwei schnelle Klicks starten zwei Timer"), dann **live reproduziert** | **behoben** |
| 3 | Prop-Drilling | **Teilweise:** `reviewEdits` wurde an **drei** Seiten durchgereicht (jede legte sie selbst über die Daten) | Props-Liste von `PageRouter` gelesen | **behoben** durch Fall 2 (die Prop entfällt) |
| 4 | Unnötiger globaler State | **kein Fund**, nur der bekannte Grenzfall: `BookmarksProvider` umschließt **alle** Routen (auch Timeline, People) | Demo-8-Abwägung erneut gelesen. Filter, Entwurf und geöffnetes Detail sind lokal bzw. in der URL | **bewusst belassen** (Demo 8) |
| 5 | Mutieren | **kein Fund** | Textsuche nach `.push(`, `.pop(`, `.shift(`, `.splice(`, `.sort(`, `.reverse(`, `.fill(` und Zuweisungen an Eigenschaften | nichts zu beheben |

**Zum Mutieren konkret** (Textsuche über `src/` ohne Sandbox): die einzigen Treffer sind (a) Kommentare, die vanilla-Fehler
beschreiben, (b) `types.push(type)` in `uniqueTypes` auf einem **lokal in der Funktion** gebauten Array (kein State, kein Prop),
(c) `evidence.slice(-5).reverse()` und `[...x].sort(...)` in `DashboardView`/`evidenceHelpers`/`timelineHelpers` — jeweils auf einer
**Kopie**. Kein State und kein Prop wird mutiert.

### Task 2 — drei echte Fälle, behoben

#### Fall 1 — Duplizierter State: dieselben Daten **fünfmal** geladen und gehalten

| | |
|---|---|
| **Kategorie** | Duplizierter State (und eine Folge: fünf Kopien desselben Lade-/Fehler-Blocks) |
| **Wie bemerkt** | Beim Review der Aufrufe von `useCaseData()`: es stand in **fünf** Seiten (`DashboardPage`, `EvidencePage`, `WorkspacePage`, `TimelinePage`, `TeamLayout`), jede mit eigenem `useState`/`useEffect`-Laden und eigenem Lade-/Fehler-Block. Das war schon in UE4 Demo 10 F3 als "Lade-Block dreimal kopiert" aufgefallen und mit "UE5 löst das" vertagt |
| **Beleg vorher (gemessen)** | `performance`-Einträge für `data/*.json`: **10 Anfragen** beim ersten Laden und **10 bei jedem Seitenwechsel**; nach 5 Wechseln insgesamt **60** (`case.json` 12×, `evidence.json` 12×, …). *(10 statt 5, weil `StrictMode` den Effekt in der Entwicklung doppelt ausführt; im Build wären es 5 pro Seitenaufruf.)* |
| **Warum ein Problem** | jede Seite hält **ihre eigene Kopie** der Daten; die geladenen Beweisstücke verlieren bei jedem Wechsel ihre Identität; 5-fach derselbe Code für "lädt / Fehler" |
| **Fix** | `PageRouter` ruft `useCaseData()` **einmal** auf, behandelt lade/Fehler **einmal** (`early return`) und reicht fertige Daten als Prop `data` an die Seiten. Die Seiten rufen `useCaseData` nicht mehr auf |
| **Beleg nachher (gemessen)** | **10 Anfragen** beim ersten Laden (5 im Build), danach **0** bei jedem der 5 Seitenwechsel; **60 → 10** |
| **Zusatz** | zentraler Fehlerfall getestet (`case.json` testweise entfernt): `main` zeigt "Could not load the case data. Please reload the page.", Navigation bleibt sichtbar; Datei danach wiederhergestellt (`git status` sauber) |

#### Fall 2 — Duplizierte Ableitung + Prop-Drilling: `reviewEdits` an drei Seiten

| | |
|---|---|
| **Kategorie** | Duplizierter State (die **gleiche Berechnung** an drei Stellen) und Prop-Drilling (`reviewEdits` an drei Seiten) |
| **Wie bemerkt** | Textsuche nach `applyReviewEdits(`: **drei** Aufrufer (`DashboardPage`, `TeamLayout`, `EvidencePage`), und die Prop `reviewEdits` in drei Seiten-Signaturen |
| **Warum ein Problem** | **Veraltungs-Falle:** jede neue Seite, die Beweisstücke zeigt (heute `Timeline`, `Workspace` zeigen keine Status), müsste **dran denken**, die Änderungen selbst über die Daten zu legen. Vergisst sie es, zeigt sie den **alten** Status, während Evidence den neuen zeigt. Das ist genau der "Dashboard-Zähler"-Fehler aus UE1 in neuem Gewand |
| **Fix** | `PageRouter` legt die Änderungen **einmal** über die geladenen Beweisstücke (`applyReviewEdits`) und gibt **fertige** Daten weiter. `DashboardPage`, `TeamLayout`, `EvidencePage` kennen `reviewEdits` nicht mehr; `applyReviewEdits` hat **einen** Aufrufer |
| **Beleg nachher** | Textsuche: `applyReviewEdits(` nur noch in `PageRouter`, Prop `reviewEdits` nirgends mehr als Seiten-Prop. Live: E03 auf "reviewed" → Dashboard "2 Reviewed", Personen-Detail `patch-vector` zeigt E03 `reviewed`, Evidence-Filter "reviewed" → `E03,E12` |

#### Fall 3 — Veralteter State: der "Saved"-Timer im Hypothesen-Formular

| | |
|---|---|
| **Kategorie** | Veralteter State (ein **alter** Timer ändert den State, obwohl er längst überholt ist) |
| **Wie bemerkt** | Beim Wiederlesen der Annahme aus Demo 2 ("zwei schnelle Klicks starten zwei Timer; der erste blendet früher aus"). Dann **reproduziert** |
| **Beleg vorher (gemessen)** | "Save" bei 0,1 s, nochmal bei 1,6 s. Bei **2,2 s** (0,6 s nach dem zweiten Speichern) war "Saved" **schon weg**: der erste Timer hatte es ausgeblendet |
| **Fix** | `useRef` für die Timer-ID: vor jedem neuen Timer `clearTimeout(savedTimer.current)`; **nur der letzte** Timer zählt |
| **Beleg nachher (gemessen)** | dasselbe Muster: bei 2,2 s und 3,2 s weiter sichtbar, erst bei 3,9 s (2,3 s nach dem zweiten Speichern) weg |
| **Ehrlich** | ein `useRef` ist ein Wert, der Neurendern **überlebt**, aber beim Ändern **keines** auslöst (richtig für eine Timer-ID). Das Aufräumen **beim Verlassen der Seite** (`useEffect`-Cleanup) fehlt weiter: ein Timer, der nach dem Entmounten feuert, setzt State einer ausgehängten Komponente (in React 19 ohne Warnung, harmlos). Das braucht `useEffect` und gehört in UE6 |

### Was sich dabei verändert hat (ehrliche Bilanz)

| | vorher | nachher |
|---|---|---|
| Codezeilen in den sieben berührten Dateien (ohne Kommentare/Leerzeilen) | 481 | **399** (−82) |
| Lade-/Fehler-Blöcke | **5** | **1** |
| `useCaseData()`-Aufrufer | 5 | **1** |
| `applyReviewEdits`-Aufrufer | 3 | **1** |
| Daten-Anfragen bei 5 Seitenwechseln (Entwicklung) | **50** | **0** |
| Props von `PageRouter` nach unten, zusammen | 7 | **9** (+2) |
| `PageRouter` (Codezeilen) | 62 | 74 |

Die Prop-Zahl **steigt** (jede Seite bekommt `data`), aber jede Seite verliert dafür Ladecode, den Aufruf von `useCaseData` und, wo es sie gab, die
Prop `reviewEdits`. Der Preis: `PageRouter` wird größer (Routen + State + Laden). Dass er "die Daten besitzt", ist die logische
Folge der Regel aus Demo 5 (State lebt beim niedrigsten gemeinsamen Besitzer).

**Nebenwirkungen:**

- Während des Ladens zeigt die Seite jetzt eine **allgemeine** Meldung ("Loading case file…") statt der **seiten­spezifischen** Überschrift
  (z. B. "Case Dashboard"). Die Navigation oben bleibt sichtbar.
- Das Beispiel "Early return" aus UE4 Demo 2 (`TimelinePage`) steht jetzt in `PageRouter.tsx`; in der UE4-Doku ist es vermerkt.

### Verifikation

- **Daten-Anfragen:** vorher 60 (10 pro Seitenaufruf), nachher 10 insgesamt (siehe Fall 1).
- **Verhalten unverändert** (kompletter Durchlauf ohne Neuladen): zwei Sterne, E03 auf "reviewed", Notiz → Evidence zeigt es;
  **Dashboard** "2 Bookmarked / 2 Reviewed"; **Workspace** E03, E14 samt Notiz; der "Open"-Link öffnet E03 in Evidence; Personen-Detail
  zeigt E03 `reviewed`; Timeline `?person=nova-byte` 3 Events, Dropdown "nova-byte"; Evidence-Filter "reviewed" → `E03,E12`.
- **Timer-Fall** vorher/nachher gemessen (Fall 3).
- **Konsole:** zwischen zwei Markern (alle Seiten, Locations, Detail) keine Meldung.
- **Aufräumen:** `remotion_*`-Keys wieder entfernt; `public/data/case.json` nach dem Fehlertest wiederhergestellt.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler (die neuen `data`-Props, der `useRef<ReturnType<typeof
  setTimeout> | undefined>` und die entfernten Aufrufe kompilieren). `npm run format:check` → sauber (beim ersten Versuch).
  `npm run build` → grün (154 Module).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | UE5 Demo 8 | 288,16 KB | 89,42 KB | 154 |
  | **UE5 Demo 9** | **286,49 KB** | **89,33 KB** | **154** |
  | Unterschied | **−1,67 KB** | **−0,09 KB** | 0 |

  Das Bundle wird **kleiner**: vier Kopien des Lade-Blocks und zwei der Ableitung sind weg. Es ist die deutlichste Verkleinerung in UE5
  (Demo 7 hatte nur −0,09 KB).

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Fall 1 beweisen (Netzwerk):** `F12` → Tab "Netzwerk", filtern nach `json`. Zwischen Dashboard, Evidence, Workspace wechseln.
**Nachher:** keine neuen Anfragen. Sag: "vorher hat jede Seite beim Öffnen alle fünf JSON-Dateien neu geladen, 10 Anfragen pro
Wechsel (5 im Build)." Oder in der Konsole:
```js
performance.getEntriesByType("resource").filter((e) => /data\/.*\.json/.test(e.name)).length
```
vor und nach dem Wechseln vergleichen (bleibt gleich).

**2. Fall 2 zeigen:** `PageRouter.tsx`, der Block
```tsx
const data = { ...caseDataState.data, evidence: applyReviewEdits(caseDataState.data.evidence, reviewEdits) };
```
Sag: "die Änderungen werden **einmal** über die Daten gelegt. Keine Seite kann es vergessen."

**3. Fall 3 live (stark):** Workspace, im Formular zweimal schnell **Save** (z. B. bei 0 s und bei 1,5 s). "Saved" bleibt bis 2 s nach dem **zweiten**
Klick. In `HypothesisForm.tsx` die Zeile `clearTimeout(savedTimer.current);` zeigen und kurz auskommentieren → "Saved" verschwindet 2 s nach dem **ersten** Klick.

**4. Das Review-Ergebnis vortragen:** "fünf Muster geprüft. Zwei sind wirklich aufgetreten (duplizierter und veralteter State), eines
teilweise (Drilling), zwei nicht (Mutieren, unnötig global). Ich habe drei Fälle behoben."

---

## Demo 10 — Letzte direkte DOM-Zugriffe entfernen und Abschluss

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

React geht davon aus, dass **es allein** das DOM schreibt (UE4 Demo 1 F4). Jeder Code, der **an React vorbei** in die Seite
greift (`innerHTML`, `classList`, `getElementById`, `createElement` …), kann dessen Buch durcheinanderbringen. Diese Demo ist der
**Abschluss-Kassensturz**: durch die **ganze** React-App gehen, nachsehen, ob noch jemand hinter Reacts Rücken am DOM schraubt,
und das Ergebnis belegen.

*Analogie:* der **Schlussrundgang** nach einem Umbau. Man geht in jeden Raum, schaut, ob noch ein provisorisches Kabel hängt,
und schreibt auf, was man gefunden hat — nicht nur "sieht gut aus", sondern mit Messgerät.

### Task 1 — der Abschluss-Sweep

Zwei Prüfungen, die sich ergänzen: **statisch** (Textsuche im Quellcode) und **zur Laufzeit** (ein Spion in den DOM-Funktionen).

**a) Statisch** — Textsuche über **ganz `src/`** (ohne Sandbox) nach: `document.`, `window.`, `innerHTML`, `outerHTML`,
`insertAdjacent`, `createElement(`, `appendChild`, `removeChild`, `.classList`, `querySelector`, `getElementById`, `getElementsBy`,
`addEventListener`, `dangerouslySetInnerHTML`, `.style.`, `.focus(`, `scrollIntoView`, `.textContent =`, `.value =`, `ref=`, `useRef`,
`alert(`, `confirm(`, `prompt(`:

| Fundstelle | Was es ist | Urteil |
|---|---|---|
| `main.tsx:20` `document.getElementById("react-root")` | der **Einhängepunkt**: React braucht ein Element, in das es seinen Baum setzt (`createRoot`) | **legitim**, keine Manipulation von Inhalt, steht nicht in einer Komponente |
| `EvidenceDetail.tsx` `scrollIntoView` (Ref-Callback) | scrollt das aufgeklappte Detail ins Bild | **die eine bewusste Ausnahme**, siehe unten |
| `HypothesisForm.tsx` `alert(…)` | blockierender Browser-Dialog bei einem Speicherfehler | **entfernt**, ersetzt durch gerenderten State (siehe unten) |
| `HypothesisForm.tsx` `useRef` | Timer-ID (Demo 9), **kein** DOM-Element | kein Fund |
| Kommentare, die vanilla-Code beschreiben | z. B. "vanilla schrieb es per `innerHTML`" | kein Fund |
| `FilterSelect.tsx:54` (Treffer von `.value =`) | `props.value === undefined`, ein **Vergleich** | Fehltreffer |
| Sandbox-Dateien (`*-main.tsx`) | nur `getElementById(…)` als Einhängepunkt | gehören nicht zur App |

**Keine** Treffer für `innerHTML`, `outerHTML`, `insertAdjacent*`, `createElement(`, `appendChild`, `removeChild`, `.classList`,
`querySelector*`, `addEventListener`, `dangerouslySetInnerHTML`, `.style.`, `.focus(`, `.textContent =` im Code. Auch `react.html` hat **kein**
Inline-Skript außer dem Einstieg.

**b) Zur Laufzeit** — der entscheidende Beweis. Ich habe die DOM-Funktionen **umhüllt** (`innerHTML`-Setter, `insertAdjacentHTML`,
`classList.add/remove/toggle`, `document.getElementById/querySelector*/createElement`, `Element.querySelector*`, `scrollIntoView`,
`appendChild`/`removeChild`, `alert`) und bei **jedem** Aufruf die **aufrufende Datei** aus dem Stack gelesen. Dann **alle fünf Views
durchgespielt und bedient**: Dashboard, Evidence (Suche, Filter, Clear, Stern, Detail öffnen, Status ändern, Notiz speichern), People &
Locations (Liste, Personen-Detail), Timeline, Workspace (Hypothesen-Formular speichern):

| | React (`src/`) | vanilla (`js/`, derselbe Ablauf) |
|---|---|---|
| Aufrufe **aus unserem Code** (zusammen) | **2** | **231** |
| davon `innerHTML`-Setter | **0** | **42** |
| `document.getElementById` | **0** | **102** |
| `classList.add/remove` | **0** | **72** (18 + 54) |
| `querySelectorAll` | **0** | **14** |
| `scrollIntoView` | **2** (`EvidenceDetail.tsx`) | 1 |
| `alert` | **0** | 0 (nicht ausgelöst) |
| Aufrufe aus **Bibliotheken** (React DOM selbst) | 2348 | 13 |

React DOM führt **2348** DOM-Aufrufe aus — **das ist der Punkt**: das DOM wird laufend geschrieben, aber **nur von React**.
Aus **unserem** Code kommen genau zwei, beide dieselbe Zeile (`scrollIntoView`; **zwei**, weil `StrictMode` den Ref-Callback in der
Entwicklung doppelt aufruft).

**Das einzige, was entfernt wurde: `alert()` → gerenderter State**

| | vorher | nachher |
|---|---|---|
| Speicher voll/gesperrt | `alert("Your hypothesis could not be saved …")`: blockierender Browser-Dialog, an React vorbei | `saveFailed` (`useState`), gerendert als `<div className="warning-banner" role="alert">…</div>` |
| nach erfolgreichem Speichern | — | die Meldung verschwindet von selbst (`setSaveFailed(false)`), "Saved" erscheint |

**Live getestet** (`Storage.prototype.setItem` wirft einen `QuotaExceededError`): Meldung im Formular **sichtbar**, `alert` **0×** aufgerufen,
"Saved" **nicht** angezeigt. Danach wieder normal: Meldung weg, "Saved" da.

**Die eine bewusste Ausnahme: `scrollIntoView` per Ref-Callback**

| Frage | Antwort |
|---|---|
| Was macht es? | scrollt das Detail-Panel ins Bild, sobald es im DOM hängt (vanilla: `section.scrollIntoView()` im Öffnen-Code) |
| **Manipuliert** es das DOM? | **Nein.** Es ändert weder Inhalt noch Struktur noch Klassen; es **liest** die Lage und bewegt den Bildlauf |
| Warum nicht deklarativ? | React kann "scrolle dorthin" nicht als Markup ausdrücken. Dafür gibt es den dokumentierten **Ausweg**: einen `ref` (wie bei `focus()`) |
| Warum steht es in einer **stabilen** Funktion? | ein Inline-Callback wäre bei jedem Render neu und würde bei jedem Render erneut scrollen (z. B. nach "Save note") |
| Streng "null"? | wer **wörtlich null** verlangt, entfernt die Zeile (die Seite funktioniert, nur ohne automatisches Scrollen) oder legt das Panel **über** die Liste. Ich habe beides bewusst nicht gemacht: es wäre ein **Verhaltensverlust** gegenüber vanilla |

**Sonstiges, was nicht zählt** (damit die Aussage genau bleibt): `new FormData(event.currentTarget)` **liest** den Wert eines
Formulars über das Event (kein Schreiben); der `localStorage` und `setTimeout` sind Browser-**APIs**, aber **kein DOM**.

### Task 2 — die ganze App läuft auf React-State und Props

**Alle fünf Views sind React**, jede über eine echte, speicherbare URL (`react.html#…`):

| View | URL | Gebaut in |
|---|---|---|
| Dashboard | `#/` | UE3 |
| People & Locations | `#/team/people`, `#/team/people/:personId`, `#/team/locations` | UE4 |
| Timeline | `#/timeline?person=…` | UE4 |
| Evidence Catalogue | `#/evidence?open=…` | **UE5** |
| Workspace | `#/workspace` | **UE5** |

**Das vollständige Zustands-Inventar** (alle Hooks in `src/`, ohne Sandbox; per Textsuche):

| Wo | Was | Art |
|---|---|---|
| `app/PageRouter.tsx` | `useCaseData()` (**ein** Aufruf), `notes`, `reviewEdits` | geladene Daten, 2× `useState` |
| `shared/BookmarksContext.tsx` | `bookmarks` (`useState`), `useMemo`, `createContext`/`useContext` | Context-Besitzer |
| `shared/useCaseData.ts` | `useState` + `useEffect` | der **einzige** `useEffect` der App (Laden) |
| `features/evidence/EvidencePage.tsx` | `useReducer` (Filter), `useSearchParams` (`?open=`) | lokaler State + URL |
| `features/workspace/HypothesisForm.tsx` | `values`, `showSaved`, `saveFailed` (`useState`), `useRef` (Timer) | lokaler State |
| `features/timeline/TimelinePage.tsx` | `useSearchParams` (nur lesen) | URL |
| `features/people-locations/*` | `useParams`, `useOutletContext` | lesen vom Router |
| Dashboard, Workspace | `useBookmarks()` | lesen den Context |

Alles andere (`EvidenceCard`, `EvidenceToolbar`, `Badge`, `StatCard` …) ist **reine Darstellung**: Props rein, Markup raus.

**Die vanilla-App ist weiter da, aber getrennt:** `index.html` + `js/` sind ein **eigener Einstiegspunkt**, den React nie anfasst
(UE3-Entscheidung: beide Apps laufen parallel; React importiert aus `js/` nur Typen und reine Funktionen). In `js/` stehen
**115** Zeilen mit DOM-Aufrufen (Textsuche; `main.ts` 18, `evidence.ts` 29, `timeline.ts` 22, `workspace.ts` 17 …). Das ist **nicht** die React-App;
sie bleibt als Vergleich unverändert.

### Verifikation

- **Statische Suche** und **Laufzeit-Spion** (Tabellen oben): aus unserem Code **2** Aufrufe (`scrollIntoView`), aus React DOM **2348**;
  vanilla im gleichen Ablauf **231** aus unserem Code.
- **`alert` → State** live: Fehlerfall, Wiederherstellung (siehe oben).
- **Regressionslauf nach dem Umbau** (derselbe Ablauf wie in Demo 9, ohne Neuladen): zwei Sterne, E03 auf "reviewed", Notiz →
  **Dashboard** "2 Bookmarked / 2 Reviewed"; **Workspace** E03, E14 samt Notiz; **Personen-Detail** `patch-vector` zeigt E03 `reviewed`;
  **Timeline** `?person=nova-byte` 3 Events; Evidence-Filter "reviewed" → `E03,E12`. **Konsole** zwischen zwei Markern: keine Meldung.
- **Aufräumen:** `remotion_*`-Keys wieder entfernt; `Storage.prototype.setItem` und `window.alert` nach dem Test zurückgesetzt.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler. `npm run format:check` → sauber (beim ersten Versuch).
  `npm run build` → grün (154 Module).

  | Stand | `react-*.js` | gzip | Module |
  |---|---|---|---|
  | UE5 Demo 9 | 286,49 KB | 89,33 KB | 154 |
  | **UE5 Demo 10** | **286,60 KB** | **89,36 KB** | **154** |
  | Unterschied | **+0,11 KB** | **+0,03 KB** | 0 (der `saveFailed`-Zustand und die Meldung ersetzen `alert`) |

  **Über ganz UE5** (Ende UE4 → Ende UE5): `react-*.js` 272,31 → **286,60 KB** (**+14,3 KB**), gzip 85,79 → **89,36 KB** (**+3,6 KB**), Module
  139 → **154** (+15). Dafür sind jetzt **alle fünf Views** React (Evidence und Workspace kamen dazu); die vanilla-App bleibt bei 20,11 KB.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Den Kassensturz per Suche:** im Editor (oder Terminal) in `src/` nach `innerHTML` suchen → keine Treffer im Code; nach `classList` → keine; nach
`querySelector` → keine; nach `getElementById` → nur `main.tsx`. Sag: "der Einhängepunkt von React. Ohne diese Zeile gibt es keinen React-Baum."

**2. Den Beweis zur Laufzeit zeigen (stark):** in der Konsole **in beiden Apps** (`react.html` und `index.html`) einen Zähler einhängen:
```js
let n = 0; const o = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
Object.defineProperty(Element.prototype, "innerHTML", { ...o, set(v) { if ((new Error().stack || "").includes("/js/")) n++; return o.set.call(this, v); } });
```
dann durch die Views klicken und `n` ansehen: **vanilla** zählt hoch, **React** bleibt bei 0 (`/js/` kommt in React-Aufrufen nie vor). Sag: "React schreibt
selbst ununterbrochen ins DOM, aber unser Code nie."

**3. Die Ausnahme ehrlich benennen:** `EvidenceDetail.tsx`, `scrollIntoViewOnMount`. Sag: "das **ändert** das DOM nicht, es scrollt. React
kann das nicht als Markup ausdrücken, deshalb der dokumentierte Ausweg `ref`. Wer wörtlich null will, löscht die Zeile."

**4. Den `alert`-Ersatz zeigen:** im Workspace in der Konsole `Storage.prototype.setItem = () => { throw new Error("voll"); }`, dann "Save hypothesis draft" →
rote Meldung **im** Formular, kein Dialog.

**5. Das Inventar zeigen:** Tabelle oben. Sag: "ein `useEffect` in der ganzen App (das Laden), ein Context, ein Reducer, der Rest sind `useState` und
reine Darstellung."

---

## Abschluss UE5 — das Ganze auf einen Blick

| Demo | Kern | Schlüsselzahl / -beleg |
|---|---|---|
| 1 | Handler direkt am Element; Event-Delegation nicht mehr von Hand | `onclick`-Attribute **14 → 0**, XSS-Notiz nur noch Text |
| 2 | kontrollierte Felder, `useState` | ein Feld ohne `onChange` bleibt leer, React meldet es |
| 3 | unveränderliche Updates | gleiche Referenz = React sieht nichts (Sandbox), `readonly` als Compiler-Schutz |
| 4 | abgeleitet statt gespeichert | 22 Filter-Kombinationen identisch zu vanilla; Zähler **und** Liste aus **einer** Funktion |
| 5 | State nach oben | Dashboard sofort "2 Reviewed", `localStorage`-Lesezugriffe beim Navigieren **0** |
| 6 | Callbacks nach unten | 2 Prop-Ebenen; Sandbox: Setter durchreichen vs. Callback |
| 7 | `useReducer` | 49 → 36 Zeilen, `CLEAR_FILTERS` als eine Aktion; `useState` ist ein Spezialfall |
| 8 | Context, ehrlich abgewogen | Props 11 → 7, aber +18 Zeilen: "knapp, nur Bookmarks" |
| 9 | State-Probleme finden | Daten-Anfragen **60 → 10**, Timer-Fehler behoben |
| 10 | kein DOM mehr von uns | Aufrufe aus unserem Code **2** (React) gegen **231** (vanilla) |

---
