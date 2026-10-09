# UE4 CHANGES

Laufendes Änderungsprotokoll für Exercise 4 (React UI & Component Design).
Baut auf dem fertigen Stand von [`../ue3/UE3_CHANGES.md`](../ue3/UE3_CHANGES.md) auf (React-Shell +
Dashboard aus UE3 sind Voraussetzung). Migriert **People & Locations** und **Timeline** nach
React — Struktur statt Verhalten: kein `useState`, kein `innerHTML`, keine manuelle DOM-Erzeugung.
Evidence und Workspace folgen in UE5.

---

## Demo 1 — JSX, Funktionskomponenten, typisierte Props, Komposition & `children`

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Eine React-Komponente ist eine Funktion, die dir ein Stück Oberfläche zurückgibt. Zwei Dinge machen
sie wirklich brauchbar:

1. **Props** — die "Eingabe" der Funktion. Mit TypeScript sagen wir genau, **welche Form** diese
   Eingabe haben muss. Gibt jemand etwas Falsches rein, meckert der Compiler, bevor die App je läuft.
2. **`children`** — der Platz **zwischen** den Tags (`<Card>…hier…</Card>`). So baut man eine
   Hülle, die nicht wissen muss, was drinsteckt.

*Analogie:* Props sind wie die Felder eines Formulars (Name, Alter — feste Felder mit festem
Typ). `children` ist wie ein leerer Bilderrahmen: der Rahmen ist immer gleich, das Bild darin
bestimmt, wer ihn benutzt.

### Task 1 — mindestens 3 kleine Komponenten, alle mit typisierten Props

Gebaut für die People-&-Locations-View (ersetzt den UE3-Platzhalter `PeoplePage.tsx`):

| Komponente | Typisierte Props | Rolle |
|---|---|---|
| `PersonCard` (`src/components/PersonCard.tsx`) | `person: Person`, `evidenceCount: number` | eine Personen-Karte (Avatar, Rolle, Verantwortlichkeiten, Statement, Beweisstück-Zähler) |
| `LocationCard` (`src/components/LocationCard.tsx`) | `location: Location` | eine Orts-Karte (ID + Name, Beschreibung, "Contains"-Liste) |
| `BulletList` (`src/components/BulletList.tsx`) | `items: string[]` | reine Aufzählung — wird von **beiden** Karten benutzt (`responsibilities` bzw. `contains`) |
| `Card` (`src/components/Card.tsx`) | `variant: "person" \| "location"`, `children: ReactNode` | die gemeinsame Hülle (siehe Task 2) |

Alle Props-Typen sind explizite `interface`s, kein einziges `any`. `Person`/`Location` kommen per
`import type` aus `js/types.ts` (UE2, Demo 6) — dieselbe Datenform wie in der vanilla-App.

### Task 2 — eine Komponente mit `children`, an echter Stelle benutzt

**`Card`** ist die Hülle für beide Karten. Im CSS teilen sich `.person-card` und `.location-card`
schon immer dieselbe Optik (Rahmen, Hintergrund, Schatten) — der Inhalt ist aber komplett
verschieden. Deshalb bekommt `Card` keine Daten, sondern `children`:

```tsx
<Card variant="person">   {/* Hülle: immer gleich */}
  <div className="person-card-header">…</div>   {/* Inhalt: bestimmt PersonCard */}
  <BulletList items={person.responsibilities} />
</Card>
```

`variant` ist ein Union-Typ (`"person" | "location"`) — jeder andere String ist ein Compiler-Fehler.

### Was bewusst anders ist als in der vanilla-App

| Punkt | vanilla | React (Demo 1) | Warum |
|---|---|---|---|
| People/Locations-Tab | Tab-Umschalter mit `state.currentPeopleTab` | beide Listen **untereinander** | UE4 verbietet State. Der Tab kommt in Demo 8 als echte Route (`/team/people`, `/team/locations`) zurück |
| "view"-Button an jeder Person | filtert Evidence und navigiert dorthin | **fehlt**, nur der Zähler bleibt | braucht Interaktivität + die noch nicht migrierte Evidence-Seite (UE5) |
| Zähler-Logik | `countEvidenceForPerson()` liest den globalen `state` | `src/lib/evidence.ts` — **reine** Funktion, bekommt die Evidence-Liste als Parameter | die React-Seite importiert `js/state.ts` bewusst nicht (UE3 Demo 6 F3/Demo 10). Prüft weiterhin **id und Anzeigename** wegen der E04-Inkonsistenz (UE2 Demo 6) |

### Verifikation

- `npm run typecheck` → 0 Fehler. `npm run format:check` → sauber.
- Live im Browser (`/react.html#people`): 6 Personen-Karten, 6 Orts-Karten, alle 6 Avatare
  laden (`naturalWidth > 0`), Konsole leer.
