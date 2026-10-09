// ---------------------------------------------------------------------
// DASHBOARD-SEITE (ue3 demo 10, ue4 demo 5 aufgeteilt) - FEATURE/CONTAINER
// beantwortet nur EINE frage: "woher kommen die daten und sind sie schon da?"
// holt sie (useCaseData), behandelt lade-/fehlerzustand, liest den
// bookmark-zaehler aus dem localStorage - und reicht fertige daten an
// DashboardView weiter, die nur noch darstellt. frueher stand beides in
// dieser einen datei (siehe UE4_CHANGES demo 5).
// ---------------------------------------------------------------------
import { useCaseData } from "../hooks/useCaseData";
import { getBookmarkCount } from "../lib/bookmarks";
import { DashboardView } from "../components/DashboardView";

export function DashboardPage() {
  const caseDataState = useCaseData();

  if (caseDataState.status === "loading") {
    return (
      <section>
        <h2>Case Dashboard</h2>
        <p>Loading case file&hellip;</p>
      </section>
    );
  }

  if (caseDataState.status === "error") {
    return (
      <section>
        <h2>Case Dashboard</h2>
        <p>Could not load the case data. Please reload the page.</p>
      </section>
    );
  }

  // der localStorage-zugriff steht hier (feature-seite) und nicht in der
  // darstellung: er ist ein zugriff auf die "aussenwelt", die darstellung
  // soll eine reine funktion ihrer props bleiben.
  return <DashboardView data={caseDataState.data} bookmarkCount={getBookmarkCount()} />;
}
