# UE6 Demo 1 — Render-Logik gegen Effekte (das ausführliche Lern- und Präsentationsdokument)

Dieses Dokument ist für **Demo 1 allein** gedacht: alles, was du wissen, zeigen und beantworten können musst, an einer Stelle. Die
Kurzfassungen stehen zusätzlich in [`UE6_CHANGES.md`](UE6_CHANGES.md) (Demo 1) und
[`UE6_THEORIE_ANTWORTEN.md`](UE6_THEORIE_ANTWORTEN.md) (F1, F2).

**Aufgabenstellung (Kurz):**
- **Task 1:** ein Beispiel für einen **Seiteneffekt direkt im Render** finden (oder absichtlich schreiben und wieder entfernen) und erklären,
  warum es einer ist, **obwohl es "zu funktionieren scheint"**.
- **Task 2:** in **eigenen Worten** eine kurze **Regel** formulieren: was gehört in den Render, was in einen Effekt?
- **Frage 1:** Warum kann React eine Komponente **mehrfach** oder zu **unerwarteten** Zeiten rendern (StrictMode)? Was ginge mit dem
  gefundenen Beispiel schief, wenn der Render zweimal liefe?
- **Frage 2:** Ist das Berechnen eines abgeleiteten Werts (die gefilterte Evidence-Liste aus UE5) ein Seiteneffekt? Warum (nicht)? Wie
  beeinflusst das die Regel?

---

## 0. Spickzettel (die ganze Demo in 12 Zeilen)

1. **Render** = die Funktion der Komponente läuft und gibt JSX zurück. Sie soll **nur rechnen**: aus Props und State das Bild beschreiben.
2. **Seiteneffekt** = alles, was **außerhalb** der Funktion etwas **verändert** (Variable, Speicher, Konsole, Netzwerk, DOM, Timer) **oder liest, was sich
   unabhängig von React ändern kann**.
3. React ruft den Render **wann und wie oft es will** auf (StrictMode: **zweimal** in der Entwicklung; jede Änderung von State, Props oder Eltern: **wieder**).
4. Deshalb muss der Render **rein** sein: gleiche Eingaben → gleiches Ergebnis, **keine** Wirkung nach außen. Dann ist Mehrfachaufruf harmlos.
5. **Drei Orte für Dinge, die etwas "tun":**
   - **Event-Handler** — weil der Nutzer **geklickt/getippt** hat.
   - **Effekt (`useEffect`)** — weil die Komponente **auf dem Bildschirm steht** und sich mit etwas **außerhalb von React** abgleichen muss (Laden, Titel, Timer, Listener).
   - **Render** — nur **Berechnen**.
6. **Ein abgeleiteter Wert ist kein Seiteneffekt** (`visibleEvidence`, `squareSum`): er verändert nichts, hängt nur von den Eingaben ab, Mehrfachaufruf schadet nicht.
7. **Gemessen in der Sandbox (StrictMode an):** ein Seiteneffekt im Render läuft **doppelt** (Zähler 2 statt 1, ID 2 statt 1). Ohne StrictMode: **1** — aber die ID **ändert sich
   bei jedem Neurendern** (1, 2, 3) und der gelesene `localStorage`-Wert bleibt **veraltet**, bis zufällig neu gerendert wird.
8. **Im echten Projekt:** `console.log` in `DashboardPage` → **2×** pro Seitenaufruf (StrictMode in `main.tsx`).
9. **Echter Fund in der eigenen Historie:** UE5 Demo 4: `DashboardPage` und `WorkspacePage` lasen den `localStorage` **im Render** (`loadBookmarks()` im Funktionskörper).
10. **Graubereich:** `useState(loadBookmarks)` liest den `localStorage` einmal beim ersten Rendern (Initialisierer). Das ist ein **reines Lesen, einmalig und idempotent**: toleriert.
11. Die Regel in einem Satz: *"Im Render rechnet man, im Handler reagiert man, im Effekt gleicht man ab."*
12. Der Effekt ist **kein** Ort für alles, was irgendwie "danach" passiert: was man **ausrechnen** kann, gehört **nicht** in Effekt + State (UE5 Demo 4).

---

## 1. Die Begriffe in einfachen Worten

### 1.1 Render

Eine React-Komponente ist eine **Funktion**. **Rendern** heißt: React **ruft diese Funktion auf**, und sie liefert zurück, **wie die Oberfläche
jetzt aussehen soll** (JSX). Das Rendern ist **nicht** das Zeichnen auf den Bildschirm: React vergleicht das Ergebnis mit dem vorigen und ändert dann nur, was nötig ist
(UE3 Demo 3: virtueller DOM).

### 1.2 Seiteneffekt

Ein **Seiteneffekt** ist alles, was eine Funktion **neben dem Zurückgeben ihres Ergebnisses** tut:

