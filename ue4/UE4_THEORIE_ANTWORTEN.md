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

---

## Demo 3 — Collections rendern

Personen, Orte und Timeline-Events als gemappte Collections mit stabilen `key`s (jeweils die ID aus
den Daten) gerendert; alle `.map()`-Aufrufe in `src/` durchgesehen, Eindeutigkeit der Schlüssel in
den echten JSON-Daten geprüft. Details, Tabellen in `UE4_CHANGES.md`.

### F1: Wofür benutzt React den `key` intern eigentlich?

**Einfach gesagt:** der `key` ist ein **Namensschild** pro Listenelement. React benutzt ihn, um
beim nächsten Rendern zu erkennen: "dieser Eintrag ist **derselbe** wie vorhin" — und damit sein
bestehendes Element **wiederzuverwenden**, statt es wegzuwerfen und neu zu bauen.

**Der Mechanismus (Abgleich, "Reconciliation"):** nach jedem Render vergleicht React die neue
Beschreibung mit der vorigen (virtueller DOM, UE3 Demo 3). Bei einer Liste muss es dafür jedes
**neue** Kind einem **alten** zuordnen. Das geht über den `key`:

| Situation beim Vergleich | Was React tut |
|---|---|
| gleicher `key` **und** gleicher Typ wie vorher | derselbe Eintrag → **bestehendes** DOM-Element/Komponente **wiederverwenden**, nur geänderte Props/Inhalte aktualisieren |
| `key` ist **neu** | neuer Eintrag → Element **erzeugen** und einfügen |
| alter `key` kommt **nicht mehr** vor | Eintrag entfernt → Element **entfernen** (und Komponente aufräumen) |
| gleiche Keys in **anderer Reihenfolge** | Einträge sind nur umsortiert → vorhandene Elemente **verschieben** statt neu zu schreiben |

**Warum das wichtig ist:** "wiederverwenden" heißt, dass alles, was an dem Element hängt, **erhalten
bleibt** — der State der Komponente, der Fokus, getippter Text in einem Eingabefeld, die
Scroll-Position, ein laufendes Bild-Laden. Wird ein Element stattdessen verworfen und neu
gebaut, geht all das verloren (und die Arbeit des Browsers ist größer). Im Bookmark-Beispiel aus
UE3 Demo 3 sorgt genau das dafür, dass nur **eine** Karte angefasst wird, nicht alle 18.

**Regeln, die sich daraus ergeben:**
- **Eindeutig unter Geschwistern** (innerhalb *einer* Liste) — nicht global. Zwei verschiedene
  Listen dürfen dieselben Keys benutzen.
- **Stabil** — derselbe Eintrag muss bei jedem Render denselben `key` haben. Deshalb **keine**
  `Math.random()`-Keys (jeder Render = alle Einträge neu) und mit Vorsicht der Array-Index (Demo 4).
- **Der `key` ist kein normales Prop.** Die Komponente kann ihn **nicht** lesen (`props.key` ist
  `undefined`) — er ist ausschließlich für React selbst da. Braucht eine Komponente die ID,
  übergibt man sie zusätzlich als eigenes Prop (z. B. `evidenceId`).
- **Ohne `key`** warnt React in der Konsole und fällt auf den Array-Index als Zuordnung zurück —
  was bei Listen, die sich ändern, falsch sein kann (genau das Thema von Demo 4).

**Nebenbefund:** ändert man den `key` eines Elements, behandelt React es als **ein anderes Element**
— altes wird entfernt, neues frisch gebaut. Das nutzt man gelegentlich absichtlich, um den
State einer Komponente zurückzusetzen.

---

## Demo 4 — Stabile Keys und Listen-Identität

Wegwerf-Sandbox (`key-demo.html`, `src/sandbox/KeyDemo.tsx`) mit derselben Liste zweimal: links
`key={index}`, rechts `key={person.id}`. Live gemessen: Notiz klebt bei Umsortieren/Entfernen an der
**Position** statt an der Person — ohne jede Konsolenmeldung. Details, Messtabelle in
`UE4_CHANGES.md`.

### F1: Was geht konkret schief, wenn Keys fehlen, doppelt sind oder auf dem Array-Index basieren — bei einer Liste, die sich umsortieren oder filtern kann?

**Einfach gesagt:** React ordnet alte und neue Einträge über den `key` zu. Stimmt diese Zuordnung
nicht, bekommt ein Eintrag den **Zustand eines anderen** — und React merkt es nicht, weil für React
alles "in Ordnung" aussieht.

| Fall | Was React tut | Konkrete Folge |
|---|---|---|
| **Key fehlt** | warnt in der Konsole (`Each child in a list should have a unique "key" prop`) und **fällt auf den Index zurück** | dasselbe wie unten — nur zusätzlich mit Warnung |
| **Key = Array-Index** | ordnet nach **Position** zu: "Platz 1 bleibt Platz 1" | State, Fokus, getippter Text hängen an der **Position**, nicht am Inhalt. Live gemessen: nach "Reihenfolge umdrehen" steht die Notiz von Signal Scholar bei Patch Vector; nach "Erste Person entfernen" erbt Kernel Colt die Notiz der entfernten Person |
| **Key doppelt** | React warnt; die Zuordnung ist nicht mehr eindeutig | laut React-Doku können Kinder **doppelt oder gar nicht** erscheinen — was bei einem Update passiert, ist nicht vorhersagbar |
| **Key zufällig** (`Math.random()`) | jeder Render erzeugt neue Keys → alles wirkt "neu" | alle Zeilen werden bei jedem Render **zerstört und neu gebaut**: State, Fokus, Scroll weg, Eingaben verlieren den Cursor |

