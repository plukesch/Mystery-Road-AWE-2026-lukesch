import type { Evidence } from "../../js/types";

// die beiden felder, die das detail-panel aendern darf (status, relevanz).
// der nutzer aendert nie ein beweisstueck selbst, sondern fuegt eine
// "aenderung" hinzu: { E03: { status: "reviewed" } }. die geladene liste
// bleibt unberuehrt (siehe applyReviewEdits).
export type ReviewEdit = Partial<Pick<Evidence, "status" | "relevance">>;

// legt die aenderungen ueber die geladene liste und gibt eine NEUE liste
// zurueck. unveraenderte beweisstuecke sind dieselben objekte wie vorher
// (nichts wird kopiert, was sich nicht aendert), geaenderte sind NEUE objekte
// ({ ...item, ...edit } kopiert das alte und ueberschreibt nur die felder der
// aenderung). das original-array und seine objekte werden nie veraendert.
// vanilla hat dagegen direkt am geladenen objekt geschrieben:
// `ev.status = ...` ("direct mutation of the loaded evidence object").
//
// ue5 demo 5: lag bis dahin in features/evidence/evidenceHelpers.ts. seit der
// state nach oben gezogen ist, lesen DREI seiten die beweisstuecke MIT den
// aenderungen (evidence, dashboard, people-locations) -> shared/ (regel aus
// ue4 demo 6).
export function applyReviewEdits(
  evidence: readonly Evidence[],
  edits: Readonly<Record<string, ReviewEdit>>
): Evidence[] {
  return evidence.map((item) => {
    const edit = edits[item.id];
    return edit ? { ...item, ...edit } : item;
  });
}