| Art | Beispiel | Verändert die Außenwelt? |
|---|---|---|
| Variable außerhalb ändern | `zaehler++` mit `zaehler` außerhalb der Funktion | ja |
| In Speicher schreiben | `localStorage.setItem(...)` | ja |
| Konsole schreiben | `console.log(...)` | ja (sichtbare Wirkung) |
| Netzwerk | `fetch(...)` | ja |
| DOM ändern | `document.title = ...`, `element.scrollIntoView()` | ja |
| Timer / Listener | `setTimeout`, `window.addEventListener` | ja |
| **Lesen** von etwas, das sich **unabhängig** ändern kann | `localStorage.getItem(...)`, `Date.now()`, `Math.random()` | nein, **aber die Funktion ist dadurch nicht mehr rein**: gleiche Eingaben können verschiedene Ergebnisse liefern |

### 1.3 Reine Funktion (pure function)

Eine Funktion ist **rein**, wenn (1) das Ergebnis **nur** von den Parametern abhängt (gleiche Eingaben → gleiches Ergebnis) und (2) sie **nichts außerhalb** verändert.
Beispiel: `squareSum([1,2,3,4])` liefert immer `30` und berührt nichts anderes. Du kannst sie 1× oder 100× aufrufen: kein Unterschied.

### 1.4 Die drei Orte

| Ort | Wann läuft es? | Wofür? | Beispiel aus dem Projekt |
|---|---|---|---|
| **Render** (Funktionskörper) | bei **jedem** Rendern, **beliebig oft** | **berechnen**, was man sieht | `visibleEvidence = sortEvidence(filterEvidence(...))` (UE5 Demo 4) |
| **Event-Handler** | **einmal pro Ereignis** (Klick, Tippen, Absenden) | etwas **tun**, **weil der Nutzer etwas getan hat** | `handleToggle` im `BookmarksProvider`: neue Liste berechnen, State setzen, in den `localStorage` speichern |
| **Effekt** (`useEffect`) | **nach** dem Zeichnen, abhängig von seiner Abhängigkeitsliste | sich mit etwas **außerhalb von React** **abgleichen**, **weil die Komponente angezeigt wird** | `useCaseData`: nach dem ersten Anzeigen die JSON-Daten laden |

*Analogie:* der Render ist der **Architektenplan** (kann beliebig oft gezeichnet und verworfen werden, kostet nur Papier). Der Event-Handler ist das, was der
**Bauherr auf Zuruf** tut ("bau hier eine Tür ein"). Der Effekt ist das, was **nach Fertigstellung** an der Außenwelt angeschlossen wird (Strom, Wasser).
Niemand schließt die Wasserleitung an, **während er noch den Plan zeichnet** — denn der Plan wird vielleicht dreimal gezeichnet und zweimal weggeworfen.

---

## 2. Task 1 — das Beispiel für einen Seiteneffekt im Render

Ich habe **beides** gemacht: einen **echten Fund** in der eigenen Projekt-Historie **und** ein **absichtlich geschriebenes** Beispiel in einer Wegwerf-Sandbox.

### 2.1 Der echte Fund: `localStorage` im Render (UE5 Demo 4)

Im Stand von **UE5 Demo 4** (Commit `8ae73cb`) stand in `features/dashboard/DashboardPage.tsx` im Funktionskörper:

```tsx
export function DashboardPage() {
  const caseDataState = useCaseData();
  ...
  const bookmarkCount = bookmarkedEvidence(caseDataState.data.evidence, loadBookmarks()).length;   // <- Zeile 42
  return <DashboardView data={caseDataState.data} bookmarkCount={bookmarkCount} />;
}
```

und in `features/workspace/WorkspacePage.tsx`:

```tsx
const bookmarks = loadBookmarks();   // Zeile 42
const notes = loadNotes();           // Zeile 43
```

`loadBookmarks()` ruft `localStorage.getItem(...)` auf und parst das Ergebnis. Das stand also **bei jedem Rendern** im Funktionskörper.

**Warum das ein Seiteneffekt-Problem ist, obwohl es lief:**

| # | Grund | Erklärung |
|---|---|---|
| 1 | **Der Render hängt von etwas ab, das React nicht kennt.** | Der `localStorage` ist **nicht** Teil von State oder Props. Der Render ist nicht mehr "gleiche Eingaben → gleiche Ausgabe" |
| 2 | **React merkt Änderungen nicht.** | Ändert etwas anderes den `localStorage` (ein zweiter Browser-Tab, die vanilla-App), **rendert React nicht neu**. Die Anzeige bleibt **veraltet**, bis zufällig aus anderem Grund neu gerendert wird (in der Sandbox live gezeigt, Abschnitt 3.3) |
| 3 | **Es sieht richtig aus.** | Auf der Seite stand der **richtige** Zähler: weil man das Dashboard nur über die Navigation betrat (die Seite wird neu eingehängt und liest frisch). Der Fehler zeigte sich nie im normalen Gebrauch |
| 4 | **Ein Zugriff auf die Außenwelt mitten im Berechnen.** | Der Render macht I/O. Bei einem **vollen** oder **gesperrten** Speicher kann das werfen, mitten im Render |
| 5 | **Aufruf bei jedem Rendern.** | Dashboard und Workspace parsten bei **jedem** Rendern das JSON neu. Bei vielen Rendern (Filter, Tippen) unnötige Arbeit |