- **Zähler gegen vanilla verglichen:** beide zeigen 3 / 4 / 5 / 4 / 4 / 5 (Signal Scholar, Kernel
  Colt, Nova Byte, Patch Vector, Refactor Rex, Root Harbor) — Verhaltens-Parität.
- **Nebenbefund (echter Bug in der vanilla-App):** ein Direktaufruf von `#people` zeigt dort bei
  **allen** Personen "0 related evidence items". Grund: `renderPeople()` läuft beim ersten Besuch,
  bevor `evidence.json` fertig geladen ist, und wird wegen des `viewRendered.people`-Flags nie
  erneut ausgeführt — derselbe Render-Cache-Bug wie beim Dashboard in UE3 Demo 10 F2. Die
  React-Version zeigt auch beim Direktaufruf die richtigen Zahlen.
- **Absichtlicher Typfehler** (Grundlage für Theorie-F2): `<LocationCard location="L01" />`
  eingefügt → `npm run typecheck`:
  ```
  src/pages/PeoplePage.tsx:39:32 - error TS2322: Type 'string' is not assignable to type 'Location'.
  ```
  Danach wieder auskommentiert (geparkt in `PeoplePage.tsx`, für die Live-Demo reaktivierbar).

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Die vier Komponenten zeigen**
`PersonCard.tsx` öffnen, auf `interface PersonCardProps` zeigen. Sag: "jede Komponente sagt
vorher genau, was sie bekommt — kein `any`."

**2. `children` zeigen**
`Card.tsx` (5 Zeilen) neben `PersonCard.tsx` und `LocationCard.tsx`. Sag: "die Hülle ist
dieselbe, der Inhalt kommt von außen."

**3. Den Typfehler live auslösen**
In `src/pages/PeoplePage.tsx` das `//` vor `const kaputt = <LocationCard … />` entfernen, dann:
```bash
npm run typecheck
```
Zeig die rote Meldung `Type 'string' is not assignable to type 'Location'`. Sag: "der Compiler
fängt das, bevor die Seite je geladen wird." Zeile wieder auskommentieren.

**4. Im Browser**
`/react.html#people` — sechs Personen, sechs Orte, Zähler sichtbar.

---

## Demo 2 — Bedingtes Rendern

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Oft soll die Oberfläche **je nach Situation** anders aussehen: eine Liste ist leer → Hinweistext
statt Liste; ein Event ist "widersprüchlich" → rotes Badge statt grünes. In React gibt es dafür
kein eigenes Spezial-Feature — man benutzt normales JavaScript **innerhalb** von JSX. Es gibt nur
mehrere Werkzeuge dafür, und jedes passt zu einer anderen Situation.

*Analogie:* wie eine Verkehrsampel-Steuerung mit mehreren Mitteln: ein **Schranken**
(`early return` — wenn gesperrt, kommt gar nichts weiter), eine **Weiche** (`ternary` — genau zwei
Gleise), ein **Zusatzlicht** (`&&` — entweder an oder gar nicht da), eine **Tabelle** (`lookup` —
nachschlagen, welche Farbe zu welchem Zustand gehört).

### Task — die Timeline als Beispiel-View (ersetzt den UE3-Platzhalter)

Neu gebaut: `TimelinePage`, `TimelineEventItem`, `CertaintyBadge`, dazu die reinen Helfer in
`src/lib/timeline.ts` (`resolveLocationNames`, `sortByTimeAscending`). Die View zeigt alle 15
Events, aufsteigend nach Zeit (wie der vanilla-Default), mit Ortsnamen und Certainty-Badge.

**Vier verschiedene Techniken, jede dort, wo sie passt:**

| Technik | Wo im Code | Fall | Warum diese und keine andere |
|---|---|---|---|
| **Early return** | `TimelinePage.tsx` (loading / error) | Seite ist noch nicht bereit | Zwei **Sonderfälle**, nach denen der Rest der Funktion gar nicht mehr gebraucht wird. Alles danach darf davon ausgehen, dass `data` da ist — ohne jedes Mal `data?.…` |
| **Ternary** (`? :`) | `TimelinePage.tsx` (Leer-Zustand) | `events.length === 0` → Hinweistext, sonst die Liste | **Genau zwei** Fälle, **beide** liefern etwas Anzuzeigendes. Ein ternary ist ein `if/else`, das einen Wert ergibt |
| **`&&`** | `TimelineEventItem.tsx` (Ortszeile) | Ortszeile nur zeigen, wenn es Orte gibt | Es gibt **nur einen** Fall (da / nicht da) — der Else-Zweig wäre `null`. `&&` spart das |
| **Lookup / Mapping** | `CertaintyBadge.tsx` | `confirmed → reviewed`, `reported → flagged`, `contradictory → critical` | **Drei** Zustände → eine Tabelle ist lesbarer als eine verschachtelte Ternary-Kette. Mit `Record<Certainty, string>` erzwingt der Compiler zusätzlich, dass **kein** Fall vergessen wird |

