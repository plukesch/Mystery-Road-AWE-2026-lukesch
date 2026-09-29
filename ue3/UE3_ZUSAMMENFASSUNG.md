# UE3 Zusammenfassung — zum einfachen Lernen

Das ist die **einfache Version** von allem, was wir in UE3 gemacht haben — zum schnellen Lernen,
bevor du (falls nötig) in die ausführlichen Dateien schaust:
[`UE3_CHANGES.md`](UE3_CHANGES.md) (was genau geändert wurde) und
[`UE3_THEORIE_ANTWORTEN.md`](UE3_THEORIE_ANTWORTEN.md) (die vollständigen Antworten).

Jeder Demo-Abschnitt endet mit einem kurzen **🇬🇧 English recap**-Block, falls du auf Englisch
präsentieren musst.

**Der große Bogen von UE3, in einem Satz:** wir haben React ins Projekt geholt und die App-Shell +
das Dashboard damit neu gebaut, **parallel** zur alten, weiterhin funktionierenden Version — der
Rest der App wird erst in UE4/UE5 migriert.

---

## Demo 1 — Wie sich das Web entwickelt hat

**Einfach:** Es gab 5 grobe Phasen: (1) nur feste Seiten, (2) Server baut Seiten dynamisch, aber
immer noch mit vollem Neuladen, (3) AJAX — Teile der Seite können nachgeladen werden, ohne alles
neu zu laden, (4) SPA — die ganze Seite wird eine einzige, durchgehend laufende App, (5) moderne
Mischformen. Unsere App gehört zu Phase 4, und zwar zur **frühen** Variante (Hash in der URL,
kein Framework) — genau das, was Teams bauen mussten, **bevor** es React & Co. gab.

**Die Fragen, einfach:**
- AJAX hat gelöst: "muss ich für jede Kleinigkeit die ganze Seite neu laden?" — Antwort: nein mehr.
  Aber es hat ein neues Problem gebracht: der Bildschirm (DOM) und die Daten dahinter laufen leicht
  auseinander, weil man beides von Hand synchron halten muss. Genau das haben SPA-Frameworks später
  gelöst.
- Hash-Routing (`#dashboard`) gehört zur frühen SPA-Zeit (ca. 2010–2014) — damals war das der
  einzige Trick, um die URL zu ändern, ohne die Seite neu zu laden.

**🇬🇧 English recap:** The web evolved through static pages → server-generated pages → AJAX
(partial updates) → SPA frameworks → modern hybrids. Our app is an early, hand-built SPA using
hash-based routing (`#dashboard`) — the trick teams used before frameworks existed. AJAX solved
full-page reloads but introduced a new problem: DOM and data drifting out of sync, which SPA
frameworks later fixed.

---

## Demo 2 — SSR vs. CSR (Server rendert vs. Browser rendert)

**Einfach:** SSR = der Server schickt eine **fertige** Seite mit echtem Inhalt. CSR = der Server
schickt eine **fast leere** Seite, und JavaScript im Browser baut den Rest erst danach zusammen.
Wikipedia = SSR (bewiesen: der Inhalt steht schon im rohen HTML, bevor JS läuft). Unsere App = CSR
(die erste HTML-Antwort ist praktisch leer).

**Die Fragen, einfach:**
- Bei uns: Browser holt leere Seite → lädt JS → JS holt Daten per `fetch()` → **erst dann** sieht
  man das Dashboard. Genau deshalb gibt's den "Loading case file…"-Spinner.
- Ohne JavaScript sieht man von unserer App fast **nichts** — nur den Header und einen Spinner, der
  sich nie dreht fertig, weil nichts ihn je ausblendet.

**🇬🇧 English recap:** SSR sends a fully-rendered page; CSR sends an empty shell and lets
JavaScript build the content afterwards. Our app is CSR — proven by checking Wikipedia (SSR) vs.
our own app (empty initial HTML) directly in the browser's network tab. Without JavaScript, users
would see almost nothing — just the header and a spinner that never resolves.

---

## Demo 3 — Der virtuelle DOM

