import { useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { ROUTES } from "../shared/routes";
import { toggleBookmark } from "../shared/bookmarks";
import type { ReviewEdit } from "../shared/reviewEdits";
import { loadBookmarks, loadNotes, saveBookmarks, saveNotes } from "../shared/storage";
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
// gemeinsame state HIER, nicht mehr in EvidencePage:
//
//   vorher: EvidencePage hielt bookmarks/notizen/aenderungen als eigenen state;
//           Workspace und Dashboard lasen den localStorage ZUSAETZLICH selbst
//           (zweite/dritte Quelle derselben Tatsache); die status-aenderungen
//           gingen beim Seitenwechsel verloren (EvidencePage wurde entmountet).
//   jetzt:  EINE Quelle. jede seite bekommt, was sie braucht, als PROPS; wer
//           etwas aendern will, bekommt eine CALLBACK-funktion (demo 6).
//           PageRouter bleibt beim Seitenwechsel eingehaengt und behaelt den state.
export function PageRouter() {
  // eine FUNKTION als startwert: der localStorage wird nur beim ersten rendern gelesen
  const [bookmarks, setBookmarks] = useState<string[]>(loadBookmarks);
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);
  const [reviewEdits, setReviewEdits] = useState<Record<string, ReviewEdit>>({});

  // die drei aenderungen. jede erzeugt ein NEUES array/objekt (demo 3) und
  // schreibt - wo es persistiert wird - in den localStorage. das passiert im
  // handler, nicht im render.
  function handleToggleBookmark(evidenceId: string) {
    const next = toggleBookmark(bookmarks, evidenceId);
    setBookmarks(next);
    saveBookmarks(next);
  }

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

  return (
    <Routes>
      <Route
        path={ROUTES.dashboard}
        element={<DashboardPage bookmarks={bookmarks} reviewEdits={reviewEdits} />}
      />
      <Route
        path={ROUTES.evidence}
        element={
          <EvidencePage
            bookmarks={bookmarks}
            notes={notes}
            reviewEdits={reviewEdits}
            onToggleBookmark={handleToggleBookmark}
            onSaveNote={handleSaveNote}
            onChangeReview={handleChangeReview}
          />
        }
      />
      <Route path={ROUTES.team} element={<TeamLayout reviewEdits={reviewEdits} />}>
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
      <Route path={ROUTES.timeline} element={<TimelinePage />} />
      <Route
        path={ROUTES.workspace}
        element={<WorkspacePage bookmarks={bookmarks} notes={notes} />}
      />
      {/* unbekannte url -> zurueck aufs dashboard, wie handleHashChange() in
          vanilla. zusaetzlich korrigiert "replace" die adressleiste (in vanilla
          blieb der ungueltige hash stehen). siehe THEORIE_ANTWORTEN demo 8 F2. */}
      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