**Behoben** in UE5 Demo 5: der State liegt in React (Demo 5: `PageRouter`, seit Demo 8: `BookmarksProvider`), die Seiten lesen ihn per Props bzw. Context. Der `localStorage`
wird nur noch **beim Start gelesen** und **im Event-Handler geschrieben** (siehe Abschnitt 3).

### 2.2 Das absichtlich geschriebene Beispiel (Sandbox)

Datei `src/sandbox/RenderEffectDemo.tsx` (Wegwerf-Beispiel: **nicht** in `vite.config.js`, also nie gebaut oder deployt). Links die **falsche** Komponente, mit **fünf**
Seiteneffekten im Render:

```tsx
let badRenderCalls = 0;   // außerhalb der Komponente
let nextInstanceId = 1;   // außerhalb der Komponente

function BadRender() {
  badRenderCalls += 1;                                                   // (1) Außenwelt verändern
  console.log("[demo] BadRender wird gerendert");                        // (2) Konsole
  const instanceId = nextInstanceId++;                                   // (3) "eindeutige" ID im Render vergeben
  localStorage.setItem("demo-last-render", String(badRenderCalls));      // (4) in den localStorage SCHREIBEN
  const outside = localStorage.getItem("demo-outside") ?? "(noch nichts gespeichert)";   // (5) im Render LESEN
  ...
}
```

| # | Seiteneffekt | Art |
|---|---|---|
| 1 | `badRenderCalls += 1` | eine Variable **außerhalb** verändern |
| 2 | `console.log(...)` | in die **Konsole** schreiben |
| 3 | `nextInstanceId++` | eine **ID im Render vergeben** (Zähler außerhalb) |
| 4 | `localStorage.setItem(...)` | in den **Speicher schreiben** |
| 5 | `localStorage.getItem(...)` | **lesen** von etwas, das sich unabhängig ändern kann (der echte Fund aus 2.1) |

In der **Mitte** steht dieselbe Aufgabe **richtig** (jeder Seiteneffekt an seinem Platz), **rechts** ein **abgeleiteter Wert** (`squareSum`), und unten ein
**Messgerät**, das `console.log` und `localStorage.setItem` mithört und die Zähler anzeigt.

### 2.3 Messergebnisse (live im Browser, `react`-Sandbox)

**Mit StrictMode** (Standard, `render-effect-demo.html`):

| Messung | nach dem Laden | nach 1× "Neurendern" | nach 2× "Neurendern" |
|---|---|---|---|
| `BadRender`: Render-Aufrufe (Modulvariable) | **2** (!) | **4** | 6 |
| Angezeigte ID dieser Instanz (`nextInstanceId++`) | **2** (!) | **4** | 6 |
| `localStorage.setItem` im Render | **2** | 4 | — |
| `console.log("[demo] …")` | **2** | 4 | — |
| `squareSum()`-Aufrufe | **2** | 4 | — |
| angezeigtes Ergebnis `squareSum` | **30** | **30** | 30 |
| `GoodRender`: Schreibzugriffe durch den Effekt | **2** (Mount, StrictMode wiederholt ihn) | 2 (**unverändert**) | — |

**Ohne StrictMode** (`render-effect-demo.html?strict=0`, so verhält sich eine Produktions-Seite):

| Messung | nach dem Laden | nach 1× "Neurendern" | nach 2× "Neurendern" |
|---|---|---|---|
| `BadRender`: Render-Aufrufe | **1** | **2** | 3 |
| Angezeigte ID dieser Instanz | **1** | **2** (!) | **3** (!) |
| `localStorage.setItem` im Render | 1 | 2 | — |
| `console.log("[demo] …")` | 1 | 2 | — |

**Der Wert `outside` (im Render gelesen):**

| Schritt | angezeigt |
|---|---|
| nach dem Laden | "(noch nichts gespeichert)" |
| nach "localStorage von außen ändern" (direkt `localStorage.setItem`) | **immer noch** "(noch nichts gespeichert)" (**veraltet**) |
| nach "Neurendern" | "von außen (…)" (aktuell, **zufällig** weil gerendert wurde) |

*Genau dasselbe Verhalten hatte der Dashboard-Zähler im Stand von UE5 Demo 4, wenn ein Wert außerhalb von React geändert wurde.*