**Einfach:** der virtuelle DOM ist eine billige, reine JavaScript-Kopie davon, wie die Seite
aussehen soll. Ändert sich etwas, wird eine neue Kopie gebaut, mit der alten verglichen, und **nur**
die wirklich unterschiedlichen Stellen werden am echten Bildschirm geändert — statt alles neu zu
bauen. Gefundenes Beispiel im **alten** Code: ein Bookmark-Klick hat die **komplette** Beweisstück-
Liste (bis zu 18 Karten) neu gebaut, obwohl sich nur **ein** Stern-Symbol ändert.

**Die Fragen, einfach:**
- Mit virtuellem DOM würden nur die zwei winzigen Änderungen an der **einen** betroffenen Karte
  passieren, die anderen 17 blieben komplett unangetastet.
- Ist das automatisch "schneller"? Nein — es ist ein Tausch: billige Vergleichsarbeit (im Speicher)
  gegen teure echte Bildschirm-Arbeit. Lohnt sich, wenn vieles gleich bleibt.
- Macht React automatisch schnell? Nein! Schlechte Komponenten-Aufteilung, teure Berechnungen,
  fehlende Listen-`key`s können eine React-App trotzdem langsam machen.

**🇬🇧 English recap:** The virtual DOM is a cheap in-memory copy of the UI. React compares the new
copy to the old one and only updates what actually changed in the real DOM. We found a concrete
example in the old code: one bookmark click rebuilt the *entire* evidence list instead of just the
one changed star icon. Virtual DOM isn't automatically "faster" — it trades cheap comparison work
for avoiding expensive real-DOM work, and React apps can still be slow for other reasons.

---

## Demo 4 — SPA vs. MPA: Zustand & Navigation

**Einfach:** wir haben gezeichnet, wie Navigation bei uns funktioniert (Klick → Hash ändert sich →
kein Reload → nur ein Teil wird ausgetauscht) und aufgelistet, was einen Reload übersteht.
**Übersteht** einen Reload: Bookmarks, Notizen, gespeicherte Hypothese (alles in `localStorage`).
**Geht verloren:** offenes Beweisstück-Detail, aktive Filter, ungespeicherter Text.

**Die Fragen, einfach:**
- In einer klassischen Mehrseiten-App lebt der Zustand auf dem **Server**. Bei uns lebt er im
  **Arbeitsspeicher des Browsers** — schneller, aber viel fragiler (ein Reload löscht fast alles).
- Ein echter Router könnte: Links direkt auf ein bestimmtes Beweisstück (`/evidence/E14`), eine
  "nicht gefunden"-Seite, sauberere Browser-Historie.
- **Live getestet:** Zurück-Button-Test ergab einen echten, überraschenden Effekt — ein geöffnetes
  Beweisstück-Detail hat **keinen** eigenen Zurück-Schritt, weil das Öffnen die URL nie ändert. Ein
  Klick auf Zurück springt deshalb zu weit zurück (direkt zum Dashboard, nicht nur "Detail zu").

**🇬🇧 English recap:** We diagrammed how navigation works (no reload, just a hash change) and
listed what survives a page reload (localStorage: bookmarks, notes) vs. what's lost (open detail
view, filters). Traditional multi-page apps keep state on the server; our SPA keeps it in browser
memory — faster, but fragile. We live-tested the browser Back button and found a real quirk:
opening an evidence detail never changes the URL, so pressing Back skips right past it instead of
just closing the detail.

---

## Demo 5 — React kennenlernen

**Einfach:** eine winzige React-Komponente geschrieben (nur ein `<div>` mit festem Text). Der
große Unterschied zur alten `renderEvidenceCardHTML()`-Funktion: die alte Funktion gibt einen
**Text** zurück (der Browser muss ihn komplett neu lesen/parsen), eine React-Komponente gibt ein
**strukturiertes Objekt** zurück, das React direkt vergleichen kann.

**Die Fragen, einfach:**
- JSX ist kein Browser-Feature — ein Werkzeug übersetzt `<div>...</div>` in normale
  JavaScript-Funktionsaufrufe, **bevor** der Code je im Browser landet.
- String vs. Objekt: String → Browser muss alles neu bauen. Objekt → React vergleicht nur, was sich
  wirklich geändert hat.
- "Komponenten sind nur Funktionen" heißt: React ruft sie auf, **wann und wie oft es will** —
  manchmal sogar absichtlich doppelt (Strict Mode). Ein Seiteneffekt (z. B. eine globale Variable
  verändern) im Funktionskörper wäre deshalb gefährlich — er würde öfter passieren, als man denkt.