**Die zwei geforderten Fälle:**

1. **Leer-Zustand:** `TimelinePage`: `events.length === 0 ? <p>No timeline events match…</p> : events.map(…)`.
   Mit den heutigen Daten kommt er nie vor (immer 15 Events). Er wird in Demo 10 real, wenn ein
   `?person=…`-Filter eine Person ohne Events auswählen kann.
2. **Zustandsabhängiger Stil/Label:** das Certainty-Badge (`CertaintyBadge`) **und** die
   CSS-Klasse `certainty-${event.certainty}` am Event selbst — `.certainty-contradictory` färbt den
   Zeitstrahl-Punkt rot (`styles.css`).

**Bewusst noch nicht verdrahtet:** die "View E04"-Buttons sind sichtbar, tun aber noch nichts —
in vanilla öffnen sie ein Modal (braucht State, UE5). Das gleiche Prinzip wie bei den Filter-
Dropdowns: "visuell komplett, funktional erst später".

**Aliasing-Lehre aus UE1 angewendet:** `sortByTimeAscending` sortiert eine **Kopie**
(`[...events].sort(…)`), nicht das Original-Array — ein In-Place-Sort wäre genau der UE1-Demo-2-Bug.

### Verifikation

- `npm run typecheck` → 0 Fehler, `npm run format:check` → sauber.
- Live: `/react.html#timeline` zeigt 15 Events, Konsole leer.
- **Direkt gegen vanilla verglichen** (`/#timeline`): gleiche 15 Titel in gleicher Reihenfolge,
  identische Badge-Klassen (`badge-reviewed` ×12, `badge-flagged` ×2, `badge-critical` ×1), identische
  Ortsnamen pro Event.
