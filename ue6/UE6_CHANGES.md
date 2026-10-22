# UE6 CHANGES

Laufendes Änderungsprotokoll für Exercise 6 (Effects, Data Fetching & a Backend).
Baut auf dem fertigen Stand von [`../ue5/UE5_CHANGES.md`](../ue5/UE5_CHANGES.md) auf (alle fünf Views sind React, die Daten kommen aus
`public/data/*.json`). UE6 führt `useEffect` richtig ein, ersetzt die statischen JSON-Dateien durch ein kleines **Node-Backend** (nur lokal in der Entwicklung)
und behandelt Laden, Fehler, Leere, Rennen und Abbruch.

> **Stand:** bisher **nur Demo 1** bearbeitet (Beobachten und Erklären, kein App-Code geändert). Die übrigen Demos folgen.

> **URL der lokalen App:** `http://localhost:5173/Mystery-Road-AWE-2026-lukesch/react.html#/…`

> **Das ausführliche Präsentationsdokument zu Demo 1:** [`UE6_DEMO1_RENDER_VS_EFFECTS.md`](UE6_DEMO1_RENDER_VS_EFFECTS.md)

---

## Demo 1 — Render-Logik gegen Effekte

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Eine React-Komponente ist eine **Funktion**, und React ruft sie **auf, wann und wie oft es selbst will**. Diese Funktion soll nur **ausrechnen, wie die Oberfläche aussieht**
(den **Render**). Alles, was darüber hinaus etwas **tut** (speichern, laden, den Titel setzen, einen Timer starten), ist ein **Seiteneffekt** und gehört **nicht** in den Render,
sondern in einen **Event-Handler** (wenn der Nutzer etwas getan hat) oder in einen **Effekt** (wenn die Komponente angezeigt wird und sich mit der Außenwelt abgleichen muss).

*Analogie:* der Render ist ein **Architektenplan**. Man darf ihn beliebig oft zeichnen und wegwerfen. Aber man schließt **nicht** die Wasserleitung an, **während** man noch den
Plan zeichnet, denn der Plan wird vielleicht dreimal gezeichnet, und die Leitung müsste dreimal angeschlossen werden.

### Task 1 — ein Seiteneffekt im Render

Ich habe **zwei** Beispiele: einen **echten Fund** in der Historie und ein **absichtlich geschriebenes** in einer Wegwerf-Sandbox.

**Der echte Fund:** im Stand von UE5 Demo 4 (Commit `8ae73cb`) las `DashboardPage` den `localStorage` **im Funktionskörper**
(`bookmarkedEvidence(…, loadBookmarks())`), `WorkspacePage` ebenso (`loadBookmarks()`, `loadNotes()`). Behoben in UE5 Demo 5 (State in React).

**Das absichtliche Beispiel:** `src/sandbox/RenderEffectDemo.tsx` (nicht in `vite.config.js`, nie gebaut). Links die falsche Komponente mit **fünf** Seiteneffekten im Render:

| # | Seiteneffekt | Art |
|---|---|---|
| 1 | `badRenderCalls += 1` | Variable **außerhalb** ändern |
| 2 | `console.log(…)` | Konsole |
| 3 | `nextInstanceId++` | **ID im Render** vergeben |
| 4 | `localStorage.setItem(…)` | **Schreiben** in den Speicher |
| 5 | `localStorage.getItem(…)` | **Lesen** von etwas, das sich ohne React ändert (der echte Fund) |

In der Mitte dieselbe Aufgabe **richtig** (`useId`, State-Initialisierer, **Effekt** zum Schreiben, **Event-Handler** für die Konsole), rechts ein **abgeleiteter Wert**
(`squareSum`), unten ein **Messgerät**.

**Warum es ein Seiteneffekt ist, obwohl es "zu funktionieren scheint":**

| Warum es funktioniert **scheint** | Was falsch ist |
|---|---|
| der angezeigte Zähler geht hoch | unter StrictMode zählt er **doppelt** (2 statt 1); in Produktion 1 — dev und prod zeigen **Verschiedenes** |
| ohne StrictMode stimmen die Zahlen | die **ID** ändert sich bei **jedem** Neurendern (1, 2, 3), obwohl es dieselbe Instanz ist |
| der gelesene Wert stimmt beim Laden | er bleibt **veraltet**, wenn sich der `localStorage` von außen ändert |
| nichts wirft einen Fehler | die Fehler zeigen sich nur in Randfällen |

