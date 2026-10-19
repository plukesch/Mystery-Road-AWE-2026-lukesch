// ---------------------------------------------------------------------
// reine hilfsfunktionen fuer den workspace (ue5 demo 1)
// ---------------------------------------------------------------------
import type { Evidence } from "../../../js/types";

export interface NoteEntry {
  evidenceId: string;
  title: string;
  text: string;
}

// die beweisstuecke, deren id in den bookmarks steht - in der reihenfolge der
// evidence-daten, wie renderBookmarksList() in vanilla. vanilla filterte nach
// einem EXTRA-Feld `ev.bookmarked`, das zusaetzlich zu `state.bookmarks`
// gepflegt werden musste (zwei orte fuer dieselbe tatsache). hier gibt es nur
// die id-liste; die beweisstuecke werden daraus abgeleitet (siehe demo 4).
export function bookmarkedEvidence(evidence: Evidence[], bookmarks: string[]): Evidence[] {
  return evidence.filter((item) => bookmarks.includes(item.id));
}

// beweisstuecke mit nicht-leerer notiz. entspricht dem `if (note)` in
// renderNotesList(). vanilla hat dabei eine DOM-id aus dem ARRAY-INDEX gebaut
// ("noteText-" + i, siehe UE4 demo 4 F2); hier reicht die evidence-id als key.
export function noteEntries(evidence: Evidence[], notes: Record<string, string>): NoteEntry[] {
  return evidence.flatMap((item) => {
    const text = notes[item.id];
    return text ? [{ evidenceId: item.id, title: item.title, text }] : [];
  });
}
