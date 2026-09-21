# Demo 6 — Debugger-Session (Live-Skript)

Keine Code-Änderung. Das hier ist der Ablauf, den du **live in der Klasse** in den Chrome-DevTools
vorführst. Debuggt wird der **Mutation-/Referenz-Bug aus Demo 2** (`handleSortChange` zerlegt die
Master-Liste `allEvidence`), weil man daran alle geforderten Debugger-Funktionen sauber zeigen kann.

## Vorbereitung

```bash
git checkout 6377dd0        # "Demo1 done" - Module gesplittet, NOCH KEIN Bug gefixt
py -3 -m http.server 8137 --bind 127.0.0.1
```

Browser: `http://127.0.0.1:8137` öffnen, **F12** → DevTools. Danach zurück mit
`git checkout main` (bzw. deinen Branch) — der Commit-Hash bleibt für den Live-Diff notiert.

> Warum dieser Commit: hier ist `state.filteredEvidence = state.allEvidence` (die geteilte
> Referenz) noch drin **und** `handleSortChange` enthält die volle Sortier-Logik inline
> (ab `main` ist es nur noch `renderEvidenceList()` — nichts mehr zum Durchsteppen).

## Datei & Zeilen (Stand `6377dd0`, `js/views/evidence.js`)

| Zeile | Code |
|---|---|
| 162 | `export function handleSortChange() {` |
| 163 | `var sortValue = document.getElementById("sortEvidence").value;` |
| 166 | `state.filteredEvidence.sort(function (a, b) {`  ← *title-asc*-Zweig |
| 167 | `return a.title.localeCompare(b.title);`  ← Komparator-Body |
| 182 | `renderEvidenceList();` |

---

## Schritt 1 — Breakpoint setzen (kein `console.log`)

1. DevTools → Tab **Sources**.
2. Links im Dateibaum: `127.0.0.1:8137` → `js` → `views` → **`evidence.js`**.
3. Auf die **Zeilennummer 163** klicken → blauer Marker = Breakpoint.
4. In der App (nicht DevTools) das Dropdown **„Sort"** von „Newest first" auf **„Title (A–Z)"** stellen.
5. Die Ausführung hält auf Zeile 163. Oben steht „Paused on breakpoint".

## Schritt 2 — Watch-Ausdrücke anlegen (Scope/Watch-Panel)

Rechts im **Watch**-Panel auf **+** und einzeln hinzufügen:

- `state.allEvidence === state.filteredEvidence`  → zeigt **`true`** (das ist der Bug: ein Array, zwei Namen)
- `state.allEvidence.map(e => e.id).join()`        → `E01,E02,E03,…,E18`
- `sortValue`                                       → noch `undefined` (Zeile 163 nicht ausgeführt)

Diese Ausdrücke werten bei jedem Step neu aus — damit trackst du den Wert über mehrere Schritte.

## Schritt 3 — „Step over" (F10)

- Einmal **Step over** (Icon: Pfeil-über-Punkt, `F10`).
- Zeile 163 wird ausgeführt, ohne in `document.getElementById` hineinzuspringen.
- Watch: `sortValue` ist jetzt `"title-asc"`. Der Zeiger steht auf dem `if`.
- Weiter **Step over**, bis der Zeiger auf **Zeile 166** (`state.filteredEvidence.sort(...)`) steht.

## Schritt 4 — „Step into" (F11) + der teure Fehlgriff

- Jetzt **Step into** (Pfeil-in-Punkt, `F11`) auf Zeile 166.
- Du landest **im Komparator**, Zeile 167 (`return a.title.localeCompare(b.title)`).
- Im Scope-Panel: `a` und `b` sind zwei Evidence-Objekte.
- **Das ist das Beispiel für „falscher Step kostet Zeit":** `.sort()` ruft diesen Komparator
  bei 18 Elementen ~50–60 Mal auf. Wolltest du nur *„die Sortierung ausführen und weiter"*,
  hättest du **Step over** genommen — mit **Step into** klickst du dich jetzt durch Dutzende
  Komparator-Aufrufe. Drück 2–3× **Resume** (`F8`) / **Step out**, um das zu „fühlen".

## Schritt 5 — Conditional Breakpoint (statt 50× Resume)

1. **Rechtsklick** auf Zeilennummer **167** → **„Add conditional breakpoint…"**.
2. Bedingung eintippen: `a.title.startsWith("Legacy")`
3. **Resume** (`F8`).
4. Die Ausführung hält jetzt **nur**, wenn der Komparator das Element
   „Legacy controller flash log" (E08) in der Hand hat — nicht bei jedem der ~55 Vergleiche.
   Scope zeigt `a.title === "Legacy controller flash log"`.