**Was konkret verloren/vertauscht werden kann**, wenn die Zuordnung falsch ist:
- **State** der Komponente (`useState`) — wie die Notiz im Experiment,
- **DOM-Zustand** (Text in unkontrollierten Eingabefeldern, Checkbox-Haken, Fokus, Auswahl),
- **Animationen/Übergänge** (laufen am falschen Element oder starten neu),
- **Effekte** (`useEffect` läuft für die "falsche" Identität weiter).

**Und Leistung:** fügt man bei Index-Keys vorne ein Element ein, verschiebt sich **jeder** Index —
React aktualisiert alle Zeilen statt nur eine neue einzufügen.

**Wann Index-Keys harmlos sind** — Antwort auf F3. Das Experiment zeigt nur, dass sie gefährlich
werden, wenn **beides** zutrifft: die Liste ändert sich **und** die Zeilen tragen etwas mit sich.

### F2: Die *originale* vanilla-Version hatte einen echten Bug, bei dem ein Feature einen Array-Index als Kennung statt einer stabilen ID benutzte. Hätte derselbe Fehler, direkt als `key={index}` nach React portiert, ein Symptom verursacht, das ein:e Nutzer:in bemerkt, oder nur eine Konsolenwarnung? Erkläre, warum.

**Einfach gesagt:** **weder noch.** Es gäbe **keine** Konsolenwarnung (Index-Keys sind gültig und eindeutig)
**und** für diese konkrete Stelle auch **kein sichtbares Symptom** — weil die Zeilen dort keinen State
tragen. Der Fehler wäre **latent**: er schlägt erst zu, wenn die Zeile später etwas "mit sich herumträgt".

**Die echte Stelle** (`app.js`, Zeile 909; heute `js/views/workspace.ts`):
```js
noteEntries.push({ index: i, evidenceId: allEvidence[i].id, … });   // i = Position in allEvidence
…
html += '<div id="noteText-' + entry.index + '">' + entry.text + '</div>';
```
Die DOM-ID einer Notiz wird aus der **Array-Position** gebildet, nicht aus der Evidence-ID. Gäbe es
ein `<NoteRow key={entry.index} … />`, wäre das die direkte Portierung.

**Warum das (hier) kein sichtbares Symptom hätte:**
1. **Die Zeilen sind zustandslos.** Eine Notiz-Zeile zeigt nur ID, Titel und Text — alles kommt
   aus den Props. Wird eine Komponenten-Instanz an einer neuen Position **wiederverwendet**, bekommt
   sie einfach die neuen Props und zeigt das Richtige. Es gibt nichts, was an der alten Position
   "kleben" könnte. Im Experiment kam der Fehler erst durch das **Textfeld mit eigenem State**.
2. **Der Index ist eine Position in der Master-Liste**, nicht in der angezeigten. Das macht ihn
   praktisch stabil, solange `allEvidence` nicht umsortiert wird — jede Evidence behält ihre Nummer,
   auch wenn Notizen hinzukommen oder wegfallen. Nur beim Umsortieren der Master-Liste (genau der
   Aliasing-Bug aus UE1 Demo 2) würden sich die Keys verschieben — und selbst dann zeigen
   zustandslose Zeilen nach dem Update dieselben Daten, nur mit unnötig viel Aufwand.
3. **Keine Konsolenwarnung:** React meldet nur **fehlende oder doppelte** Keys. Jede Position kommt
   nur einmal vor — Index-Keys sind eindeutig, also still.

**Der Fehler wäre also nur eine "Zeitbombe":** sobald die Notiz-Zeile bearbeitbar wird (Textfeld,
"aufgeklappt"-Zustand, Löschen-Bestätigung), tritt **genau das Verhalten aus dem Experiment** auf. Das
macht diesen Bugtyp gefährlich: er besteht jeden Test, bis jemand ein harmloses Feature ergänzt.

**Zur ID in der vanilla-App selbst:** `noteText-<index>` wird nirgends per `getElementById` gesucht
(Suche im Code: nur die Erzeugung). Das Symptom wäre dort also ebenfalls nicht spürbar — es bleibt
ein Fehler im Entwurf (Identität aus der Position), nicht im Verhalten.

### F3: Alle echten Daten dieser App (Personen, Orte, Timeline-Events) haben bereits stabile IDs. Gibt es trotzdem je einen legitimen Grund, `key={index}` zu benutzen? Wann?

**Einfach gesagt:** **ja, aber nur, wenn die Liste "tot" ist:** sie ändert sich nie in der Reihenfolge,
nichts wird in der Mitte eingefügt oder entfernt, und die Zeilen tragen keinen eigenen Zustand.

Der Index ist dann kein Fehler, sondern die **ehrlichste** Identität, die es gibt. Die Bedingungen
müssen **alle** erfüllt sein:

| Bedingung | Warum nötig |
|---|---|
| Die Liste wird **nie umsortiert, gefiltert oder in der Mitte verändert** | sonst verschiebt sich die Zuordnung (Experiment) |
| Die Zeilen sind **zustandslos** (kein `useState`, keine Eingaben, kein Fokus) | sonst klebt der State an der Position |
| Es gibt **keine stabile ID** (oder sie wäre nicht eindeutig) | sonst nimmt man die ID |

**Typische legitime Fälle:**
- **Platzhalter beim Laden** (Skeletons): `Array.from({ length: 3 }, (_, i) => <Skeleton key={i} />)` —
  drei gleiche graue Balken, jeder ohne Identität.
- **Feste Text-Zeilen/Aufzählungen**, die aus dem Code oder einer unveränderlichen Quelle kommen.
- **Wirklich doppelte Werte:** zwei identische Strings in einer Liste dürfen nicht beide
  derselbe `key` sein — der Index ist hier der sichere Ausweg.