**🇬🇧 English recap:** We wrote a tiny static JSX component. Unlike the old
`renderEvidenceCardHTML()` function (which returns a plain HTML string the browser has to
re-parse), a React component returns a structured object React can compare directly. JSX is just
syntax that compiles to normal function calls — no browser understands it natively. Because React
may call a component function more than once, side effects inside the function body are risky.

---

## Demo 6 — React + TypeScript ins Projekt geholt

**Einfach:** React installiert und eine **zweite, komplett eigene Seite** (`react.html`) neben der
bestehenden `index.html` gebaut. Beide laufen gleichzeitig, völlig unabhängig voneinander — nichts
an der alten App wurde angefasst.

**Die Fragen, einfach:**
- Installiert: `react`/`react-dom` (die Bibliothek selbst), `@vitejs/plugin-react` (übersetzt JSX),
  `@types/react` (Typen für TypeScript).
- Weg zum Bildschirm: `react.html` lädt `main.tsx` → `main.tsx` übergibt `<App />` an React →
  React baut daraus echte DOM-Elemente und hängt sie ein.
- Entscheidung: zwei getrennte Seiten statt einem Umschalt-Knopf auf einer Seite — sicherer, kein
  Risiko, dass sich alte und neue App gegenseitig stören.

**🇬🇧 English recap:** We installed React + TypeScript support (`react`, `react-dom`,
`@vitejs/plugin-react`, `@types/react`) and built a second, fully separate page (`react.html`)
next to the existing vanilla app. Both run side by side with zero interference — a deliberate
choice over a single page with a runtime toggle, to avoid the two apps colliding.

---

## Demo 7 — Bauplan für die ganze App (Komponenten-Hierarchie)

**Einfach:** ein Diagramm für die **komplette** App gezeichnet — nicht nur fürs Dashboard, das wir
diese Übung bauen, sondern auch für die Seiten, die erst in UE4/UE5 drankommen. Plus
wiederverwendbare Bausteine wie `Badge`, `BookmarkButton`.

**Die Fragen, einfach:**
- Eine eigene Komponente lohnt sich, wenn: sie mehrfach gebraucht wird, sie ein Listen-Element ist,
  oder sie einen klar eigenen Zweck hat.
- Beispiel `Badge`: kommt an 3 Stellen vor. Die alte App hatte die **Logik** (welche Farbe/Klasse)
  schon geteilt, aber das **HTML** wurde trotzdem 3x einzeln hingeschrieben. React kann beides
  zusammen in einer Komponente bündeln.
- Warum jetzt schon die ganze App planen? Weil ein Diagramm nichts kostet, aber ein späterer Umbau
  von schon geschriebenem Code sehr wohl.

**🇬🇧 English recap:** We designed a component hierarchy diagram for the *entire* app, not just
the Dashboard we're building now — pages plus reusable pieces like `Badge` and `BookmarkButton`.
Planning early is cheap (just a diagram); reworking already-built code later is expensive. The
`Badge` example shows the old app already shared the *logic* for badge colors but still repeated
the actual HTML markup three times — React can bundle both together in one component.

---

## Demo 8 — Architecture Decision Record: Warum React/SPA?

**Einfach:** ein eigenes Dokument geschrieben, das **ehrlich** Vor- **und** Nachteile auflistet, ob
React/SPA für diese App die richtige Wahl ist.

- **Warum SPA:** die App lebt vom ständigen, schnellen Hin- und Herspringen zwischen Beweisstücken/
  Personen/Timeline — genau das kann SPA am besten.
- **Warum React:** löst ein Problem, das in dieser App **wirklich mehrfach** aufgetreten ist (DOM
  und Daten laufen bei Handarbeit leicht auseinander, siehe Demo 3).
- **Der größte, ehrlich benannte Nachteil:** das React-Bundle allein wiegt **219 KB** — mehr als das
  **Zehnfache** der gesamten alten App (20 KB)!

**Die Fragen, einfach:**
- Verlust bei Server-Rendering statt SPA: die App würde sich bei jedem Klick langsamer anfühlen.
  Verlust bei React statt einer leichteren Lösung: vor allem das Bundle-Gewicht.
