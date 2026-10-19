# UE5 Theorie-Fragen & Antworten — Exercise 5

Laufende Sammlung, gleiches Schema wie [`../ue4/UE4_THEORIE_ANTWORTEN.md`](../ue4/UE4_THEORIE_ANTWORTEN.md).

---

## Demo 1 — Event-Handling aus vanilla-Listenern migrieren

Evidence Catalogue und Workspace als React-Views gebaut; fünf Handler aus der vanilla-App migriert (Stern,
Karte öffnen, Close, Save note, Workspace-"Open"). Live gemessen: im React-DOM gibt es kein `onclick`-Attribut
mehr (vanilla: 14), kein `data-action` (vanilla: 18) und keine globalen `window.`-Funktionen. Details und
Messtabellen in `UE5_CHANGES.md`.

### F1: Wie hängst du in React einen Klick-Handler an einen Button, verglichen mit der vanilla-Version (Inline-`onclick="..."` im HTML-String oder `addEventListener` im JS)? Was bekommt in jedem Ansatz das Event-Objekt, und ist es dieselbe Art von Objekt?

**Einfach gesagt:** in React schreibst du die Funktion **als Prop direkt an den Button** (`onClick={…}`). In
vanilla klebt man sie **nachträglich von außen** an (als Text im HTML oder per `addEventListener`). Das Event
ist in vanilla das **echte Browser-Event**, in React ein **Wrapper darum** — gleiche Bedienung
(`stopPropagation()`, `preventDefault()`, `target`), aber nicht dasselbe Objekt.

**Die drei Wege nebeneinander:**

| | Inline-Attribut (vanilla) | `addEventListener` (vanilla) | `onClick`-Prop (React) |
|---|---|---|---|
| Wo steht der Handler? | als **Text** im HTML-String: `onclick="closeEvidenceDetail()"` | im JS, **nachdem** das Element existiert: `btn.addEventListener("click", fn)` | im JSX, **am Element**: `<button onClick={onClose}>` |
| Was ist der Handler? | ein **Textstück**, das der Browser zu einer Funktion übersetzt | eine Funktion | eine Funktion (kein Text, kein Aufruf!) |
| Welche Funktionen sind erreichbar? | nur **globale** (`window.closeEvidenceDetail`) | alle im Gültigkeitsbereich | alle im Gültigkeitsbereich (Closure) |
| Wer hängt ihn an/ab? | der Browser beim Parsen des HTML | **du** (und du musst dran denken, es nach jedem Neubau zu wiederholen) | **React**, bei jedem Render passend |
| Typisierung | keine (Text) | `(e: MouseEvent)` | `(e: React.MouseEvent<HTMLButtonElement>)` |

**Aus unserem Code** (`EvidenceDetail.tsx`):

```tsx
<button type="button" className="btn btn-secondary btn-small" onClick={onClose}>
  Close
</button>
```

**Zwei Stolpersteine:**
- `onClick={onClose}` übergibt die **Funktion**. `onClick={onClose()}` würde sie **sofort beim Rendern
  aufrufen** und deren Ergebnis übergeben.
- Braucht der Handler ein Argument, schreibt man einen Pfeil darum: `onClick={() => onOpen(evidence.id)}` (so
  in `EvidenceCard`). Der Pfeil wird beim Klick aufgerufen, nicht beim Rendern.

**Welches Objekt bekommt der Handler?**

| | Was ankommt | Art |
|---|---|---|
| Inline-`onclick="f()"` | in der Funktion steht das Event als `event` (und `this` = das Element) | das **native** `MouseEvent` des Browsers |
| `addEventListener("click", f)` | `f(event)` | das **native** `MouseEvent` |
| React `onClick={f}` | `f(event)` | ein **`SyntheticEvent`** (`React.MouseEvent`) — ein **Wrapper** von React um das native Event |

**Ist es dieselbe Art Objekt? Nein, aber fast gleich zu bedienen.** Das `SyntheticEvent` hat dieselben
Methoden und Felder, die man braucht (`stopPropagation()`, `preventDefault()`, `target`, `currentTarget`,
`clientX`, …) und sorgt dafür, dass sie in allen Browsern gleich funktionieren. Das native Event steckt
darin: `event.nativeEvent`. Unterschiede, die man kennen sollte:

- `event.currentTarget` ist das Element, **an dem der Handler hängt** (der Button), `event.target` das
  Element, **auf dem tatsächlich geklickt wurde** (z. B. das innere `<span>` mit dem Stern).
- Seit React 17 ist das Event **nicht mehr "gepoolt"**: man darf es auch in asynchronem Code weiter
  benutzen (davor wurde es nach dem Handler zurückgesetzt).
- React hängt **nicht** an jedes Element einen echten Browser-Listener, sondern **einen pro Event-Typ am
  Wurzel-Container** (`#react-root`) und verteilt das Event selbst an die passenden `onClick`-Props
  (Details in F2).

**Zwei vanilla-Eigenheiten, die in React wegfallen** (beide live in `UE5_CHANGES.md` belegt):
1. **Globale Funktionen.** Weil `onclick="saveCurrentNote()"` nur Globales sieht, musste `js/main.ts` fünf
   Funktionen an `window` hängen und `declare global { interface Window { … } }` schreiben. Im React-DOM:
   `typeof window.saveCurrentNote` → `"undefined"`.
2. **Zustand aus dem DOM zurücklesen.** Beim Speichern einer Notiz hat vanilla die Evidence-ID mit
   `textarea.getAttribute("data-evidence-id")` aus dem DOM geholt, weil der Inline-Handler keinen Zugriff auf
   den Rest hatte. In React steht `evidence.id` einfach in der Closure von `handleSubmit`.

### F2: Die Klick-Behandlung der vanilla-Evidence-Liste benutzte Event Delegation (ein Listener am Container, der `event.target` prüft) auch, um das erneute Registrieren von Listenern bei jedem Render zu umgehen. Braucht man dieses Muster in React noch? Warum oder warum nicht?

**Einfach gesagt:** **Nein, nicht von Hand** — React macht die Delegation **selbst** und räumt dabei genau das
Problem weg, das sie in vanilla nötig machte.

**Warum vanilla Delegation brauchte** (`renderEvidenceList()` in `js/views/evidence.ts`):

1. Die Liste wird bei **jedem** Render mit `container.innerHTML = html` komplett **neu gebaut**. Alle alten
   Karten-Elemente sind weg — und mit ihnen jeder Listener, den man an sie gehängt hätte.
2. Einzelne Listener pro Karte (18 Stück) müssten **nach jedem Render neu angehängt** werden.
3. Lösung: **ein** Listener am Container (der bleibt stehen), der beim Klick nachschaut, wer gemeint war:
   `event.target.closest("[data-action='bookmark']")` und `.closest(".evidence-card")`.
4. Die Karte musste ihre Identität im HTML mitführen (`data-id="E03"`, `data-action="bookmark"`), weil der
   Container-Listener sonst nicht wüsste, welche Karte gemeint ist.

(Im Code steht sogar ein Kommentar, dass `container.addEventListener(...)` bei jedem Render erneut aufgerufen
wird und nur deshalb **kein** Doppel-Listener entsteht, weil der Browser identische Paare aus Typ und
Funktionsreferenz dedupliziert.)

**Warum React das nicht braucht:**

| vanilla-Problem | Wie es in React gelöst ist |
|---|---|
| Neuer `innerHTML` → alle Listener weg | React **baut nichts neu**: es vergleicht (Abgleich, UE3 Demo 3) und ändert nur, was sich unterscheidet. Bleibt eine Karte bestehen (gleicher `key`), bleibt ihr DOM-Element **und** ihr Handler bestehen. Kommt eine Karte neu dazu, hängt React ihren Handler automatisch an |
| Identität im HTML mitführen (`data-id`, `data-action`) | Jede Karte hat ihren **eigenen Handler mit eigener Closure**: `onClick={() => onOpen(evidence.id)}` — die ID steckt in der Funktion, nicht im DOM. Im React-DOM: **0** `data-action`-Attribute (vanilla: 18) |
| `closest()` suchen, weil der Klick oft auf dem inneren `<span>` landet | Das Event **bubbelt durch den React-Baum**: ein Klick auf das innere Stern-`<span>` löst `onClick` des umgebenden Buttons aus, ohne dass man suchen muss. (In vanilla war genau das ein echter Bug: der Klick auf das Span öffnete das Detail statt zu bookmarken; behoben mit `closest()`) |
| Listener vergessen/doppelt anhängen | Es gibt nichts anzuhängen. Im Quellcode von `src/` kein einziges `addEventListener` (Textsuche) |

**Aber: React benutzt Delegation selbst — unter der Haube.** `createRoot(rootElement)` hängt **einen**
Listener pro Event-Typ an `#react-root` (seit React 17; davor am `document`). Kommt ein Klick an, schaut React
nach, welche Komponente das Ziel ist, und ruft die passenden `onClick`-Props entlang des Baums auf. Das Muster
ist also **nicht verschwunden**, es ist **in die Bibliothek gewandert**: man schreibt Handler direkt ans
Element und bekommt trotzdem die Effizienz eines einzelnen Listeners.

**`stopPropagation()` braucht man weiterhin** — das ist kein Delegations-Thema, sondern Bubbling. Der Stern
sitzt *in* der Karte; ohne `event.stopPropagation()` in `handleBookmarkClick` würde derselbe Klick nach oben
durchlaufen und zusätzlich `onOpen` der Karte aufrufen. In vanilla hieß das im Container-Listener: erster Ast
(`bookmarkBtn`) macht `stopPropagation()` und `return`, bevor der Karten-Ast läuft. Live geprüft: Klick auf
den Stern → Stern aktiv, URL bleibt `#/evidence`, **kein** Detail.

**Wann Delegation in React doch noch sinnvoll sein kann:** bei **sehr** großen Listen (tausende Zeilen, wo
tausende Closures stören) oder wenn man mit Elementen arbeitet, die **React nicht besitzt** (z. B. HTML von
außen). Für 18 Karten ist es unnötig; wir haben es bewusst nicht gebaut.

---

## Demo 2 — `useState` und kontrollierte Formulare

Das Evidence-Suchfeld und alle sechs Felder des Hypothesen-Formulars sind kontrolliert (`value` + `onChange`,
Zustand per `useState`); "Save hypothesis draft" liest den Zustand und speichert im `localStorage` (gleiche
Form wie vanilla). Die zwei Fragen live belegt: ein Feld ohne `onChange` bleibt leer, und React meldet das.
Details und Messtabellen in `UE5_CHANGES.md`.

