// ---------------------------------------------------------------------
// WEGWERF-BEISPIEL (ue4 demo 4) - gehoert NICHT zur migrierten app.
// zeigt dieselbe liste zweimal nebeneinander: links mit key={index}
// (falsch), rechts mit key={person.id} (richtig). die einzige absicht dieser
// datei: einen SICHTBAREN unterschied erzeugen. deshalb darf sie, anders als
// die echten ue4-komponenten, state benutzen (die liste muss sich ja aendern).
// ---------------------------------------------------------------------
import { useState } from "react";

interface DemoPerson {
  id: string;
  name: string;
}

const INITIAL_PEOPLE: DemoPerson[] = [
  { id: "signal-scholar", name: "Signal Scholar" },
  { id: "kernel-colt", name: "Kernel Colt" },
  { id: "nova-byte", name: "Nova Byte" },
  { id: "patch-vector", name: "Patch Vector" },
];

interface PersonRowProps {
  person: DemoPerson;
}

// jede zeile hat ihren EIGENEN state (die getippte notiz). genau das ist der
// punkt: der state haengt an der komponenten-INSTANZ - und welche instanz zu
// welcher person gehoert, entscheidet allein der key.
function PersonRow({ person }: PersonRowProps) {
  const [note, setNote] = useState("");
  return (
    <li>
      <strong>{person.name}</strong>{" "}
      <input
        type="text"
        placeholder="Notiz"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </li>
  );
}

export function KeyDemo() {
  const [people, setPeople] = useState<DemoPerson[]>(INITIAL_PEOPLE);

  return (
    <div className="stub-page" style={{ maxWidth: 900 }}>
      <h2>key-Demo (Wegwerf-Beispiel)</h2>
      <p>
        1. In eine Zeile eine Notiz tippen. 2. Dann die Liste ändern. Beobachten, bei welcher Person
        die Notiz danach steht.
      </p>
      <p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPeople([...people].reverse())}
        >
          Reihenfolge umdrehen
        </button>{" "}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPeople(people.slice(1))}
        >
          Erste Person entfernen
        </button>{" "}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPeople(INITIAL_PEOPLE)}
        >
          Zurücksetzen
        </button>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3>key=&#123;index&#125; (falsch)</h3>
          <ul id="list-index">
            {people.map((person, index) => (
              <PersonRow key={index} person={person} />
            ))}
          </ul>
        </div>
        <div>
          <h3>key=&#123;person.id&#125; (richtig)</h3>
          <ul id="list-id">
            {people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
