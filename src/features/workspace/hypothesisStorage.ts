// ---------------------------------------------------------------------
// localStorage fuer den hypothesen-entwurf (ue5 demo 2)
// spiegelbild von saveHypothesis()/loadHypothesisFromStorage() in
// js/views/workspace.ts - nur OHNE die DOM-zugriffe: vanilla las jedes feld mit
// getElementById(...).value aus der seite und schrieb es genauso zurueck. hier
// bekommt die funktion den entwurf als parameter bzw. liefert ihn zurueck.
// derselbe key wie in vanilla ("remotion_hypothesis"), dieselbe form: ein
// entwurf, der in einer app gespeichert wurde, laedt in der anderen.
// liegt im feature (nicht in shared/): nur der workspace braucht ihn.
// ---------------------------------------------------------------------
import type { HypothesisDraft } from "../../../js/types";

const HYPOTHESIS_KEY = "remotion_hypothesis";

// die felder, die das formular bearbeitet. "savedAt" gehoert nicht dazu: den
// zeitstempel setzt erst das speichern.
export type HypothesisFields = Omit<HypothesisDraft, "savedAt">;

// eine FUNKTION statt einer konstanten: jeder aufruf liefert ein frisches
// objekt samt frischem array - der startwert des formulars teilt sich nie eine
// referenz mit einem anderen.
function emptyHypothesis(): HypothesisFields {
  return {
    suspectId: "",
    nature: "",
    evidenceIds: [],
    confidence: "50",
    explanation: "",
    alternative: "",
  };
}

// der localStorage-inhalt ist zur compile-zeit unbekannt (kann veraltet oder von
// hand veraendert sein) -> "unknown" parsen und jedes feld einzeln pruefen,
// fehlende/falsche felder fallen auf den leeren startwert zurueck. entspricht den
// "|| ''"-fallbacks in vanilla.
export function loadHypothesis(): HypothesisFields {
  const empty = emptyHypothesis();
  try {
    const raw = localStorage.getItem(HYPOTHESIS_KEY);
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return empty;
    const draft = parsed as Partial<Record<keyof HypothesisDraft, unknown>>;
    return {
      suspectId: typeof draft.suspectId === "string" ? draft.suspectId : empty.suspectId,
      nature: typeof draft.nature === "string" ? draft.nature : empty.nature,
      evidenceIds: Array.isArray(draft.evidenceIds)
        ? draft.evidenceIds.filter((id): id is string => typeof id === "string")
        : empty.evidenceIds,
      confidence: typeof draft.confidence === "string" ? draft.confidence : empty.confidence,
      explanation: typeof draft.explanation === "string" ? draft.explanation : empty.explanation,
      alternative: typeof draft.alternative === "string" ? draft.alternative : empty.alternative,
    };
  } catch (err) {
    console.warn("Could not read stored hypothesis draft, ignoring it", err);
    return empty;
  }
}

// true = gespeichert, false = der localStorage hat es abgelehnt (voll, gesperrt).
export function saveHypothesis(fields: HypothesisFields): boolean {
  const draft: HypothesisDraft = { ...fields, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(HYPOTHESIS_KEY, JSON.stringify(draft));
    return true;
  } catch (err) {
    console.error("Could not save hypothesis draft", err);
    return false;
  }
}
