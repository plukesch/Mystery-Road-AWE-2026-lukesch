// ---------------------------------------------------------------------
// WEGWERF-BEISPIEL (ue5 demo 3) - gehoert NICHT zur migrierten app.
// zeigt dieselbe Aktion ("Bookmark hinzufuegen") zweimal nebeneinander:
// links wird der State MUTIERT (push + derselbe Array zurueck an setState),
// rechts UNVERAENDERLICH ersetzt ([...alt, neu]). die einzige absicht dieser
// datei: sichtbar machen, was React tatsaechlich vergleicht - naemlich die
// REFERENZ, nicht den Inhalt - und dass ein mutierter State manchmal
// "zufaellig" richtig aussieht.
// ---------------------------------------------------------------------
import { memo, useState } from "react";

interface BookmarkSummaryProps {
  bookmarks: string[];
}

// memo(): diese komponente rendert nur dann neu, wenn sich ein PROP geaendert
// hat - und "geaendert" heisst fuer memo: Object.is(altesProp, neuesProp), also
// ein ANDERES array. dasselbe array mit neuem inhalt zaehlt als "nichts
// passiert". genau so vergleicht React auch den State (siehe oben), und so
// entscheiden useMemo/React.memo, ob sie etwas neu berechnen.
const BookmarkSummary = memo(function BookmarkSummary({ bookmarks }: BookmarkSummaryProps) {
  const names = bookmarks.length > 0 ? ` - ${bookmarks.join(", ")}` : "";
  return (
    <p className="hint-text">
      Summary (memo): {bookmarks.length} Bookmark(s){names}
    </p>
  );
});

function nextId(bookmarks: string[]): string {
  return `E${String(bookmarks.length + 1).padStart(2, "0")}`;
}

export function MutationDemo() {
  const [wrong, setWrong] = useState<string[]>([]);
  const [right, setRight] = useState<string[]>([]);
  // ein State, der mit den Bookmarks nichts zu tun hat - er loest nur ein
  // neues Rendern der ganzen Seite aus.
  const [unrelatedClicks, setUnrelatedClicks] = useState(0);

  function addWrong() {
    wrong.push(nextId(wrong)); // MUTIERT das bestehende Array
    setWrong(wrong); // dieselbe Referenz -> React sieht "nichts geaendert"
  }

  function addRight() {
    setRight([...right, nextId(right)]); // NEUES Array
  }

  return (
    <div className="stub-page" style={{ maxWidth: 900 }}>
      <h2>Mutation-Demo (Wegwerf-Beispiel)</h2>
      <ol>
        <li>Links "Bookmark hinzufügen (push)" klicken: sichtbar passiert nichts.</li>
        <li>"Unabhängiges Neurendern": links erscheint der Eintrag, die Summary nicht.</li>
        <li>Rechts dasselbe: sofort richtig, die Summary stimmt.</li>
      </ol>
      <p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setUnrelatedClicks(unrelatedClicks + 1)}
        >
          Unabhängiges Neurendern ({unrelatedClicks})
        </button>{" "}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setWrong([]);
            setRight([]);
          }}
        >
          Zurücksetzen
        </button>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3>Mutiert (falsch)</h3>
          <button type="button" className="btn btn-primary" onClick={addWrong}>
            Bookmark hinzufügen (push)
          </button>
          <ul id="list-wrong">
            {wrong.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          <div id="summary-wrong">
            <BookmarkSummary bookmarks={wrong} />
          </div>
        </div>
        <div>
          <h3>Unveränderlich (richtig)</h3>
          <button type="button" className="btn btn-primary" onClick={addRight}>
            Bookmark hinzufügen ([...alt, neu])
          </button>
          <ul id="list-right">
            {right.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          <div id="summary-right">
            <BookmarkSummary bookmarks={right} />
          </div>
        </div>
      </div>
    </div>
  );
}