### F1: Was macht ein Eingabefeld "kontrolliert" im Gegensatz zu "unkontrolliert"? Zeig, was passiert, wenn du in eines deiner kontrollierten Felder tippst, ohne `onChange` zu verdrahten, und erkläre es im Sinne von Reacts Render-Zyklus, *warum* das passiert.

**Einfach gesagt:** **Kontrolliert** heißt: **React** besitzt den Wert (er steht in `useState`), das Feld zeigt ihn nur an.
**Unkontrolliert** heißt: der **Browser** besitzt den Wert, React fragt nur bei Bedarf nach. Ohne `onChange` kann ein
kontrolliertes Feld seinen Wert nie ändern: React zeichnet es nach jeder Taste wieder mit dem alten Wert, es wirkt
"eingefroren".

**Die zwei Arten nebeneinander:**

| | Unkontrolliert | Kontrolliert |
|---|---|---|
| Wer besitzt den aktuellen Wert? | der **Browser** (das DOM-Element) | **React** (`useState`) |
| Prop am Element | `defaultValue` (nur der **Startwert**) | `value` (der **aktuelle** Wert) + `onChange` |
| Wie liest man den Wert? | bei Bedarf aus dem DOM (Formular abschicken → `FormData`, oder `ref`) | steht schon im State — jederzeit lesbar |
| Aus unserem Code | Notiz-Textarea (`defaultValue={note}`, gelesen per `FormData`), Timeline-Dropdowns | Suchfeld (`value={searchTerm}`), alle 6 Felder des Hypothesen-Formulars |
| Gut für | einfache Formulare, die man nur beim Abschicken liest | Eingaben, auf die die Seite **sofort** reagieren muss (Live-Filter, Validierung, abhängige Felder, Zurücksetzen) |

**Der Kreislauf eines kontrollierten Feldes (bei jeder Taste):**

```
Taste → onChange feuert → setSearchTerm(neuerText) → React rendert EvidencePage neu
      → <input value={searchTerm}> bekommt den neuen Text → das Feld zeigt ihn
```

**Was passiert ohne `onChange`?** Live ausprobiert: in `EvidenceToolbar.tsx` die Zeile
`onChange={(event) => onSearchChange(event.target.value)}` testweise gelöscht, "abc" mit echten Tasten getippt:

| Beobachtung | Wert |
|---|---|
| Wert des Feldes nach dem Tippen | **`""`** — nichts erscheint |
| Konsole | React-Fehlermeldung (sinngemäß): "You provided a value prop to a form field without an onChange handler. This will render a read-only field. If the field should be mutable use defaultValue. Otherwise, set either onChange or readOnly." |
| Nach `onChange` wieder einsetzen | "abc" lässt sich tippen |

**Warum das so ist — im Sinne des Render-Zyklus:**

1. Der Nutzer drückt "a". **Der Browser trägt das "a" kurz in das Feld ein** (das ist sein Standardverhalten).
2. Das `input`-Event kommt bei React an. **Es gibt aber keinen Handler** → React ruft **keinen Setter** auf →
   der **State bleibt `""`**.
3. React vergleicht nach dem Event den DOM-Wert des Feldes mit dem Wert, den es **laut State** haben müsste
   (`value={searchTerm}` = `""`). Sie sind verschieden → React **setzt das Feld auf `""` zurück** (React stellt den
   "Soll-Wert" wieder her).
4. Ergebnis: das "a" ist sofort wieder weg. Für den Nutzer sieht das Feld **schreibgeschützt** aus.

Das Kernprinzip: bei einem kontrollierten Feld ist **der State die einzige Wahrheit**, das DOM-Element ist nur
ein Spiegel. Ein Wert kommt **nur über den State** ins Feld. Wer den State nicht ändert, ändert das Feld nicht.

**Zwei Ausnahmen, die man kennen sollte:**
- `readOnly` am Feld sagt React ausdrücklich "ja, das soll nicht änderbar sein" — dann gibt es keine Warnung.
- `value={undefined}` (oder gar kein `value`) macht das Feld **unkontrolliert**. Wechselt ein Feld zwischen den zwei
  Zuständen (`value` erst `undefined`, dann ein String), warnt React ebenfalls. Deshalb haben alle unsere
  Startwerte einen String (`""`), nie `undefined`.

### F2: Das Hypothesen-Formular hat mehrere Eingabetypen (Select, Multi-Select, Range, Textarea). Hast du pro Feld ein `useState` benutzt oder ein einziges Objekt? Begründe deine Wahl. (Notiere dir die Frage für Demo 7 — `useReducer` — wo du sie für ein anderes Formular neu überdenken sollst.)

**Einfach gesagt:** **Ein Objekt.** Die sechs Felder gehören zusammen: sie werden **zusammen geladen, zusammen
gespeichert und (später) zusammen zurückgesetzt**. Ein Objekt macht aus "sechs Dingen, die immer gemeinsam
behandelt werden" **eine** Sache.

**Der Vergleich:**

| | Ein `useState` pro Feld | Ein Objekt (gewählt) |
|---|---|---|
| Code | 6× `const [x, setX] = useState(...)` | 1× `useState<HypothesisFields>(loadHypothesis)` + **ein** `setField` |
| **Speichern** | 6 Werte einzeln einsammeln: `{ suspectId, nature, evidenceIds, … }` | `saveHypothesis(values)` — der Entwurf ist **schon** das Objekt |
| **Laden** | 6 Setter nacheinander aufrufen (und für jeden den Startwert einzeln wissen) | **ein** Startwert: `useState(loadHypothesis)` |
| **Zurücksetzen** (z. B. "Clear") | 6 Setter aufrufen — einen vergessen und das Formular ist halb geleert | **ein** `setValues(empty)` |
| Neues Feld hinzufügen | neues `useState` + neuer Handler + an `save`/`load` denken | ein Feld im Typ `HypothesisFields`, der Compiler zeigt, wo es noch fehlt |
| Typisierung | jedes einzeln | `HypothesisFields` ist **dieselbe Form** wie der gespeicherte `HypothesisDraft` (`Omit<…, "savedAt">`) |
| Nachteil | — | man muss beim Ändern **kopieren**: `{ ...previous, [field]: value }` statt nur den einen Wert zu setzen |

**Der Handler ist bewusst generisch:**

```tsx
function setField<K extends keyof HypothesisFields>(field: K, value: HypothesisFields[K]) {
  setValues((previous) => ({ ...previous, [field]: value }));
}
```

Das `K extends keyof HypothesisFields` verhindert Typfehler schon beim Schreiben: `setField("evidenceIds", "x")`
(ein String statt eines Arrays) ist ein **Compiler-Fehler**, ebenso `setField("typo", …)`.

**Zwei Dinge, die ich beim Kopieren beachte:**
1. `{ ...previous, … }` baut ein **neues** Objekt, das alte bleibt unverändert. Das ist ein **unveränderliches
   Update** (Thema von Demo 3): React erkennt eine Änderung daran, dass es ein **anderes** Objekt bekommt.
2. `setValues((previous) => …)` benutzt die **Funktionsform** des Setters. `previous` ist der **neueste** Stand,
   auch wenn mehrere Updates im selben Event zusammenkommen. (`setValues({ ...values, … })` würde den Stand von
   *diesem Render* kopieren — das ist bei einem einzelnen Event gleich, aber bei zwei schnell aufeinander folgenden
   Updates ein Fehler.)

**Warum nicht pro Feld — und wann doch?** Pro Feld wäre vollkommen in Ordnung, wenn die Felder **nichts
miteinander zu tun hätten** (zwei getrennte Schalter in der Kopfzeile). Das **Suchfeld** der Evidence-Seite ist
deshalb ein **einzelnes** `useState("")` — es hat noch keine Geschwister. Sobald Suche, Typ, Person, Ort, Status,
Relevanz und Sortierung zusammenkommen (**sieben** Werte, die oft gemeinsam geändert und gemeinsam zurückgesetzt
werden), reicht auch ein Objekt nicht mehr bequem; dort fragt Demo 7, ob ein `useReducer` besser passt.

**Ausblick auf Demo 7 (die Frage dort neu stellen):** das Hypothesen-Formular hat **nur eine Art** Änderung
("Feld X auf Wert Y setzen"), deshalb reicht ein Objekt und ein `setField`. Die Evidence-Filter haben **mehrere
Arten** (ein Filter ändern, die Sortierung ändern, alle zurücksetzen), und genau dort wird ein Reducer mit
benannten Aktionen lesbarer. Merksatz: *eine Art von Änderung → Objekt; mehrere Arten → Reducer.*

**Wo der Zustand wohnt:** der Entwurf liegt **in `HypothesisForm` selbst**, nicht in `WorkspacePage`. Kein anderer Teil
der App braucht ihn (Regel aus Demo 5: Zustand lebt beim **niedrigsten gemeinsamen Besitzer**). Dadurch ist
`HypothesisForm` keine reine Darstellung mehr, sondern eine zustandsbehaftete Komponente.

---

## Demo 3 — Unveränderliche Updates

Alle State-Änderungen der Evidence-/Workspace-Seiten erzeugen ein **neues** Array bzw. Objekt (`toggleBookmark`,
`applyReviewEdits`, `{ ...previous, … }`, `[...evidence].sort`). Neu: Review-Status und Relevanz sind im Detail
änderbar, ohne ein geladenes Beweisstück anzufassen. Belegt mit einer Mutations-Sandbox, einem Test mit
**eingefrorenen** Eingaben und echten Compiler-Fehlern für `readonly`. Details und Messtabellen in `UE5_CHANGES.md`.

### F1: Warum scheint direktes Mutieren von State in React auf dem Bildschirm manchmal trotzdem zu "funktionieren", verursacht aber echte (schwer zu findende) Fehler an anderer Stelle? Was vergleicht React tatsächlich, wenn es entscheidet, ob neu gerendert wird?

**Einfach gesagt:** React vergleicht beim State nur **die Referenz** ("ist das **dasselbe Objekt** wie vorher?"), nicht den
**Inhalt**. Mutiert man ein Array und gibt dasselbe Array zurück, sieht React "nichts geändert". Auf dem Bildschirm
taucht die Änderung nur **zufällig** auf — nämlich wenn aus einem anderen Grund neu gerendert wird.

**Was React vergleicht:**

| Stelle | Vergleich |
|---|---|
| `setState(neu)` | `Object.is(alterState, neu)` — ist es **dasselbe** Objekt? Wenn ja: **kein** Neurendern, Kinder werden übersprungen |
| Props einer `React.memo`-Komponente | pro Prop `Object.is(alt, neu)` — ein neues Array/Objekt zählt als geändert, dasselbe nicht |
| `useMemo` / `useCallback` / `useEffect` Abhängigkeiten | `Object.is` pro Eintrag |
| Der Inhalt eines Arrays/Objekts | **wird nie verglichen** (zu teuer, React schaut nicht hinein) |

