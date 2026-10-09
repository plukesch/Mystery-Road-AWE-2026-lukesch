import { Navigate, Route, Routes } from "react-router";
import { ROUTES } from "../shared/routes";
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
export function PageRouter() {
  return (
    <Routes>
      <Route path={ROUTES.dashboard} element={<DashboardPage />} />
      <Route path={ROUTES.evidence} element={<EvidencePage />} />
      <Route path={ROUTES.team} element={<TeamLayout />}>
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
      <Route path={ROUTES.workspace} element={<WorkspacePage />} />
      {/* unbekannte url -> zurueck aufs dashboard, wie handleHashChange() in
          vanilla. zusaetzlich korrigiert "replace" die adressleiste (in vanilla
          blieb der ungueltige hash stehen). siehe THEORIE_ANTWORTEN demo 8 F2. */}
      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
