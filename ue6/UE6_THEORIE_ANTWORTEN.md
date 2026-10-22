# UE6 Theorie-Fragen & Antworten — Exercise 6

Laufende Sammlung, gleiches Schema wie [`../ue5/UE5_THEORIE_ANTWORTEN.md`](../ue5/UE5_THEORIE_ANTWORTEN.md).

> **Stand:** bisher **nur Demo 1**. Das ausführliche Detaildokument mit Live-Demo-Skript und Nachfragen:
> [`UE6_DEMO1_RENDER_VS_EFFECTS.md`](UE6_DEMO1_RENDER_VS_EFFECTS.md).

---

## Demo 1 — Render-Logik gegen Effekte

Ein Seiteneffekt im Render, einmal als **echter Fund** (UE5 Demo 4: `DashboardPage` las den `localStorage` im Funktionskörper) und einmal **absichtlich** in einer Sandbox
(`render-effect-demo.html`, fünf Seiteneffekte im Render, mit Messgerät), dazu die Regel in eigenen Worten. Live gemessen mit und ohne StrictMode und im echten Projekt.
Details, Tabellen in `UE6_CHANGES.md`.

### F1: Warum kann React die Render-Funktion einer Komponente mehr als einmal oder zu unerwarteten Zeitpunkten aufrufen (z. B. in der Entwicklung mit Strict Mode)? Was ginge mit dem gefundenen Seiteneffekt-Beispiel schief, wenn der Render zweimal liefe?

**Einfach gesagt:** der Render ist eine **Berechnung**, kein Ereignis. React behält sich vor, sie so oft zu wiederholen, wie es nötig oder nützlich ist: um Fehler früh zu finden
(StrictMode), weil sich **etwas geändert hat** (State, Props, Eltern) oder um Arbeit zu **planen und zu verwerfen**. Die Annahme ist: Aufrufen ist **folgenlos**, bis React das Ergebnis **übernimmt**.
Ein Seiteneffekt im Render bricht diese Annahme.

**Warum React mehrfach rendert:**

| Grund | Wann | Beobachtet |
|---|---|---|
| **StrictMode** (Entwicklung) | ruft Komponenten und Initialisierer **absichtlich zweimal** auf, führt Effekte zweimal aus | Sandbox **2** statt 1; echtes Projekt: `[render] DashboardPage` **2×** pro Seitenaufruf (StrictMode in `main.tsx`) |
| **State, Props, Context ändern sich** | bei jeder Änderung | "Neurendern" +1 pro Klick |
| **Das Eltern-Element rendert neu** | auch bei gleichen Props (ohne `memo`) | `BadRender` hat **keine** Props und rendert trotzdem mit |
| **Concurrent Rendering** | React kann einen begonnenen Render **pausieren, verwerfen, neu starten** | in dieser App nicht eingesetzt, laut React-Dokumentation der Hauptgrund für die Reinheitsregel (nicht gemessen) |

**StrictMode verursacht den Fehler nicht, er macht ihn sichtbar:** ohne StrictMode (`?strict=0`) ändert sich die **ID** der Instanz trotzdem bei jedem Neurendern (1, 2, 3).

**Was mit dem Beispiel schiefgeht, wenn der Render zweimal läuft** (gemessen, StrictMode an):

| Seiteneffekt im Render | Folge | Gemessen |
|---|---|---|
| Zähler (`badRenderCalls += 1`) | zählt **doppelt**, passt nicht mehr zu den sichtbaren Updates | **2** statt 1 |
| ID vergeben (`nextInstanceId++`) | die Instanz bekommt nicht die erste, sondern die **zweite** ID | angezeigt **2** statt 1 (nach dem Neurendern 4, 6 …) |
| Schreiben (`localStorage.setItem`) | **doppelt** ausgeführt; bei nicht idempotenten Operationen **doppelte Wirkung** | **2** Schreibzugriffe |
| Konsole | doppelte Meldungen | **2** |
| **Lesen** (`localStorage.getItem`, der echte Fund) | bei doppeltem Aufruf **harmlos**, **aber** der Wert **veraltet**, wenn er sich außerhalb von React ändert | live: von außen geändert → Anzeige bleibt alt |

