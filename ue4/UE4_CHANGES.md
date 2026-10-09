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
