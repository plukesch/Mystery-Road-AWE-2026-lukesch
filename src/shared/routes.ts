// ue4 demo 8: die URL-pfade der app an EINER stelle. ersetzt VIEWS/ViewName/
// navigateTo aus navigation.ts (die waren fuer das handgebaute hash-routing
// aus UE3 da). liegt in shared/, weil die shell (NavBar, PageRouter) UND
// features (dashboard/IntroCard, people-locations/*) dieselben pfade brauchen -
// ein tippfehler in einem pfad waere sonst ein toter link.
// die pfade gelten HINTER dem "#": der HashRouter (main.tsx) liest
// react.html#/team/people als pfad "/team/people".
export const ROUTES = {
  dashboard: "/",
  evidence: "/evidence",
  team: "/team",
  people: "/team/people",
  // ue4 demo 9: ein MUSTER, kein fertiger pfad - ":personId" ist ein platzhalter.
  // PageRouter registriert damit die route, personPath() baut daraus echte links.
  personDetail: "/team/people/:personId",
  locations: "/team/locations",
  timeline: "/timeline",
  workspace: "/workspace",
} as const;

// baut den link auf die detailseite EINER person. encodeURIComponent: die id
// kommt aus daten (heute immer ein "slug" wie "nova-byte"), landet aber in einer
// url - sonderzeichen wie "/" oder "?" wuerden sonst die route zerreissen.
export function personPath(personId: string): string {
  return `${ROUTES.people}/${encodeURIComponent(personId)}`;
}
