// ---------------------------------------------------------------------
// DASHBOARD-SEITE (ue3 demo 10, ue4 demo 5 aufgeteilt) - FEATURE/CONTAINER
// beantwortet nur EINE frage: "woher kommen die daten und sind sie schon da?"
// holt sie (useCaseData), behandelt lade-/fehlerzustand und reicht fertige
// daten an DashboardView weiter, die nur noch darstellt. frueher stand beides in
// dieser einen datei (siehe UE4_CHANGES demo 5).
//
// ue5 demo 5: die bookmarks und die status-aenderungen kommen als PROPS vom
// gemeinsamen vorfahren (PageRouter). die seite liest NICHTS mehr selbst aus dem
// localStorage (vorher: ein zugriff auf die aussenwelt mitten im render) -
// und sieht deshalb eine bookmark- oder status-aenderung aus der evidence-seite
// SOFORT, beim naechsten rendern.
// ---------------------------------------------------------------------
import { useCaseData } from "../../shared/useCaseData";
import { bookmarkedEvidence } from "../../shared/bookmarks";
import { applyReviewEdits, type ReviewEdit } from "../../shared/reviewEdits";
import { DashboardView } from "./DashboardView";

interface DashboardPageProps {
  bookmarks: readonly string[];
  reviewEdits: Readonly<Record<string, ReviewEdit>>;
}

export function DashboardPage({ bookmarks, reviewEdits }: DashboardPageProps) {
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

  // abgeleitet, nicht gespeichert (demo 4): die beweisstuecke MIT den
  // aenderungen, und der zaehler als laenge derselben bookmark-liste, die der
  // workspace anzeigt. DashboardView bleibt eine reine funktion ihrer props.
  const evidence = applyReviewEdits(caseDataState.data.evidence, reviewEdits);
  const bookmarkCount = bookmarkedEvidence(evidence, bookmarks).length;
  const data = { ...caseDataState.data, evidence };
  return <DashboardView data={data} bookmarkCount={bookmarkCount} />;
}
