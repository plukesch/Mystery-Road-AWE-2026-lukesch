// ---------------------------------------------------------------------
// WEGWERF-BEISPIEL (ue5 demo 6) - gehoert NICHT zur migrierten app.
// zeigt zwei Wege, wie ein KIND den State des ELTERNTEILS aendern darf:
//  - links:  das Elternteil gibt eine CALLBACK-funktion ("onToggle") nach unten.
//            die REGEL (neu berechnen + speichern) steht an EINER Stelle.
//  - rechts: das Elternteil gibt den SETTER ("setBookmarks") nach unten. jedes
//            Kind baut sich seine eigene Regel - und die gehen auseinander.
// "Speicher" steht fuer den localStorage und ist hier nur ein zweiter State,
// damit man SIEHT, ob gespeichert wurde.
// ---------------------------------------------------------------------
import { useState } from "react";

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function Status({ state, storage }: { state: string[]; storage: string[] }) {
  return (
    <p className="hint-text">
      State: [{state.join(", ")}] &middot; Gespeichert: [{storage.join(", ")}]
    </p>
  );
}

// ---- links: CALLBACK -----------------------------------------------------

interface RightChildProps {
  label: string;
  onToggle: (id: string) => void;
}

// das Kind kennt nur "onToggle(id)". es weiss nicht, wo der State liegt, wie
// umgeschaltet wird, und dass gespeichert wird.
function RightChild({ label, onToggle }: RightChildProps) {
  return (
    <button type="button" className="btn btn-secondary" onClick={() => onToggle("E01")}>
      {label}: E01 an/aus
    </button>
  );
}

function RightParent() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [storage, setStorage] = useState<string[]>([]);

  // die EINE Stelle mit der Regel
  function handleToggle(id: string) {
    const next = toggle(bookmarks, id);
    setBookmarks(next);
    setStorage(next);
  }

  return (
    <div>
      <h3>Callback (richtig)</h3>
      <RightChild label="Kind A" onToggle={handleToggle} />{" "}
      <RightChild label="Kind B" onToggle={handleToggle} />
      <div id="status-right">
        <Status state={bookmarks} storage={storage} />
      </div>
    </div>
  );
}

// ---- rechts: SETTER durchgereicht ----------------------------------------

interface WrongChildProps {
  label: string;
  bookmarks: string[];
  setBookmarks: (next: string[]) => void;
  setStorage?: (next: string[]) => void;
}

// jedes Kind muss die Regel SELBST kennen. Kind A weiss, dass man auch
// speichern muss; Kind B (setStorage fehlt) vergisst es und haengt nur an.
function WrongChild({ label, bookmarks, setBookmarks, setStorage }: WrongChildProps) {
  function handleClick() {
    const next = setStorage ? toggle(bookmarks, "E01") : [...bookmarks, "E01"];
    setBookmarks(next);
    if (setStorage) setStorage(next);
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={handleClick}>
      {label}: E01 an/aus
    </button>
  );
}

function WrongParent() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [storage, setStorage] = useState<string[]>([]);

  return (
    <div>
      <h3>Setter durchgereicht (falsch)</h3>
      <WrongChild
        label="Kind A"
        bookmarks={bookmarks}
        setBookmarks={setBookmarks}
        setStorage={setStorage}
      />{" "}
      <WrongChild label="Kind B" bookmarks={bookmarks} setBookmarks={setBookmarks} />
      <div id="status-wrong">
        <Status state={bookmarks} storage={storage} />
      </div>
    </div>
  );
}

export function CallbackDemo() {
  return (
    <div className="stub-page" style={{ maxWidth: 900 }}>
      <h2>Callback-Demo (Wegwerf-Beispiel)</h2>
      <ol>
        <li>In beiden Spalten: Kind B zweimal klicken, dann Kind A einmal.</li>
        <li>Links bleiben State und "Gespeichert" gleich. Rechts laufen sie auseinander.</li>
      </ol>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <RightParent />
        <WrongParent />
      </div>
    </div>
  );
}