> Merksatz für die Frage: der Conditional Breakpoint bringt dich **in einem Sprung** zu dem
> einen Fall, der dich interessiert, statt 50× „Resume" zu klicken und jedes Mal zu prüfen.

## Schritt 6 — „Step out" (Shift+F11)

- Aus dem Komparator **Step out** (`Shift+F11`) → zurück in die `.sort()`-Maschinerie
  (ggf. ruft sie sofort wieder den Komparator — noch 1–2× Step out / Resume).
- Conditional Breakpoint wieder entfernen (Rechtsklick → Remove), sonst hält es weiter.
- Nach Abschluss von Zeile 166 steht der Zeiger auf **Zeile 182** (`renderEvidenceList();`).

## Schritt 7 — Den Bug im Watch-Panel *sehen*

Jetzt, **nach** dem `.sort()` auf Zeile 166, im Watch-Panel schauen:

- `state.allEvidence.map(e => e.id).join()` ist jetzt **`E12,E03,E10,E16,E17,E06,…`**
  → die **Master-Liste** wurde umsortiert, obwohl im Code nur `state.filteredEvidence.sort(...)` steht.
- `state.allEvidence === state.filteredEvidence` steht weiter auf **`true`**.

Das ist der Beweis, direkt im Debugger, ohne ein einziges `console.log`: der Wert von
`state.allEvidence` hat sich **zwischen zwei Steps** geändert, und du siehst die exakte Zeile,
die es getan hat.

## Schritt 8 — Call Stack lesen („wer hat mich gerufen, womit?")

Panel **Call Stack** (rechts, unter Watch), während es noch pausiert:

```
handleSortChange            evidence.js:182
onchange (inline handler)   index.html:126      <select id="sortEvidence" onchange="handleSortChange()">
dispatch / (native)         — Event-System
```

- „Wer hat `handleSortChange` gerufen?" → der **Inline-`onchange`-Handler** des `<select>`,
  ausgelöst durch mein Ändern des Dropdowns (ein `change`-Event).
- „Womit?" → `handleSortChange` bekommt **kein Argument**. Die Eingabe kommt aus dem DOM:
  `document.getElementById("sortEvidence").value` (Zeile 163). Das erklärt, warum der Wert
  `"title-asc"` „aus dem Nichts" kam — er stand nie in einem Funktionsargument.
- Klick auf den `renderEvidenceList`-Frame (wenn du in Schritt 6 hineingesteppt bist): du
  siehst, dass `renderEvidenceList` sofort am `if (state.evidenceViewLoading) return;`
  aussteigt — das ist nebenbei der Demo-3-Bug, live im Stack.

## Schritt 9 — Variable live ändern, um den Fix zu testen (vor dem Coden)

1. **Reload**, Breakpoint auf Zeile 163 wieder rein, Dropdown erneut auf „Title (A–Z)" → Pause.
2. Unten **Console** öffnen (`Esc`). Weil wir **im Frame von `handleSortChange` pausiert** sind,
   ist `state` hier im Scope.
3. Eintippen und Enter:
   ```js
   state.filteredEvidence = state.allEvidence.slice()
   ```
4. Watch prüfen: `state.allEvidence === state.filteredEvidence` ist jetzt **`false`**.
5. **Resume** (`F8`) — die Sortierung läuft durch.
6. Watch: `state.allEvidence.map(e => e.id).join()` ist **immer noch `E01,…,E18`**.

→ Der `.slice()`-Fix ist damit **im laufenden Programm bewiesen**, bevor eine Zeile Quellcode
geändert wurde. Genau so wurde der Demo-2-Fix abgesichert.

---

## Abgehakt

- [x] echter Breakpoint in einer bug-nahen Funktion, Zeile für Zeile durchgesteppt
- [x] Step over (Z.163), Step into (Komparator Z.167), Step out (aus dem Komparator) — je bewusst
- [x] Call-Stack-Panel gelesen + „wer rief mich, womit" an echtem Beispiel erklärt
- [x] Conditional Breakpoint (`a.title.startsWith("Legacy")`) statt 50× Resume
- [x] Scope/Watch: `state.allEvidence` über mehrere Steps verfolgt + `state.filteredEvidence`
      live auf `.slice()` gesetzt, um die Hypothese zu testen