**Im echten Projekt** (gleicher Browser, `react.html`): temporär `console.log("[render] DashboardPage")` an den Anfang von `DashboardPage` gesetzt, **einmal** zum Dashboard
navigiert: die Meldung erschien **2×** (StrictMode in `main.tsx`). Danach wieder entfernt (`git status` sauber).

### 2.4 Warum es "zu funktionieren scheint" (und trotzdem falsch ist)

| # | Warum es funktioniert **scheint** | Was tatsächlich falsch ist |
|---|---|---|
| 1 | Der **angezeigte Zähler** geht hoch, die Seite sieht normal aus | in der Entwicklung zählt er **doppelt** (2 statt 1); in Produktion nur 1 — **dev und prod zeigen Verschiedenes** |
| 2 | **Ohne StrictMode** stimmen die Zahlen (1, 2, 3 …) | die **ID** ändert sich bei **jedem** Neurendern (1, 2, 3), obwohl es **dieselbe** Instanz ist. Eine ID, die sich ändert, ist keine ID |
| 3 | Der gelesene Wert ist **beim Laden richtig** | er bleibt **veraltet**, wenn sich der `localStorage` von außen ändert |
| 4 | **Nichts wirft** einen Fehler, keine Warnung | die Fehler zeigen sich nur in **Randfällen** (zweiter Tab, schneller Doppelklick, Concurrent-Rendering) |
| 5 | Der Schreibzugriff **funktioniert** (die Daten landen im Speicher) | er passiert **bei jedem Render** (gemessen) und **vor** dem Zeichnen, laut React-Dokumentation auch bei Renders, die React **verwirft** (Concurrent Rendering, hier nicht gemessen) |

**Der Kern:** "es funktioniert" heißt nur "ich habe es **einmal** so ausprobiert, wie ich es mir gedacht habe". React verspricht aber **nicht**, den Render genau einmal pro
sichtbarer Änderung aufzurufen. Wer sich darauf verlässt, baut auf etwas, das **nicht garantiert** ist.

### 2.5 Die richtige Version (Mitte der Sandbox)

| Aufgabe | falsch (im Render) | richtig (an seinem Platz) |
|---|---|---|
| ID pro Instanz | `nextInstanceId++` | **`useId()`**: dieselbe ID bei **jedem** Render, von React vergeben (gemessen: `_r_0_` bleibt gleich) |
| Wert aus dem `localStorage` übernehmen | `localStorage.getItem(...)` im Render | **einmalig** im **State-Initialisierer**: `useState(() => localStorage.getItem(...))` |
| In den `localStorage` schreiben | `localStorage.setItem(...)` im Render | **Effekt** `useEffect(() => { ...setItem(note) }, [note])`: **nach** dem Zeichnen, **nur** wenn sich `note` ändert (gemessen: 2 Schreibzugriffe beim Laden unter StrictMode, danach **0** durch Neurendern) |
| In die Konsole schreiben | `console.log` im Render | **Event-Handler** (`handleLogClick`): passiert **einmal pro Klick** |
| Zähler "wie oft gerendert" | Modulvariable im Render | **gar nicht nötig**. Wer es wirklich messen will: React DevTools Profiler (er misst von außen) |

**Bemerkenswert:** auch der **Effekt** läuft unter StrictMode beim Laden **zweimal** (Mounten, Aufräumen, Mounten, mit der Absicht, fehlende Aufräum-Funktionen zu finden).
Der Schreibzugriff ist **idempotent** (zweimal denselben Wert schreiben schadet nicht), deshalb ist er dort **harmlos**. Das ist der Einstieg in Demo 2 und 3.

---

## 3. Task 2 — die Regel in eigenen Worten

> **Im Render rechnet man, im Event-Handler reagiert man, im Effekt gleicht man ab.**

**Etwas ausführlicher:**

- **In den Render** gehört alles, was nötig ist, um zu **beschreiben, wie die Oberfläche aussieht** — **berechnet** aus Props und State: filtern, sortieren, formatieren,
  Texte zusammensetzen, JSX bauen. Er muss **rein** sein: **nichts** außerhalb verändern, **nichts** lesen, was sich ohne React ändern kann (`localStorage`, `Date.now()`,
  `Math.random()`, `window.…`), **nichts** starten.
- **In einen Event-Handler** gehört, was passieren soll, **weil der Nutzer etwas getan hat**: speichern, löschen, absenden, navigieren, umschalten.
- **In einen Effekt** gehört, was passieren soll, **weil die Komponente angezeigt wird** (oder sich ihre Eingaben ändern) und sich dabei mit **etwas außerhalb von React** abgleichen
  muss: Daten laden, den Seitentitel setzen, einen Timer oder Listener an- und abmelden.

**Der Entscheidungsbaum:**

