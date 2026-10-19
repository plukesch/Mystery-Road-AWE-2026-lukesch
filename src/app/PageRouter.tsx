import { useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { ROUTES } from "../shared/routes";
import { BookmarksProvider } from "../shared/BookmarksContext";
import { applyReviewEdits, type ReviewEdit } from "../shared/reviewEdits";
import { loadNotes, saveNotes } from "../shared/storage";
import { useCaseData } from "../shared/useCaseData";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { EvidencePage } from "../features/evidence/EvidencePage";
import { TeamLayout } from "../features/people-locations/TeamLayout";
import { PeopleTab } from "../features/people-locations/PeopleTab";
import { PersonDetail } from "../features/people-locations/PersonDetail";
import { LocationsTab } from "../features/people-locations/LocationsTab";
import { TimelinePage } from "../features/timeline/TimelinePage";
import { WorkspacePage } from "../features/workspace/WorkspacePage";

// die route-tabelle: URL -> komponente. ersetzt den switch aus demo 9
// (der ueber ein handgebautes "ViewName" lief) - jetzt sagt der router selbst,
// welcher eintrag zur url passt. People & Locations ist eine VERSCHACHTELTE
// route: /team ist das gemeinsame layout (ueberschrift + tab-leiste), die
// kinder /team/people und /team/locations fuellen dessen <Outlet />.
//
// ue5 demo 5 - STATE NACH OBEN GEZOGEN. PageRouter ist die niedrigste
// komponente, die ALLE seiten enthaelt, die bookmarks/notizen/status-aenderungen
// lesen oder aendern (Dashboard, Evidence, Workspace, People). deshalb wohnt der
// gemeinsame state HIER, nicht mehr in EvidencePage; jede seite bekommt, was sie
// braucht, als PROPS, wer etwas aendern will, bekommt eine CALLBACK-funktion (demo 6).
//
// ue5 demo 8 - die BOOKMARKS sind ein CONTEXT geworden (BookmarksProvider um die
// Routen). Dashboard, Evidence und Workspace lesen sie mit useBookmarks().
//
// ue5 demo 9 - DIE DATEN WERDEN HIER EINMAL GELADEN UND EINMAL ZUSAMMENGESETZT.
//   vorher: jede der fuenf seiten rief useCaseData() selbst auf (5 mal derselbe
//           fetch bei JEDEM seitenwechsel, 5 kopien derselben daten, 5 mal der
//           lade-/fehler-block) und drei seiten legten die status-aenderungen
//           selbst ueber die daten (applyReviewEdits an drei stellen, dazu die
//           prop "reviewEdits" an drei seiten).
//   jetzt:  PageRouter laedt EINMAL, behandelt lade-/fehlerzustand EINMAL und legt
//           die aenderungen EINMAL ueber die geladenen beweisstuecke. die seiten
//           bekommen fertige daten (`data`) und wissen nichts mehr von
//           useCaseData oder reviewEdits. siehe UE5_CHANGES demo 9, faelle 1 und 2.
export function PageRouter() {
  const caseDataState = useCaseData();
  // eine FUNKTION als startwert: der localStorage wird nur beim ersten rendern gelesen
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);
  const [reviewEdits, setReviewEdits] = useState<Record<string, ReviewEdit>>({});

  // die zwei aenderungen. jede erzeugt ein NEUES objekt (demo 3) und schreibt -
  // wo es persistiert wird - in den localStorage. das passiert im handler,
  // nicht im render.
  function handleSaveNote(evidenceId: string, text: string) {
    const next = { ...notes, [evidenceId]: text };
    setNotes(next);
    saveNotes(next);
  }

  // verschachteltes unveraenderliches update, zwei ebenen (siehe demo 3):
  //  1. { ...previous, [evidenceId]: ... }  neues aussen-objekt
  //  2. { ...previous[evidenceId], ...edit } neues innen-objekt
  function handleChangeReview(evidenceId: string, edit: ReviewEdit) {
    setReviewEdits((previous) => ({
      ...previous,
      [evidenceId]: { ...previous[evidenceId], ...edit },
    }));
  }

  // technik "early return" (ue4 demo 2): die zwei sonderfaelle werden EINMAL, hier,
  // abgehandelt. alles danach darf davon ausgehen, dass die daten da sind.
  if (caseDataState.status === "loading") {
    return <p>Loading case file&hellip;</p>;
  }

  if (caseDataState.status === "error") {
    return <p>Could not load the case data. Please reload the page.</p>;
  }

  // abgeleitet (demo 4), nicht gespeichert: die geladenen daten, bei denen die
  // beweisstuecke die aenderungen des nutzers tragen.
  const data = {
    ...caseDataState.data,
    evidence: applyReviewEdits(caseDataState.data.evidence, reviewEdits),
  };

  return (
    <BookmarksProvider>
      <Routes>
        <Route path={ROUTES.dashboard} element={<DashboardPage data={data} />} />
        <Route
          path={ROUTES.evidence}
          element={
            <EvidencePage
              data={data}
              notes={notes}
              onSaveNote={handleSaveNote}
              onChangeReview={handleChangeReview}
            />
          }
        />
        <Route path={ROUTES.team} element={<TeamLayout data={data} />}>
          {/* /team allein hat keinen eigenen inhalt -> weiter auf /team/people.
              "replace": der zwischenschritt /team landet nicht in der browser-
              historie, "zurueck" springt also nicht in eine leere zwischenseite. */}
          <Route index element={<Navigate to={ROUTES.people} replace />} />
          <Route path={ROUTES.people} element={<PeopleTab />} />
          {/* ue4 demo 9: route MIT parameter. ":personId" passt auf ein beliebiges
              url-segment (/team/people/nova-byte); der wert steht in der
              komponente per useParams() zur verfuegung. */}
          <Route path={ROUTES.personDetail} element={<PersonDetail />} />
          <Route path={ROUTES.locations} element={<LocationsTab />} />
        </Route>
        <Route path={ROUTES.timeline} element={<TimelinePage data={data} />} />
        <Route path={ROUTES.workspace} element={<WorkspacePage data={data} notes={notes} />} />
        {/* unbekannte url -> zurueck aufs dashboard, wie handleHashChange() in
            vanilla. zusaetzlich korrigiert "replace" die adressleiste (in vanilla
            blieb der ungueltige hash stehen). siehe THEORIE_ANTWORTEN demo 8 F2. */}
        <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
      </Routes>
    </BookmarksProvider>
  );
}
