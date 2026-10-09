# UE4 Theorie-Fragen & Antworten — Exercise 4

Laufende Sammlung, gleiches Schema wie [`../ue3/UE3_THEORIE_ANTWORTEN.md`](../ue3/UE3_THEORIE_ANTWORTEN.md).

---

## Demo 1 — JSX, Funktionskomponenten, typisierte Props, Komposition & `children`

Vier Komponenten für People & Locations gebaut (`Card`, `PersonCard`, `LocationCard`,
`BulletList`), alle mit explizit typisierten Props, `Card` nimmt `children`. Absichtlichen
Typfehler live ausgelöst. Details, Tabellen in `UE4_CHANGES.md`.

### F1: Zeig einen JSX-Ausdruck in deinem Code, der einen JavaScript-Wert oder -Ausdruck einbettet (nicht nur statisches Markup). Was darf und was darf nicht in `{...}` stehen?

**Einfach gesagt:** in `{ }` steht ein Stück **JavaScript, das einen Wert ergibt** — ein Name, ein
Funktionsaufruf, eine Rechnung. Alles, was nur eine **Anweisung** ist (ein `if`, eine
`for`-Schleife, ein `const`), geht nicht hinein.

**Beispiele aus unserem Code** (`src/components/PersonCard.tsx`):

| Ausdruck in `{ }` | Was es ist |
|---|---|
| `{person.name}` | ein einfacher Wert (Property-Zugriff) |
| `` alt={`Portrait of ${person.name}`} `` | ein Template-String als Attributwert |
| `{evidenceCount === 1 ? "" : "s"}` | ein **Ternary** — entscheidet zwischen "item" und "items" |
| `{people.map((person) => <PersonCard … />)}` (`PeoplePage.tsx`) | ein Funktionsaufruf, der ein **Array aus JSX** liefert |

**Was hineindarf:** jeder JavaScript-**Ausdruck** (alles, was einen Wert liefert): Variablen,
Property-Zugriffe, Funktionsaufrufe, Ternaries, `&&`, Template-Strings, `.map()`.

**Was nicht hineindarf:**
- **Anweisungen** (`if (…) { }`, `for (…)`, `const x = …`) — dafür gibt es Ersatz: Ternary/`&&`
  statt `if`, `.map()` statt `for`, die Variable **vor** dem `return` deklarieren.
- **Ein einfaches Objekt als Kind** (`{person}`) — React wirft `Objects are not valid as a React
  child`, weil es nicht weiß, wie es ein Objekt anzeigen soll. Strings, Zahlen, JSX-Elemente und
  Arrays davon sind erlaubt; `true`/`false`/`null`/`undefined` werden einfach **nicht** angezeigt.

### F2: Was würde TypeScript fangen, wenn du einer typisierten Komponente die falsche Datenform übergibst? Zeig einen echten Typfehler, den du absichtlich provoziert hast.

**Einfach gesagt:** der Compiler vergleicht, was du hineingibst, mit dem, was die Komponente
verlangt — und bricht ab, **bevor** die Seite je im Browser läuft.

**Echt ausgelöst:** `LocationCard` verlangt ein `Location`-**Objekt**. Ich habe stattdessen nur die
ID als String übergeben:

```tsx
const kaputt = <LocationCard location="L01" />;
```

`npm run typecheck` meldet:

```
src/pages/PeoplePage.tsx:39:32 - error TS2322: Type 'string' is not assignable to type 'Location'.

39   const kaputt = <LocationCard location="L01" />;
                                  ~~~~~~~~

  src/components/LocationCard.tsx:6:3 - The expected type comes from property 'location'
  which is declared here on type 'IntrinsicAttributes & LocationCardProps'
```

Die Meldung zeigt **beide Seiten**: die falsche Stelle (`PeoplePage.tsx:39`) **und** wo der erwartete
Typ herkommt (`LocationCard.tsx:6`). Dasselbe würde der Compiler fangen bei: einem **fehlenden**
Pflicht-Prop (`<PersonCard person={p} />` ohne `evidenceCount`), einem **falschen Typ**
(`evidenceCount="3"` statt `3`), einem **unbekannten** Prop (Tippfehler im Namen) oder einem
ungültigen Union-Wert (`<Card variant="team">` — nur `"person" | "location"` ist erlaubt).

**Ohne TypeScript** (reines JavaScript) wäre der Fehler erst zur **Laufzeit** aufgefallen: die
Komponente würde `"L01".name` lesen, bekäme `undefined` — und zeigt eine leere Karte, ohne dass
irgendjemand eine Fehlermeldung sieht.