```
Soll es etwas BERECHNEN, das auf dem Bildschirm erscheint?            ──ja──▶  RENDER (rein!)
        │ nein
        ▼
Passiert es, WEIL DER NUTZER ETWAS GETAN HAT (Klick, Eingabe, Submit)? ──ja──▶  EVENT-HANDLER
        │ nein
        ▼
Muss sich die Komponente mit der AUSSENWELT ABGLEICHEN, solange sie     ──ja──▶  EFFEKT (+ Aufräumen)
angezeigt wird (laden, abonnieren, Titel, Timer)?
```

**Dieselbe Regel an Beispielen aus dem Projekt:**

| Was | Wo steht es richtig | Warum |
|---|---|---|
| sichtbare Evidence-Liste (filtern, sortieren) | **Render** (`visibleEvidence`) | nur Berechnen, rein |
| Bookmark umschalten **und** speichern | **Event-Handler** (`handleToggle`) | der Nutzer hat geklickt |
| Notiz speichern | **Event-Handler** (`handleSaveNote`) | der Nutzer hat abgesendet |
| JSON-Daten vom Server holen | **Effekt** (`useCaseData`) | die Komponente wird angezeigt und muss sich mit dem Netzwerk abgleichen |
| gespeicherte Bookmarks **beim Start** lesen | **State-Initialisierer** (`useState(loadBookmarks)`) | **einmaliges, reines Lesen** (Graubereich, siehe unten) |
| zu einem Detail scrollen | **Ref-Callback** (`scrollIntoViewOnMount`) | ein Ausweg für DOM-Dinge, die React nicht deklarativ ausdrücken kann |
| Seitentitel setzen (kommt in Demo 2) | **Effekt** | `document.title` ist die Außenwelt |
| "Saved"-Timer aufräumen (kommt in Demo 3) | **Effekt mit Cleanup** | ein Timer muss beim Verlassen abgemeldet werden |

**Der Graubereich: `useState(loadBookmarks)`.** Die Aufgabe nennt als Beispiel "`localStorage` inline im Funktionskörper lesen". Unser Initialisierer liest den `localStorage` **auch
während des Renders** (React ruft ihn beim **ersten** Rendern auf). Warum ist das trotzdem in Ordnung?

| Kriterium | Initialisierer `useState(loadBookmarks)` | Lesen bei jedem Render (der alte Dashboard-Code) |
|---|---|---|
| Wie oft? | **einmal** beim ersten Rendern | **bei jedem** Rendern |
| Verändert es etwas? | nein, **nur lesen** | nein, nur lesen |
| Danach? | der Wert **gehört dem State**, React kennt ihn | der Wert wird **jedes Mal neu** geholt, React kennt ihn nicht |
| Veraltet? | nein, der State ist die Wahrheit | **ja**, wenn sich der Speicher von außen ändert |
| StrictMode | ruft den Initialisierer **zweimal** auf: harmlos, weil **idempotent** (live: `remotion_hypothesis` wird beim Laden 2× gelesen) | jeder Render liest |

Es ist ein **toleriertes, einmaliges, reines Lesen**, **kein** Muster für "Werte, die sich ändern". Wer es streng sieht, liest den Wert **in einem Effekt** und setzt ihn dann in den State
(dann gibt es einen kurzen leeren ersten Frame). Wichtig ist: **ein Wert, der sich ändern kann, wird nicht bei jedem Render aus der Außenwelt geholt.**

---

## 4. Frage 1 — Warum kann React mehrfach rendern, und was ginge schief?

### 4.1 Warum ruft React den Render mehrfach oder "unerwartet" auf?

**Einfach gesagt:** der Render ist **kein Ereignis**, sondern eine **Berechnung**, und React behält sich vor, sie **so oft zu wiederholen, wie es für richtig hält**: um Fehler früh zu
finden, um Arbeit zu planen und zu verwerfen, oder weil sich etwas geändert hat. Die Annahme: Aufrufen ist **billig und folgenlos**, bis React das Ergebnis **übernimmt**.

| Grund | Wann | Beobachtet? |
|---|---|---|
| **StrictMode (Entwicklung)** | React ruft **jede** Komponente (und jeden `useState`-/`useMemo`-/`useReducer`-Initialisierer und Updater) **absichtlich zweimal** auf und führt **Effekte zweimal** aus (Mounten → Aufräumen → Mounten). Ziel: Seiteneffekte **früh sichtbar machen** | **ja**: Sandbox 2 statt 1, echtes Projekt `[render] DashboardPage` **2×** pro Seitenaufruf, `useCaseData` 10 statt 5 JSON-Anfragen (UE5 Demo 9). Im Projekt aktiv in `main.tsx` |
| **State, Props oder Context ändern sich** | jede Änderung | **ja**: "Neurendern" in der Sandbox +1 pro Klick |
| **Das Eltern-Element rendert neu** | auch wenn die Props **gleich** bleiben (ohne `memo`) | **ja**: `BadRender` hat **keine** Props und rendert trotzdem bei jedem Klick auf einen Knopf des Eltern-Elements neu |
| **Concurrent Rendering** | React kann einen **begonnenen** Render **pausieren, verwerfen oder neu starten** (z. B. Übergänge, `Suspense`), **ohne** ihn je auf den Bildschirm zu bringen | nicht in dieser App eingesetzt, **nicht** gemessen. Laut React-Dokumentation **der** Grund, warum Reinheit eine **Pflicht** ist |
| **StrictMode bei Ref-Callbacks** | React 19 hängt Ref-Callbacks im StrictMode doppelt an (anhängen, abhängen, anhängen) | **ja**: `scrollIntoView` wurde 2× aufgerufen (UE5 Demo 10) |