**Warum es "manchmal funktioniert"** — live in der Sandbox (`mutation-demo.html`) gezeigt:

| Schritt (links: `push` + `setState(dieselbe Referenz)`) | Sichtbar |
|---|---|
| 2× "Bookmark hinzufügen" | **nichts**: Liste leer, Summary 0 — `Object.is` sagt "dieselbe Referenz", React rendert nicht |
| "Unabhängiges Neurendern" (ändert nur einen anderen Zähler) | Liste zeigt plötzlich `E01, E02`: die Seite wurde aus **anderem Grund** neu gerendert und liest dabei das **mutierte** Array |
| dasselbe: die `memo`-Summary | **bleibt bei 0**: ihr Prop ist weiterhin dieselbe Referenz → `memo` überspringt sie |

Für den Entwickler sieht das aus wie "geht manchmal, manchmal nicht" — das macht diese Fehler so schwer zu finden. Im
Test klickt man irgendwann etwas anderes, die Liste aktualisiert sich, und der Fehler ist "weg".

**Was an anderen Stellen kaputtgeht**, wenn ein State mutiert wird:

1. **Alles, was auf Referenz-Gleichheit setzt**: `memo`-Komponenten, `useMemo`-Ergebnisse, `useEffect`-Abhängigkeiten
   sehen die Änderung nie (Sandbox: die Summary). Ein Effekt, der auf `bookmarks` hört, läuft nicht.
2. **Geteilte Referenzen (Aliasing):** zeigen zwei Variablen auf dasselbe Array, ändert sich das eine **mit** (der
   vanilla-Bug aus F2).
3. **Alte Zustände sind verloren:** wer "vorher" und "nachher" vergleichen will (Rückgängig, Verlauf), hat nur noch
   **ein** Objekt, in dem beides überschrieben wurde.
4. **React-Entwicklungsmodus:** `StrictMode` ruft Updater-Funktionen `setX(previous => …)` absichtlich zweimal auf.
   Mutiert der Updater, passiert die Änderung doppelt (laut React-Dokumentation; hier nicht gesondert getestet).

**Zur Schreibweise:** `[...bookmarks, id]` baut ein **neues** Array (flache Kopie plus neues Element). `filter` liefert
**immer** ein neues. `{ ...obj, feld: wert }` kopiert das Objekt und überschreibt nur ein Feld. Verschachtelte
Strukturen müssen **auf jeder Ebene** neu sein, die sich ändert — bei `reviewEdits` zwei Ebenen:
`{ ...previous, [id]: { ...previous[id], ...edit } }`.

### F2: Die originale vanilla-App hatte einen echten Fehler: Sortieren der Evidence mutierte das Master-Array über eine geteilte Referenz und verlor dauerhaft die ursprüngliche Reihenfolge. Zeig, wie dein React-State-Update für die entsprechende Aktion (Bookmark-Toggle oder Sortieren) genau diese Fehlerklasse vermeidet. Sei konkret, was anders ist — nicht nur "React macht das".

**Einfach gesagt:** React **verhindert** das nicht von selbst. Der Schutz kommt aus **vier Entscheidungen in unserem Code**:
(1) es gibt keine gespeicherte zweite Liste, die auf die Master-Liste zeigen könnte, (2) jede Änderung baut eine Kopie,
(3) die geladenen Daten werden nie angefasst, (4) der Compiler verbietet das Mutieren (`readonly`).

**Der vanilla-Fehler im Detail** (UE1 Demo 2, Kommentar in `js/data.ts`):

```js
state.filteredEvidence = state.allEvidence;      // KEINE Kopie: zwei Namen für DASSELBE Array
...
state.filteredEvidence.sort(...);                // sortiert in place -> allEvidence ist mit umsortiert
```

Folgen: die **ursprüngliche Reihenfolge war dauerhaft weg**, und das Dashboard ("Recent evidence" liest `allEvidence`)
zeigte danach Müll. Behoben mit `.slice()` (flache Kopie). Aber: die **Fehlerklasse** (Aliasing + In-Place-Operation)
bleibt in vanilla möglich, weil `state` ein veränderbares globales Objekt ist, das jeder importiert.

**Was in der React-Version anders ist** — konkret, jeweils belegt:

| # | Was | vanilla | React (`EvidencePage` & Helfer) |
|---|---|---|---|
| 1 | **Gibt es eine zweite Liste, die aliasen könnte?** | ja: `state.filteredEvidence` wird **gespeichert** und zeigte zuerst auf dasselbe Array | **nein**: es gibt keine gespeicherte gefilterte/sortierte Liste. Sie wird in jedem Render **abgeleitet** (`sortEvidence(…)`, in Demo 3 noch `sortNewestFirst`). Ohne gespeicherte zweite Liste kann sie nicht auf die erste zeigen (Demo 4) |
| 2 | **Sortieren** | `list.sort(...)` in place (nach dem Fix auf einer frisch gebauten Kopie) | `[...evidence].sort(...)` — **Kopie vor dem Sortieren**. Live: auf einer **eingefrorenen** Liste läuft die Funktion, ohne zu werfen, und liefert `["new","old"]` |
| 3 | **Bookmark-Toggle** | `state.bookmarks.push(id)` **und** `ev.bookmarked = true` — zwei Mutationen, dieselbe Tatsache an zwei Orten | `toggleBookmark(bookmarks, id)` liefert ein **neues** Array. Es gibt **kein** `bookmarked`-Feld am Beweisstück; `isBookmarked` wird mit `bookmarks.includes(id)` abgeleitet. Live: mit eingefrorener Eingabe `["E01","E02"]` → neue Arrays, Original unverändert, `frozen.push` zum Vergleich wirft |
| 4 | **Status ändern** | `ev.status = …` direkt am **geladenen** Objekt | die geladene Liste wird **nie** angefasst: die Änderungen stehen in `reviewEdits`, `applyReviewEdits` baut daraus eine **neue** Liste (geänderte Einträge neue Objekte, unveränderte dieselben). Live: Original-`A` bleibt `"unreviewed"`, die neue Liste hat `"reviewed"` |
| 5 | **Compiler-Schutz** | keiner | `readonly Evidence[]` an den Helfern: Mutieren ist ein **Typfehler** (siehe unten) |
| 6 | **Wer kann den State anfassen?** | jede Datei, die `state` importiert (globales Singleton) | State liegt in einer Komponente; Kinder bekommen **Werte** als Props und rufen **Callbacks** auf (Demo 6). Kein Weg, an der Komponente vorbei "mal eben" zu mutieren |

**Echte Compiler-Fehler für Punkt 5** (installierte TypeScript-Version, Test-Datei außerhalb des Projekts):

```
error TS2339: Property 'sort' does not exist on type 'readonly Evidence[]'.
error TS2339: Property 'push' does not exist on type 'readonly string[]'.
error TS2540: Cannot assign to 'status' because it is a read-only property.
```

**Ehrliche Einschränkung:** das alles sind **unsere** Entscheidungen, keine Magie. React verhindert nicht, dass jemand
`evidence.sort()` schreibt, wenn der Typ nicht `readonly` ist. Der Unterschied zu vanilla: (a) die **Architektur** macht
den Fehler schwerer (keine geteilte, gespeicherte Zweitliste, kein globales `state`), (b) **TypeScript** kann ihn
verbieten, (c) falsches Mutieren fällt in React **eher auf** (die Seite aktualisiert sich nicht — Sandbox), statt
still die Daten aller zu verändern. Die Fehlerklasse ist damit **sehr unwahrscheinlich**, nicht **unmöglich** — für
"strukturell verhindert" (bessere Formulierung für Demo 10) gehört die abgeleitete statt gespeicherte Liste dazu
(Demo 4).

---

## Demo 4 — Abgeleitete Werte statt gespeicherter

Die sichtbare Evidence-Liste wird in jedem Render aus (geladene Liste + Änderungen + sieben Filterwerte)
**berechnet** (`applyReviewEdits` → `filterEvidence` → `sortEvidence`) und nirgends gespeichert. Dashboard-Zähler und
Workspace-Liste leiten beide mit **derselben** Funktion (`bookmarkedEvidence`) aus der Bookmark-ID-Liste ab. Gegen
vanilla geprüft (22 Filter-Kombinationen identisch; ein veralteter Bookmark-Eintrag lässt in vanilla Zähler und Liste
auseinanderlaufen, in React nicht). Details und Messtabellen in `UE5_CHANGES.md`.

### F1: Was ist die Regel, ob etwas in `useState` gehört oder beim Rendern inline (oder per `useMemo`) berechnet wird? Wende sie auf die gefilterte Evidence-Liste an und begründe.

**Einfach gesagt:** *"Kann ich es aus etwas ausrechnen, das ich ohnehin schon habe?"* Ja → **nicht** in den State, einfach
ausrechnen. Nein (nur der Nutzer kann es bestimmen) → `useState`.

**Die Regel als Fragenfolge:**

| Frage | Antwort | Folge |
|---|---|---|
| 1. Bleibt der Wert über Renderings hinweg bestehen **und** kommt er vom Nutzer / von außen? | ja | **State** |
| 2. Lässt er sich aus bestehendem State, Props oder anderen Werten **berechnen**? | ja | **abgeleitet**, nicht speichern |
| 3. Ist die Berechnung nachweislich **teuer** (gemessen, nicht geraten)? | ja | `useMemo` **um die Berechnung**, trotzdem **kein** State |

**Angewendet auf die gefilterte Liste:**

| Wert | State oder abgeleitet? | Begründung |
|---|---|---|
| Suchtext, Typ, Person, Ort, Status, Relevanz, Sortierung | **State** | nur der Nutzer bestimmt sie, sie lassen sich aus nichts anderem berechnen |
| geladene Beweisstücke | **kommt von außen** (`useCaseData`) | Daten, nicht ableitbar |
| Änderungen an Status/Relevanz | **State** | neue Information vom Nutzer (Demo 3) |
| **die sichtbare (gefilterte, sortierte) Liste** | **abgeleitet** | sie ist eine reine Funktion aus den drei Zeilen darüber: `sortEvidence(filterEvidence(...))` |
| Anzahl der Treffer, Leer-Zustand | **abgeleitet** | `visibleEvidence.length === 0` |
| Typ-Optionen des Dropdowns | **abgeleitet** | `uniqueTypes(evidence)` aus der vollen Liste |
| `filters` (die sieben Werte als Objekt) | **abgeleitet** | nur zusammengesteckt, kein neuer Zustand |

