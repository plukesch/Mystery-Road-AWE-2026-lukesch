// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE (ue5 demo 1) - FEATURE/CONTAINER
// ersetzt den platzhalter aus UE3. spiegelbild von js/views/evidence.ts:
// toolbar, karten-raster, detail-panel. diese seite besorgt die daten und haelt
// die dinge, die sich durch klicks und eingaben aendern:
//  - bookmarks   (useState, aus dem localStorage gestartet)
//  - notizen     (useState, aus dem localStorage gestartet)
//  - suchtext    (useState, demo 2: das suchfeld ist kontrolliert)
//  - aenderungen an status/relevanz (useState, demo 3: unveraenderliche updates)
//  - welches beweisstueck geoeffnet ist -> NICHT als useState, sondern in der
//    URL (?open=E04), wie die timeline ihre person (UE4 demo 10). so ist ein
//    geoeffnetes detail verlinkbar, "zurueck" schliesst es, und der
//    "Open"-button im workspace ist einfach ein <Link>.
// provisorisch: bookmarks und notizen leben vorerst HIER, der workspace liest
// sie separat aus dem localStorage. das wird in demo 5 (state nach oben
// ziehen) sauber gemacht.
// ---------------------------------------------------------------------
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useCaseData } from "../../shared/useCaseData";
import { loadBookmarks, loadNotes, saveBookmarks, saveNotes } from "../../shared/storage";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceDetail } from "./EvidenceDetail";
import { EvidenceToolbar } from "./EvidenceToolbar";
import {
  applyReviewEdits,
  resolveLocationLabels,
  resolvePersonNames,
  sortNewestFirst,
  toggleBookmark,
  uniqueTypes,
  type ReviewEdit,
} from "./evidenceHelpers";

export function EvidencePage() {
  const caseDataState = useCaseData();
  // eine FUNKTION (ohne Klammern) als startwert: react ruft sie nur beim ERSTEN
  // rendern auf ("lazy initial state"). mit loadBookmarks() wuerde der
  // localStorage bei JEDEM rendern gelesen und das ergebnis verworfen.
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);
  // ue5 demo 2: der text im suchfeld. ein `useState` FUER das suchfeld - das
  // feld ist kontrolliert (siehe EvidenceToolbar). die liste benutzt ihn ab demo 4.
  const [searchTerm, setSearchTerm] = useState("");
  // ue5 demo 3: die AENDERUNGEN an status/relevanz, nicht eine kopie der liste:
  // { E03: { status: "reviewed" } }. die geladenen beweisstuecke bleiben
  // unberuehrt, die angezeigte liste wird jedes mal daraus abgeleitet (siehe
  // applyReviewEdits und UE5_THEORIE_ANTWORTEN demo 3/4).
  const [reviewEdits, setReviewEdits] = useState<Record<string, ReviewEdit>>({});
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

  // ---- die event-handler (hier steht der echte state-setter) ----

  // jede der drei aenderungen unten erzeugt ein NEUES array bzw. objekt und
  // uebergibt es dem setter - nie wird ein bestehender state veraendert.
  function handleToggleBookmark(evidenceId: string) {
    const next = toggleBookmark(bookmarks, evidenceId);
    setBookmarks(next);
    saveBookmarks(next);
  }

  // verschachteltes unveraenderliches update, zwei ebenen:
  //  1. { ...previous, [evidenceId]: ... }  neues aussen-objekt
  //  2. { ...previous[evidenceId], ...edit } neues innen-objekt
  // beide ebenen muessen neu sein; sonst saehe react ein "gleiches" objekt.
  // die FUNKTIONS-form des setters (previous => ...) arbeitet immer mit dem
  // neuesten stand, auch wenn zwei aenderungen schnell aufeinander folgen.
  function handleChangeReview(evidenceId: string, edit: ReviewEdit) {
    setReviewEdits((previous) => ({
      ...previous,
      [evidenceId]: { ...previous[evidenceId], ...edit },
    }));
  }

  function handleOpen(evidenceId: string) {
    setSearchParams({ open: evidenceId });
  }

  function handleClose() {
    setSearchParams({});
  }

  function handleSaveNote(evidenceId: string, text: string) {
    const next = { ...notes, [evidenceId]: text };
    setNotes(next);
    saveNotes(next);
  }

  // ---- abgeleitete werte (jeden render neu berechnet, nirgends gespeichert) ----

  const openId = searchParams.get("open");
  // unbekannte oder leere id -> undefined -> kein panel (wie bei ?person= in UE4)
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <div className="evidence-grid">
        {sortNewestFirst(evidence).map((item) => (
          <EvidenceCard
            key={item.id}
            evidence={item}
            isBookmarked={bookmarks.includes(item.id)}
            onToggleBookmark={handleToggleBookmark}
            onOpen={handleOpen}
          />
        ))}
      </div>
      {selected && (
        <EvidenceDetail
          key={selected.id}
          evidence={selected}
          personNames={resolvePersonNames(selected.personIds, people)}
          locationLabels={resolveLocationLabels(selected.locationIds, locations)}
          note={notes[selected.id] ?? ""}
          onClose={handleClose}
          onSaveNote={handleSaveNote}
          onChangeReview={handleChangeReview}
        />
      )}
    </section>
  );
}
