// ---------------------------------------------------------------------
// reine hilfsfunktionen fuer den evidence-katalog (ue5 demo 1)
// kein state, kein localStorage: alles kommt als parameter, alles geht als
// rueckgabewert raus - wie timelineHelpers.ts.
// ---------------------------------------------------------------------
import type { Evidence, Location, Person, Relevance, ReviewStatus } from "../../../js/types";

// ue5 demo 3: die funktionen, die ein array/objekt LESEN, nehmen es als
// `readonly Evidence[]` bzw. `readonly string[]`. "readonly" ist ein
// compiler-schutz: auf einem readonly-array gibt es kein push(), sort(),
// splice(), reverse() - ein versehentliches mutieren ist ein TYPFEHLER, bevor
// die seite je laeuft (siehe UE5_THEORIE_ANTWORTEN demo 3 F2).

// neueste zuerst = der default von #sortEvidence in vanilla ("date-desc").
// sortiert eine KOPIE ([...evidence]): Array.sort() sortiert sonst das
// ORIGINAL-array in place - genau der aliasing-fehler aus UE1 demo 2, bei dem
// die urspruengliche reihenfolge dauerhaft verloren ging. mit
// `evidence.sort(...)` statt der kopie waere das hier ein compiler-fehler
// (readonly), nicht erst ein laufzeit-fehler.
export function sortNewestFirst(evidence: readonly Evidence[]): Evidence[] {
  return [...evidence].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// bookmark an/aus als REINE funktion: bekommt die alte liste, gibt eine NEUE
// zurueck, fasst die alte nie an. vanilla (handleBookmarkClick) hat dieselbe
// aktion zweimal mutiert: state.bookmarks.push(id) bzw. ein neu zugewiesenes
// filter-ergebnis, dazu ev.bookmarked = true/false am beweisstueck.
// die zwei zweige liefern beide ein NEUES array: filter() baut immer ein
// neues, [...bookmarks, id] ebenfalls. "bookmarks.push(id); return bookmarks;"
// waere der erste instinkt - dasselbe array mit anderem inhalt, das react
// nicht als geaendert erkennt (siehe demo 3 F1).
export function toggleBookmark(bookmarks: readonly string[], evidenceId: string): string[] {
  return bookmarks.includes(evidenceId)
    ? bookmarks.filter((id) => id !== evidenceId)
    : [...bookmarks, evidenceId];
}

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
export function applyReviewEdits(
  evidence: readonly Evidence[],
  edits: Readonly<Record<string, ReviewEdit>>
): Evidence[] {
  return evidence.map((item) => {
    const edit = edits[item.id];
    return edit ? { ...item, ...edit } : item;
  });
}

// ein <select> liefert IMMER einen string. diese pruefungen sagen dem
// compiler ("type guards"), wann aus dem string einer unserer engeren
// union-typen geworden ist - statt ihn wie vanilla (`as ReviewStatus`) blind
// zuzusichern.
export function isReviewStatus(value: string): value is ReviewStatus {
  return value === "unreviewed" || value === "reviewed" || value === "flagged";
}

export function isRelevance(value: string): value is Relevance {
  return value === "unknown" || value === "relevant" || value === "irrelevant";
}

// die typen fuer das dropdown, kleingeschrieben und ohne doppelte, in der
// reihenfolge ihres ersten auftretens - wie populateEvidenceDropdowns() in
// vanilla. evidence.json ist nicht einheitlich (z. B. "test-report" neben
// "Test-Report"); die vanilla-filter vergleichen deshalb mit toLowerCase().
export function uniqueTypes(evidence: readonly Evidence[]): string[] {
  const types: string[] = [];
  for (const item of evidence) {
    const type = item.type.toLowerCase();
    if (!types.includes(type)) types.push(type);
  }
  return types;
}

// personIds enthaelt meistens eine id ("kernel-colt"), bei E04 aber den
// ANZEIGENAMEN ("Nova Byte", siehe js/types.ts). findet sich keine person zur
// id, wird der rohe wert angezeigt - wie renderEvidenceDetail() in vanilla.
export function resolvePersonNames(personIds: string[], people: Person[]): string[] {
  return personIds.map((id) => people.find((person) => person.id === id)?.name ?? id);
}

export function resolveLocationLabels(locationIds: string[], locations: Location[]): string[] {
  return locationIds.map((id) => {
    const location = locations.find((loc) => loc.id === id);
    return location ? `${location.id} - ${location.name}` : id;
  });
}