**Beispiel aus unserem Code:** `BulletList` (Verantwortlichkeiten / "Contains") benutzt
`key={item}` (den Text). Das ist ok, **weil** ich geprüft habe, dass kein Text in einer Liste doppelt
vorkommt (Demo 3). Kämen jemals zwei gleiche Aufzählungspunkte vor, wäre `key={index}` dort die
**richtige** Wahl — die Liste ist statisch und zustandslos, beide Bedingungen von oben erfüllt.

**Nie legitim:** `key={Math.random()}` — er ist nicht stabil und zerstört bei jedem Render alle
Zeilen (siehe F1).

---

## Demo 5 — Presentational vs. Feature-Komponenten, Komponentengrenzen

Alle Komponenten als Feature/Container oder Presentational eingeordnet (Tabelle in
`UE4_CHANGES.md`), `DashboardPage` in `DashboardPage` (Feature) + `DashboardView` (Presentational)
aufgeteilt. Verhalten live gegengeprüft (unverändert). Details dort.

### F1: Für die aufgeteilte Komponente: was war die einzige Verantwortung jeder Hälfte? Würde eine Änderung an einem Implementierungsdetail der einen Hälfte die andere betreffen? Warum (nicht)?

**Einfach gesagt:** `DashboardPage` kümmert sich nur ums **Besorgen** der Daten, `DashboardView` nur ums
**Anzeigen**. Wechselt man eine Hälfte aus, merkt die andere nichts davon — solange der
"Übergabe-Zettel" (die Props) gleich bleibt.

| Hälfte | Einzige Verantwortung |
|---|---|
| `DashboardPage` (Feature) | "Woher kommen die Daten, und sind sie schon da?" — Daten laden, Lade-/Fehlerzustand, `localStorage` lesen |
| `DashboardView` (Presentational) | "Wie sieht ein Dashboard für diese Daten aus?" — Statistiken ableiten, Layout zusammensetzen |

**Wirkt sich eine Änderung auf die andere Hälfte aus?** **Nein** — solange der Vertrag
(`DashboardViewProps`: `data: CaseData`, `bookmarkCount: number`) derselbe bleibt:

| Änderung | Betrifft | Betrifft **nicht** |
|---|---|---|
| Daten kommen künftig aus einem Context, einer Bibliothek oder einer anderen API statt aus `useCaseData()` | nur `DashboardPage` (sie muss am Ende weiter `CaseData` liefern) | `DashboardView` — sie weiß gar nicht, dass es je `fetch` gab |
| Bookmarks kommen aus React-State statt `localStorage` (UE5) | nur `DashboardPage` (eine Zeile) | `DashboardView` bekommt weiterhin einfach eine Zahl |
| Layout ändert sich (Karten umsortiert, neues Panel) | nur `DashboardView` | `DashboardPage` — sie reicht dieselben Daten durch |
| Der **Vertrag** ändert sich (z. B. `bookmarkCount` wird zu `bookmarks: string[]`) | **beide** — aber TypeScript meldet beide Stellen als Fehler, es bleibt nichts unbemerkt | — |

**Warum die Trennung so wirkt:** die Grenze verläuft entlang der Frage "greift der Code auf die
Außenwelt zu?". Alles, was sich ändern kann, weil sich **die Welt** ändert (Datenquelle, Speicherort),
steckt auf einer Seite; alles, was sich ändert, weil sich **das Design** ändert, auf der anderen.
Dazu kommt: `DashboardView` ist eine **reine Funktion** ihrer Props und lässt sich mit handgebauten
Daten rendern — ohne Server, ohne `localStorage` (testbar, in einer Sandbox ausprobierbar).

**Ehrliche Einschränkung:** die Hälften sind nicht völlig unabhängig, sondern über den Vertrag
verbunden. Eine Aufteilung entfernt keine Abhängigkeit, sie macht sie **explizit und klein** (zwei
Props statt "alles hängt an allem").

### F2: Nenne eine konkrete Regel, mit der du entschieden hast: "das gehört in eine Presentational-Komponente" oder "das gehört in eine Feature-Komponente".

**Einfach gesagt:** *"Greift der Code auf die Außenwelt zu — Netzwerk, Speicher, URL — oder macht er
nur aus Props Markup?"* Außenwelt → Feature. Nur Props → Presentational.

**Die Regel als Test:** *Könnte ich diese Komponente auf einer leeren Testseite mit handgebauten
Props anzeigen — ohne Netzwerk, ohne `localStorage`, ohne URL?*

| Antwort | Einordnung | Beispiel |
|---|---|---|
| **Ja** — braucht nur Props | Presentational | `PersonCard` (bekommt `person` + `evidenceCount`), `DashboardView` |
| **Nein** — muss etwas von draußen holen oder lesen | Feature | `DashboardPage` (`fetch`, `localStorage`), `App` (liest den URL-Hash) |

**Wie die Regel im Code sichtbar ist:** die Außenwelt kommt in React **über Hooks und Seiteneffekte**
herein (`useState`/`useEffect`, `fetch`, `localStorage`, `window.location`). Faustregel daraus: **taucht
einer dieser Zugriffe in einer Komponente auf, ist sie eine Feature-Komponente.** Bei uns kommt das
ausschließlich in `App`, den drei Seiten und den Hooks vor.

**Grenzfälle, und wie ich sie entscheide:** `NavButton` und `IntroCard` schreiben beim **Klick** den
URL-Hash (`navigateTo`). Ich ordne sie als Presentational ein, weil der Zugriff nur im Event-Handler
passiert und die **Ausgabe** nur von Props abhängt. Wenn man es strenger will, kann man stattdessen einen
`onSelect`-Prop übergeben, und der Aufrufer entscheidet, was beim Klick passiert — dann wäre die
Darstellung vollständig rein. Das ist eine Abwägung zwischen Strenge und Aufwand, bei dieser Größe
reicht die lockere Variante.

---

## Demo 6 — Feature-orientierte Ordnerstruktur