- Das rote Event ist das einzige `contradictory` (Position 7, "The dashboard label defect is
  observed") — nur dort bekommt der Zeitstrahl-Punkt die rote Variante.
- Daten geprüft: **kein** Event hat leere `locationIds` (relevant für Theorie-F1: die `0`-Falle
  würde mit den heutigen Daten nicht sichtbar, ist aber latent da).

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Die vier Techniken an einem Bildschirm zeigen**
`TimelinePage.tsx` und `TimelineEventItem.tsx` nebeneinander. Auf die vier Stellen zeigen
(early return, ternary, `&&`, Lookup in `CertaintyBadge.tsx`) und je **einen Satz** sagen, warum
genau diese Technik.

**2. Das rote Event live zeigen**
`/react.html#timeline` öffnen, zum 7. Event scrollen: rotes Badge "contradictory", roter Punkt am
Zeitstrahl. "Alle anderen sind grün/gelb — das entscheidet die Tabelle in `CertaintyBadge`."

**3. Den Compiler-Schutz der Tabelle zeigen**
In `src/components/CertaintyBadge.tsx` eine Zeile aus `BADGE_VARIANT` löschen (z. B. `reported`),
```bash
npm run typecheck
```
→ Fehler: `Property 'reported' is missing in type …`. Sag: "wenn ein Zustand vergessen wird,
merkt es der Compiler — bei einer if-Kette würde es nie auffallen." Zeile wieder einfügen.

**4. Die `0`-Falle erklären** (Theorie-F1) — in `TimelineEventItem.tsx` auf
`locationNames.length > 0 &&` zeigen und das `> 0` erklären.

---

## Demo 3 — Collections rendern

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Fast jede Seite zeigt **Listen**: sechs Personen, sechs Orte, fünfzehn Events. In React schreibt man
dafür **nicht** jede Karte einzeln hin, sondern beschreibt **eine** Karte und lässt sie für jedes
Datenelement wiederholen — mit `.map()`. Dazu gehört immer ein `key`: ein "Namensschild" pro
Element, damit React beim nächsten Rendern erkennt, **welcher** Eintrag welcher ist.

*Analogie:* eine Klassenliste. Ohne Namen sagt man "der Dritte von links" — kommt jemand dazu oder
wechselt den Platz, ist "der Dritte" plötzlich jemand anderes. Mit Namensschild (`key`) bleibt jeder
eindeutig erkennbar, egal wo er sitzt.

### Task — die drei Listen als gemappte Collections mit `key`

Alle drei Listen sind gemappt (`.map()`) und haben einen eigenen, **stabilen** `key`:

| Liste | Datei | `key` | Warum dieser Schlüssel |
|---|---|---|---|
| Personen (6) | `src/pages/PeoplePage.tsx` | `person.id` (`"kernel-colt"`, …) | feste, einmalige ID aus der Datenquelle |
| Orte (6) | `src/pages/PeoplePage.tsx` | `location.id` (`"L01"`, …) | dito |
| Timeline-Events (15) | `src/pages/TimelinePage.tsx` | `event.id` | dito |

Die kleineren Listen **innerhalb** der Karten haben ebenfalls Keys (React warnt sonst):

| Liste | Datei | `key` |
|---|---|---|
| Verantwortlichkeiten / "Contains" | `BulletList.tsx` | der Text (`item`) — innerhalb **einer** Liste eindeutig |
| "View E04"-Buttons je Event | `TimelineEventItem.tsx` | `evidenceId` |
| Nav-Buttons, "How to use"-Einträge | `NavBar.tsx`, `IntroCard.tsx` | `viewName` |
| Letzte Beweisstücke/Events (Dashboard) | `RecentEvidenceList.tsx`, `RecentTimelineList.tsx` | `ev.id` / `evt.id` |

**Nicht jedes `.map()` braucht einen `key`:** `resolveLocationNames` (`src/lib/timeline.ts`)
mappt IDs zu **Strings**, nicht zu JSX — nur Listen aus **Elementen/Komponenten** brauchen Keys.

### Verifikation

- **Alle** `.map()`-Aufrufe in `src/` per Suche durchgegangen: jeder, der JSX liefert, hat einen
  `key`.
- **Eindeutigkeit in den echten Daten geprüft** (direkt aus `public/data/*.json`): keine doppelten
  IDs bei Personen, Orten, Timeline-Events, Evidence; keine doppelten Texte in einer
  `responsibilities`-/`contains`-Liste; keine doppelten `evidenceIds` pro Event. Heißt: jeder
  Schlüssel ist innerhalb seiner Liste einmalig.
- Beim Aufruf von `/react.html#people` und `#timeline` (Demo 1/2) kamen keine React-Warnungen in
  der Konsole.
- **Gegenprobe live gemacht:** in `PeoplePage.tsx` den `key={person.id}` testweise entfernt →
  die Seite rendert weiterhin alle 6 Karten (**optisch kein Unterschied**), aber die Konsole meldet
  (zweimal, wegen StrictMode):
  ```
  Each child in a list should have a unique "key" prop. See https://react.dev/link/warning-keys
  Check the render method of `PeoplePage`.
  ```
  Danach `key` wieder eingesetzt, Seite erneut geladen: keine neue Warnung. Wichtig fürs Verstehen:
  ein fehlender Key bricht **nichts sichtbar** — React warnt nur. Warum das trotzdem ein echtes
  Problem ist, zeigt Demo 4.
- Beobachtungs-Detail: React warnt nur beim **ersten** Rendern einer Liste. Wer die Warnung live
  vorführen will, lädt die Seite auf `#dashboard` und wechselt dann zu `#people` — bei einem
  Direktaufruf auf `#people` passiert der erste Render schon, bevor man in die Konsole schaut.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Eine Liste und ihren `key` zeigen**
`src/pages/PeoplePage.tsx`: `people.map((person) => <PersonCard key={person.id} … />)`. Sag: "eine
Karte beschrieben, sechsmal wiederholt — und jede trägt ihr Namensschild `person.id`."

**2. Die Warnung bei fehlendem `key` zeigen**
In `PeoplePage.tsx` `key={person.id}` kurz löschen und speichern. Dann `/react.html#dashboard`
öffnen, Konsole (`F12`) aufmachen, **danach** auf "People & Locations" klicken. Die Konsole zeigt:
`Each child in a list should have a unique "key" prop … Check the render method of PeoplePage.`
Die Seite selbst sieht dabei **normal** aus. Zeile wieder einfügen. Sag: "React sagt von sich aus,
dass ihm das Namensschild fehlt — sichtbar kaputt ist aber noch nichts."

**3. Den Kern erklären**
"Der `key` ist nicht für uns und nicht im HTML sichtbar — er ist für React: so erkennt es beim
nächsten Rendern, welcher Eintrag derselbe geblieben ist." (Theorie-F1; Demo 4 zeigt, was passiert,
wenn dieser Schlüssel falsch gewählt ist.)

---

## Demo 4 — Stabile Keys und Listen-Identität

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

In Demo 3 haben wir gesehen: **ohne** `key` sieht die Seite normal aus, React warnt nur. Heißt das,
Keys sind egal? **Nein.** Das Problem tritt erst auf, wenn sich eine Liste **verändert** (umsortiert,
gefiltert) **und** die Zeilen etwas "mit sich herumtragen" — zum Beispiel getippten Text.

*Analogie:* ein Klassenzimmer mit Sitzplätzen, auf jedem Platz liegt ein Notizzettel des Schülers.
- **`key={index}`** = React merkt sich nur die **Platznummer**. Tauschen zwei Schüler die Plätze,
  denkt React: "Platz 1 ist Platz 1" — die Zettel bleiben liegen, nur die **Namen** am Platz ändern
  sich. Der Zettel von Anna liegt jetzt bei Ben.
