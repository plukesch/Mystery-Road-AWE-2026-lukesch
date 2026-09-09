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