Alle React-Dateien von "nach Art" (`components/`, `hooks/`, `lib/`, `pages/`) auf "nach Feature"
(`app/`, `features/<name>/`, `shared/`) umgebaut, per `git mv`. Struktur und Regel stehen in
`ARCHITECTURE.md` (Projekt-Root). Verhalten live gegengeprüft, Abhängigkeitsrichtung mechanisch geprüft.
Details in `UE4_CHANGES.md`.

### F1: Was ist der Unterschied, Dateien "nach Typ" zu ordnen (alle Komponenten in einen Ordner, alle Hooks in einen anderen) oder "nach Feature"? Warum hast du für diese App die gewählte Struktur gewählt?

**Einfach gesagt:** nach **Typ** sortiert man nach "was für eine Datei ist das?", nach **Feature** nach "wozu
gehört sie?". Dateien, die man **gemeinsam ändert**, sollten nahe beieinander liegen — und das sind
fast immer Dateien desselben Features, nicht desselben Typs.

| | Nach Typ | Nach Feature |
|---|---|---|
| Ordner heißen | `components/`, `hooks/`, `pages/`, `lib/` | `timeline/`, `dashboard/`, `people-locations/` |
| "Ich ändere die Timeline" | Dateien in **vier** Ordnern suchen | **ein** Ordner |
| Ordnergröße | wächst mit der App (bei uns schon 16 Dateien in `components/`) | wächst nur, wenn **das Feature** wächst |
| Ein Feature löschen/verschieben | über viele Ordner verstreut | ein Ordner |
| Gut, wenn | die App klein ist, es kaum Zusammengehöriges gibt | die App aus klar getrennten Bereichen besteht |
| Risiko | nach einiger Zeit ein "Müllordner" (`components/`) | Duplikate, wenn zwei Features dasselbe brauchen — dafür gibt es `shared/` |

**Warum Feature-Struktur für diese App:** sie besteht aus **fünf klar getrennten Views**, und die
Aufgabenstellung migriert sie **View für View** (UE3 Dashboard, UE4 People + Timeline, UE5 Evidence +
Workspace). Genau das ist die Einheit, in der ich arbeite und committe. Konkret hat die Struktur schon
vorher einen Vorteil gezeigt: `components/` enthielt eine Mischung aus Shell (`Header`), Dashboard
(`StatCard`), People (`PersonCard`) und Timeline (`CertaintyBadge`) — ohne dass man dem Ordnernamen ansah,
was wozu gehört. Dazu passt: **jedes Feature hat eine `*Page.tsx` (Feature-Komponente) und seine
Darstellungs-Komponenten** (Demo 5) — beides liegt jetzt am selben Ort.

**Ehrlich dazu:** nach Typ zu ordnen ist nicht "falsch". Bei 4 oder 5 Dateien ist es sogar bequemer. Die
Feature-Struktur lohnt sich ab dem Punkt, an dem man beim Ändern **mehrere Ordner gleichzeitig offen haben
muss** — der war bei uns erreicht.

### F2: Wo hast du die Grenze zwischen einer Komponente gezogen, die in einem Feature-Ordner lebt, und einer, die in einen shared/common-Ordner gehört? Gib je ein echtes Beispiel aus deiner Struktur.

**Einfach gesagt:** *"Wird die Datei heute von mindestens zwei verschiedenen Stellen benutzt?"* Wenn ja:
`shared/`. Wenn nein: bleibt sie im Feature, auch wenn sie allgemein **aussieht**.

**Die Regel:** eine Datei liegt in `shared/` nur, wenn sie **heute** von **zwei verschiedenen Stellen**
benutzt wird — zwei Features, oder die Shell und ein Feature. Ein Nutzer → lokal. Kommt später ein zweiter
Nutzer, zieht sie um. (Man baut nicht auf Vorrat "für später mal".)

| Beispiel | Wo | Warum |
|---|---|---|
| `useCaseData.ts` | **`shared/`** | wird von **drei** Features benutzt (Dashboard, People, Timeline) |
| `navigation.ts` (`VIEWS`, `ViewName`, `navigateTo`) | **`shared/`** | wird von der **Shell** (`NavBar`, `NavButton`, `PageRouter`) **und** vom **Dashboard** (`IntroCard`) benutzt |
| `Card.tsx`, `BulletList.tsx` | **`features/people-locations/`** | klingen generisch, haben aber **nur Nutzer in diesem einen Feature** (`PersonCard`, `LocationCard`) |
| `CertaintyBadge.tsx` | **`features/timeline/`** | heute genau ein Nutzer |

**Der lehrreichste Fall war `navigation`:** `VIEWS`/`ViewName` standen vorher in `useHashRoute.ts`, also in
der **Shell**. Das Dashboard (`IntroCard`) brauchte sie aber auch. Hätte ich sie dort gelassen, hätte ein
Feature von der Shell abgehangen — während die Shell (`PageRouter`) die Features importiert. Das wäre ein
**Zyklus auf Ordner-Ebene** gewesen (`app → features → app`; kein Datei-Zyklus, aber genau die Art
Verflechtung, bei der man keinen der beiden Ordner mehr für sich ändern oder entfernen kann). Die Regel
"Features hängen nie von `app/` ab" hat den Fehler sichtbar gemacht, **bevor** er einer wurde. Lösung: das
Gemeinsame in `shared/` ziehen.

**Warum die Regel "heute zwei Nutzer" und nicht "könnte generisch sein":** zu früh nach `shared/`
zu schieben hat einen versteckten Preis. Eine `shared/`-Komponente muss für **alle** Nutzer passen — ihre
Props werden mit der Zeit zu einem Sammelbecken aus Sonderfällen (`variant`, `showIcon`, `compact`, …).
Wartet man auf den **echten** zweiten Nutzer, kennt man dessen Anforderungen und kann die Schnittstelle
danach formen. Das passiert in Demo 7: dort kommt `Badge` nach `shared/`, weil es dann wirklich an mehreren
Stellen in verschiedenen Features gebraucht wird (Dashboard-Status, Timeline-Certainty).