### F3: Was ist der Unterschied, Daten als benanntes Prop zu übergeben statt als `children`? Warum hast du für deine Komponente `children` gewählt?

**Einfach gesagt:** ein **benanntes Prop** ist ein festes Feld im Formular (`person={…}`).
**`children`** ist der leere Raum **zwischen** den Tags — der Aufrufer kann dort **beliebiges JSX**
einsetzen.

| | Benanntes Prop | `children` |
|---|---|---|
| Syntax | `<LocationCard location={loc} />` | `<Card variant="person"> … </Card>` |
| Was die Komponente weiß | die **genaue Form** der Daten | **nichts** über den Inhalt |
| Wer bestimmt den Inhalt/Aufbau | die Komponente (sie baut das Markup selbst) | der **Aufrufer** |
| Typ | der konkrete Typ (`Location`, `number`, …) | `ReactNode` (alles Renderbare) |
| Passt, wenn … | die Komponente Daten **darstellt** | die Komponente nur eine **Hülle/Struktur** liefert |

**Warum `children` bei `Card`:** `PersonCard` und `LocationCard` teilen sich dieselbe **Hülle**
(Rahmen, Hintergrund, Schatten — im CSS stehen `.person-card` und `.location-card` schon immer
zusammen), aber der **Inhalt** ist völlig verschieden (Avatar + Statement vs. Überschrift +
Beschreibung). Mit einem benannten Daten-Prop hätte `Card` wissen müssen, wie Personen **und** Orte
aussehen — und für jede neue Karte angepasst werden müssen. Mit `children` ist `Card` ein
5-Zeilen-Rahmen, der **nie wieder angefasst** werden muss, egal was später darin steht.

### F4: Warum kollidiert direkte DOM-Manipulation (wie in der alten vanilla `app.js`, z. B. `innerHTML`, `classList.add/remove`, manuell gebaute Elemente) mit Reacts Rendering-Modell? Welche Annahme macht React darüber, wem das DOM "gehört", die direkte Manipulation bricht?

**Einfach gesagt:** React geht davon aus, dass **es allein** das DOM schreibt. Es führt im
Speicher Buch darüber, was es angelegt hat. Greift jemand anderes ein, stimmt das Buch nicht mehr
mit der Wirklichkeit überein.

**Die Annahme:** alles unterhalb von `#react-root` **gehört React**. React hat dort jeden
Knoten selbst erzeugt, merkt sich für jeden eine Referenz im virtuellen Baum (UE3 Demo 3) und
ändert beim nächsten Render genau die Knoten, die sich laut **seinem Buch** unterscheiden.

**Was kaputtgeht, wenn man trotzdem direkt eingreift:**
- **`container.innerHTML = …`** ersetzt alle Kinder durch **neue** Knoten. Reacts Referenzen
  zeigen danach auf Knoten, die nicht mehr im Dokument hängen — das nächste Update ändert
  unsichtbare, abgekoppelte Elemente, oder React wirft einen Fehler (`removeChild`: der Knoten ist
  gar kein Kind mehr).
- **`classList.add/remove`** verändert etwas, das React nicht kennt. Beim nächsten Render schreibt
  React die Klasse wieder so, wie **es** sie berechnet hat — deine Änderung verschwindet still
  (oder bleibt falsch stehen, wenn React die Stelle für "unverändert" hält und gar nicht anfasst).
- **Manuell eingefügte Elemente** kennt React nicht — es kann sie weder aktualisieren noch
  aufräumen.

**Konkret an unserer alten App:** `renderEvidenceList()` setzt `container.innerHTML = html` bei
**jedem** Klick und baut alles neu (UE3 Demo 3) — in React wäre genau das verboten, weil React
beim nächsten Update gegen einen DOM-Baum arbeiten würde, den es nicht mehr kennt.

**Der erlaubte Ausweg:** wenn man wirklich imperativ ans DOM muss (z. B. ein Eingabefeld
fokussieren), nutzt man dafür von React vorgesehene Wege (`ref`, `useEffect`) — und fasst nur
Knoten an, die React **nicht** selbst neu rendert.

---

## Demo 2 — Bedingtes Rendern

Timeline als Beispiel-View gebaut (`TimelinePage`, `TimelineEventItem`, `CertaintyBadge`) mit vier
Techniken: early return, ternary, `&&`, Lookup-Tabelle. Zwei geforderte Fälle: Leer-Zustand +
zustandsabhängiges Certainty-Badge. Live gegen die vanilla-Timeline verglichen (15 Events, gleiche
Reihenfolge/Badges/Orte). Details, Technik-Tabelle in `UE4_CHANGES.md`.