**Warum die Liste nicht in den State gehört:** würde man `const [visible, setVisible] = useState(evidence)` anlegen, müsste
man `setVisible(...)` **bei jeder Änderung von sieben Filtern, den Bookmarks, dem Status und den geladenen Daten**
aufrufen. Vergisst man **eine** Stelle, zeigt die Seite etwas anderes als die Filter sagen. Der Fehler passiert nicht
beim Schreiben, sondern bei jeder späteren Änderung. Abgeleitet gibt es nichts nachzuführen.

**Inline oder `useMemo`?** Hier **inline** (`const visibleEvidence = …` im Render):

- 18 Beweisstücke, eine Schleife über wenige Felder: die Berechnung dauert Mikrosekunden.
- `useMemo` ist **kein** State, sondern ein Cache für eine teure Berechnung (er merkt sich das Ergebnis, solange die
  Abhängigkeiten gleich bleiben). Er verhindert keine Fehler, er spart nur Arbeit, und er erwartet, dass die Funktion
  **rein** ist (gleiche Eingaben → gleiches Ergebnis).
- Voraussetzung dafür ist genau Demo 3: `useMemo` prüft die Abhängigkeiten per **Referenz**. Würden wir mutieren,
  bekäme `useMemo` die Änderung nie mit und lieferte ein veraltetes Ergebnis.
- Wann `useMemo`: wenn man **gemessen** hat, dass die Berechnung stört (Tausende Einträge, sichtbares Ruckeln) — nicht
  vorsorglich.

**Der Test, den ich benutze:** *"Wenn ich diesen Wert löschen und neu berechnen würde — ginge Information verloren?"* Bei der
gefilterten Liste: **nein** → nicht speichern. Beim Suchtext: **ja** → State.

### F2: Die vanilla-App hatte zwei verwandte Fehler: einen Dashboard-Bookmark-Zähler, der veralten konnte (er wurde nur beim ersten Besuch einer View neu gerendert), und eine Variable `filteredEvidence`, die manchmal buchstäblich dasselbe Array wie die Master-Liste war. Erkläre konkret, warum das Ableiten dieser Werte beim Rendern **beide** Fehlerklassen strukturell unmöglich macht, nicht nur unwahrscheinlicher.

**Einfach gesagt:** beide Fehler brauchen einen **gespeicherten** Wert, der **von Hand** aktuell gehalten werden muss. Wenn es
keinen gespeicherten Wert gibt, gibt es nichts, was man vergessen oder falsch teilen könnte.

**Fehler 1 — der veraltete Zähler.**

| | vanilla | React |
|---|---|---|
| Wo steht der Zähler? | wird von `renderDashboard()` in den DOM **geschrieben**. Ursprünglich lief das **nur beim ersten Besuch** (der Guard `!state.viewRendered.dashboard` in `js/navigation.ts`); der Zähler blieb auf 0, bis man neu lud. UE1 hat das **von Hand** repariert ("Dashboard bei jedem Besuch neu rendern", Kommentar in `navigation.ts`) | wird bei **jedem** Rendern aus der ID-Liste **berechnet** (`bookmarkedEvidence(...).length`) |
| Was muss man tun, damit er stimmt? | die richtige Stelle muss `renderDashboard()` **aufrufen** (heute in `handleHashChange`, früher fehlend). Dasselbe Muster steckt noch beim Evidence-View: `renderEvidenceList()` muss nach jeder Änderung von Hand aufgerufen werden, und der Guard `!viewRendered.evidence` gilt dort weiter | nichts |
| Was passiert, wenn man es vergisst? | der Zähler **veraltet** still (so war der Original-Fehler) | geht nicht: es gibt keinen "Aktualisieren"-Schritt, der fehlen könnte |

Strukturell unmöglich ist es, weil der Fehler **die Aktualisierung** voraussetzt, die man vergessen kann. Ein
abgeleiteter Wert wird nicht "aktualisiert", er wird **bei jedem Rendern neu berechnet**: die einzige Aktualisierung ist
der Render selbst, und den löst React aus, wenn sich die Eingaben ändern.

**Fehler 2 — `filteredEvidence === allEvidence`.**

| | vanilla | React |
|---|---|---|
| Gibt es eine gespeicherte gefilterte Liste? | ja, `state.filteredEvidence`, die zu Beginn `state.allEvidence` **zugewiesen** wurde (dasselbe Array unter zwei Namen) | nein: `visibleEvidence` ist eine **lokale Konstante** im Render, gebaut aus `filter(...)` (liefert **immer** ein neues Array) und `[...].sort(...)` (Kopie) |
| Wie kann sie auf die Master-Liste zeigen? | durch die Zuweisung | gar nicht: sie wird bei jedem Render **neu aus den Eingaben gebaut** und lebt nur bis zum Ende dieses Renders |
| Folge in vanilla | `filteredEvidence.sort(...)` sortierte `allEvidence` mit | es gibt keine Variable, die über Renderings hinweg existiert und ein zweiter Name für die Master-Liste sein könnte |

Strukturell unmöglich ist es, weil Aliasing eine **langlebige zweite Referenz** braucht. Ein abgeleiteter Wert hat
keine: er wird aus den Eingaben **neu gebaut**, nicht an die Eingaben **zugewiesen**.

**Der Gegenbeweis, live gemessen (ein dritter Fall derselben Klasse):** `localStorage.remotion_bookmarks =
["E12","ZZ99"]` (`ZZ99` gibt es nicht).

| | Dashboard-Zähler | Workspace-Liste |
|---|---|---|
| vanilla | **2** (`state.bookmarks.length`, zählt die unbekannte ID mit) | **1** (nur vorhandene Beweisstücke) |
| React | **1** | **1** |

In vanilla stehen "wie viele" und "welche" an **zwei Stellen** und laufen auseinander. In React kommen beide aus **einer
Funktion** (`bookmarkedEvidence`) und können es nicht.

**Die ehrlichen Grenzen** (damit "strukturell" nicht übertrieben klingt):

1. **"Strukturell" gilt für den abgeleiteten Wert, nicht für seine Eingaben.** Mutiert jemand die geladene Liste direkt
   (`evidence.sort()`), ist die Eingabe kaputt — dagegen helfen Demo 3 (unveränderliche Updates) und `readonly`.
   Beide Demos zusammen erst machen die Fehlerklasse unmöglich.
2. **"Neu berechnet bei jedem Rendern" setzt voraus, dass gerendert wird.** React rendert, wenn sich **State oder Props**
   ändern. Der Dashboard-Zähler liest heute den `localStorage` direkt im Render (eine Quelle **außerhalb** von React):
   das stimmt, weil die Dashboard-Seite beim Navigieren neu eingehängt wird. Ändert jemand den `localStorage` bei
   offener Seite (zweiter Tab), merkt React nichts. Sobald die Bookmarks als State **in React** liegen (Demo 5), ist die
   Abhängigkeit explizit, und auch dieser Rest ist weg.
3. **Zwei Quellen bleiben möglich**, wenn man sie schafft (State in `EvidencePage` **und** `localStorage`, vorerst):
   die Ableitung ist konsistent, die Quelle noch doppelt. Das räumt Demo 5 auf.

---

## Demo 5 — State zum nächsten gemeinsamen Besitzer nach oben ziehen

Bookmarks, Notizen und Status-Änderungen leben jetzt in `PageRouter` (niedrigster gemeinsamer Vorfahre von
Dashboard, Evidence, People & Locations und Workspace) und kommen als Props bei den Seiten an. Live geprüft:
eine Änderung in Evidence ist **ohne Neuladen** im Dashboard ("2 Bookmarked / 2 Reviewed"), im Workspace und in der
Personen-Detailseite sichtbar und bleibt beim Seitenwechsel erhalten. Details und Messtabellen in `UE5_CHANGES.md`.

### F1: Was bedeutet "State nach oben ziehen" konkret, mechanisch? Geh durch, wo der Bookmark-State **vorher** lag und wo er **jetzt** liegt.

**Einfach gesagt:** "Nach oben ziehen" heißt, das `useState` aus der Komponente **herausschneiden**, die es nur
zufällig besaß, und in den **niedrigsten Vorfahren** einfügen, der alle Nutzer enthält. Von dort bekommen die
Komponenten den **Wert** als Prop und eine **Funktion** zum Ändern.

**Vorher (Stand Demo 4):**

| Komponente | Wie sie an die Bookmarks kam |
|---|---|
| `EvidencePage` | **besaß** den State: `const [bookmarks, setBookmarks] = useState(loadBookmarks)` |
| `WorkspacePage` | las den `localStorage` **selbst**, bei jedem Rendern (`loadBookmarks()`) |
| `DashboardPage` | las den `localStorage` **selbst**, bei jedem Rendern |

Drei Komponenten, **zwei verschiedene Wahrheiten** (der State in Evidence, der `localStorage` für die anderen). Sie
stimmten nur überein, weil Evidence jede Änderung **zusätzlich** in den `localStorage` schrieb.

**Jetzt:**

| Komponente | Wie sie an die Bookmarks kommt |
|---|---|
| **`PageRouter`** | **besitzt** den State: `useState(loadBookmarks)`, plus `handleToggleBookmark` (ruft `setBookmarks` und `saveBookmarks`) |
| `EvidencePage` | bekommt `bookmarks` (Wert) und `onToggleBookmark` (Callback) als **Props** |
| `WorkspacePage` | bekommt `bookmarks` als Prop |
| `DashboardPage` | bekommt `bookmarks` als Prop |

**Der Weg eines Klicks:** Stern anklicken → `EvidenceCard` ruft `onToggleBookmark(id)` → das ist (über `EvidencePage`)
die Funktion `handleToggleBookmark` in `PageRouter` → sie berechnet mit `toggleBookmark` ein **neues** Array,
ruft `setBookmarks(neu)` → `PageRouter` rendert neu → **alle** Seiten bekommen die neue Prop → die sichtbare Seite
zeigt es. (Der `localStorage` wird dabei nur **geschrieben**, nie zum Anzeigen gelesen.)

**Wie findet man den "niedrigsten gemeinsamen Vorfahren"?**

1. Alle Komponenten aufschreiben, die den State **lesen oder ändern** (Evidence-Karte, Dashboard-Zähler,
   Workspace-Liste, …).
2. Den Baum nach oben laufen, bis sich ihre Wege **das erste Mal treffen**. Hier: alle vier Seiten sind
   Geschwister unter `PageRouter` — dort treffen sie sich.
3. **Nicht höher** gehen als nötig: `App` wäre auch ein Vorfahre, aber `Header` und `NavBar` bräuchten den State nicht
   und würden bei jeder Änderung unnötig mitrendern.

