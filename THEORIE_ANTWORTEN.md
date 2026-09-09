# Theorie-Fragen & Antworten — Exercise 1

Laufende Sammlung. Pro Demo die Fragen aus der Angabe + Antworten zum Durchlesen vor der Präsentation.

---

## Demo 1 — Split der App in ES-Module

### F1: Unterschied klassisches `<script>` vs. `<script type="module">`? Mindestens zwei für diese App relevante Verhaltensunterschiede.

1. **Scope.** Top-Level-`var`/`function` in einem klassischen Script landen auf `window` (global). In einem Modul sind sie modul-lokal und stehen *nicht* auf `window`. Genau deshalb mussten wir in `main.js` die 7 Funktionen, die `index.html` per Inline-`onclick` aufruft, explizit mit `window.navigateTo = navigateTo` etc. dranhängen — sonst wirft der Inline-Handler „navigateTo is not defined".
2. **Ausführungszeitpunkt.** Ein klassisches `<script>` wird sofort an seiner Stelle im HTML ausgeführt und blockiert das Parsen (die alte `app.js` lag deshalb am Body-Ende). Ein Modul wird *immer* wie `defer` behandelt: erst nach dem vollständigen HTML-Parsen, in Dokumentreihenfolge. Ein Modul im `<head>` würde also trotzdem funktionieren.
3. **Strict Mode.** Module sind immer im Strict Mode. Klassische Scripts laufen im „sloppy mode", solange nicht `"use strict"` draufsteht. (Relevant für F2 unten und für Demo 8: ein vergessenes `var` wirft jetzt, statt still ein globales anzulegen.)
4. **Laden.** Module werden über HTTP mit CORS geladen und brauchen einen JS-MIME-Typ; mehrfacher Import führt den Modulcode trotzdem nur einmal aus. Dazu `import`/`export` gibt es nur im Modul.

### F2: `allEvidence` war ein globales `var`. Was muss jetzt passieren, damit ein anderes Modul den Wert liest/ändert? Welchen Fehler bekommt man, wenn man es vergisst, und warum ist der nützlich?

Der Wert lebt jetzt in `state.js` als `state.allEvidence`. Ein anderes Modul muss `import state from "./state.js"` schreiben und dann `state.allEvidence` lesen bzw. `state.allEvidence = …` setzen. Ohne diesen Import ist der Name im Modul schlicht nicht bekannt.

- Vergisst man den Import und schreibt einfach `allEvidence = data`, gibt es im Modul (Strict Mode!) einen **`ReferenceError: allEvidence is not defined`** — sofort, an genau der Zeile.
- Das ist nützlich, weil der Fehler *laut* ist. Im sloppy mode hätte `allEvidence = data` still ein *neues* globales `allEvidence` angelegt, das mit dem echten State nichts zu tun hat → zwei auseinanderlaufende Zustände, Bug irgendwo ganz woanders. Der harte Fehler verhindert genau dieses stille Fork.
- Zusätzlich: Wenn man `import { allEvidence }` als *named binding* importiert und dann `allEvidence = …` versucht, kommt **`TypeError: Assignment to constant variable` / „Cannot assign to read only property"** — importierte Bindings sind schreibgeschützte Sichten. Deshalb halten wir den State in einem Objekt und mutieren dessen Properties, statt Primitive zu exportieren.

### F3: Named vs. Default Export? Eine Stelle im Refactor nennen, wo du dich für eins entschieden hast, und warum.

- **Named export:** `export function foo()`, Import mit exaktem Namen `import { foo }`. Beliebig viele pro Modul. Name ist an der Importstelle fixiert.
- **Default export:** `export default X`, genau einer pro Modul, Import mit frei wählbarem Namen `import Beliebig from …`.
- **Meine Wahl:** `state.js` hat `export default state` (das Modul dreht sich um *genau eine* Hauptsache — den State-Container) und daneben `export const STORAGE_KEYS` als *named* (zweitrangige, separate Konstante). Alle anderen Module (`utils.js`, `lookup.js`, die View-Module) nutzen ausschließlich named exports, weil sie *mehrere gleichrangige* Funktionen anbieten, deren Namen (`renderTimeline`, `findPersonById`) am Aufrufort stabil und wiedererkennbar sein sollen.
- Trade-off, den man erwähnen sollte: viele Teams verbieten Default-Exports komplett, weil „Find Usages" und Umbenennen schwerer werden (jede Importstelle darf den Namen anders wählen).

