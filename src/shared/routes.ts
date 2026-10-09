// ue4 demo 8: die URL-pfade der app an EINER stelle. ersetzt VIEWS/ViewName/
// navigateTo aus navigation.ts (die waren fuer das handgebaute hash-routing
// aus UE3 da). liegt in shared/, weil die shell (NavBar, PageRouter) UND ein
// feature (dashboard/IntroCard, people-locations/TeamLayout) dieselben pfade
// brauchen - ein tippfehler in einem pfad waere sonst ein toter link.
// die pfade gelten HINTER dem "#": der HashRouter (main.tsx) liest
// react.html#/team/people als pfad "/team/people".
export const ROUTES = {
  dashboard: "/",
  evidence: "/evidence",
  team: "/team",
  people: "/team/people",
  locations: "/team/locations",
  timeline: "/timeline",
  workspace: "/workspace",
} as const;
