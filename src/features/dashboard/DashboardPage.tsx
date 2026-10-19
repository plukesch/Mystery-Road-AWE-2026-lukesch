// ---------------------------------------------------------------------
// DASHBOARD-SEITE (ue3 demo 10, ue4 demo 5 aufgeteilt) - FEATURE/CONTAINER
// verbindet die fertigen daten mit dem, was nur diese seite wissen muss: wie viele
// Beweisstuecke gemerkt sind. DashboardView stellt dann nur noch dar. frueher stand
// beides in einer datei (siehe UE4_CHANGES demo 5).
//
// ue5 demo 8: die bookmarks kommen aus dem CONTEXT (useBookmarks). die seite sieht
// eine bookmark-aenderung aus der evidence-seite SOFORT, beim naechsten rendern.
// ue5 demo 9: die seite laedt keine daten mehr (kein useCaseData, kein
// lade-/fehler-block) und kennt die status-aenderungen nicht mehr: `data` kommt
// FERTIG von PageRouter, die beweisstuecke tragen die aenderungen schon.
// ---------------------------------------------------------------------
import type { CaseData } from "../../shared/useCaseData";
import { useBookmarks } from "../../shared/BookmarksContext";
import { bookmarkedEvidence } from "../../shared/bookmarks";
import { DashboardView } from "./DashboardView";

interface DashboardPageProps {
  data: CaseData;
}

export function DashboardPage({ data }: DashboardPageProps) {
  const { bookmarks } = useBookmarks();

  // abgeleitet, nicht gespeichert (demo 4): der zaehler ist die laenge derselben
  // bookmark-liste, die der workspace anzeigt. DashboardView bleibt eine reine
  // funktion ihrer props.
  const bookmarkCount = bookmarkedEvidence(data.evidence, bookmarks).length;
  return <DashboardView data={data} bookmarkCount={bookmarkCount} />;
}