**Die Richtung der Abhängigkeiten gehört zur selben Regel:** `app → features → shared`. `shared` darf
nichts aus `features` oder `app` kennen, und Features kennen sich nicht untereinander — sonst wäre
`shared` nicht mehr "unten", und man könnte ein Feature nicht mehr entfernen, ohne ein anderes zu
beschädigen. Das habe ich nicht nur behauptet, sondern mit einer Textsuche über alle `import`-Zeilen geprüft
(keine Verstöße; einzige `app → features`-Imports: die fünf Zeilen in `PageRouter.tsx`).

---

## Demo 7 — Wiederverwendbare UI-Bausteine

`Badge` (`src/shared/Badge.tsx`) als wiederverwendbare Komponente extrahiert, benutzt an drei Stellen in zwei
Features (Timeline: Certainty; Dashboard: Review-Status und Case-Status), dazu zwei dünne Fach-Wrapper
(`CertaintyBadge`, `StatusBadge`). Verhalten per DOM-Vergleich live bestätigt, Typschutz mit einem echten
Compiler-Fehler belegt. Details in `UE4_CHANGES.md`.

### F1: Zeig die zwei (oder mehr) Stellen, an denen deine wiederverwendbare Komponente benutzt wird. Was variiert zwischen ihnen über Props, und was bleibt fest in der Komponente? Wie hast du entschieden, wo diese Grenze verläuft?

**Einfach gesagt:** `Badge` kennt genau **zwei Einstellungen**: wie er aussieht (`variant`) und was drinsteht
(`children`). Alles andere ist fest. Was ein Badge **bedeutet**, weiß er nicht — das wissen die Features.

**Die Stellen:**

| Stelle | Feature | Aufruf | `variant` kommt von |
|---|---|---|---|
| Certainty eines Events | Timeline | `<Badge variant={variant}>{certainty}</Badge>` (in `CertaintyBadge`) | Lookup-Tabelle `confirmed → reviewed`, `reported → flagged`, `contradictory → critical` |
| Review-Status in "Recent evidence" | Dashboard | `<Badge variant={statusVariant(status)}>{status}</Badge>` (in `StatusBadge`) | Funktion `reviewed/flagged/sonst unreviewed` |
| Case-Status ("OPEN") | Dashboard | `<Badge variant="flagged">{…toUpperCase()}</Badge>` | **fest** `"flagged"` (wie in vanilla — der Case-Status färbt sich nicht nach seinem Wert) |

**Was variiert (Props):** nur `variant` und `children`.

| Prop | Warum einstellbar |
|---|---|
| `variant: BadgeVariant` | die **eine** Dimension, in der sich die drei Stellen wirklich unterscheiden. Ein geschlossener Union aus genau den 5 Klassen, die `styles.css` kennt — ein Tippfehler ist ein Compiler-Fehler (`Did you mean '"flagged"'?`), kein stiller Fehlschlag |
| `children: ReactNode` | der Inhalt ist an jeder Stelle anderer Text ("confirmed", "unreviewed", "OPEN") |

**Was fest ist:** das `<span>`, die Basis-Klasse `badge`, das Namensschema `badge-<variante>`. Alle drei
Stellen brauchen das **identisch** — es gibt nichts, wozu man es einstellen müsste.

**Wo die Grenze verläuft — und was ich bewusst NICHT als Prop angeboten habe:**

| Möglicher Prop | Warum nicht |
|---|---|
| `uppercase` / `capitalize` | nur **eine** Stelle braucht Großbuchstaben (`CaseSummaryCard`). Der Aufrufer macht `.toUpperCase()` selbst — eine Zeile, die die Komponente nicht kennen muss |
| `status`, `certainty` | Fach-Begriffe. Hätte `Badge` ein `status`-Prop, müsste er wissen, was "reviewed" **bedeutet**, und bei jedem neuen Fachbegriff (`relevance`, …) wachsen. Das mappen die **Wrapper** in den Features |
| `className` zum Durchreichen | damit könnte jede Stelle das Varianten-Vokabular umgehen (`className="badge-lila"`). Dann gäbe es genau wieder die Streuung, die der Baustein beenden soll |
| `onClick`, `icon`, `size` | wird heute von **keiner** der drei Stellen gebraucht. Was niemand braucht, kommt nicht hinein |

**Die Regel dahinter:** *`Badge` weiß, wie ein Badge **aussieht**; er darf nicht wissen, was ein Badge in
irgendeinem Feature **bedeutet**.* Deshalb gibt es die dünnen Wrapper (`CertaintyBadge`, `StatusBadge`): sie
übersetzen einen Fachbegriff in eine Variante. Ein neues Feature braucht dann **nur** einen neuen
Wrapper, `Badge` bleibt unberührt.

**Wie ich es gemerkt habe, wenn die Grenze falsch gewesen wäre:** ein Prop, der nur für **eine** Stelle
existiert (`uppercase`) oder der Fachwissen enthält (`status`), ist das Warnsignal für einen
"Sonderfall-Haufen". Hätte ich ihn aufgenommen, bekäme jede Stelle künftig Props, die sie nicht
braucht.

### F2: Die originale vanilla-App hatte doppelten HTML-Template-Code (dasselbe Karten-Markup zweimal, leicht unterschiedlich, in zwei Funktionen). Vergleiche das direkt mit dem, was du gerade gebaut hast. Was bietet eine wiederverwendbare Komponente, was kopierte Template-Strings nicht boten?

**Einfach gesagt:** in der vanilla-App war nur die **Entscheidung** ("welche Farbe?") geteilt, das **Aussehen** wurde
jedes Mal neu von Hand hingeschrieben. Eine Komponente teilt beides, und der Compiler prüft die
Benutzung.

