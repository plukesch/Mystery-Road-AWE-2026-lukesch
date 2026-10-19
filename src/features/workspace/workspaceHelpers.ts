// ---------------------------------------------------------------------
// reine hilfsfunktionen fuer den workspace (ue5 demo 1)
// ---------------------------------------------------------------------
import type { Evidence } from "../../../js/types";

export interface NoteEntry {
  evidenceId: string;
  title: string;
  text: string;
}

// (bookmarkedEvidence() lag bis ue5 demo 3 hier. dashboard UND workspace
// brauchen es -> shared/bookmarks.ts, siehe dort.)

// beweisstuecke mit nicht-leerer notiz. entspricht dem `if (note)` in
// renderNotesList(). vanilla hat dabei eine DOM-id aus dem ARRAY-INDEX gebaut
// ("noteText-" + i, siehe UE4 demo 4 F2); hier reicht die evidence-id als key.
export function noteEntries(evidence: Evidence[], notes: Record<string, string>): NoteEntry[] {
  return evidence.flatMap((item) => {
    const text = notes[item.id];
    return text ? [{ evidenceId: item.id, title: item.title, text }] : [];
  });
}