### Task 2 — die Regel in eigenen Worten

> **Im Render rechnet man, im Event-Handler reagiert man, im Effekt gleicht man ab.**

| Ort | Wann | Wofür |
|---|---|---|
| **Render** | bei **jedem** Rendern, beliebig oft | nur **berechnen**, was man sieht: rein, ohne Wirkung nach außen |
| **Event-Handler** | **einmal pro Ereignis** | etwas **tun**, **weil der Nutzer etwas getan hat** |
| **Effekt** | **nach** dem Zeichnen | sich mit der **Außenwelt abgleichen**, **weil die Komponente angezeigt wird** |

Aus dem Projekt: sichtbare Liste → **Render**; Bookmark umschalten und speichern → **Handler**; JSON laden → **Effekt**; Bookmarks beim Start lesen → **State-Initialisierer**
(Graubereich: einmaliges, reines Lesen, siehe Detaildokument Abschnitt 3).

### Messergebnisse (live)

**Sandbox mit StrictMode** (`render-effect-demo.html`):

| | nach dem Laden | nach 1× Neurendern |
|---|---|---|
| `BadRender`-Renders (Modulvariable) | **2** | 4 |
| angezeigte ID (`nextInstanceId++`) | **2** | 4 |
| `localStorage.setItem` im Render | 2 | 4 |
| `console.log` | 2 | 4 |
| `squareSum()`-Aufrufe (abgeleiteter Wert) | 2 | 4, Ergebnis **immer 30** |
| Effekt-Schreibzugriffe (richtige Komponente) | 2 (Mount, StrictMode wiederholt ihn) | **2** (kein Zuwachs) |

**Sandbox ohne StrictMode** (`?strict=0`): Renders **1 → 2 → 3**, ID **1 → 2 → 3** (die ID ändert sich trotzdem bei jedem Neurendern).

**Veralteter Wert:** `localStorage` von außen geändert → die im Render gelesene Anzeige bleibt **alt**, bis ein Neurendern kommt.

**Im echten Projekt:** `console.log("[render] DashboardPage")` am Anfang von `DashboardPage` → **2 Meldungen** pro Seitenaufruf (StrictMode in `main.tsx`). Danach entfernt;
`DashboardPage` ist unverändert gegenüber dem letzten Commit.

### Verifikation

- **Typ-Check:** `npm run typecheck` → 0 Fehler (vom Nutzer ausgeführt, inklusive der neuen Sandbox).
- **Sandbox live** mit und ohne StrictMode durchgespielt, Zahlen wie oben.
- **Echtes Projekt:** doppelte Render-Meldung gemessen und die Test-Zeile wieder entfernt (`git status` zeigt nur die drei neuen Sandbox-Dateien).
- **Aufräumen:** `localStorage` der Sandbox-Keys (`demo-…`) geleert.
- **Nach dem Umbau ausgeführt (vom Nutzer):** `format:check` und `build` siehe unten.
- **App-Code:** **nicht** geändert, nur die Sandbox kam dazu.

### 🎤 Live-Demo — was du im Unterricht herzeigst

Die vollständige Schritt-für-Schritt-Anleitung mit den erwarteten Zahlen steht im Detaildokument
[`UE6_DEMO1_RENDER_VS_EFFECTS.md`](UE6_DEMO1_RENDER_VS_EFFECTS.md), Abschnitt 6. Die Kurzform:

1. **Sandbox laden**, "Messen": links **2** statt 1. "Das ist **StrictMode**: React ruft den Render in der Entwicklung absichtlich zweimal auf."
2. **"Unabhängiges Neurendern"**: Zähler **und ID** links ändern sich, obwohl nichts passiert ist. "Ein Seiteneffekt im Render läuft bei **jedem** Rendern."
3. **`?strict=0`**: **1** Render, aber die **ID ändert sich trotzdem**. "Der Fehler ist auch ohne StrictMode da. StrictMode macht ihn nur **sichtbar**."
4. **"localStorage von außen ändern"**: links bleibt der Wert **alt**. "Das war unser echter Fund im Dashboard (UE5 Demo 4)."
5. **Rechts** `squareSum = 30`, obwohl 2× berechnet: "**Rechnen ist kein Seiteneffekt.**"
6. **Regel** nennen: "Im Render rechnet man, im Handler reagiert man, im Effekt gleicht man ab."

---