**Der Befund in der vanilla-App** (Suche in `js/`):

| Was | Anzahl |
|---|---|
| handgeschriebene `<span class="badge …">`-String-Stellen | **6**, in 3 Dateien (`evidence.ts` ×3, `dashboard.ts` ×2, `timeline.ts` ×1) |
| Klassennamen-Helfer in `utils.ts` | 2 (`getStatusBadgeClass`, `getRelevanceBadgeClass`) |
| zusätzliche, **eigene** Mapping-Funktion nur für Timeline | 1 (`certaintyBadgeClass`) mit eigenem Fallback |

Die vanilla-App hat die **Entscheidung** also schon halb geteilt (zwei Helfer in `utils.ts`), aber das
**Markup** nirgends: jede der 6 Stellen setzt `'<span class="badge ' + … + '">' … '</span>'` selbst
zusammen, und für Certainty gibt es einen dritten, separaten Helfer.

**Was die Komponente zusätzlich bietet:**

| | Kopierte Template-Strings (vanilla) | Komponente (jetzt) |
|---|---|---|
| **Wo steht das Aussehen?** | an 6 Stellen | an **einer** (`Badge.tsx:26`, per Textsuche belegt) |
| **Aussehen ändern** (z. B. ein Icon) | 6 Stellen finden und anpassen | 1 Edit, wirkt sofort auf alle Verwendungen in beiden Features |
| **Tippfehler in der Variante** | `'badge badge-' + "flaged"` → stiller, ungestylter Badge, niemand merkt es | Compiler-Fehler mit Korrekturvorschlag (`Did you mean '"flagged"'?`) — echt ausgelöst |
| **Eingabe-Absicherung** | `ev.status` wird **roh** in den HTML-String gesetzt (`innerHTML`) — enthielte der Wert `<` oder `&`, würde er als HTML interpretiert | `{children}` wird von React als **Text** gesetzt und automatisch maskiert |
| **Schnittstelle** | keine: eine Funktion `(status) => "badge-…"`, deren Rückgabewert man nur als String weiterverwendet | typisierte Props (`variant`, `children`), der Editor zeigt die erlaubten Werte |
| **Einbetten** | nur per String-Verkettung | als Element in beliebigem JSX (`<strong>…</strong> <StatusBadge … />`) |

**Eine ehrliche Einschränkung:** die Duplizierung des Markups hätte man in der vanilla-App **auch ohne React**
beheben können, mit einer Hilfsfunktion `badgeHTML(variant, text)`. Das Problem war also nicht "Strings statt
Komponenten", sondern dass **niemand diese Funktion geschrieben hat**. Was eine React-Komponente über eine
solche Funktion hinaus liefert, sind die Zeilen aus der Tabelle: **geprüfte Props** (der Variant-Typ), das
**automatische Maskieren** von Inhalten und das **Einbetten** ohne String-Bau. Das ist ein reeller, aber
kein magischer Vorteil.

---

## Demo 8 — Routing: People & Locations als echte Routen

React Router 8.4.0 mit `HashRouter` eingebaut, den handgebauten `useHashRoute`/`NavButton` ersetzt, den
People/Locations-Tab von lokalem Zustand in zwei echte Routen (`/team/people`, `/team/locations`) mit
gemeinsamem Layout verwandelt. Live gegen die vanilla-App verglichen. Details in `UE4_CHANGES.md`.

### F1: Warum ist es für die Nutzer:in wichtig, den People/Locations-Tab zu einer echten Route zu machen, statt ihn als internen Komponenten-Zustand zu lassen? Nenne eine konkrete Fähigkeit, die sie gewinnt.

**Einfach gesagt:** was in der **Adresse** steht, kann man **speichern, verschicken und mit "Zurück" erreichen**.
Was nur im **Zustand** steckt, kann man nichts davon — nach einem Reload ist es zurückgesetzt.

**Die konkreten Fähigkeiten**, jede live in beiden Versionen verglichen:

| Fähigkeit | Tab als Zustand (vanilla) | Tab als Route (React) |
|---|---|---|
| **Lesezeichen / Link verschicken** | die Adresse bleibt `#people` — ein Link kann nur "People", nie "Locations" | `react.html#/team/locations` direkt aufgerufen → Locations-Tab aktiv, 6 Orte (getestet) |
| **"Zurück" / "Vorwärts"** | der Tab-Wechsel ist **nicht** in der Browser-Historie. Getestet: Tab auf Locations, "Zurück" → **verlässt die ganze People-View** (landet auf `#dashboard`) | jeder Tab ist ein History-Eintrag. Getestet: Locations → "Zurück" → People → "Vorwärts" → Locations |
| **Reload** | ist der Tab nur Zustand, fällt er nach `F5` auf den Standard ("People") zurück | die Adresse bleibt, der Tab bleibt |
| **"In neuem Tab öffnen"** | ein `<button>` hat keine Adresse | die Tab-Leiste besteht aus echten Links (`<a href="#/team/locations">`) |

**Die wichtigste Fähigkeit davon: ein Lesezeichen/Link, der auf genau diesen Tab zeigt.** Wer einer Kollegin
"schau dir die Orte an" schicken will, schickt eine Adresse — nicht "geh auf People und klick dann den
zweiten Tab".

**Das ist dasselbe Muster wie UE3 Demo 4 F3** — dort fiel uns auf, dass ein geöffnetes Beweisstück-Detail
"unsichtbar" für die History war. Der Tab war die gleiche Lücke in kleinerer Form; jetzt ist sie
geschlossen. (Das Beweisstück-Detail bleibt es bis zur Migration der Evidence-Seite in UE5.)

