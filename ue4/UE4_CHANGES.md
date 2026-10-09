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
