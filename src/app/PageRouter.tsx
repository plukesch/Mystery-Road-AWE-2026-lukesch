import type { ViewName } from "../shared/navigation";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { EvidencePage } from "../features/evidence/EvidencePage";
import { PeoplePage } from "../features/people-locations/PeoplePage";
import { TimelinePage } from "../features/timeline/TimelinePage";
import { WorkspacePage } from "../features/workspace/WorkspacePage";

interface PageRouterProps {
  view: ViewName;
}

// spiegelbild der if/else-if-kette am ende von handleHashChange() (js/navigation.ts),
// die dort entscheidet, welche renderX()-funktion laeuft. hier: welche seiten-
// komponente gerendert wird. ViewName ist ein literal-union (5 feste strings) -
// tsc meldet einen fehler, falls dieser switch je einen fall vergisst
// ("exhaustiveness checking", siehe UE3_THEORIE_ANTWORTEN demo 9 F1).
export function PageRouter({ view }: PageRouterProps) {
  switch (view) {
    case "dashboard":
      return <DashboardPage />;
    case "evidence":
      return <EvidencePage />;
    case "people":
      return <PeoplePage />;
    case "timeline":
      return <TimelinePage />;
    case "workspace":
      return <WorkspacePage />;
  }
}
