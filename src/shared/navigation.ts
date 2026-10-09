// ue4 demo 6: gemeinsames wissen ueber die fuenf views. liegt in shared/, weil
// es von der shell (NavBar, NavButton, PageRouter, useHashRoute) UND von einem
// feature (dashboard/IntroCard) gebraucht wird - mehr als ein nutzer, an
// verschiedenen stellen. vorher steckte VIEWS/ViewName in useHashRoute.ts, was
// das dashboard von der shell abhaengig gemacht haette (siehe ARCHITECTURE.md).
export const VIEWS = ["dashboard", "evidence", "people", "timeline", "workspace"] as const;
export type ViewName = (typeof VIEWS)[number];

// spiegelbild von navigateTo() aus js/navigation.ts.
export function navigateTo(viewName: ViewName): void {
  window.location.hash = viewName;
}