- **`key={person.id}`** = React merkt sich den **Namen**. Wechselt Anna den Platz, geht ihr Zettel mit.

### Task — Wegwerf-Beispiel mit `key={index}`, sichtbar falsch, dann ersetzt

Eine **Sandbox**, bewusst getrennt von der echten App:

| Datei | Rolle |
|---|---|
| `key-demo.html` (Root) | eigene Seite, im Dev-Server unter `/key-demo.html` erreichbar |
| `src/sandbox/main.tsx` | Mount-Code |
| `src/sandbox/KeyDemo.tsx` | die Demo selbst |

**Aufbau:** dieselbe Personenliste **zweimal nebeneinander** — links `key={index}` (falsch), rechts
`key={person.id}` (richtig). Jede Zeile hat ein Textfeld (eigener Komponenten-State, `PersonRow`).
Drei Knöpfe verändern die Liste: **Reihenfolge umdrehen**, **Erste Person entfernen**,
**Zurücksetzen**.

**Warum hier State erlaubt ist:** UE4 verbietet State in den **echten** Komponenten. Die Sandbox ist
ein Wegwerf-Beispiel, das nicht Teil der App ist (`vite.config.js` kennt sie nicht → sie wird nie
gebaut oder deployt). Ohne State könnte sich die Liste gar nicht ändern.

**Ergebnis, live gemessen** (Notiz `NOTIZ-A` in die **erste** Zeile, "Signal Scholar", getippt):

| Aktion | `key={index}` (links) | `key={person.id}` (rechts) |
|---|---|---|
| **Reihenfolge umdrehen** | `Patch Vector [NOTIZ-A]` ← **falsch**, die Notiz klebt am Platz | `Signal Scholar [NOTIZ-A]` (jetzt als letzte Zeile) ← richtig |
| **Erste Person entfernen** | `Kernel Colt [NOTIZ-A]` ← **falsch**, Kernel Colt erbt die Notiz einer anderen Person | `Kernel Colt []` ← richtig, die Notiz verschwindet mit Signal Scholar |

**Das Beängstigende daran:** auf der `key={index}`-Seite gab es **keine einzige Konsolenmeldung**.
Der Index ist ein gültiger, eindeutiger `key` — React hat nichts zu bemängeln. Der Fehler zeigt sich
nur dem Menschen, der tippt (Theorie-F2).

**Ersetzt durch stabile ID:** die rechte Spalte **ist** die Korrektur (`key={person.id}`). Die
echten Komponenten der App benutzen schon durchgehend IDs als Keys (Demo 3).

### Verifikation

- Beide Szenarien live im Browser durchgespielt (Skript mit echten `input`-Events, damit Reacts
  `onChange` wie beim Tippen feuert); Konsole blieb leer.
- Sandbox ist **nicht** in `rollupOptions.input` → taucht in `dist/` nicht auf. `tsc` prüft sie
  trotzdem mit (`src/**/*.tsx`), Prettier ebenfalls.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Sandbox öffnen:** `npm run dev`, dann `/key-demo.html`. Zwei Spalten erklären: links falsch,
rechts richtig.

**2. Den Fehler selbst auslösen**
- In **beide** ersten Zeilen ("Signal Scholar") etwas tippen, z. B. `Notiz A`.
- Auf **"Reihenfolge umdrehen"** klicken.
- Zeigen: links steht die Notiz jetzt bei **Patch Vector**, rechts bei **Signal Scholar**.
- Sag: "links hat React die Zeile **am Platz** wiedererkannt, nicht an der Person — der State klebt
  an der Position."

**3. Zweites Szenario:** "Zurücksetzen", Notiz in die erste Zeile, **"Erste Person entfernen"**.
Links erbt Kernel Colt die Notiz einer entfernten Person.

**4. Konsole zeigen (`F12`):** leer. Sag: "kein Fehler, keine Warnung — genau deshalb ist dieser
Bug so tückisch."

**5. Code zeigen:** in `KeyDemo.tsx` die zwei `.map()`-Aufrufe — der einzige Unterschied ist
`key={index}` vs. `key={person.id}`.

---

## Demo 5 — Presentational vs. Feature-Komponenten, Komponentengrenzen

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Nicht jede Komponente hat dieselbe Art von Aufgabe. Man kann sie grob in zwei Sorten teilen:

- **Presentational ("Schaufenster"):** bekommt Daten **hereingereicht** und zeigt sie an. Es weiß
  nicht, woher die Daten kommen.
- **Feature / Container ("Lager"):** **besorgt** die Daten (Netzwerk, Speicher, URL) und kümmert sich
  um Zustände wie "lädt noch" oder "Fehler" — und reicht dann alles an ein Schaufenster weiter.

