import type { ViewName } from "./hooks/useHashRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { EvidencePage } from "./pages/EvidencePage";
import { PeoplePage } from "./pages/PeoplePage";
import { TimelinePage } from "./pages/TimelinePage";
import { WorkspacePage } from "./pages/WorkspacePage";

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