**Die Gegenregel (was *nicht* nach oben gehört):** alles, was nur **eine** Komponente braucht, bleibt dort. Die sieben
Filterwerte bleiben in `EvidencePage`, der Formular-Entwurf in `HypothesisForm`. State "auf Vorrat" nach oben zu legen
macht die oberen Komponenten schwerer und jede Änderung löst mehr Neurendern aus.

**Was man dafür bezahlt:** Der besitzende Vorfahre muss Werte und Callbacks **weiterreichen** (Props). Die Verbindung
zwischen Besitzer und Nutzer wird dadurch **sichtbar** (man sieht an den Props, wer was liest), aber auch länger
(Demo 6 und 8).

### F2: Was würde konkret schiefgehen, wenn jede der Komponenten Dashboard, Evidence und Workspace ein **eigenes** `useState` für die Bookmarks hätte?

**Einfach gesagt:** Es gäbe **drei Kopien** derselben Tatsache. Jede Kopie ändert sich nur, wenn **ihre eigene**
Komponente etwas tut. Die anderen merken nichts — also zeigen die drei irgendwann **Verschiedenes**.

**Was konkret passiert** (jede Zeile mit Herkunft):

| # | Szenario | Folge | Beleg |
|---|---|---|---|
| 1 | In Evidence einen Stern setzen, **dann** ins Dashboard | das Dashboard hat **seine** Kopie, zeigt den alten Zähler (oder lädt neu aus dem `localStorage`, dann **doppelte Wahrheit**) | in Demo 3 live gemessen für die **Status**-Änderung: nach der Änderung zeigte das Dashboard weiter "1 Reviewed" (die Änderung steckte nur in Evidence) |
| 2 | Änderung geht beim Seitenwechsel **verloren**, weil der State mit der Komponente ausgehängt wird | der Nutzer stellt E03 auf "reviewed", wechselt zum Dashboard und zurück: wieder "unreviewed" | in Demo 3 live gemessen (nur noch 1 reviewed-Karte statt 2) |
| 3 | **Zwei Schreiber** überschreiben sich im `localStorage`: jede Komponente speichert **ihre** Liste | die zuletzt speichernde Seite gewinnt, die Bookmarks der anderen sind weg ("Lost Update") | aus dem Code abgeleitet, nicht gesondert gemessen |
| 4 | Man ändert **eine** Stelle (Evidence-Karte) und muss an **zwei weitere** denken (Dashboard-Zähler, Workspace-Liste) | beim nächsten neuen Nutzer (z. B. ein Bookmark-Zähler in der Kopfzeile) muss man wieder an alles denken; vergisst man eine Stelle, **veraltet** sie still | vanilla-Dashboard-Zähler (UE1, in Demo 4 beschrieben); der Zähler stand auf 0, bis man neu lud |
| 5 | **Drei Parser, drei Key-Strings** für `remotion_bookmarks` | ändert sich das Format, muss man drei Stellen finden | bis Demo 4 gab es tatsächlich zwei (Evidence/`storage.ts` und `dashboard/bookmarks.ts` mit kopiertem Key-String) |

**Die zwei Fehlerklassen dahinter** (die Angabe nennt sie in Demo 9):
- **Duplizierter State** — dieselbe Tatsache (welche Beweisstücke sind gemerkt) steht an mehreren Orten.
- **Veralteter State** — eine der Kopien wird nicht aktualisiert, wenn die andere sich ändert.

Beides sind **dieselbe Wurzel**: **mehr als ein Besitzer**. Mit **einem** Besitzer (`PageRouter`) gibt es nichts, was
auseinanderlaufen könnte; die anderen Seiten **lesen** nur.

**Was man dagegen nicht tun sollte:** die drei Kopien durch ein zusätzliches Hin-und-Her-Synchronisieren (z. B. mit
`useEffect`) "reparieren". Das erzeugt noch mehr Stellen, an denen etwas vergessen werden kann. Die Lösung ist
**weniger** State (einer), nicht mehr Synchronisierung.

---

## Demo 6 — Callbacks nach unten reichen

`PageRouter` besitzt den State und gibt den Kindern **Callbacks** (`onToggleBookmark`, `onSaveNote`, `onChangeReview`)
statt der Setter. Den Weg des Bookmark-Callbacks live aus dem React-Baum gelesen (`EvidenceCard → EvidencePage →
PageRouter`: drei Komponenten, zwei Props-Ebenen), den Unterschied zum durchgereichten Setter in einer Sandbox gezeigt
und den Vertrag mit echten Compiler-Fehlern belegt. Details und Messtabellen in `UE5_CHANGES.md`.

### F1: Warum kann (oder sollte) eine tief verschachtelte Kind-Komponente nicht einfach direkt State ändern, der in einem weit entfernten Vorfahren liegt? Was bringt das Herunterreichen eines Callbacks stattdessen?

**Einfach gesagt:** Ein Kind **kann** den State des Vorfahren schon technisch nicht anfassen, und wenn man ihm den **Setter**
gäbe, **sollte** es das nicht: dann kennt jedes Kind die Regeln, und die Regeln gehen auseinander. Mit einem **Callback**
**meldet** das Kind nur, und **eine** Stelle entscheidet.

**Warum es nicht geht (technisch):**

| Grund | Erklärung | Beleg |
|---|---|---|
| **Gültigkeitsbereich** | `bookmarks` und `setBookmarks` sind **lokale Variablen** der Funktion `PageRouter`. Eine andere Funktion kommt nur heran, wenn man ihr den Wert **übergibt** | Compiler: `Cannot find name 'setBookmarks'` |
| **Einbahnstraße der Daten** | Props gehen nur **von oben nach unten**. Ein Prop-Wert ist für das Kind nur-lesen | Compiler: `Property 'push' does not exist on type 'readonly string[]'` (die Props sind als `readonly` typisiert) |
| **Mutieren würde nichts bewirken** | selbst wenn ein Kind das Array verändern könnte, sähe React es nicht (Demo 3: gleiche Referenz → kein Neurendern) | Sandbox Demo 3 |

**Warum man dem Kind den Setter trotzdem nicht geben sollte** (live in der Sandbox `callback-demo.html`):

| Problem | Was passiert | Beleg |
|---|---|---|
| **Regeln wandern in die Kinder** | jedes Kind muss wissen: "umschalten statt anhängen", "speichern nicht vergessen" | Sandbox: Kind B hängt nur an (`[E01, E01]`) und speichert nicht (`Gespeichert: []`) |
| **Abweichende Kopien derselben Regel** | zwei Kinder, zwei Varianten; welche stimmt? | Sandbox: Kind A und Kind B verhalten sich verschieden |
| **Nichts schränkt ein** | der Setter akzeptiert **jeden** Wert (`setBookmarks([])` löscht alles) | Typ des Setters: beliebiges `string[]` |
| **Nicht wiederverwendbar** | die Karte müsste wissen, **wo** der State liegt | `EvidenceCard` kennt nur `onToggleBookmark(id)` und läuft überall |
| **Schwer zu finden, wer ändert** | jedes Kind könnte es sein | mit Callbacks: Suche nach `onToggleBookmark` zeigt alle Auslöser |

**Was ein Callback bringt:**

1. **Eine Stelle für die Regel.** `handleToggleBookmark` berechnet die neue Liste, setzt State und speichert. Alle
   Auslöser nutzen sie; keiner kann sie verbiegen.
2. **Ein schmaler, typisierter Vertrag.** `(evidenceId: string) => void` sagt genau, was das Kind melden darf —
   `onToggleBookmark(42)` und `onToggleBookmark()` sind Compilerfehler (`TS2345`, `TS2554`).
3. **Das Kind bleibt dumm und wiederverwendbar.** `EvidenceCard` weiß nichts über `localStorage`, Router oder
   Besitzer. Man könnte sie in einer Sandbox mit `onToggleBookmark={console.log}` rendern.
4. **Der Datenfluss bleibt lesbar:** Werte laufen **nach unten**, Meldungen **nach oben**. Wer wissen will, wer
   Bookmarks ändert, sucht `onToggleBookmark`.
5. **Kleinste Berechtigung:** nur wer etwas ändern muss, bekommt einen Callback. `WorkspacePage` und `DashboardPage` bekommen
   **keinen**, können also nichts ändern.

**Zum Vergleich vanilla:** `state` ist ein **globales** veränderbares Objekt, das jedes Modul importieren kann
(`dashboard.ts`, `workspace.ts`, `evidence.ts`, `storage.ts`). Dort **kann** jede Datei `state.bookmarks` ändern und
muss selbst daran denken, danach zu speichern. In React gibt es diesen Weg nicht.

### F2: Verfolge einen Callback vom Ort seiner Definition (mit dem echten `useState`-Setter darin) bis zur aufrufenden Komponente. Durch wie viele Komponentenebenen geht er, und fühlt sich das nach "zu viel" an? Wird Prop-Drilling hier bereits zum echten Problem?

**Einfach gesagt:** Der Bookmark-Callback geht durch **drei** Komponenten (`PageRouter` → `EvidencePage` →
`EvidenceCard`), also **zwei Props-Ebenen**. Nur **eine** davon (`EvidencePage`) reicht ihn **bloß weiter**. Das ist **kein**
echtes Problem.

**Der Weg von `onToggleBookmark`** (live aus dem React-Baum gelesen):

```
PageRouter                  definiert handleToggleBookmark   (hier steckt setBookmarks + saveBookmarks)
  └─ <EvidencePage onToggleBookmark={handleToggleBookmark}>      Prop-Ebene 1
       └─ <EvidenceCard onToggleBookmark={onToggleBookmark}>     Prop-Ebene 2
            └─ handleBookmarkClick()  ruft  onToggleBookmark(evidence.id)   (beim Klick auf den Stern)
```

| Messung | Wert |
|---|---|
| Komponentenkette (unsere) | `PageRouter` → `EvidencePage` → `EvidenceCard`: 3 Komponenten, **2 Prop-Ebenen** |
| Dazwischen (nicht unsere) | `Routes`, `RenderedRoute` aus React Router: halten nur unser Element, **kein** Prop-Durchreichen |
| Ist es überall **dieselbe** Funktion? | ja (`===` auf beiden Ebenen) |
| Props gesamt | `EvidencePage` **6**, `EvidenceDetail` **7**, `EvidenceCard` **4** |
| Davon **nur durchgereicht** (von `EvidencePage` nie selbst aufgerufen) | **3**: `onToggleBookmark`, `onSaveNote`, `onChangeReview` |
| `onSaveNote` / `onChangeReview` | `PageRouter` → `EvidencePage` → `EvidenceDetail`: ebenfalls 2 Prop-Ebenen |

