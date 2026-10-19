// ---------------------------------------------------------------------
// reine hilfsfunktionen fuer den evidence-katalog (ue5 demo 1)
// kein state, kein localStorage: alles kommt als parameter, alles geht als
// rueckgabewert raus - wie timelineHelpers.ts.
// ---------------------------------------------------------------------
import type { Evidence, Location, Person, Relevance, ReviewStatus } from "../../../js/types";
import { evidenceMentionsPerson } from "../../shared/personEvidence";

// ue5 demo 3: die funktionen, die ein array/objekt LESEN, nehmen es als
// `readonly Evidence[]` bzw. `readonly string[]`. "readonly" ist ein
// compiler-schutz: auf einem readonly-array gibt es kein push(), sort(),
// splice(), reverse() - ein versehentliches mutieren ist ein TYPFEHLER, bevor
// die seite je laeuft (siehe UE5_THEORIE_ANTWORTEN demo 3 F2).

// ---------------------------------------------------------------------
// ue5 demo 4: FILTERN und SORTIEREN als reine funktionen.
// die sichtbare liste wird bei JEDEM rendern aus (geladene liste + aktuelle
// filter-werte) NEU BERECHNET und nirgends gespeichert. vanilla hat sie
// gespeichert (state.filteredEvidence) und von hand aktuell gehalten - das war
// die quelle der zwei bugs aus der angabe (siehe THEORIE_ANTWORTEN demo 4 F2).
// ---------------------------------------------------------------------

// die vier sortierungen, genau die <option value="...">s von #sortEvidence.
// EINE quelle fuer den union-typ UND die laufzeit-pruefung (isSortOrder).
const SORT_ORDERS = ["date-desc", "date-asc", "title-asc", "title-desc"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export function isSortOrder(value: string): value is SortOrder {
  return (SORT_ORDERS as readonly string[]).includes(value);
}

// alle sieben werte der toolbar. alle strings ("" = "kein filter"), die
// sortierung ist ein geschlossener union-typ. bewusst KEIN zustand: das ist die
// FORM der werte, die die seite aus ihren useStates zusammensetzt (demo 7).
export interface EvidenceFilters {
  search: string;
  type: string;
  person: string;
  location: string;
  status: string;
  relevance: string;
  sort: SortOrder;
}

// spiegelbild von getFilteredEvidence() in js/views/evidence.ts: ein beweisstueck
// bleibt, wenn es JEDEN gesetzten filter erfuellt. lesen nur (filter() baut ein
// NEUES array, das original bleibt unberuehrt) und OHNE dom: vanilla las die
// werte mit getElementById(...).value aus den dropdowns, hier kommen sie als
// parameter. wie in vanilla wird mit toLowerCase() verglichen, weil
// evidence.json nicht einheitlich ist (z. B. "test-report" neben "Test-Report",
// E12 mit "Reviewed").
export function filterEvidence(
  evidence: readonly Evidence[],
  filters: EvidenceFilters,
  people: readonly Person[]
): Evidence[] {
  const searchTerm = filters.search.toLowerCase().trim();
  const person = filters.person ? people.find((p) => p.id === filters.person) : undefined;

  return evidence.filter((item) => {
    if (searchTerm) {
      const haystack = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }
    if (filters.type && item.type.toLowerCase() !== filters.type) return false;
    // person gesetzt, aber unbekannt -> nichts passt (wie in vanilla)
    if (filters.person && (!person || !evidenceMentionsPerson(item, person))) return false;
    if (filters.location && !item.locationIds.includes(filters.location)) return false;
    if (filters.status && item.status.toLowerCase() !== filters.status) return false;
    if (filters.relevance && item.relevance.toLowerCase() !== filters.relevance) return false;
    return true;
  });
}

const timeOf = (item: Evidence): number => new Date(item.timestamp).getTime();

// eine tabelle statt einer if-kette (siehe UE4 demo 2: lookup). Record<SortOrder, …>
// zwingt den compiler zu EINEM eintrag pro sortierung - kommt eine fuenfte
// option dazu und der eintrag fehlt, ist das ein typfehler.
const COMPARATORS: Record<SortOrder, (a: Evidence, b: Evidence) => number> = {
  "date-desc": (a, b) => timeOf(b) - timeOf(a),
  "date-asc": (a, b) => timeOf(a) - timeOf(b),
  "title-asc": (a, b) => a.title.localeCompare(b.title),
  "title-desc": (a, b) => b.title.localeCompare(a.title),
};

// sortiert eine KOPIE ([...evidence]): Array.sort() sortiert sonst das
// ORIGINAL-array in place - genau der aliasing-fehler aus UE1 demo 2, bei dem
// die urspruengliche reihenfolge dauerhaft verloren ging. mit
// `evidence.sort(...)` statt der kopie waere das hier ein compiler-fehler
// (readonly), nicht erst ein laufzeit-fehler.
// (hiess bis ue5 demo 3 sortNewestFirst und konnte nur "neueste zuerst".)
export function sortEvidence(evidence: readonly Evidence[], sort: SortOrder): Evidence[] {
  return [...evidence].sort(COMPARATORS[sort]);
}

// (toggleBookmark() und applyReviewEdits() lagen bis ue5 demo 4 hier. sie
// brauchen jetzt mehrere stellen -> shared/bookmarks.ts bzw. shared/reviewEdits.ts,
// siehe ue5 demo 5.)

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