**Der Preis (ehrlich):** mehr Struktur für etwas, das vorher eine Variable war — Layout-Route, `Outlet`,
Context, zwei Dateien mehr. Und `HashRouter`-URLs sind weniger hübsch als echte Pfade (siehe Wahl in
`UE4_CHANGES.md`). Der Gewinn lohnt sich genau dann, wenn eine Ansicht **für sich adressierbar** sein soll —
bei einer Ansicht, die nie jemand verlinken oder per "Zurück" erreichen will, wäre ein lokaler Zustand
gerechtfertigt.

### F2: Was macht dein Router, wenn die URL zu keiner definierten Route passt? Vergleiche das damit, wie `handleHashChange()` der vanilla-App auf das Dashboard zurückfiel.

**Einfach gesagt:** in beiden Fällen sieht die Nutzer:in am Ende das **Dashboard**. Der Unterschied: React
Router **korrigiert zusätzlich die Adresszeile** und kennt die Möglichkeit, stattdessen eine
"Seite nicht gefunden" zu zeigen.

**Was mein Router tut:** am Ende der Routen-Tabelle steht ein Catch-all-Eintrag:

```tsx
<Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
```

`*` passt auf jede Adresse, die vorher nichts getroffen hat. `<Navigate replace>` leitet auf `/` um und
**ersetzt** dabei den ungültigen Eintrag in der Historie.

**Live getestet:**

| Eingabe | Ergebnis |
|---|---|
| `#/nonsense` | Adresse wird zu `#/`, Dashboard sichtbar |
| `#/team/foo` (unbekanntes Kind einer bekannten Route) | Adresse wird zu `#/`, Dashboard sichtbar |
| `#/team` (bekannte Route ohne eigenen Inhalt) | wird zu `#/team/people` (eigener Index-Redirect) |

**Der Vergleich mit `handleHashChange()` (vanilla):**

| | vanilla `handleHashChange()` | React Router (`*`-Route) |
|---|---|---|
| Was die Nutzer:in sieht | Dashboard | Dashboard |
| Wie es entschieden wird | `if (validViews.indexOf(hash) === -1) hash = "dashboard"` — **von Hand**, gegen eine selbst gepflegte Liste | der Router sucht den **besten Treffer** in der Routen-Tabelle; `*` ist der letzte Auffangeintrag |
| **Adresszeile danach** | bleibt **ungültig** (`#nonsense` steht weiter oben) | wird **korrigiert** (`#/`) |
| Verschachtelte/Parameter-URLs | nicht vorgesehen (nur 5 feste Wörter) | `/team/foo` wird als "unbekannt" erkannt, `/team/people` als gültig |

**Warum ich den Fallback aufs Dashboard beibehalten habe** (statt einer "404-Seite"): wie in UE3 Demo 9 ist das
Ziel der Migration **Verhaltens-Parität**. Ein Router ermöglicht aber beides, und die Wahl ist bewusst:

| Option | Verhalten | Wann sinnvoll |
|---|---|---|
| **Kein** Catch-all | der Router rendert **nichts**: live getestet (Catch-all testweise entfernt) hat `<main>` **0 Kinder**, die Adresse bleibt `#/nonsense`, und die Konsole warnt (zweimal wegen StrictMode) `No routes matched location "/nonsense"` | nie — man sieht einen leeren Bildschirm |
| `*` → `<Navigate replace>` aufs Dashboard *(gewählt)* | Dashboard, korrigierte Adresse | wenn kein Fehler gemeldet werden soll — wie vanilla |
| `*` → eigene `NotFoundPage` | "Diese Seite gibt es nicht" mit Link zurück | wenn Nutzer:innen wissen sollen, dass die Adresse falsch war (z. B. bei verschickten Links) |

**Ein ehrlicher Nachteil der gewählten Variante:** wer sich im Link vertippt, merkt es nicht — er landet
kommentarlos auf dem Dashboard. Für eine Fallakte mit fünf Ansichten ist das vertretbar; bei vielen
verschickten Detail-Links (Demo 9: `/team/people/:personId`) wäre eine eigene "nicht gefunden"-Meldung
besser — und Demo 9 braucht sie ohnehin für ungültige IDs.

---

## Demo 9 — Route-Parameter

Route `/team/people/:personId` mit Detailseite `PersonDetail` gebaut (Karte + zugehörige Beweisstücke),
"view"-Links an jeder Personen-Karte, unbekannte IDs mit eigener Meldung abgefangen. Alles live getestet,
inklusive Randfällen, plus ein echter Compiler-Fehler als Beleg. Details in `UE4_CHANGES.md`.

### F1: Wie liest du den Wert eines Route-Parameters in deiner Komponente, und welchen Typ hat er für TypeScript standardmäßig? Was musstest du tun, um ihn sicher zu benutzen (z. B. wenn die ID in der URL zu keiner echten Person passt)?

**Einfach gesagt:** `useParams()` gibt ihn mir, aber **immer als `string | undefined`** — der Router kann
nicht wissen, ob die URL wirklich eine gültige ID enthält. Sicher benutzen heißt: **beide** Fälle behandeln,
"fehlt" **und** "gibt es nicht".

**Wie man ihn liest:**

```tsx
const { personId } = useParams();   // personId: string | undefined
```

**Der Typ:** `useParams()` liefert ein Objekt, in dem **jeder** Parameter `string | undefined` ist. Zwei Gründe:
die URL kommt vom Nutzer (er kann sie beliebig tippen), und der Router prüft zur Compile-Zeit nicht, ob die
Komponente auch wirklich unter einer Route mit diesem Parameter hängt. Außerdem ist es immer ein **String** —
auch bei `/orders/42` wäre `42` ein Text und müsste bei Bedarf in eine Zahl umgewandelt (und auf `NaN` geprüft)
werden.

**Echter Compiler-Beleg:** ich habe absichtlich `personId.length` ohne Prüfung geschrieben:

```
src/features/people-locations/PersonDetail.tsx:19:18 - error TS18048: 'personId' is possibly 'undefined'.
```