**Fühlt sich das nach "zu viel" an?** Nein. Die Gründe:

1. **Die Tiefe ist klein.** Zwei Ebenen, und die mittlere (`EvidencePage`) ist keine reine Rohrleitung: sie **benutzt**
   `bookmarks`, `notes` und `reviewEdits` selbst, besitzt die Filter und setzt Karten und Detail zusammen. Dass sie
   nebenbei drei Callbacks weiterreicht, ist Teil ihrer Aufgabe ("Komposition").
2. **Die Weitergabe ist sichtbar und geprüft.** Ändert sich die Signatur eines Callbacks, meldet TypeScript **alle drei
   Stellen** als Fehler. Nichts bleibt unbemerkt (anders als beim "heimlichen" Zugriff auf globalen State).
3. **Änderungsgrund.** Würde sich `PageRouter` ändern, müsste nur `EvidencePage` angepasst werden, nicht die Karte.

**Was mir trotzdem auffällt** (ehrlich, die Stelle, an der es **anfangen** könnte, weh zu tun): nicht die **Tiefe**, sondern die
**Menge** — `EvidencePage` hat **6** Props, `EvidenceDetail` **7**. Würde man noch ein Feature ergänzen (z. B. Notiz
löschen), käme ein siebtes dazu. Das ist das Signal, über **Bündeln** (ein `actions`-Objekt) oder **Context**
nachzudenken (Demo 8), nicht über Weglassen.

**Meine Schwelle, ab der Prop-Drilling ein echtes Problem wird:**

| Zeichen | Hier? |
|---|---|
| ≥ 3 Ebenen, auf denen eine Komponente eine Prop **nur** weiterreicht | nein (eine Ebene) |
| dieselbe Prop an **vielen** weit entfernten Stellen gebraucht | nein (die Nutzer hängen alle **direkt** unter `PageRouter`, eine Ebene tief) |
| Zwischen-Komponenten müssen sich ändern, **obwohl** sie die Prop nicht interessiert | nein (`EvidencePage` benutzt sie / gehört zur Aufgabe) |
| Props-Liste so lang, dass man den Überblick verliert | **an der Grenze** (6 bis 7) |

**Fazit:** heute **handhabbar**. Für diese App in ihrer jetzigen Größe ist Weiterreichen **gut genug**. Demo 8 prüft, ob
Context sich lohnt; mein Zwischenstand ist: noch nicht, aber die Prop-Menge in `EvidencePage` ist der Kandidat für die
erste Entlastung.

---

## Demo 7 — `useReducer` für den Filter-Zustand

Die sieben Filterwerte der Evidence-Seite (Suche, Typ, Person, Ort, Status, Relevanz, Sortierung) sind jetzt **ein**
`useReducer` mit drei Aktionen (`SET_FILTER`, `SET_SORT`, `CLEAR_FILTERS`). Das Verhalten ist gegenüber vanilla
unverändert (dieselben 22 Kombinationen, "Clear" lässt die Sortierung stehen). Der Reducer ist eine **reine Funktion** in
`filterReducer.ts`. Details und Messtabellen in `UE5_CHANGES.md`.

### F1: Warum passt dieser Zustand ("Evidence-Filter") besser zu `useReducer` als ein Haufen einzelner `useState`? Was wurde konkret einfacher, nachdem du umgestellt hast?

**Einfach gesagt:** Die sieben Werte **gehören zusammen** (immer gemeinsam gelesen, oft gemeinsam geändert,
gemeinsam zurückgesetzt) und ändern sich auf **wenige, benennbare Arten**. Dafür ist ein Reducer gemacht: er sammelt
**alle** Übergänge an einer Stelle und gibt jedem einen Namen.

**Woran man erkennt, dass ein Reducer passt:**

| Merkmal | Evidence-Filter |
|---|---|
| mehrere **zusammengehörige** Werte | 7 Werte, alle beeinflussen dieselbe Liste |
| Änderungen auf **wenige Arten** | "einen Filter setzen", "Sortierung setzen", "alles zurücksetzen" |
| Ein Übergang **berührt mehrere Werte** | `CLEAR_FILTERS` setzt sechs Werte und lässt einen stehen |
| Die **Regeln** der Übergänge sind selbst Wissen | "Clear lässt die Sortierung" ist eine Regel (wie vanilla) |

**Was konkret einfacher wurde** (gemessene Zahlen aus `UE5_CHANGES.md`):

| # | Vorher (7× `useState`) | Nachher (`useReducer`) |
|---|---|---|
| 1 | Filter-Code in `EvidencePage`: **49** Codezeilen | **11** Zeilen in der Seite + **25** im Reducer |
| 2 | Ein `switch` mit **7 Fällen** für **7 Setter** in der Komponente | **2** Zweige (`sort` oder nicht), der Rest ist `SET_FILTER` |
| 3 | "Clear": **6 Setter** nacheinander von Hand | **1** Aktion, die Regel steht im Reducer |
| 4 | Das Zustandsobjekt für Toolbar und Filterfunktion **von Hand** aus sieben Variablen zusammengesetzt | der Zustand **ist** das Objekt (`filters`) |
| 5 | Zustandsübergänge **verstreut** in Handlern der Komponente | alle in **einer** reinen Funktion, **ohne React testbar** (live mit eingefrorenem Zustand ausprobiert) |
| 6 | Ein neuer Filter: neuer `useState` + neuer `case` + neuer Setter in Clear + Feld im Objekt (**vier** Stellen) | neues Feld im Typ + im `INITIAL_FILTERS` (der Compiler erzwingt es); `SET_FILTER` und `CLEAR_FILTERS` funktionieren **unverändert** |
| 7 | Eine "Tippfehler-Sortierung" (`"newest"`) kommt als String an und wird erst im Handler geprüft | der Aktionstyp `SET_SORT` verlangt ein `SortOrder`: `"newest"` ist ein **Compilerfehler** |

**Ehrlich, was nicht besser wurde:**
- Es ist **nicht dramatisch weniger Code** (36 gegen 49 Zeilen). Der Gewinn liegt in der **Struktur**.
- Es gibt **mehr Wörter** ("dispatch", "Aktion", "Reducer") für jemanden, der es zum ersten Mal sieht. Für **einen**
  Zähler oder **ein** Suchfeld wäre `useReducer` übertrieben, dort ist `useState` richtig.

**Meine Faustregel:** `useState` für **ein** unabhängiges Stück Zustand; `useReducer`, sobald **mehrere zusammengehörige** Werte
**mehrere Arten** von Änderung haben, vor allem wenn eine Änderung **mehrere Werte gleichzeitig** berührt.

### F2: Zeig deine `CLEAR_FILTERS`-Aktion. Wie macht ein Reducer "mehrere zusammengehörige Werte auf einmal, konsistent zurücksetzen" leichter richtig zu machen, als sie einzeln zurückzusetzen?

**Einfach gesagt:** Die Antwort auf "wie sieht ein **leerer** Filter aus?" steht **einmal** (`INITIAL_FILTERS`), und `CLEAR_FILTERS`
**benutzt** sie, statt sie zu **wiederholen**. Vergessen ist dadurch nicht mehr möglich.

**Die Aktion** (`filterReducer.ts`):

```ts
case "CLEAR_FILTERS":
  // wie vanilla: Suche und die fünf Filter leeren, die SORTIERUNG bleibt
  return { ...INITIAL_FILTERS, sort: state.sort };
```

**Der Auslöser** (`EvidencePage.tsx`): `dispatch({ type: "CLEAR_FILTERS" })`: eine Zeile.

**Vorher** (Demo 4/5) standen sechs Setter von Hand:

```tsx
setSearch(""); setTypeFilter(""); setPersonFilter(""); setLocationFilter(""); setStatusFilter(""); setRelevanceFilter("");
```

**Warum der Reducer das leichter richtig macht** — vier Gründe, jeder prüfbar:

| # | Grund | Erklärung |
|---|---|---|
| 1 | **Eine Quelle für "leer"** | `INITIAL_FILTERS` ist der Startwert **und** das Ergebnis von Clear. Ändert sich ein Startwert, ändert sich Clear automatisch. Vorher stand `""` an zwei Orten (`useState("")` **und** `setX("")`) |
| 2 | **Der Compiler erzwingt Vollständigkeit** | `INITIAL_FILTERS` ist vom Typ `EvidenceFilters` und **muss** jedes Feld enthalten. Ein achtes Feld `tag` ohne Startwert ist ein Compilerfehler: `Property 'tag' is missing in type … but required in type 'EvidenceFilters'` (echt gemessen). Man **kann** das neue Feld nicht in Clear vergessen |
| 3 | **Eine Aktion, ein Render** | alle Werte ändern sich **in einem** Zustandsübergang. Bei sechs Settern fasst React sie zwar im selben Event zusammen, aber **die Verantwortung**, keinen zu vergessen, liegt beim Autor jedes Handlers |
| 4 | **Die Ausnahme steht an einer Stelle** | "die Sortierung bleibt" ist **eine Zeile** im Reducer (`sort: state.sort`). Vorher war sie nur dadurch ausgedrückt, dass ein Setter **fehlt** — die Absicht war unsichtbar (man sah nicht, ob `setSort` absichtlich fehlt oder vergessen wurde) |

**Konsistent heißt auch:** nach `CLEAR_FILTERS` ist der Zustand **immer** ein gültiger `EvidenceFilters` (alle sieben Felder
vorhanden). Mit einzelnen Settern gibt es kurz Zwischenzustände (halb geleert), im selben Render sieht man sie nicht,
aber **in der Logik** existieren sie.

**Live belegt:** der Reducer mit **eingefrorenem** Zustand `{ search: "x", …, sort: "title-desc" }` aufgerufen →
`CLEAR_FILTERS` liefert alle Filter `""`, `sort` bleibt `"title-desc"`, das Ergebnis ist ein **neues** Objekt
(weder das alte noch `INITIAL_FILTERS`). In der App: Suche `log` und alle fünf Filter gesetzt, Sortierung `title-asc`
(1 Karte) → nach "Clear filters" 18 Karten, Sortierung bleibt.

### F3: Ist `useReducer` grundsätzlich etwas anderes als `useState`, oder ist `useState` im Grunde ein Spezialfall derselben Idee? Begründe.

**Einfach gesagt:** `useState` ist ein **Spezialfall** von `useReducer`. Es ist derselbe Mechanismus mit einem
**eingebauten**, besonders einfachen Reducer ("ersetze den Zustand durch das, was ich dir gebe").

**Der Beweis aus dem installierten React-Quelltext** (React 19.3.0, `react-dom-client.development.js`):