**Zum echten Fund:** das **Lesen** im Dashboard hätte bei zweimaligem Aufruf keinen Schaden gemacht (zweimal parsen, gleiches Ergebnis). Sein Fehler war die **veraltete Anzeige**
und die **Abhängigkeit von etwas, das React nicht beobachtet**. Das **Schreiben** im Render (Nr. 4 der Sandbox) zeigt dagegen genau das **Doppel**-Problem.

**Warum es "zu funktionieren scheint":** der Zähler geht hoch, die Seite sieht normal aus, nichts wirft einen Fehler. Es heißt nur "ich habe es einmal so ausprobiert". React verspricht aber
**nicht**, den Render genau einmal pro sichtbarer Änderung aufzurufen.

### F2: Ist das Berechnen eines abgeleiteten Werts (wie die gefilterte Evidence-Liste aus Übung 5) ein Seiteneffekt? Warum oder warum nicht, und wie fließt diese Unterscheidung in die Regel ein, die du aufgeschrieben hast?

**Einfach gesagt:** **Nein.** Ein abgeleiteter Wert ist eine **reine Berechnung**: gleiche Eingaben, gleiches Ergebnis, und **nichts** außerhalb wird verändert. Er gehört **in den Render**.
Der Render darf **rechnen**, aber nichts **tun**.

**Die Prüfung an `visibleEvidence`:**

```tsx
const visibleEvidence = sortEvidence(filterEvidence(evidence, filters, people), filters.sort);
```

| Prüfung | Antwort |
|---|---|
| Verändert sie etwas außerhalb? | **nein**: `filter()` baut ein neues Array, `sortEvidence` sortiert eine Kopie (UE5 Demo 3) |
| Hängt das Ergebnis nur von den Eingaben ab? | **ja** (`evidence`, `filters`, `people`) |
| Schadet doppelter Aufruf? | **nein**. StrictMode ruft es ständig doppelt auf, ohne dass es auffällt |
| Beleg in der Sandbox | `squareSum()` wurde 2× aufgerufen (4× nach einem Neurendern), das angezeigte Ergebnis war **immer 30** |

**Was wäre ein Seiteneffekt?** `filterEvidence(...)` **plus** `console.log(...)`, **plus** ein Zähler `searchCount++`, oder ein Filter mit `Date.now()` / `Math.random()` (unrein: das Ergebnis hängt
von etwas anderem ab als den Eingaben). `new Date(item.timestamp)` dagegen ist rein (macht aus der **Eingabe** ein Datum).

**Wie das die Regel beeinflusst:**

1. Die Regel trennt **Berechnen** von **Tun**. "Viel Arbeit" ist kein Merkmal eines Seiteneffekts; **Wirkung nach außen** oder **Abhängigkeit von Äußerem** ist es.
2. Ein abgeleiteter Wert gehört **nicht** in einen Effekt mit `setState` ("Wert in State spiegeln"): das wäre **doppelter State** (UE5 Demo 4/9) und ein **Extra-Render**.
3. Ist die Berechnung **teuer**, hilft `useMemo` (ein Cache), **kein Effekt**; die Berechnung bleibt rein.
4. **Testfrage:** *"Wenn ich diese Zeile zweimal ausführe: ist das Ergebnis dasselbe und ist draußen nichts anders?"* Ja → **Render**. Nein → **Handler** (wenn der Nutzer etwas getan hat)
   oder **Effekt** (wenn sich die angezeigte Komponente mit der Außenwelt abgleichen muss).

**Die Regel, die ich aufgeschrieben habe:** *"Im Render rechnet man, im Event-Handler reagiert man, im Effekt gleicht man ab."*

---