### F1: Zeig eine Stelle, an der du `bedingung && <Komponente />` statt eines Ternary benutzt hast. Was würde schiefgehen, wenn `bedingung` eine Zahl wie `0` statt eines Booleans wäre — und gilt dieses Risiko für deinen echten Code?

**Einfach gesagt:** `&&` ist ein "entweder zeigen oder gar nichts". Fällt die linke Seite auf die Zahl
`0`, zeigt React aber **nicht nichts**, sondern ein nacktes **"0"** auf dem Bildschirm.

**Die Stelle** (`src/components/TimelineEventItem.tsx`):

```tsx
{locationNames.length > 0 && (
  <p className="evidence-meta">Location: {locationNames.join(", ")}</p>
)}
```

**Warum `&&` hier und kein Ternary:** es gibt nur **einen** Fall, der etwas anzeigt. Ein Ternary
müsste für "keine Orte" einen Else-Zweig haben — und der wäre nur `null`
(`cond ? <p>…</p> : null`). `&&` spart genau diesen leeren Zweig.

**Was mit `0` schiefgeht — der Mechanismus:** JavaScripts `&&` gibt **den linken Wert zurück**, wenn
dieser "falsy" ist, nicht automatisch `false`:

| Ausdruck | Ergebnis | Was React zeigt |
|---|---|---|
| `false && <p/>` | `false` | **nichts** (React blendet `false`, `null`, `undefined` aus) |
| `0 && <p/>` | `0` | die Zahl **`0`** — Zahlen sind gültige Kinder und werden als Text gerendert |
| `"" && <p/>` | `""` | nichts (leerer String ist unsichtbar) |

Hätte ich `locationNames.length && (…)` geschrieben, würde ein Event mit leerer Orts-Liste statt
einer fehlenden Zeile eine **sichtbare "0"** zeigen.

**Gilt das für meinen echten Code?** Mit den **heutigen Daten nicht sichtbar:** ich habe
`timeline.json` geprüft, **kein** Event hat leere `locationIds`. Das Risiko ist aber **latent** —
sobald jemand ein Event ohne Ort einträgt, würde die Variante ohne Vergleich plötzlich eine "0"
zeigen. Deshalb steht dort ausdrücklich `> 0`: der Vergleich liefert immer einen **Boolean**
(`true`/`false`), nie eine Zahl. Faustregel: links von `&&` immer etwas, das **garantiert ein Boolean**
ist (`> 0`, `=== …`, `Boolean(x)`, `!!x`), nie eine nackte Zahl.

### F2: Warum könnte es besser sein, `null` aus einer Komponente zurückzugeben, statt eines leeren `<div>`? Hast du eines von beiden benutzt, und warum?

**Einfach gesagt:** `null` heißt "ich zeige **nichts**" — es entsteht **kein** Element im DOM. Ein
leeres `<div>` ist dagegen ein echtes Element: unsichtbar, aber **vorhanden**.

**Warum `null` oft besser ist:**
- **Layout:** ein leeres `<div>` ist im DOM — CSS kann darauf wirken: Abstände (`margin`, `padding`,
  `gap` in Flex/Grid) bleiben stehen und erzeugen eine sichtbare Lücke, obwohl "nichts" da ist.
  In unserem Raster (`.people-grid`, `.locations-grid`) würde ein leeres Element sogar eine
  **leere Zelle** belegen.
- **CSS-Selektoren:** `:empty`, `:first-child`, `:last-child` verhalten sich anders, wenn ein
  Platzhalter-Element dazwischen steckt.
- **Sauberkeit/Barrierefreiheit:** unnötige Knoten im DOM, die Screenreader-Struktur und
  DevTools-Baum verstopfen.

**Wann ein leeres Element doch richtig ist:** wenn die Stelle im Layout **stabil** bleiben soll
(z. B. ein reservierter Platz, damit nichts springt) oder wenn man später per `ref` ein Element
braucht, das schon da sein muss.

**Was ich benutzt habe:** **keinen** leeren `<div>` irgendwo. Das `&&`-Muster aus F1 liefert bei
"keine Orte" den Wert `false`, und React rendert `false` als **nichts** — im DOM entsteht kein
Element, das Ergebnis ist also dasselbe wie bei `null`. Ein ausdrückliches `return null` aus einer
Komponente war in Demo 2 noch nicht nötig (jede bisherige Komponente zeigt immer etwas). Wo es
auftaucht, wäre es die richtige Wahl — z. B. eine Komponente, die nur dann etwas zeigen soll, wenn
ein Wert vorhanden ist — und nicht `<div></div>`.
