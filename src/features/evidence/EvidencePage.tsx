// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE (ue5 demo 1) - FEATURE/CONTAINER
// ersetzt den platzhalter aus UE3. spiegelbild von js/views/evidence.ts:
// toolbar, karten-raster, detail-panel. diese seite besorgt die daten und haelt
// die dinge, die NUR sie braucht:
//  - die sieben filter-werte (7x useState, demo 4; demo 7 fasst sie zu EINEM
//    useReducer zusammen)
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
// ---------------------------------------------------------------------
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useCaseData } from "../../shared/useCaseData";
import { applyReviewEdits, type ReviewEdit } from "../../shared/reviewEdits";
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
  type SortOrder,
} from "./evidenceHelpers";

interface EvidencePageProps {
  bookmarks: readonly string[];
  notes: Readonly<Record<string, string>>;
  reviewEdits: Readonly<Record<string, ReviewEdit>>;
  onToggleBookmark: (evidenceId: string) => void;
  onSaveNote: (evidenceId: string, text: string) => void;
  onChangeReview: (evidenceId: string, edit: ReviewEdit) => void;
}

export function EvidencePage({
  bookmarks,
  notes,
  reviewEdits,
  onToggleBookmark,
  onSaveNote,
  onChangeReview,
}: EvidencePageProps) {
  const caseDataState = useCaseData();
  // ue5 demo 4: die sieben filter-werte, je ein useState (die toolbar ist
  // kontrolliert, siehe EvidenceToolbar). "" = "kein filter". EHRLICH: das ist
  // ein haufen einzelner states, der immer gemeinsam gelesen wird und (clear)
  // gemeinsam zurueckgesetzt werden muss - genau die stelle, an der demo 7 auf
  // useReducer umstellt. sie bleiben HIER: nur diese seite braucht sie.
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [relevanceFilter, setRelevanceFilter] = useState("");
  const [sort, setSort] = useState<SortOrder>("date-desc");
  const [searchParams, setSearchParams] = useSearchParams();

  if (caseDataState.status === "loading") {
    return (
      <section>
        <h2>Evidence Catalogue</h2>
        <p>Loading case file&hellip;</p>
      </section>
    );
  }

  if (caseDataState.status === "error") {
    return (
      <section>
        <h2>Evidence Catalogue</h2>
        <p>Could not load the case data. Please reload the page.</p>
      </section>
    );
  }

  const { people, locations } = caseDataState.data;
  // die angezeigte liste = die geladene liste + die aenderungen des nutzers.
  // berechnet bei JEDEM rendern, nirgends gespeichert (siehe demo 4).
  const evidence = applyReviewEdits(caseDataState.data.evidence, reviewEdits);

  // ---- die event-handler, die NUR diese seite betreffen ----

  function handleOpen(evidenceId: string) {
    setSearchParams({ open: evidenceId });
  }

  function handleClose() {
    setSearchParams({});
  }

  // die toolbar meldet (feldname, neuer wert); hier geht jeder an SEINEN setter.
  // sieben faelle fuer sieben useStates - das ist die schreibarbeit, die demo 7
  // mit einem reducer (eine aktion "SET_FILTER") spart. "sort" kommt als string
  // aus dem <select>, erst der type guard macht daraus einen SortOrder.
  function handleFilterChange(field: keyof EvidenceFilters, value: string) {
    switch (field) {
      case "search":
        setSearch(value);
        break;
      case "type":
        setTypeFilter(value);
        break;
      case "person":
        setPersonFilter(value);
        break;
      case "location":
        setLocationFilter(value);
        break;
      case "status":
        setStatusFilter(value);
        break;
      case "relevance":
        setRelevanceFilter(value);
        break;
      case "sort":
        if (isSortOrder(value)) setSort(value);
        break;
    }
  }

  // "Clear filters": wie in vanilla (clearFilters() in js/views/evidence.ts)
  // werden suche und die fuenf filter geleert, die SORTIERUNG bleibt. sechs
  // setter von hand - vergisst man einen, bleibt ein filter "haengen". (demo 7
  // zeigt, wie ein reducer das an EINER stelle regelt.)
  function handleClearFilters() {
    setSearch("");
    setTypeFilter("");
    setPersonFilter("");
    setLocationFilter("");
    setStatusFilter("");
    setRelevanceFilter("");
  }

  // ---- abgeleitete werte (jeden render neu berechnet, nirgends gespeichert) ----

  // die sieben useStates als EIN objekt - nur zum Weitergeben, kein state.
  const filters: EvidenceFilters = {
    search,
    type: typeFilter,
    person: personFilter,
    location: locationFilter,
    status: statusFilter,
    relevance: relevanceFilter,
    sort,
  };
  // DIE sichtbare liste: (geladene liste + aenderungen) -> filtern -> sortieren.
  // wird bei JEDEM rendern neu gebaut und nirgends gespeichert. aendert sich ein
  // filter, ein bookmark, ein status oder die geladene liste, stimmt sie beim
  // naechsten rendern automatisch - es gibt keinen zweiten "gefilterten" stand,
  // der vergessen werden koennte (siehe THEORIE_ANTWORTEN demo 4).
  const visibleEvidence = sortEvidence(filterEvidence(evidence, filters, people), sort);

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
              onToggleBookmark={onToggleBookmark}
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