**Es gibt zwei verschiedene Fehlerfälle — und nur einen davon fängt der Compiler:**

| Fall | Wer merkt es | Wie ich damit umgehe |
|---|---|---|
| Der Parameter ist `undefined` (Typ-Ebene) | **TypeScript** (Fehler oben) | `find(...)` mit `personId` ist erlaubt, ein Vergleich mit `undefined` findet einfach nichts — der Fall ist durch den nächsten mitabgedeckt |
| Der Parameter ist ein String, aber **gehört zu keiner Person** (`/team/people/does-not-exist`) | **niemand automatisch** — die URL passt zum Muster, der Router ist zufrieden | `people.find(...)` liefert `undefined` → `if (!person)` zeigt eine eigene Meldung |

Der zweite Fall ist der eigentliche, und er ist **nicht** durch Typen lösbar: die ID kommt zur Laufzeit, aus
der Adresszeile. Genau wie schon bei den JSON-Daten (UE2 Demo 6 F2) gilt: **TypeScript prüft Code, nicht Daten
von draußen.** Deshalb gibt es `if (!person)`.

**Weitere Dinge, die ich geprüft habe** (live):

| Prüfung | Ergebnis |
|---|---|
| Unbekannte ID `does-not-exist` | Meldung + Link zurück, die Tab-Leiste bleibt sichtbar |
| Falsche Schreibweise `Nova-Byte` | ebenfalls "nicht gefunden" — der Vergleich ist **exakt**, die ID ist ein Slug in Kleinbuchstaben |
| ID mit HTML-Zeichen (`<b>x</b>`, URL-kodiert) | wird als **Text** ausgegeben, **0** `<b>`-Elemente — React maskiert `{personId}`, die vom Nutzer kontrollierte Adresse kann kein Markup einschleusen |
| Links bauen | `personPath()` kodiert die ID mit `encodeURIComponent`, damit Sonderzeichen die Route nicht zerreißen; `useParams()` dekodiert sie beim Lesen wieder |

**Warum die Meldung im Layout steht (nicht als eigene Seite):** die Detailseite ist ein **Kind** von `/team`.
Bei einer unbekannten ID bleibt die Tab-Leiste stehen, und der Nutzer kommt mit einem Klick zurück in die
Liste. Das war auch die Lehre aus Demo 8 F2: ein kommentarloses Zurückspringen aufs Dashboard wäre hier
schlechter.

### F2: Was ist für die Nutzer:in der praktische Unterschied zwischen `/team/people/nova-byte` (Route-Parameter) und `/team/people?person=nova-byte` (Query-Parameter)? Warum passt für diesen konkreten Fall das eine besser?

**Einfach gesagt:** der **Pfad** sagt, **welche Seite** gemeint ist ("die Seite über Nova Byte"). Die
**Query** sagt, **wie** eine Seite angezeigt werden soll ("die Personen-Liste, aber mit diesem Filter").
Hier geht es um die **Seite über eine Person** — also Pfad.

| | Route-Parameter `/team/people/nova-byte` | Query-Parameter `/team/people?person=nova-byte` |
|---|---|---|
| Was es ausdrückt | **Identität**: *welches* Ding diese Seite zeigt | **Option**: *wie* dieselbe Seite angezeigt wird (Filter, Sortierung, Suche) |
| Pflicht? | **ja** — ohne ihn ist es eine andere Seite (die Liste) | **nein** — ohne ihn gilt ein Standardwert ("alle") |
| Wie viele sinnvoll? | genau einer pro Position | beliebig viele kombinierbar (`?person=a&sort=name`) |
| Eigener Inhalt? | ja: eigene Seite mit eigenen Inhalten (Karte + zugehörige Beweisstücke) | nein: dieselbe Seite, anders gefiltert |
| Ungültiger Wert | ein **Fehler** der Adresse → "nicht gefunden" (live: `…/does-not-exist`) | wird meist **ignoriert** oder fällt auf den Standard zurück |
| Live gemessen | `…/people/nova-byte` → **1** Karte + 5 Beweisstücke | `…/people?person=nova-byte` → **alle 6** Personen (die Seite liest den Parameter gar nicht) |

**Was die Nutzer:in praktisch davon hat:**

- **Der Pfad ist eine Adresse für ein Ding.** Man kann ihn verschicken, speichern und sieht an der Adresse,
  was man bekommt ("…/nova-byte"). Er passt in die Hierarchie "Team → Personen → eine Person" und lässt sich
  als Brotkrumen-Navigation lesen.
- **Die Query ist eine Einstellung.** Ein Link `…?person=nova-byte` sagt "wie die Liste, nur mit einer
  Voreinstellung". Zurück zur ungefilterten Liste ist **dieselbe** Adresse ohne Query.

**Warum hier der Route-Parameter:** die Detailseite einer Person ist **keine gefilterte Liste**, sondern eine
eigene Ansicht — mit anderem Layout (eine Karte statt sechs) und eigenem Inhalt (die zugehörigen
Beweisstücke). Die Person ist **Pflicht** für diese Ansicht, nicht optional. Das ist genau das Kriterium für
einen Pfad-Parameter: *"würde ohne diesen Wert eine andere Seite erscheinen?"* — ja.

**Der Gegenfall — wo die Query richtig ist:** die **Timeline** (Demo 10). Dort ist `…/timeline?person=nova-byte`
weiterhin "die Timeline", nur mit einer **vorausgewählten Person** — es gibt sie auch ohne (dann zeigt sie
alle), und man könnte einen zweiten Filter ergänzen (`&type=access-log`). Dort wäre ein Pfad-Parameter
falsch: ohne `/nova-byte` bliebe eine gültige Seite übrig, nämlich die ganze Timeline.

**Merksatz:** *Pfad = **was**. Query = **wie**.*