**Wichtig:** StrictMode **verursacht** keinen Fehler. Er macht einen **bestehenden** sichtbar. Der Beleg: **ohne** StrictMode (`?strict=0`) ändert sich die ID von `BadRender` **trotzdem** bei jedem
Neurendern (1, 2, 3). Das ist kein Doppel-Render-Problem, sondern ein **Reinheitsproblem**.

### 4.2 Was ginge mit dem gefundenen Beispiel schief, wenn der Render zweimal liefe?

| Beispiel | Wenn der Render zweimal läuft … | Gemessen |
|---|---|---|
| **Zähler / Modulvariable** (`badRenderCalls += 1`) | zählt **doppelt**; der angezeigte Wert stimmt nicht mit den sichtbaren Updates überein ("warum steigt der Zähler schneller, als ich klicke?") | **2** statt 1 beim Laden |
| **ID im Render vergeben** (`nextInstanceId++`) | die Komponente bekommt **nicht** die erste ID, sondern die **zweite**; Ids "springen" (2, 4, 6); bei Listen entstehen **Lücken oder Duplikate** | angezeigt **2** statt 1 |
| **Schreiben im Render** (`localStorage.setItem`) | wird **zweimal** ausgeführt; bei **nicht idempotenten** Operationen (hochzählen, anhängen, Nachricht senden, Bestellung auslösen) **doppelte Wirkung**. Bei einem **verworfenen** Render bleibt die Wirkung, **obwohl nie etwas angezeigt wurde** (laut React-Dokumentation, hier nicht gemessen) | **2** Schreibzugriffe |
| **Konsole** | doppelte Meldungen; man sucht einen Fehler, den es nicht gibt | **2** Meldungen |
| **Lesen im Render** (der echte Fund `loadBookmarks()` im Dashboard) | bei doppeltem Aufruf **harmlos** (Lesen ändert nichts) — **aber** das Problem ist ein anderes: der Wert **veraltet** und der Render ist **nicht rein** | live: "von außen ändern" → Anzeige bleibt alt |

**Zum echten Fund konkret:** das **Lesen** des `localStorage` im Dashboard hätte bei doppeltem Aufruf **keinen** Schaden angerichtet (zweimal parsen, gleiches Ergebnis). Der Schaden war die
**veraltete Anzeige** und die **Abhängigkeit von etwas, das React nicht beobachtet**. Das **Schreiben** im Render (Sandbox, Nr. 4) zeigt dagegen genau das **Doppel-Problem**.

---

## 5. Frage 2 — Ist ein abgeleiteter Wert ein Seiteneffekt?

**Einfach gesagt:** **Nein.** Ein abgeleiteter Wert ist eine **reine Berechnung**: gleiche Eingaben, gleiches Ergebnis, **nichts** wird verändert. Er gehört **in den Render**. Deshalb
darf der Render **rechnen** — auch viel — aber **nichts tun**.

**Die gefilterte Evidence-Liste aus UE5 Demo 4:**

```tsx
const visibleEvidence = sortEvidence(filterEvidence(evidence, filters, people), filters.sort);
```

| Prüfung | Antwort |
|---|---|
| Verändert sie etwas außerhalb? | **nein.** `filter()` baut ein **neues** Array, `sortEvidence` sortiert eine **Kopie** (`[...evidence].sort`). Die Eingaben bleiben unberührt (UE5 Demo 3: `readonly`) |
| Hängt das Ergebnis nur von den Eingaben ab? | **ja** (`evidence`, `filters`, `people`) |
| Schadet doppelter Aufruf? | **nein.** Das gleiche Ergebnis, nur doppelt berechnet. StrictMode ruft das **ständig** auf, und es fällt nicht auf |
| Beleg in der Sandbox | `squareSum()` wurde unter StrictMode **2×** aufgerufen (4 nach einem Neurendern), das angezeigte Ergebnis war **immer 30** |

**Gegenprobe — was *wäre* ein Seiteneffekt?** Dieselbe Berechnung, **plus** etwas, das nach außen wirkt:

| Variante | Seiteneffekt? |
|---|---|
| `filterEvidence(...)` | nein |
| `filterEvidence(...)` **und** `console.log(result)` | ja (Konsole) |
| `filterEvidence(...)` **und** `searchCount++` (Modulvariable) | ja |
| `filterEvidence(...)` **mit** `Date.now()` oder `Math.random()` im Filter | **unrein** (das Ergebnis hängt von etwas anderem ab als den Eingaben) |
| `new Date(item.timestamp).getTime()` | **rein** (macht aus der **Eingabe** ein Datum, ohne etwas zu lesen oder zu verändern) |

**Wie das die Regel beeinflusst:**

1. Die Regel muss **"Berechnen"** vom **"Tun"** trennen: der Render darf **rechnen**, aber nicht **tun**. "Viel Arbeit" ist **kein** Merkmal eines Seiteneffekts.
2. Ein abgeleiteter Wert gehört **nicht** in einen Effekt mit `setState` (**"Wert in State spiegeln"**). Das wäre doppelter Zustand (UE5 Demo 4/9: duplizierter State) und ein **Extra-Render**
   (erst falsch, dann richtig). Berechnen im Render ist **richtiger und einfacher**.
3. Wenn die Berechnung **teuer** ist, hilft `useMemo` (ein Cache), **nicht** ein Effekt. `useMemo` ändert **nichts an der Einordnung**: die Berechnung bleibt rein.
4. Die Testfrage für die Regel: *"Wenn ich diese Zeile zweimal ausführe — ist das Ergebnis dasselbe und ist **draußen** nichts anders?"* Ja → **Render**. Nein → **Handler oder Effekt**.

---

## 6. Live-Demo-Skript (so präsentierst du es)

**Vorbereitung:** `npm run dev` läuft. Sandbox öffnen:
`http://localhost:5173/Mystery-Road-AWE-2026-lukesch/render-effect-demo.html`. Konsole (`F12`) offen lassen.

| # | Du machst | Du sagst | Erwartetes Ergebnis |
|---|---|---|---|
| 1 | Seite laden. Auf "Messen" klicken | "Links ist eine Komponente mit **fünf Seiteneffekten im Render**. Die Seite wurde **einmal** geladen." | `Render-Aufrufe = 2`, ID **2**, `console.log` **2**, `squareSum` **2** |
| 2 | Auf die Zahl **2** zeigen | "Einmal geladen, aber **zwei** Renders: das ist **StrictMode**. React ruft den Render in der Entwicklung absichtlich **zweimal** auf." | — |
| 3 | `main.tsx` zeigen (Kommentar zu StrictMode) | "Im echten Projekt ist es genauso eingeschaltet." | — |
| 4 | "Unabhängiges Neurendern" klicken, dann "Messen" | "Ich habe **nichts** getan, nur einen fremden Zähler erhöht. Trotzdem **ändern** sich Zähler **und die ID** der Instanz." | Zähler **4**, ID **4** |
| 5 | In der Mitte (richtige Komponente) zeigen | "Die **ID** ist bei jedem Neurendern **dieselbe** (`useId`). Der Effekt hat **2** Mal geschrieben (Laden), seitdem **nicht** mehr." | `_r_0_` bleibt, Schreibzugriffe bleiben |
| 6 | Neue Seite `…render-effect-demo.html?strict=0` laden, "Messen" | "**Ohne** StrictMode: **1** Render. Sieht richtig aus?" | Zähler **1**, ID **1** |
| 7 | Zweimal "Unabhängiges Neurendern" | "Jetzt zählt es 2, 3, und die **ID ändert sich trotzdem** (1, 2, 3). **Der Fehler ist auch ohne StrictMode da.** StrictMode macht ihn nur **sichtbar**." | ID **3** |
| 8 | "localStorage von außen ändern" klicken | "Links steht der **gelesene** Wert noch **alt**. Das ist unser echter Fund: das Dashboard hat den `localStorage` im Render gelesen." | `outside` unverändert |
| 9 | "Unabhängiges Neurendern" klicken | "Jetzt ist er aktuell, **zufällig**, weil gerendert wurde." | `outside` = "von außen (…)" |
| 10 | Rechts zeigen: `squareSum` = 30 | "Rechts ein **abgeleiteter Wert**. Er wurde auch **zweimal** berechnet (Zähler), das Ergebnis ist immer **30**. **Rechnen ist kein Seiteneffekt.**" | Messung zeigt `squareSum: 2` und `30` |
| 11 | Regel an die Tafel/Folie | "Im Render rechnet man, im Handler reagiert man, im Effekt gleicht man ab." | — |

**Optional im echten Projekt (30 Sekunden):** in `DashboardPage.tsx` als erste Zeile `console.log("[render] DashboardPage");` einfügen, speichern, zum Dashboard klicken →
**zwei** Meldungen pro Seitenaufruf. Zeile wieder entfernen.

