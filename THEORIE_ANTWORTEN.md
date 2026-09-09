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