```js
function basicStateReducer(state, action) {
  return "function" === typeof action ? action(state) : action;
}
// beim Einhängen von useState:   lastRenderedReducer: basicStateReducer
// bei jedem weiteren Render:     useState: function () { return updateReducer(basicStateReducer); }
```

`useState` ruft **intern denselben `updateReducer`** auf wie `useReducer` und gibt ihm den **eingebauten** Reducer
`basicStateReducer`.

**Die Übersetzung:**

| `useState` | als `useReducer` gedacht |
|---|---|
| `const [x, setX] = useState(0)` | `const [x, dispatch] = useReducer(basicStateReducer, 0)` |
| `setX(5)` | `dispatch(5)`, der Reducer gibt `5` zurück ("ersetze") |
| `setX(prev => prev + 1)` | `dispatch(prev => prev + 1)`, der Reducer erkennt eine **Funktion** (`typeof action === "function"`) und ruft sie mit dem alten Zustand auf |

Die **Funktionsform** des Setters (`setReviewEdits(previous => …)` aus Demo 3) ist also nichts anderes als eine **Aktion, die
eine Funktion ist**.

**Was beide gemeinsam haben** (weil es dieselbe Maschine ist): `Object.is`-Vergleich des neuen mit dem alten Zustand
(gleiches Objekt → kein Neurendern, siehe Demo 3), gebündelte Updates, eine **stabile** `dispatch`-/Setter-Funktion
(ändert ihre Identität zwischen Renderings nicht), Zustand pro Komponenten-Instanz.

**Was sich unterscheidet** (die **Entscheidung, wo die Regeln stehen**, nicht die Maschine):

| | `useState` | `useReducer` |
|---|---|---|
| Wer legt fest, was eine Änderung bewirkt? | **jeder Aufrufer** (er baut den neuen Wert selbst) | **der Reducer**, an einer Stelle |
| Was schickt man los? | den **neuen Wert** | eine **Aktion** ("was ist passiert"), nicht "wie wird es" |
| Wo wohnt die Logik? | verstreut in Handlern der Komponente | in einer **reinen Funktion**, außerhalb der Komponente |
| Typisch gut für | ein unabhängiger Wert (Schalter, Zähler, ein Textfeld) | zusammengehörige Werte mit benannten Übergängen |

**Die Konsequenz:** man kann **jedes** `useState` als `useReducer` schreiben und umgekehrt (ein Reducer mit einer einzigen
Aktion "ersetze" **ist** `useState`). Die Wahl ist **eine Frage der Lesbarkeit**, nicht der Möglichkeiten. Deshalb ist die Regel
aus F1 eine Faustregel, kein Gesetz.

---

## Demo 8 — Context, und wann man ihn nicht benutzt

Die Bookmarks laufen jetzt über einen `BookmarksProvider` (um die Routen in `PageRouter`) und werden von Dashboard,
Evidence und Workspace mit `useBookmarks()` gelesen; Props `bookmarks`/`onToggleBookmark` gibt es nicht mehr (insgesamt
11 → 7 Props von `PageRouter` nach unten). Notizen und Status-Änderungen bleiben bei Props. Die Entscheidung "ist Context hier richtig?"
steht mit Zahlen in `UE5_CHANGES.md` (Task 2): **knapp, nur für die Bookmarks**.

### F1: Welches Problem löst Context tatsächlich? Was löst er *nicht* (viele erwarten, dass er wie globale Zustandsverwaltung funktioniert; wo bricht diese Erwartung zusammen)?

**Einfach gesagt:** Context löst **Weiterreichen**: einen Wert vom Besitzer zu **tief liegenden** Komponenten bringen, ohne dass
jede dazwischen ihn als Prop weiterreicht. Er ist **kein** Zustandsspeicher und **keine** Zustandsverwaltung.

**Was Context löst:**

| Problem | Wie Context hilft |
|---|---|
| Prop-Drilling: Komponenten **dazwischen** reichen etwas nur weiter | Leser holen sich den Wert direkt (`useBookmarks()`); die Zwischen-Komponenten wissen nichts davon |
| **Querschnitts**-Daten (Thema, Sprache, aktueller Nutzer, hier: Bookmarks), die viele Stellen brauchen | **ein** Provider, viele Leser |
| Wert für **Komponenten in anderen Ästen** des Baums (z. B. Header **und** Seite) | der Provider sitzt über beiden |

**Was Context nicht löst — wo die "globaler Store"-Erwartung bricht** (jede Zeile mit Beleg):

| Erwartung | Realität | Beleg |
|---|---|---|
| "Context **hält** den State" | Context **transportiert** nur. Der State steht in `useState`/`useReducer` des Providers. Ohne Provider-Komponente gibt es keinen Zustand | `BookmarksProvider` besitzt `useState(loadBookmarks)`; `createContext` allein speichert nichts |
| "Ich lese nur **einen Teil**, also rendere ich nur bei Änderung dieses Teils neu" | **Nein.** Ändert sich der Wert (die Referenz), rendern **alle** Leser neu. Es gibt **keine Auswahl** ("Selektor") | Sandbox: **B liest nur `b`** und rendert bei jedem `a + 1` mit (2×, 3×, 4× …) |
| "`memo()` verhindert das" | **Nein.** Ein geänderter Context-Wert ist keine Prop, `memo` greift nicht | Sandbox: "A in `memo()`" zählt jede Änderung mit |
| "Es ist **überall** verfügbar" | **Nur unter dem Provider.** Außerhalb: kein Wert | Sandbox: `Outside` bekommt `null`; in der App: ohne Provider **bricht die Seite ab** (`useBookmarks() must be used inside <BookmarksProvider>`) |
| "Es kümmert sich um **Persistenz**, Caching, Laden" | **Nein.** Das macht der Provider selbst (bei uns `saveBookmarks` im Handler) | `BookmarksContext.tsx` ruft `loadBookmarks`/`saveBookmarks` selbst auf |
| "Ich kann aus **jeder** Stelle ändern" | nur, wenn der Provider eine **Änderungs-Funktion** mit in den Wert legt (bei uns `toggle`). Ein Context ist von sich aus **nur-lesen** | der Wert `{ bookmarks, toggle }` |
| "Ich sehe, **wer** was liest" | Die Abhängigkeit **steht nicht** in der Signatur der Komponente | `DashboardPage(reviewEdits)`: man sieht nicht, dass sie Bookmarks liest |

**Eine praktische Folge:** der Wert muss **stabil** bleiben (`useMemo` im Provider), sonst rendern alle Leser **jedes Mal**
mit, wenn der Provider neu rendert, auch wenn sich nichts geändert hat. Für **viele, oft wechselnde** Werte reicht ein Context
nicht (dort nimmt man Bibliotheken mit Selektoren oder mehrere kleine Contexts).

**Context ist auch kein Fremdkörper:** `Routes` und `RenderedRoute` aus React Router "lesen Context" (live im Baum gesehen). Router,
Thema, Formular-Bibliotheken nutzen ihn intern.

### F2: Geh noch einmal zur Callback-Tiefe aus Demo 6. War Prop-Drilling dort tatsächlich ein Problem (lästig, fehleranfällig, lösenswert) oder ein handhabbares? Was ist deine Schwelle, ab der du zu Context greifst, statt noch eine Ebene weiterzureichen?

**Einfach gesagt:** In Demo 6 war es **handhabbar**, kein echtes Problem. Meine Schwelle: **Context erst, wenn das Durchreichen
anfängt, die Zwischen-Komponenten zu belasten** — nicht wegen der Tiefe allein.

**Was Demo 6 gemessen hat:** 3 Komponenten (`PageRouter → EvidencePage → EvidenceCard`), 2 Props-Ebenen, 3 nur
durchgereichte Callbacks, `EvidencePage` mit **6** Props.

**Meine Schwelle** (ich greife zu Context, wenn **mindestens eines** zutrifft):

| Zeichen | Warum es zählt | In dieser App? |
|---|---|---|
| **≥ 3 Ebenen**, auf denen eine Komponente eine Prop **nur** weiterreicht | Rohrleitungs-Komponenten, die sich ändern müssen, obwohl sie die Prop nicht interessiert | **nein**, eine |
| Dieselbe Prop an **vielen** (≳ 4) weit auseinanderliegenden Stellen | man schreibt dieselbe Prop immer wieder | **nein**, 3, alle direkt unter dem Router |
| Eine Komponente **außerhalb** des Teilbaums braucht den Wert (z. B. Zähler in der Kopfzeile) | mit Props müsste der State über das **gemeinsame** Elternteil mehrerer Äste, die Props-Kette wächst in **zwei** Richtungen | **noch nicht** |
| Die Props-Liste einer Komponente ist so lang, dass sie unlesbar wird (≳ 6) | Lesbarkeit | `EvidencePage` hatte genau 6 → Grenzfall |

**War es dort ein Problem?** **Nein**, aus den Gründen in Demo 6 F2: kleine Tiefe, geprüfte Typen (ein
geänderter Callback meldet TypeScript an **allen** Stellen), und `EvidencePage` ist keine reine Rohrleitung.

**Warum ich die Schwelle trotzdem nicht strenger angewendet habe:** ein Grenzfall (6 Props) plus die Tatsache, dass die Bookmarks
der **einzige app-weite** State sind, haben für **diesen einen** Fall gereicht (Entscheidung in `UE5_CHANGES.md`, Task 2:
"knapp"). Für Notizen und Status-Änderungen **nicht**: ihre Leser sind weniger oder nicht "Leser", sondern Daten-Layer.

**Faustregel in einem Satz:** *eine Ebene mehr durchreichen kostet fast nichts, ein Context kostet unsichtbare Abhängigkeiten, deshalb
erst bei einem **klaren** Schmerz* (Rohrleitungs-Komponenten, Leser außerhalb des Teilbaums, unlesbare Prop-Listen).

### F3: "Unnötiger globaler Zustand" wird ausdrücklich als häufiges Problem genannt. Könnte der Einsatz von Context hier ein Beispiel dafür sein, obwohl Context technisch nicht dasselbe ist wie eine globale Variable?

**Einfach gesagt:** **Ja, kann es** — wenn man ihn für Dinge benutzt, die nur **eine** Stelle braucht, oder aus Bequemlichkeit
("dann muss ich nichts durchreichen"). Technisch ist Context **besser** als eine globale Variable, aber **die Gefahr ist dieselbe**:
alles ist von überall lesbar, und man sieht nicht mehr, wer was braucht.

**Was Context von einer globalen Variable unterscheidet (die Vorteile):**