*Analogie:* ein Restaurant. Der **Koch** (Feature) besorgt Zutaten und kümmert sich um die Küche.
Der **Kellner/die Speisekarte** (Presentational) präsentiert, was fertig ist. Wenn der Lieferant
wechselt, muss die Speisekarte nicht neu gedruckt werden.

### Task 1 — jede bisherige Komponente einordnen

**Feature / Container** (greifen auf die "Außenwelt" zu: Netzwerk, `localStorage`, URL):

| Komponente | Warum |
|---|---|
| `App` | ruft `useHashRoute()` auf → liest den URL-Hash und hält die aktuelle View |
| `DashboardPage` | `useCaseData()` (Netzwerk), `getBookmarkCount()` (`localStorage`), Lade-/Fehlerzustand |
| `PeoplePage` | `useCaseData()`, Lade-/Fehlerzustand, berechnet pro Person den Beweisstück-Zähler |
| `TimelinePage` | `useCaseData()`, Lade-/Fehlerzustand, sortiert Events, löst Ortsnamen auf |

**Presentational** (reine Funktion ihrer Props: gleiche Props → gleiche Ausgabe):

| Komponente | Anmerkung |
|---|---|
| `DashboardView` *(neu, siehe Task 2)* | zeigt ein Dashboard für fertige Daten |
| `Header`, `NavBar`, `Card`, `BulletList`, `StatCard`, `CaseSummaryCard`, `ReviewProgressBar`, `RecentEvidenceList`, `RecentTimelineList`, `PersonCard`, `LocationCard`, `CertaintyBadge`, `TimelineEventItem` | nur Props → Markup |
| `NavButton`, `IntroCard` | **Grenzfälle:** rein darstellend, lösen aber **beim Klick** `navigateTo()` aus (schreibt den URL-Hash). Das passiert nur im Event-Handler, nicht beim Rendern — die Ausgabe hängt nicht davon ab |
| `PageRouter` | reine Funktion von `view` (welche Seite?), liest selbst nichts |
| `EvidencePage`, `WorkspacePage` | Platzhalter ohne Daten |

*(Keine Komponenten, aber zur Einordnung: die Hooks `useCaseData` und `useHashRoute` sind die Stellen,
wo die Außenwelt in React hineinkommt — sie werden nur von Feature-Komponenten aufgerufen.)*

**Objektiv geprüft:** eine Suche über `src/` zeigt, dass `useCaseData()`, `useHashRoute()`,
`getBookmarkCount()`, `useState`/`useEffect` und `fetch()` **ausschließlich** in `App`, den drei
Seiten und den beiden Hooks vorkommen — in **keiner** der reinen Darstellungs-Komponenten. Einzige
Ausnahmen sind die zwei Klick-Handler (`NavButton`, `IntroCard`).

### Task 2 — eine Komponente aufgeteilt: `DashboardPage` → `DashboardPage` + `DashboardView`

**Was `DashboardPage` vorher gleichzeitig tat — drei Aufgaben:**

| # | Aufgabe | Art |
|---|---|---|
| 1 | Daten laden, Lade-/Fehlerzustand behandeln (`useCaseData`) | Außenwelt |
| 2 | `localStorage` lesen (Bookmark-Zähler) **mitten im Rendern** | Außenwelt |
| 3 | Statistiken ableiten (`reviewedCount`, `progressPct`) **und** das Layout aus 7 Unterkomponenten zusammensetzen | Darstellung |

**Nachher — zwei Komponenten mit einer klaren Grenze:**

| Komponente | Datei | Einzige Verantwortung | Props |
|---|---|---|---|
| `DashboardPage` (Feature) | `src/pages/DashboardPage.tsx` | "Woher kommen die Daten, sind sie schon da?" — lädt, behandelt Lade/Fehler, liest `localStorage` | keine |
| `DashboardView` (Presentational) | `src/components/DashboardView.tsx` | "Wie sieht ein Dashboard für diese Daten aus?" — leitet Statistiken ab, setzt das Layout zusammen | `data: CaseData`, `bookmarkCount: number` |

**Die Grenze ist das Props-Interface `DashboardViewProps`.** Alles Unreine (Netzwerk,
`localStorage`) liegt jetzt auf der einen Seite, alles Reine auf der anderen. Ein Nebeneffekt, der
aus der UE3-Lehre folgt (Render-Funktionen sollen rein sein): `DashboardView` liest nichts mehr
aus der Außenwelt, `localStorage` wird in `DashboardPage` **einmal** gelesen und als fertige Zahl
übergeben.

**Was NICHT aufgeteilt wurde (ehrlich):** `PeoplePage` und `TimelinePage` haben denselben
Geruch in kleinerer Form (Laden + Ableiten + Layout in einer Datei) und den **identischen
Lade-/Fehler-Block** wie das Dashboard (dreimal kopiert). Das Dashboard war der klarste Fall (7
Unterkomponenten, 5 abgeleitete Werte, `localStorage`) — die anderen beiden bleiben vorerst, die
Doppelung ist ein Kandidat für Demo 10 (Theorie-F3).

