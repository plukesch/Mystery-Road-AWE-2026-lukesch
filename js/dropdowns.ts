// ---------------------------------------------------------------------
// DROPDOWN-AGGREGATOR
// populateAllDropdowns ruft in 3 verschiedene view-module rein ->
// eigenes mini-modul, damit data.js nicht alle 3 einzeln importieren muss
// ---------------------------------------------------------------------
// demo 7 (ue2): konvertiert.
import { populateEvidenceDropdowns } from "./views/evidence.js";
import { populateTimelineDropdowns } from "./views/timeline.js";
import { populateHypothesisDropdowns } from "./views/workspace.js";

export function populateAllDropdowns(): void {
  populateEvidenceDropdowns();
  populateTimelineDropdowns();
  populateHypothesisDropdowns();
}
