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