- Bei schwachen Geräten/schlechter Verbindung als **Pflicht**: nein, dann NICHT bei reiner
  Client-SPA bleiben — dann bräuchte es Server-Rendering (SSR), was aktuell bewusst nicht Teil
  dieser Übung ist.

**🇬🇧 English recap:** We wrote an honest Architecture Decision Record weighing React/SPA for
this specific app — including real downsides, not just benefits. SPA fits because the app's core
workflow is constant jumping between views; React fixes a bug pattern we genuinely saw multiple
times. Biggest honest cost: React's bundle alone (219 KB) is over 10× heavier than the entire old
vanilla app (20 KB). Under a hard low-end-device requirement, we'd switch to SSR instead of
staying with a pure client-side SPA.

---

## Demo 9 — Die App-Shell (Header, Navigation) migrieren

**Einfach:** Header, Navigationsleiste und ein einfaches Routing-Grundgerüst in React gebaut. Die 5
Buttons wechseln zwischen 5 (meistens noch leeren) Seiten — live durchgeklickt, funktioniert.

**Die Fragen, einfach:**
- Gleiche Grundidee wie vorher (Hash lesen, auf Änderung hören, unbekannten Wert abfangen) — aber
  React aktualisiert **automatisch** alles, was den Wert benutzt. Kein manuelles "ruf jetzt diese
  Funktion auf"-Aufrufen mehr nötig, und kein manuelles Klassen-Umschalten für den aktiven Button.
- Bei einem ungültigen Hash: fällt genau wie vorher auf Dashboard zurück — bewusst gleich gelassen,
  weil das Ziel "dieselbe App, nur mit React gebaut" ist, keine heimliche Verhaltensänderung.

**🇬🇧 English recap:** Built the header, nav bar and a minimal routing skeleton in React — 5
buttons switch between 5 (mostly still empty) pages, tested live and working. Same core idea as
before (read the hash, listen for changes, fall back on unknown values), but React automatically
re-renders everything that depends on it — no manual render calls, no manual class-toggling
needed. Unknown routes still fall back to Dashboard, deliberately kept identical to the old
behavior.

---

## Demo 10 — Das Dashboard migrieren (der große Abschluss)

**Einfach:** das Dashboard mit **echten** Daten in React nachgebaut — Fallzusammenfassung,
Stat-Karten, Review-Fortschritt, letzte Beweisstücke/Timeline-Events. Live geprüft: **exakt**
dieselben Zahlen wie die alte App (18 Beweisstücke, 6 Personen, 6 Orte, 0 Bookmarks, 1 reviewed,
6 % Fortschritt). Auch getestet: weg navigieren und zurückkommen — alles bleibt korrekt.

**Die Fragen, einfach:**
- Die Daten kommen aus einem eigenen React-"Hook" (lädt dieselben JSON-Dateien nochmal, komplett
  unabhängig von der alten App). Bewusst noch ein **Platzhalter** — sobald mehr Seiten echte Daten
  brauchen (UE4/UE5), muss das anders (geteilt) gelöst werden.
- Die alte App hatte einen Bug: sie zeigte manchmal veraltete Zahlen, weil sie sich "schon gerendert"
  gemerkt hat. Bei React **geht das strukturell nicht** — die Dashboard-Seite wird bei jedem Besuch
  komplett neu aufgebaut, es gibt nichts, was sich "ich hab schon mal gerendert" merken könnte.
- Zeitpunkt der Berechnung: kaum ein Unterschied — beide rechnen bei jedem Aufruf neu. Der
  eigentliche Unterschied ist, dass React das **zuverlässig automatisch** bei jedem Besuch macht,
  während die alte App dafür extra gefixt werden musste.

**🇬🇧 English recap:** Rebuilt the Dashboard with real data in React — case summary, stat cards,
review progress, recent evidence/timeline. Verified live: exact same numbers as the vanilla app,
and navigating away and back doesn't break or lose anything. Data comes from a dedicated React
hook (still a placeholder — not shared with other pages yet). The old app's "stale dashboard"
bug can't happen the same way in React, because the Dashboard page is fully remounted on every
visit instead of relying on a manually-maintained "already rendered" flag.
