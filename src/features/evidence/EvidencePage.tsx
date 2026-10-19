// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE (ue5 demo 1) - FEATURE/CONTAINER
// ersetzt den platzhalter aus UE3. spiegelbild von js/views/evidence.ts:
// toolbar, karten-raster, detail-panel. diese seite besorgt die daten und haelt
// die dinge, die NUR sie braucht:
//  - die filter (ein useReducer, demo 7; vorher sieben useState, demo 4)
//  NICHT im state: die sichtbare liste. sie wird bei jedem rendern aus
//  (geladene liste + aenderungen + filter) ABGELEITET (demo 4).
//  - welches beweisstueck geoeffnet ist -> NICHT als useState, sondern in der
//    URL (?open=E04), wie die timeline ihre person (UE4 demo 10). so ist ein
//    geoeffnetes detail verlinkbar, "zurueck" schliesst es, und der
//    "Open"-button im workspace ist einfach ein <Link>.
//
// ue5 demo 5 - STATE NACH OBEN. bookmarks, notizen und status-aenderungen
// gehoeren NICHT mehr dieser seite: sie werden auch vom dashboard, workspace und
// den personen-seiten gelesen. sie leben deshalb im gemeinsamen vorfahren
// (PageRouter) und kommen hier als PROPS an (werte) plus CALLBACKS (aenderungen,
// siehe demo 6). vorher hielt diese seite sie selbst und ging beim wechsel auf
// eine andere seite (entmounten) mitsamt der status-aenderungen unter.
// ue5 demo 9: die beweisstuecke kommen FERTIG als Prop `data` (PageRouter laedt sie
// einmal und legt die status-aenderungen schon darueber). diese seite ruft kein
// useCaseData mehr auf, hat keinen lade-/fehler-block mehr und kennt die prop
// "reviewEdits" nicht mehr.
// ---------------------------------------------------------------------
import { useReducer } from "react";
import { useSearchParams } from "react-router";
import type { CaseData } from "../../shared/useCaseData";
import { useBookmarks } from "../../shared/BookmarksContext";
import type { ReviewEdit } from "../../shared/reviewEdits";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceDetail } from "./EvidenceDetail";
import { EvidenceToolbar } from "./EvidenceToolbar";
import {
  filterEvidence,
  isSortOrder,
  resolveLocationLabels,
  resolvePersonNames,
  sortEvidence,
  uniqueTypes,
  type EvidenceFilters,
} from "./evidenceHelpers";
import { INITIAL_FILTERS, filterReducer } from "./filterReducer";

interface EvidencePageProps {
  data: CaseData;
  notes: Readonly<Record<string, string>>;
  onSaveNote: (evidenceId: string, text: string) => void;
  onChangeReview: (evidenceId: string, edit: ReviewEdit) => void;
}

export function EvidencePage({ data, notes, onSaveNote, onChangeReview }: EvidencePageProps) {
  const { people, locations, evidence } = data;
  // ue5 demo 8: die bookmarks (Wert UND Aenderungs-funktion) kommen aus dem
  // CONTEXT, nicht mehr als Props "bookmarks"/"onToggleBookmark" von PageRouter.
  // die KARTE bleibt trotzdem eine reine darstellung: sie bekommt weiter
  // isBookmarked/onToggleBookmark als Props - diese seite liest den context und
  // reicht an die karte weiter (siehe THEORIE_ANTWORTEN demo 8 F2).
  const { bookmarks, toggle } = useBookmarks();
  // ue5 demo 7: ALLE sieben filter-werte in EINEM useReducer. `filters` ist der
  // aktuelle zustand (das objekt, das vorher aus sieben useStates zusammengesetzt
  // wurde), `dispatch` schickt eine AKTION an den reducer (filterReducer.ts), der
  // den neuen zustand berechnet. der zustand bleibt HIER: nur diese seite braucht ihn.
  const [filters, dispatch] = useReducer(filterReducer, INITIAL_FILTERS);
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- die event-handler, die NUR diese seite betreffen ----

  function handleOpen(evidenceId: string) {
    setSearchParams({ open: evidenceId });
  }

  function handleClose() {
    setSearchParams({});
  }

  // die toolbar meldet (feldname, neuer wert); hier wird daraus eine AKTION.
  // vorher ein switch mit sieben faellen fuer sieben setter, jetzt zwei zweige.
  // "sort" kommt als string aus dem <select>, erst der type guard macht daraus
  // einen SortOrder (ein unbekannter wert wird ignoriert).
  function handleFilterChange(field: keyof EvidenceFilters, value: string) {
    if (field === "sort") {
      if (isSortOrder(value)) dispatch({ type: "SET_SORT", sort: value });
    } else {
      dispatch({ type: "SET_FILTER", field, value });
    }
  }

  // "Clear filters": EINE aktion. WAS dabei zurueckgesetzt wird (alles ausser der
  // sortierung, wie in vanilla), steht im reducer - nicht hier.
  function handleClearFilters() {
    dispatch({ type: "CLEAR_FILTERS" });
  }

  // ---- abgeleitete werte (jeden render neu berechnet, nirgends gespeichert) ----

  // DIE sichtbare liste: (geladene liste + aenderungen) -> filtern -> sortieren.
  // wird bei JEDEM rendern neu gebaut und nirgends gespeichert. aendert sich ein
  // filter, ein bookmark, ein status oder die geladene liste, stimmt sie beim
  // naechsten rendern automatisch - es gibt keinen zweiten "gefilterten" stand,
  // der vergessen werden koennte (siehe THEORIE_ANTWORTEN demo 4).
  const visibleEvidence = sortEvidence(filterEvidence(evidence, filters, people), filters.sort);

  const openId = searchParams.get("open");
  // unbekannte oder leere id -> undefined -> kein panel (wie bei ?person= in UE4).
  // gesucht wird in der VOLLEN liste: das detail oeffnet auch ein beweisstueck,
  // das die filter gerade ausblenden (wie in vanilla).
  const selected = evidence.find((item) => item.id === openId);

  // unten: key={selected.id} am EvidenceDetail. ein anderes beweisstueck = ein
  // NEUES panel (siehe ue4 demo 3 F1) - sonst wuerde die notiz-textarea
  // (defaultValue gilt nur beim ersten rendern) den text des vorherigen
  // beweisstuecks behalten.
  return (
    <section>
      <h2>Evidence Catalogue</h2>
      <EvidenceToolbar
        people={people}
        locations={locations}
        types={uniqueTypes(evidence)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />
      <div className="evidence-grid">
        {visibleEvidence.length === 0 ? (
          <p>No evidence matches the current filters.</p>
        ) : (
          visibleEvidence.map((item) => (
            <EvidenceCard
              key={item.id}
              evidence={item}
              isBookmarked={bookmarks.includes(item.id)}
              onToggleBookmark={toggle}
              onOpen={handleOpen}
            />
          ))
        )}
      </div>
      {selected && (
        <EvidenceDetail
          key={selected.id}
          evidence={selected}
          personNames={resolvePersonNames(selected.personIds, people)}
          locationLabels={resolveLocationLabels(selected.locationIds, locations)}
          note={notes[selected.id] ?? ""}
          onClose={handleClose}
          onSaveNote={onSaveNote}
          onChangeReview={onChangeReview}
        />
      )}
    </section>
  );
}