---

## 7. Mögliche Nachfragen (mit Antworten)

| Frage | Antwort |
|---|---|
| **Warum ruft React im StrictMode den Render zweimal auf?** | Um Seiteneffekte im Render **sichtbar** zu machen, bevor sie in Produktion Schaden anrichten. Nur in der **Entwicklung**; im Build gibt es das nicht |
| **Ist das nicht Verschwendung?** | In der Entwicklung ja, bewusst. Die Kosten sind klein, der Gewinn ist, Fehler früh zu finden |
| **Und in Produktion? Rendert React dort nur einmal?** | Pro **Änderung** meist einmal, **aber garantiert** ist das nicht. Concurrent-Features können Renders verwerfen oder wiederholen. Wer auf "genau einmal" baut, baut auf Sand |
| **Ist `console.log` im Render wirklich schlimm?** | Für **temporäres Debugging** üblich und harmlos. Als **Dauerzustand** ist es ein Seiteneffekt (doppelt unter StrictMode). Wer es behalten will: in einen Effekt oder Event-Handler |
| **Ist `useState(() => localStorage.getItem(..))` auch ein Seiteneffekt im Render?** | Ein **Graubereich**: reines, **einmaliges** Lesen, idempotent, und der Wert gehört danach dem State. Toleriert. Schlecht wäre, ihn **bei jedem Render** neu zu lesen |
| **Wie unterscheidest du Effekt und Event-Handler?** | Handler: **weil der Nutzer etwas getan hat**. Effekt: **weil die Komponente angezeigt wird** und sich abgleichen muss. Test: *Gibt es einen konkreten Klick/Eingabe als Auslöser?* → Handler |
| **Warum nicht einfach alles in `useEffect`?** | Effekte laufen **nach** dem Zeichnen (zusätzlicher Render, kurze falsche Anzeige), und sie sind fehleranfällig (Abhängigkeitsliste, Aufräumen). Was man **berechnen** kann, gehört in den Render; was ein **Klick** auslöst, in den Handler |
| **Ist `Date.now()` im Render ein Problem?** | Ja: das Ergebnis hängt nicht von den Eingaben ab (unrein). Zeit kommt **in State** (per Handler/Effekt) oder wird **als Prop übergeben** |
| **Was ist eine "reine Funktion" nochmal?** | Gleiche Eingaben → gleiches Ergebnis, und **nichts außerhalb verändert**. `squareSum` ist rein, `badRenderCalls += 1` nicht |
| **Ist das Filtern der Evidence-Liste im Render wirklich kein Problem bei jedem Tastendruck?** | Es ist **rein** und für 18 Einträge **billig**. Wäre es teuer, würde man `useMemo` einsetzen (Cache), nicht einen Effekt |
| **Was hat das mit dem Dashboard-Fehler aus UE5 zu tun?** | Dort stand ein `localStorage`-Lesen im Render (unrein). Die Lösung (State nach oben, Context) hat es in **State + Handler** verlegt. Das war schon die Regel, nur noch ohne Namen |
| **Wo ist im Projekt jetzt noch etwas "im Render", das kein reines Rechnen ist?** | Nichts Auffälliges: Textsuche im Quellcode nach `console.`, `Math.random`, `Date.now`, `localStorage` zeigt nur Handler, Initialisierer und Hilfsfunktionen |

---

## 8. Wörterbuch (Deutsch ↔ Englisch)

| Deutsch | Englisch |
|---|---|
| Rendern | to render |
| Seiteneffekt | side effect |
| reine Funktion | pure function |
| Effekt | effect (`useEffect`) |
| Event-Handler | event handler |
| Abhängigkeitsliste | dependency array |
| abgeleiteter Wert | derived value |
| Initialisierer (träge) | (lazy) initializer |
| StrictMode | `StrictMode` |
| idempotent | idempotent (zweimal ausführen = einmal ausführen) |
| Aufräumfunktion | cleanup function |

---

## 9. Dateien dieser Demo

| Datei | Rolle |
|---|---|
| `render-effect-demo.html` | Sandbox-Seite (mit `?strict=0` ohne StrictMode) |
| `src/sandbox/render-effect-main.tsx` | Einhängen mit oder ohne `StrictMode` |
| `src/sandbox/RenderEffectDemo.tsx` | die Demo selbst: falsch / richtig / abgeleitet / Messung |
| `ue6/UE6_CHANGES.md` | Änderungsprotokoll (Demo 1) |
| `ue6/UE6_THEORIE_ANTWORTEN.md` | die Fragen F1 und F2 |
| `ue6/UE6_DEMO1_RENDER_VS_EFFECTS.md` | dieses Dokument |

**Nicht geändert:** der App-Code (`src/` außer der Sandbox). Demo 1 ist reines **Beobachten und Erklären**.
