import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Evidence, Person } from "../../../js/types";
import { loadHypothesis, saveHypothesis, type HypothesisFields } from "./hypothesisStorage";

interface HypothesisFormProps {
  people: Person[];
  evidence: Evidence[];
}

// das hypothesen-formular (#hypothesisForm in index.html + populateHypothesis-
// Dropdowns()/saveHypothesis()/loadHypothesisFromStorage() in
// js/views/workspace.ts).
// ue5 demo 2: ALLE sechs felder sind jetzt KONTROLLIERT - ihr angezeigter wert
// kommt aus `values`, jede eingabe laeuft ueber onChange -> setField ->
// neuer state -> neues rendern. vanilla las jedes feld beim speichern mit
// getElementById(...).value aus der seite und schrieb es beim laden genauso
// zurueck; der DOM WAR der zustand. hier ist `values` der zustand, der DOM
// zeigt ihn nur.
// EIN objekt statt sechs useState: die felder gehoeren zusammen (sie werden
// gemeinsam geladen, gespeichert und - spaeter - zurueckgesetzt), und
// HypothesisFields ist schon die form, in der sie im localStorage liegen. siehe
// UE5_THEORIE_ANTWORTEN demo 2 F2.
// zustaendigkeit: diese komponente ist jetzt KEINE reine darstellung mehr, sie
// besitzt den entwurf (und liest/schreibt den localStorage). das ist der
// niedrigste gemeinsame besitzer - kein anderer teil der app braucht den
// entwurf (regel aus demo 5).
export function HypothesisForm({ people, evidence }: HypothesisFormProps) {
  // eine FUNKTION als startwert: der localStorage wird nur beim ersten rendern gelesen
  const [values, setValues] = useState<HypothesisFields>(loadHypothesis);
  const [showSaved, setShowSaved] = useState(false);
  // ue5 demo 9: die ID des laufenden "Saved"-Timers. ein useRef ist ein Wert, der
  // Neurendern UEBERLEBT, aber beim Aendern KEIN Neurendern ausloest (genau
  // richtig fuer eine Timer-ID, die nie angezeigt wird). vorher gab es keine
  // Referenz auf den Timer: ein zweites Speichern startete einen zweiten, und der
  // ERSTE blendete die Meldung zu frueh aus (siehe UE5_CHANGES demo 9, Fall 3).
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ein setter fuer alle felder. `previous` ist der aktuelle stand; das neue
  // objekt kopiert ihn ({ ...previous }) und ersetzt NUR das eine feld - das
  // alte objekt bleibt unveraendert (siehe demo 3). der generische typ K sorgt
  // dafuer, dass zu jedem feld nur der passende werttyp erlaubt ist.
  function setField<K extends keyof HypothesisFields>(field: K, value: HypothesisFields[K]) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  // das multi-select hat keinen einzelnen `.value`: die auswahl sind alle gerade
  // markierten <option>s. daraus wird bei JEDER aenderung ein neues array gebaut.
  function handleEvidenceChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedIds = Array.from(event.target.selectedOptions, (option) => option.value);
    setField("evidenceIds", selectedIds);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saveHypothesis(values)) {
      alert("Your hypothesis could not be saved to local storage.");
      return;
    }
    setShowSaved(true);
    // den alten Timer abbrechen, BEVOR ein neuer startet: nur der letzte Timer zaehlt
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setShowSaved(false), 2000);
  }

  return (
    <div className="hypothesis-card">
      <h3>Hypothesis Draft</h3>
      <form id="hypothesisForm" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="hypSuspect">Suspected responsible person</label>
          <select
            id="hypSuspect"
            value={values.suspectId}
            onChange={(event) => setField("suspectId", event.target.value)}
          >
            <option value="">Select a person…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypNature">Accidental or deliberate incident</label>
          <select
            id="hypNature"
            value={values.nature}
            onChange={(event) => setField("nature", event.target.value)}
          >
            <option value="">Select…</option>
            <option value="accidental">Accidental</option>
            <option value="deliberate">Deliberate</option>
            <option value="unclear">Unclear</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypEvidence">Selected supporting evidence</label>
          {/* multiple: `value` ist ein ARRAY, und das neue array wird aus den
              aktuell markierten <option>s gebaut (selectedOptions). */}
          <select
            id="hypEvidence"
            multiple
            size={6}
            value={values.evidenceIds}
            onChange={handleEvidenceChange}
          >
            {evidence.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} - {item.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypConfidence">Confidence (0&ndash;100)</label>
          <input
            type="range"
            id="hypConfidence"
            min={0}
            max={100}
            value={values.confidence}
            onChange={(event) => setField("confidence", event.target.value)}
          />
          {/* die zahl neben dem regler kommt aus DEMSELBEN zustand wie der regler
              selbst. vanilla hatte dafuer einen extra input-listener in main.ts, der
              hypConfidenceValue.textContent von hand nachfuehrte (zwei orte). */}
          <output id="hypConfidenceValue">{values.confidence}</output>
        </div>

        <div className="form-row">
          <label htmlFor="hypExplanation">Written explanation</label>
          <textarea
            id="hypExplanation"
            rows={4}
            placeholder="Explain your reasoning…"
            value={values.explanation}
            onChange={(event) => setField("explanation", event.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="hypAlternative">Alternative explanation</label>
          <textarea
            id="hypAlternative"
            rows={3}
            placeholder="What else could explain the evidence?"
            value={values.alternative}
            onChange={(event) => setField("alternative", event.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save hypothesis draft
          </button>
          {showSaved && <span className="saved-msg">Saved</span>}
        </div>
      </form>
    </div>
  );
}
