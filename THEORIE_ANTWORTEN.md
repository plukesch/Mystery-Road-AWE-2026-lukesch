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
