// ---------------------------------------------------------------------
// DER FILTER-REDUCER des evidence-katalogs (ue5 demo 7)
// eine REINE funktion: (alter zustand, aktion) -> neuer zustand. kein React,
// kein DOM, kein localStorage - sie laesst sich mit ganz normalen aufrufen
// ausprobieren. alle uebergaenge des filter-zustands stehen HIER, an einer
// stelle; EvidencePage ruft nur noch dispatch(aktion) auf.
// vorher (demo 4/5): sieben einzelne useState + ein switch mit sieben faellen
// + sechs setter von hand fuer "clear" (siehe UE5_CHANGES demo 7).
// ---------------------------------------------------------------------
import type { EvidenceFilters, SortOrder } from "./evidenceHelpers";

// die sechs felder, die per SET_FILTER gesetzt werden: alle Strings ("" = "kein
// filter"). "sort" ist bewusst AUSGENOMMEN: die sortierung ist ein geschlossener
// union-typ (SortOrder) und hat eine eigene aktion. so kann man mit SET_FILTER
// keine beliebige zeichenkette als sortierung einschmuggeln - der compiler lehnt
// `{ type: "SET_FILTER", field: "sort", value: "xyz" }` ab.
export type FilterField = Exclude<keyof EvidenceFilters, "sort">;

// die drei ARTEN von aenderung, die es gibt. ein "discriminated union": das feld
// `type` sagt, welche aktion es ist, und davon haengt ab, welche weiteren felder
// sie hat.
export type FilterAction =
  | { type: "SET_FILTER"; field: FilterField; value: string }
  | { type: "SET_SORT"; sort: SortOrder }
  | { type: "CLEAR_FILTERS" };

// der Startzustand UND zugleich die Antwort auf "wie sieht ein leerer filter
// aus?". weil er vom Typ EvidenceFilters ist, MUSS er jedes feld enthalten:
// kommt ein achtes filter-feld dazu und hier fehlt es, ist das ein Compilerfehler
// (siehe THEORIE_ANTWORTEN demo 7 F2).
export const INITIAL_FILTERS: EvidenceFilters = {
  search: "",
  type: "",
  person: "",
  location: "",
  status: "",
  relevance: "",
  sort: "date-desc",
};

// jeder zweig liefert ein NEUES objekt (demo 3): { ...state, ... } kopiert den
// alten zustand und ueberschreibt nur, was sich aendert. der alte zustand bleibt
// unveraendert. kein "default": TypeScript prueft, dass jeder FilterAction-typ
// behandelt ist - eine vierte aktion ohne eigenen zweig waere ein Compilerfehler
// ("Function lacks ending return statement").
export function filterReducer(state: EvidenceFilters, action: FilterAction): EvidenceFilters {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, [action.field]: action.value };
    case "SET_SORT":
      return { ...state, sort: action.sort };
    case "CLEAR_FILTERS":
      // wie "Clear filters" in vanilla (clearFilters() in js/views/evidence.ts):
      // suche und die fuenf filter werden geleert, die SORTIERUNG bleibt.
      return { ...INITIAL_FILTERS, sort: state.sort };
  }
}