| | globale Variable (vanilla `state`) | Context |
|---|---|---|
| Wer kann es **ändern**? | jedes Modul, das es importiert | nur über die **Funktion**, die der Provider in den Wert legt (`toggle`) |
| Wird React **benachrichtigt**? | nein, man muss von Hand neu rendern (UE1-Fehler) | ja, Leser rendern bei Änderung neu |
| **Geltungsbereich** | ganze App | nur der **Teilbaum** unter dem Provider; verschiedene Teilbäume können **verschiedene** Werte haben |
| **Austauschbar**? | schwer | ja: in einer Sandbox/im Test einen anderen Provider-Wert geben |

**Was sie gemeinsam haben (die Nachteile, die "unnötiger globaler Zustand" meint):**

| Problem | Bei Context | Bei uns |
|---|---|---|
| **Unsichtbare Abhängigkeit**: man sieht an der Signatur nicht, was die Komponente liest | ja | `DashboardPage(reviewEdits)` liest Bookmarks, ohne dass es in den Props steht |
| **Zu großer Radius**: der Wert ist für **alle** darunter erreichbar, auch für die, die ihn nicht brauchen | ja | `BookmarksProvider` umschließt **alle** Routen; auch `TimelinePage`, People & Co. **könnten** Bookmarks lesen (tun es nicht) |
| **Wiederverwendbarkeit leidet**: eine Komponente, die `useBookmarks()` ruft, braucht einen Provider und kann nicht einfach "irgendwo" stehen | ja | `useBookmarks()` **wirft** ohne Provider; deshalb liest die **Karte** den Context **nicht** selbst, sondern bekommt Props |
| **Verleitet dazu, zu viel hineinzulegen** ("wenn schon ein Context, dann auch …") | ja | wir haben **bewusst nicht** Filter, Formular-Entwurf, Notizen oder Status hineingelegt |

**Was ich bewusst lokal gelassen habe** (damit der Context keine "Müllhalde" wird): die **sieben Filterwerte** (nur `EvidencePage`), der
**Hypothesen-Entwurf** (nur das Formular), das **geöffnete Detail** (die URL). Hätte ich die in einen App-weiten Context gelegt, **wäre** das
"unnötiger globaler Zustand" gewesen: niemand außerhalb der Seite braucht sie, und jede Änderung hätte alle Leser neu gerendert.

**Ist der Bookmark-Context selbst ein Beispiel für unnötigen globalen Zustand?** **Grenzfall, nicht eindeutig.** Dagegen spricht: die
Bookmarks werden von **drei** Seiten gelesen und sind **fachlich app-weit** (wie Thema oder Nutzer). Dafür spricht: heute reichen auch **Props**
(F2), der Radius ist größer als nötig (alle Routen), und die Abhängigkeit ist unsichtbar. Deshalb steht in `UE5_CHANGES.md`:
"knapp, und nur für die Bookmarks" — und die Rückfall-Option (zurück zu Props) ist ein Handgriff.

---

## Demo 9 — Häufige State-Probleme finden und beheben

Das eigene Code-Review über die fünf Problemklassen (duplizierter State, veralteter State, Prop-Drilling, unnötiger globaler
State, Mutieren). Drei echte Fälle behoben: die Daten wurden von **fünf** Seiten einzeln geladen (60 statt 10 Anfragen bei fünf
Seitenwechseln), `applyReviewEdits` und die Prop `reviewEdits` steckten in **drei** Seiten, und ein **alter** Timer blendete im Hypothesen-Formular
die Meldung zu früh aus. Details, Messwerte und Bilanz in `UE5_CHANGES.md`.

### F1: Für jedes der zwei (hier drei) behobenen Probleme: in welche der fünf Kategorien fiel es, und wie hast du es bemerkt (sichtbarer Fehler, Code-Review-artiges Wiederlesen, React DevTools, etwas anderes)?

**Einfach gesagt:** zwei Funde waren **Duplizierter State** (Kopien derselben Tatsache), einer **Veralteter State** (ein überholter Timer). Bemerkt
habe ich sie **durch Wiederlesen und Zählen im Code** und erst danach **im Browser gemessen**. Keiner war als Fehler **sichtbar**,
bevor ich gezielt hinsah.

| Fall | Kategorie | Wie bemerkt | Warum es nicht von selbst auffiel |
|---|---|---|---|
| **1:** Daten in **fünf** Seiten geladen | **Duplizierter State** (fünf Kopien derselben Daten, fünf Kopien desselben Lade-Blocks) | **Code-Review per Suche:** `useCaseData()` in fünf Dateien. Zweite Stufe: **Netzwerk-Messung** (`performance`-Einträge: 10 Anfragen pro Seitenwechsel, 60 gesamt) | Die Seite sieht **richtig** aus. Die Daten sind klein und lokal, jede Anfrage dauert Millisekunden |
| **2:** `reviewEdits` an drei Seiten, `applyReviewEdits` dreifach | **Duplizierter State** (dieselbe **Ableitung** an drei Stellen) und **Prop-Drilling** | **Code-Review per Suche:** `applyReviewEdits(` hatte drei Aufrufer, `reviewEdits` stand in drei Signaturen | Heute **stimmen** alle drei. Der Fehler wäre erst bei der **vierten** Seite entstanden, die es vergisst |
| **3:** "Saved"-Timer | **Veralteter State** (ein überholter Timer ändert den State) | **Wiederlesen** der eigenen Notiz aus Demo 2 ("zwei Klicks, zwei Timer"), dann **live reproduziert** (bei 2,2 s war die Meldung nach dem zweiten Speichern schon weg) | Man klickt "Save" meistens **einmal**. Nur wer schnell zweimal klickt, sieht es |

**Was ich nicht benutzt habe:** React DevTools. Die Fälle zeigten sich in der **Struktur** (Aufrufer zählen) und im
**Netzwerk-Verkehr**, nicht in einem Komponentenbaum. DevTools wären für Fall 1 hilfreich gewesen ("welche Komponenten halten diesen State?"),
ich habe stattdessen den React-Baum per Skript gelesen, wie in Demo 6.

**Wie ich suche** (eine wiederholbare Methode): (1) **Wer ruft das auf?** (Aufrufer zählen: `useCaseData`, `applyReviewEdits`, `useState`), (2) **Wo steht dieselbe
Tatsache noch?** (zweiter Speicherort, zweite Berechnung), (3) **Was startet etwas, das sich selbst überholt?** (Timer, Anfragen),
(4) **Stimmt die Zahl bei einer Wiederholung?** (zweimal klicken, zweimal wechseln).

**Was ich außerdem geprüft und nicht gefunden habe:** **Mutieren** (Textsuche nach `.push/.splice/.sort/...`: nur lokale Arrays und Kopien),
**unnötigen globalen State** (nur der in Demo 8 abgewogene Grenzfall: `BookmarksProvider` um alle Routen).

### F2: Welches der fünf benannten Probleme (duplizierter State, veralteter State, Prop-Drilling, unnötiger globaler State, Mutieren) ist die Geschichte dieser App (die Fehler aus Übung 1) am deutlichsten ein Beispiel für? Erkläre die Verbindung direkt.

**Einfach gesagt:** **Duplizierter State.** Die drei Fehler aus der Einleitung der Angabe (veralteter Zähler, State an zwei Orten,
abgeleitet gegen gespeichert) und der Aliasing-Fehler haben **eine Wurzel**: dieselbe Tatsache stand **mehr als einmal** da und musste
**von Hand** gleich gehalten werden. Veraltete Werte und Mutationsfehler sind die **Folgen**.

**Die Fehler aus Übung 1, jeweils auf die Wurzel zurückgeführt:**

| vanilla-Fehler (UE1) | Wo stand die Tatsache **zweimal**? | Folge |
|---|---|---|
| **Dashboard-Zähler konnte veralten** | im State (`state.bookmarks`) **und** als Text im DOM, den `renderDashboard()` beim Rendern hineinschrieb | der DOM-Text wurde **nicht** nachgeführt, wenn die Bookmarks sich änderten (Guard `viewRendered.dashboard`) = **veralteter State** |
| **Bookmark an zwei Orten** | `state.bookmarks` (ID-Liste) **und** das Feld `ev.bookmarked` an jedem Beweisstück | beide mussten bei jeder Änderung von Hand gleich gehalten werden (`applyStoredBookmarkFlags`) |
| **`filteredEvidence === allEvidence`** | `state.allEvidence` **und** `state.filteredEvidence`, am Anfang **dasselbe** Array unter zwei Namen | `filteredEvidence.sort()` ordnete die Master-Liste mit um = **Mutieren** über eine geteilte Referenz |
| **Abgeleitet mit Gespeichert verwechselt** | die gefilterte Liste und der Zähler wurden **gespeichert**, obwohl sie sich aus den Rohdaten berechnen lassen | jede Quelländerung brauchte ein Nachführen |
| **Dashboard-Zähler 2, Liste 1** (in Demo 4 live gezeigt) | "wie viele" (`state.bookmarks.length`) und "welche" (gefilterte Liste) | die zwei Darstellungen liefen auseinander |

**Die Verbindung in einem Satz:** *veralteter State* beschreibt, **wie** es kaputtgeht (die Kopie wurde nicht nachgeführt), *Mutieren*
beschreibt **einen Mechanismus** (zwei Namen für dasselbe Array); aber **die Ursache** ist jedes Mal die **doppelte Darstellung**.

**Warum nicht die anderen drei?**

| Kandidat | Warum nicht "am deutlichsten" |
|---|---|
| Veralteter State | ist das **Symptom**, nicht die Ursache (siehe oben). Er tritt in vanilla nur **auf**, weil es Kopien gab |
| Mutieren | betrifft **einen** der Fehler (Sortieren); der Bookmark- und der Zähler-Fehler sind keine Mutationen |
| Prop-Drilling | vanilla hatte **keine Props**: ein globales `state`-Objekt, das jedes Modul importiert. Das ist eher **unnötiger globaler State** (ein Schlüssel für alle) als Drilling |
| Unnötiger globaler State | trifft auf `state` zu, erklärt aber die **Zähler-/Bookmark-Fehler** nicht: die passierten, **weil** Daten doppelt standen, nicht weil sie global waren |

**Der Beleg, dass es dieselbe Familie ist** (aus dieser Demo): **mein eigener Fall 2 war derselbe Fehler in neuem Gewand.** Drei Seiten legten die
Änderungen **selbst** über die Daten, jede hatte ihre **eigene** Ableitung: eine Kopie der Regel an drei Orten, von Hand gleich zu halten.
Die React-Antwort ist durchgehend dieselbe: **eine Quelle, alles andere wird abgeleitet** (Demo 4, 5, 9).

---