### Verifikation

- `npm run typecheck` → 0 Fehler, `npm run format:check` → sauber (beide nach dem Umbau ausgeführt).
- **Verhalten unverändert** (live): Dashboard zeigt exakt wie vor dem Umbau 18 / 6 / 6 / 0 / 1,
  6 % Fortschritt, 5 + 5 "Recent"-Einträge, 4 Einstiegs-Karten, Konsole leer.
- **Der neue Datenweg funktioniert:** `localStorage`-Key `remotion_bookmarks` testweise auf zwei
  Einträge gesetzt → das Dashboard zeigt "2 Bookmarked" (Container liest, View zeigt nur an). Danach
  den ursprünglichen Zustand wiederhergestellt.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Die Tabelle zeigen:** "Feature = besorgt Daten, Presentational = zeigt sie an."

**2. Vorher/Nachher an `DashboardPage`**
`git diff` bzw. beide Dateien öffnen: `DashboardPage.tsx` ist jetzt ~20 Zeilen (nur Laden +
Zustände), `DashboardView.tsx` enthält die ganze Darstellung. Sag: "vorher war beides in einer
Datei, jetzt hat jede Datei **eine** Frage."

**3. Die Grenze zeigen:** `DashboardViewProps` (`data`, `bookmarkCount`) — "das ist der einzige
Berührungspunkt der beiden."

**4. Den Nutzen zeigen (Theorie-F1):** in `DashboardPage.tsx` kurz `bookmarkCount={getBookmarkCount()}`
durch `bookmarkCount={99}` ersetzen → im Browser steht "99 Bookmarked", **ohne** dass
`DashboardView` angefasst wurde. Wieder zurücksetzen.

---

## Demo 6 — Feature-orientierte Ordnerstruktur

### 🔰 Einfach erklärt — worum geht's hier überhaupt?

Bisher lagen die Dateien **nach Art** sortiert: alle Komponenten in einem Ordner, alle Hooks in einem
anderen, alle Seiten in einem dritten. Das wirkt aufgeräumt, hat aber einen Haken: **will man
etwas an der Timeline ändern, muss man in vier Ordnern suchen.**

*Analogie:* eine Küche, in der alle Löffel in einer Schublade, alle Teller in einem Schrank und alle
Töpfe im Keller liegen (**nach Art**). Oder eine Küche mit einer Backstation, einer Kochstation und einer
Salatstation, an denen jeweils alles liegt, was man dort braucht (**nach Feature**). Für "ich backe jetzt"
reicht die eine Station.

### Task 1 — React-Quellcode nach Features umgebaut

**Vorher** (nach Art):

```
src/
  App.tsx  PageRouter.tsx  main.tsx
  components/   16 Dateien durcheinander (Header, PersonCard, StatCard, CertaintyBadge, ...)
  hooks/        useCaseData, useHashRoute
  lib/          bookmarks, evidence, navigation, timeline
  pages/        5 Seiten
```

**Nachher** (nach Feature):

```
src/
  main.tsx
  app/                      App, PageRouter, Header, NavBar, NavButton, useHashRoute
  features/
    dashboard/              DashboardPage, DashboardView, IntroCard, CaseSummaryCard, StatCard,
                            ReviewProgressBar, RecentEvidenceList, RecentTimelineList, bookmarks.ts
    people-locations/       PeoplePage, PersonCard, LocationCard, Card, BulletList, countEvidence.ts
    timeline/               TimelinePage, TimelineEventItem, CertaintyBadge, timelineHelpers.ts
    evidence/               EvidencePage (Platzhalter, UE5)
    workspace/              WorkspacePage (Platzhalter, UE5)
  shared/                   useCaseData.ts, navigation.ts
  sandbox/                  unverändert
```

Die vier alten Ordner (`components/`, `hooks/`, `lib/`, `pages/`) gibt es nicht mehr. **Alle** Dateien
wurden mit `git mv` verschoben, die Datei-Historie bleibt also erhalten. Ein Feature-Ordner enthält pro
Feature sowohl die Seite (Feature-Komponente) als auch ihre Darstellungs-Komponenten und Helfer — alles aus
Demo 5, aber jetzt räumlich zusammen.

**Eine echte Entscheidung unterwegs: `VIEWS`/`ViewName` und `navigateTo`.** Diese standen in
`useHashRoute.ts` (Shell) bzw. `lib/navigation.ts`. `IntroCard` (Dashboard) braucht beides, und `NavBar`/
`NavButton` (Shell) auch. Hätte ich sie in `app/` gelassen, hätte das Dashboard-Feature **von der Shell
abgehangen** — die falsche Richtung. Ergebnis: beides zog nach `shared/navigation.ts`, `useHashRoute.ts`
importiert sie jetzt von dort.

