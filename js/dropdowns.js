// ---------------------------------------------------------------------
// DROPDOWN-AGGREGATOR
// populateAllDropdowns ruft in 3 verschiedene view-module rein ->
// eigenes mini-modul, damit data.js nicht alle 3 einzeln importieren muss
// ---------------------------------------------------------------------
import { populateEvidenceDropdowns } from "./views/evidence.js";
import { populateTimelineDropdowns } from "./views/timeline.js";
import { populateHypothesisDropdowns } from "./views/workspace.js";

export function populateAllDropdowns() {
  populateEvidenceDropdowns();
  populateTimelineDropdowns();
  populateHypothesisDropdowns();
}