### F4: Warum laufen `type="module"`-Scripts gar nicht über `file://`? Gleicher Grund wie bei `fetch()`, anderer, oder beides?

- Browser blockieren ES-Module-Laden von `file://` grundsätzlich: der Origin ist `null`/opak, und Module werden mit CORS-Semantik + JS-MIME-Typ geladen — beides ist über `file://` nicht erfüllbar. Ein *klassisches* `<script src>` würde von `file://` dagegen noch laufen.
- `fetch()` scheitert über `file://` auch, aber am *Same-Origin-/CORS-Check*: `file://` hat einen opaken Origin, jede Anfrage gilt als cross-origin und wird abgewiesen.
- Also: **beides braucht einen Server**, und das gemeinsame Thema ist dasselbe (der Browser behandelt `file://` als „kein echter Origin"), aber es sind zwei verschiedene Mechanismen — Modul-Laden wird direkt unterbunden, `fetch` wird vom CORS-/Same-Origin-Modell blockiert. Für diese App heißt das: lokaler HTTP-Server ist Pflicht, sowohl wegen der Module als auch wegen der JSON-`fetch`-Aufrufe.

---

## Demo 2 — Mutation-/Referenz-Bug

Gefundener Bug: `js/data.js` → `state.filteredEvidence = state.allEvidence;` (statt einer Kopie). `handleSortChange` sortiert `filteredEvidence` in-place und zerlegt damit die Master-Liste `allEvidence` mit. Fix: `state.allEvidence.slice()`.

### F1: Unterschied *Reference* vs. *Copy* in JavaScript — in eigenen Worten — und wie erklärt das das Beobachtete?

- JS-Werte sind zwei Sorten. **Primitive** (`number`, `string`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) werden *by value* behandelt: `let b = a` kopiert den Wert, danach sind `a` und `b` unabhängig.
- **Objekte** (dazu zählen Arrays und Funktionen) werden *by reference* behandelt. Die Variable hält nicht das Objekt selbst, sondern einen Verweis auf eine Stelle im Speicher. `let b = a` kopiert nur den **Verweis** — `a` und `b` zeigen auf **dasselbe** Objekt. Eine Mutation über `b` (z. B. `b.sort()`, `b.push(x)`, `b.foo = 1`) ist über `a` sofort sichtbar, weil es nur *ein* Objekt gibt.
- Eine **Copy** ist ein bewusst neu erzeugtes Objekt mit denselben Inhalten: `arr.slice()`, `[...arr]`, `Array.from(arr)`, `Object.assign({}, obj)`, `structuredClone(obj)`. Danach sind die beiden unabhängig (bei `slice`/Spread: die *Array-Hülle* ist unabhängig, die enthaltenen Objekt-Elemente sind weiterhin geteilt → „flache" Kopie).
- **Im Bug:** `filteredEvidence = allEvidence` war eine Referenz-Kopie, kein neues Array. „Gefilterte Ansicht" und „Master-Liste" waren physisch dasselbe Array. `sort()` mutiert in-place, also hat das Sortieren der Ansicht die Master-Liste umgebaut. Andere Views, die `allEvidence` lesen (Dashboard „Recent evidence" = `allEvidence.slice(-5)`), zeigten danach die falschen Einträge. `.slice()` im Fix erzeugt eine eigene Array-Hülle → `sort()` fasst `allEvidence` nicht mehr an.

### F2: Genaue User-Aktionen + System-Zustand, die den Bug auslösen. Hättest du ihn durch reines Code-Lesen top-to-bottom gefunden — warum (nicht)?

**Auslöser, Schritt für Schritt:**
1. App frisch laden; auf dem Dashboard bleiben, bis die Daten da sind. `allEvidence` ist in Datei-Reihenfolge `E01…E18`, `filteredEvidence` zeigt auf dasselbe Array.
2. Zum „Evidence"-Tab wechseln. (Die Liste selbst hängt wegen eines anderen Bugs auf „Loading evidence…", aber die Toolbar inkl. Sort-Dropdown ist da.)
3. Das Sort-Dropdown von „Newest first" auf **„Title (A–Z)"** stellen → `onchange` ruft `handleSortChange()` → `filteredEvidence.sort(...)`.
4. Zurück zu einer Ansicht, die `allEvidence` neu liest (Dashboard nach einem erneuten `renderDashboard`, oder die Hypothese-Evidenzliste im Workspace, die bei jedem Öffnen neu gefüllt wird).
5. **Beobachtung:** die Reihenfolge dort ist jetzt alphabetisch statt `E01…E18` — obwohl man nie etwas an *dieser* Ansicht sortiert hat.

**System-Zustand, der nötig ist:** `filteredEvidence` muss zu diesem Zeitpunkt noch `=== allEvidence` sein. Das ist der Fall, solange `getFilteredEvidence()` noch nie gelaufen ist (es würde ein frisches Array zuweisen). In dieser App passiert das nie, weil der Evidence-View auf „Loading" festhängt — deshalb ist der Bug hier sogar *zuverlässig* statt nur sporadisch.

**Durch reines Lesen findbar?** Die *Zeile* `filteredEvidence = allEvidence` sieht man beim Lesen sofort und sie sollte einen stutzig machen. Aber dass daraus ein **sichtbarer** Schaden wird, hängt an einer Kette über mehrere Funktionen und Views hinweg: `sort()` mutiert in-place (muss man wissen), beide Namen teilen die Referenz, ein *anderer* Bug hält den Zustand so fest dass die Referenz nie ersetzt wird, und erst eine *dritte* Stelle (`allEvidence.slice(-5)` im Dashboard) macht den Schaden sichtbar. Diesen Pfad im Kopf zusammenzusetzen ist realistisch nur, wenn man das Symptom schon gesehen hat und rückwärts sucht. Also: die Ursache ist lesbar, der *Effekt* praktisch nur durch Benutzen + Nachstellen zu finden.

---

## Demo 3 — Asynchron-/Promise-Handling-Bug

Gefundener Bug: `state.evidenceViewLoading` wird auf `true` initialisiert und vom Erfolgs-Callback des `fetch("data/evidence.json")` nie auf `false` gesetzt → `renderEvidenceList` springt für immer mit „Loading evidence…"-Spinner raus. Fix: `state.evidenceViewLoading = false` im `.then` (und `.catch`) von `loadEvidenceData`.

### F1: Erkläre die async-Operation, um die es geht: was holt/liefert sie, und an welchem Punkt ihres Lebenszyklus (vor dem Start, während pending, bei Erfolg, bei Fehler) passiert der Bug? Wie hast du das bestätigt statt geraten?

**Die Operation:** `fetch("data/evidence.json")`. Das ist ein zweistufiges Promise: `fetch(...)` löst mit einem `Response`-Objekt auf, `.json()` darauf löst nochmal auf und **liefert das geparste JSON** — hier das Array mit den 18 Evidenz-Objekten. Das Ergebnis landet in `loadEvidenceData` im `.then(function (data) { … })`. Dieser Erfolgs-Callback ist auch die Stelle, die die anderen Views anstößt (`renderDashboard`, `populateAllDropdowns`, ggf. `renderEvidenceList`).

**Wo im Lebenszyklus:** der Bug ist ein **fehlendes State-Update bei Erfolg (on success)**.
- *Vor dem Start:* `evidenceViewLoading = true` ist korrekt — „wir laden noch, zeig den Spinner".
- *Während pending:* auch korrekt — Spinner ist richtig.
- *Bei Erfolg:* hier hätte der Callback das Flag auf `false` setzen müssen, damit `renderEvidenceList` ab jetzt die Liste rendert statt des Spinners. Genau dieses eine Update fehlt. Der Callback setzt `allEvidence`, ruft sogar `renderEvidenceList()` auf — aber `renderEvidenceList` prüft als Erstes `if (state.evidenceViewLoading) return;`, und weil das Flag noch `true` ist, passiert nichts.
- *Bei Fehler:* der `.catch` setzte es vorher auch nicht zurück → bei einem 404 hinge der Spinner ewig (Teil des Fixes: `.catch` setzt es ebenfalls auf `false`).

Der Kern in async-Worten: eine Zustandsvariable wird **vor** der Operation gesetzt und **von deren Abschluss-Callback nie aktualisiert**. Der spätere `renderEvidenceList`-Check läuft zeitlich *nach* dem Auflösen des Promise, liest aber einen Wert, der auf dem Stand von *vor dem Start* eingefroren ist.

**Wie bestätigt (nicht geraten):**
1. Nach dem Laden in der Konsole: `state.evidenceViewLoading` ist `true`, obwohl `state.allEvidence.length === 18` — die Daten sind also **nachweislich angekommen**, nur das Flag steht falsch.
2. Network-Tab: `evidence.json` → `200`. Der `fetch` ist also nicht fehlgeschlagen; es ist kein Netzwerk-/Parse-Problem.
3. `grep evidenceViewLoading` über den ganzen `js/`-Ordner: **zwei** Treffer — der Initializer (`: true`) und der Lese-Check in `renderEvidenceList`. **Null** Zuweisungen auf `false`. Damit ist bewiesen, dass kein Codepfad das Flag je zurücksetzt.
4. Gegenprobe nach dem Fix: gleiche Konsolen-Checks → `evidenceViewLoading === false`, 18 Karten im DOM, Filter/Suche/Sort erreichen jetzt `getFilteredEvidence`.

---

## Demo 4 — Stiller Bug

Gefundener Bug: `initApp` in `js/main.js` loggt `console.log("First note preview:", loadNoteAsync("E01"))` — `loadNoteAsync` gibt ein Promise zurück, nicht den Notiz-String. Konsole zeigt bei jedem Load `First note preview: Promise {<fulfilled>: ''}`, in der UI passiert nichts. Fix: der Log war ein Debug-Rest ohne Zweck → ersatzlos entfernt.

### F1: Wie ist dir der Bug überhaupt aufgefallen, wenn nichts kaputt aussah? Warum ist „nichts sieht kaputt aus" nicht dasselbe wie „nichts ist kaputt"?

**Wie aufgefallen:** DevTools war von Anfang an offen, Console-Tab sichtbar — so wie es die Angabe verlangt. Direkt nach dem Laden, noch bevor ich irgendwo geklickt habe, stand da eine Zeile: `First note preview: Promise {<fulfilled>: ''}`. Zwei Dinge waren daran verdächtig: (1) ein `console.log` mit „preview" im Text klingt nach vergessenem Debug-Code, und (2) der geloggte Wert ist ein `Promise`-Objekt, kein Text — d. h. hier wird ein Promise behandelt, als wäre es schon der fertige Wert. Nachgeprüft mit `loadNoteAsync("E01") instanceof Promise` (→ `true`) und `await loadNoteAsync("E01")` (→ `""`), plus `grep`, dass der Aufruf nur an dieser einen Stelle steht.

**Warum „sieht ok aus" ≠ „ist ok":** Die UI zeigt nur, was gerendert wird. Ein falscher Wert, der nirgends angezeigt wird, ist trotzdem ein Fehler — er sagt, dass jemand die Semantik missverstanden hat (`loadNoteAsync` liefert kein `string`). Solche stillen Fehler sind gefährlicher als sichtbare:
- Niemand meldet sie, weil auf dem Screen alles normal aussieht — sie bleiben monatelang liegen.
- Dieselbe falsche Annahme („async-Funktion gibt direkt den Wert zurück") steckt hier harmlos in einem Log, kann aber woanders in echter Logik stecken und dort echten Schaden anrichten (genau die Fehlklasse aus Demo 3).
- Die Konsole ist eine echte Fehler-Oberfläche. Wenn dort dauernd Rauschen steht, gewöhnt man sich dran und übersieht die *nächste*, ernste Meldung. „Konsole sauber halten" ist deshalb Teil von „funktioniert", nicht Kosmetik.

Konkret in dieser App: derselbe Bug-Typ hält den Evidence-View auf „Loading" fest (Demo 3) und (in einer anderen Ausprägung — `var`-Closure) wirft bei jedem Nav-Button-Klick eine `TypeError` in die Konsole, während die Navigation optisch normal weiterläuft.

---

## Demo 5 — Voller Durchlauf & Reflexion

Weitere gefundene Bugs (Details + Fixes in `CHANGES.md`):
- **5.1** Timeline `Location: [object Object]` — ganzes Objekt statt `.name` gepusht.
- **5.2** Sort-Dropdown wirkungslos — Sortierung wird bei jedem Render von `getFilteredEvidence` überschrieben (freigelegt durch die Demo-2/3-Fixes).
- **5.3** Dashboard-Stats eingefroren — `!viewRendered.dashboard`-Guard verhindert Re-Render.
- **5.4** Klick auf den ★-Stern öffnet das Detail — Klick-Ziel ist das innere `<span>` ohne `data-action`.
- **5.5** Kaputter `localStorage`-Eintrag legt die ganze App lahm — `JSON.parse` ohne `try/catch` in `loadNotesFromStorage`/`loadHypothesisFromStorage`.
- **5.6** Timeline-Modal: `click`-Listener bei jedem Öffnen neu + Konsolen-Spam.
- **5.7** Nav-Button-Klick wirft `TypeError` (`var i` closure) — Fix in Demo 8.

Gewählter Präsentations-Bug: **5.5**.

### F1: Für den gewählten Bug — genaue User-Aktionen und System-Zustand, die ihn auslösen, live ab dem Pre-Fix-Commit.

Ausgangspunkt: der committete Stand **vor** den Demo-5-Fixes, App über den lokalen Server geladen.

1. App läuft normal — Dashboard zeigt `18 / 6 / 6 / …`, alle Views gefüllt.
2. DevTools öffnen → Tab **Application** (Chrome) bzw. **Storage** (Firefox) → links **Local Storage** → den Eintrag für `http://127.0.0.1:<port>` anklicken.
3. In der App einmal ein Beweisstück öffnen und eine Notiz speichern (damit der Key `remotion_notes` existiert). In der Local-Storage-Tabelle steht jetzt `remotion_notes` mit einem JSON-Wert wie `{"E01":"..."}`.
4. Den **Wert** von `remotion_notes` doppelklicken und durch etwas ersetzen, das **kein gültiges JSON** ist, z. B. `hello` oder `{{{`. Enter.
5. Seite neu laden (`F5`).
6. **Beobachtung:** die App ist praktisch tot — Dashboard zeigt überall `0`, Evidence-Liste leer, People/Timeline leer. In der Konsole steht rot: `Uncaught SyntaxError: "hello" is not valid JSON` mit Stack-Frame `at initApp (main.js:79)`.

**Warum genau dieser Zustand:** `initApp` ruft der Reihe nach `loadBookmarksFromStorage()`, dann `loadNotesFromStorage()`, dann `setupEventListeners()`, dann `loadAllData()`. `loadNotesFromStorage` macht `state.notesStore = JSON.parse(raw)` **ohne** `try/catch`. Bei ungültigem JSON wirft `JSON.parse` synchron einen `SyntaxError`. Dieser Fehler fliegt ungefangen aus `initApp` heraus → **alles danach in `initApp` läuft nicht mehr**: keine Event-Listener, und vor allem `loadAllData()` startet nie → kein `fetch`, keine Daten. Deshalb ist nicht nur „Notizen" kaputt, sondern die ganze App.

Der Auslöser ist bewusst „unartig": kein normaler Nutzer editiert `localStorage`. Aber genau das steht in der Angabe zu Demo 5 („inspect and hand-edit `localStorage` in DevTools") und zu Demo 7 („Replace a value with text that isn't valid JSON and see what happens"). Und im echten Leben reicht schon ein halb geschriebener Wert nach einem Browser-Absturz oder ein Migrationsfehler.

**Ab dem Fix-Commit dieselben Schritte:** Reload → App lädt alle 18 Evidenzen und funktioniert normal; in der Konsole steht **eine** gelbe `console.warn("Could not read stored notes, starting empty", …)`. Die Notizen sind leer, sonst nichts.

### F2: Hat das Beheben eines Bugs je die Symptome eines anderen verändert, einen aufgedeckt oder versehentlich behoben? Wenn ja — die Beziehung erklären. Wenn nein — wie hast du bestätigt, dass die Fixes sauber isoliert sind?

Ja, mehrfach — vor allem zwischen Demo 2, Demo 3 und Bug 5.2 (Sort):

- **Demo 3 hat 5.2 aufgedeckt.** Vor dem Demo-3-Fix (`evidenceViewLoading` nie `false`) hat die Evidenz-Liste nie gerendert. Man *konnte* gar nicht sehen, ob das Sort-Dropdown etwas tut. Erst nachdem die Liste rendert, wird sichtbar: es tut nichts.
- **Demo 2 hat das Symptom von 5.2 verändert.** Vor dem `.slice()`-Fix schien Sort zu funktionieren — aber nur, weil `handleSortChange` das Array sortierte, auf das `filteredEvidence` **und** `allEvidence` zeigten, und `getFilteredEvidence` danach dieses jetzt sortierte `allEvidence` durchlief. Sort „funktionierte", indem es die Master-Liste zerlegte. Der Demo-2-Fix nimmt diesen unabsichtlichen Kanal weg → Sort tut jetzt *sichtbar* nichts. Der Fix hat also keinen neuen Bug erzeugt, sondern den **Zufall entfernt, der ein fehlendes Feature kaschiert hat**. Die richtige Implementierung ist dann 5.2 (Sortierung in `renderEvidenceList` bei jedem Render anwenden).
- **Demo 3 hat zwei Features reaktiviert**, die vorher toter Code waren: die „view"-Cross-Links von den Personen-Karten und den „View Exx"-Links in der Timeline zur gefilterten Evidenz-Liste. Die setzen `filterPerson.value` und rufen `renderEvidenceList` — was vorher am Frueh-Return hing. Kein Bugfix, aber vorher ohne Wirkung.
- **Demo 4** (die überflüssige `console.log`-Zeile entfernt) ist isoliert: keine Logik hängt an dieser Zeile, Konsole danach sauber, alle Views unverändert.

**Isolation der übrigen Fixes (5.1, 5.3, 5.4, 5.5, 5.6) bestätigt durch:**
1. Jeder Fix fasst eine andere Funktion in einem anderen Modul an (Timeline-Location-Schleife / Dashboard-Zweig in `handleHashChange` / Klick-Ziel-Prüfung in `handleEvidenceListClick` / `JSON.parse`-Guards in `storage.js`+`workspace.js` / Listener-Anhängen in `openEvidenceModal`). Keine gemeinsamen Variablen.
2. Pro Bug ein gezielter Vorher/Nachher-Check über die Konsole, jeweils mit frischem Seiten-Load (Modul-Cache über neuen Port umgangen).
3. Nach dem Anwenden **aller** Fixes ein kompletter Feature-Durchlauf: jede View mehrfach, Suche, alle Filter, Sort, Bookmark (inkl. Stern-Klick), Detail öffnen/schließen, People-Tabs, Timeline-Filter + Modal, Hypothese speichern und Reload → Persistenz prüfen. Alles grün, Konsole leer.
4. Keiner der sechs Verifikations-Checks berührt Zustand, den ein anderer Fix besitzt — deshalb können sie sich nicht gegenseitig maskieren.