### Task 2 — Struktur und Regel dokumentiert

Neue Datei im Projekt-Root: **[`ARCHITECTURE.md`](../ARCHITECTURE.md)**. Sie enthält den Ordnerbaum, die
Regel für "shared vs. feature-lokal", die Abhängigkeitsrichtung und die Grenze zum Vanilla-Code. Die
Kurzfassung:

| Regel | Inhalt |
|---|---|
| **shared oder lokal?** | In `shared/` liegt eine Datei nur, wenn sie **heute** von mindestens **zwei verschiedenen Stellen** benutzt wird (zwei Features, oder Shell + Feature). Ein Nutzer → bleibt im Feature. Kommt ein zweiter dazu → zieht um |
| **Abhängigkeitsrichtung** | `app → features → shared`. `shared` importiert nie aus `features`/`app`; Features importieren nie voneinander und nie aus `app` |
| **Grenze zu `js/`** | nur `import type` und reine Funktionen, nie `js/state.ts` (wie schon in UE3) |

### Verifikation

- **Alte Pfade:** Textsuche nach Imports auf `hooks/`, `lib/`, `pages/`, `components/` → keine Treffer.
- **Abhängigkeitsrichtung mechanisch geprüft** (Textsuche über alle `import`-Zeilen):

  | Prüfung | Ergebnis |
  |---|---|
  | `shared/` importiert aus `features/` oder `app/` | keine Treffer |
  | ein Feature importiert aus `app/` | keine Treffer |
  | ein Feature importiert ein anderes Feature | keine Treffer |
  | `app/` importiert aus `features/` | nur `PageRouter.tsx` (5 Zeilen, die Seiten-Verdrahtung) |

- **Verhalten unverändert, live im Browser** (nach dem Umbau, frisch geladen):
  Dashboard 18 / 6 / 6 / 0 / 1 und 6 %; People 6 Personen + 6 Orte, Zähler 3 / 4 / 5 / 4 / 4 / 5; Timeline
  15 Events, 15 Badges, 1 kritisches; Evidence/Workspace-Platzhalter erreichbar; ungültiger Hash →
  Dashboard; aktiver Nav-Button korrekt.
- **Konsole:** zwischen "frisch laden" und "alle fünf Views durchklicken" **keine** Fehler. Die roten
  Meldungen, die davor im Konsolen-Puffer standen, stammen aus dem Umbau selbst: Vite versuchte währenddessen,
  die gerade verschobenen Dateien live nachzuladen (404/500 auf den alten Pfaden). Nach dem Neuladen sind sie
  weg.
- **Nach dem Umbau ausgeführt:** `npm run typecheck` → 0 Fehler. `npm run format:check` → sauber (inklusive
  der neuen `ARCHITECTURE.md`). `npm run build` → grün, 59 Module, erzeugt `dist/index.html` **und**
  `dist/react.html` (React-Bundle 230 KB, gzip 71 KB). `key-demo.html` taucht in `dist/` **nicht** auf —
  die Sandbox wird, wie gewollt, nie ausgeliefert.

**Bekannte Nebenwirkung:** die relativen Pfade zu `js/` werden tiefer (`../../../js/types`). Ein Pfad-Alias
wäre die saubere Lösung, ist aber eine eigene Konfigurations-Änderung (`tsconfig` + `vite.config.js`) und
nicht Teil dieser Demo. Die Doku zu UE3 und Demo 1 bis 5 nennt weiterhin die alten Pfade — sie beschreibt
den damaligen Stand.

### 🎤 Live-Demo — was du im Unterricht herzeigst

**1. Vorher/Nachher als Baum zeigen:** `ARCHITECTURE.md` öffnen oder den Ordnerbaum im Editor aufklappen.
Sag: "früher vier Ordner nach Art, jetzt ein Ordner pro View."

**2. Den Nutzen zeigen:** "Ich will etwas an der Timeline ändern" → **ein** Ordner `features/timeline/`
aufklappen: Seite, Event-Karte, Badge, Helfer, alles da.

**3. Die Regel erklären:** `shared/` aufklappen (2 Dateien) und fragen: "warum nur diese zwei?" →
`useCaseData` hat 3 Nutzer, `navigation` hat Shell + Dashboard. Dann `people-locations/Card.tsx` zeigen:
"sieht generisch aus, hat aber nur einen Nutzer — bleibt lokal."

**4. Die Abhängigkeitsrichtung zeigen (optional, live):** in `shared/navigation.ts` testweise
`import { App } from "../app/App";` einfügen — man sieht sofort, dass `shared` nach oben greift, was die
Regel verbietet (ein Zyklus `shared → app → … → shared`). Wieder entfernen.
