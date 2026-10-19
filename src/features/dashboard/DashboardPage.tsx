// ---------------------------------------------------------------------
// DASHBOARD-SEITE (ue3 demo 10, ue4 demo 5 aufgeteilt) - FEATURE/CONTAINER
// beantwortet nur EINE frage: "woher kommen die daten und sind sie schon da?"
// holt sie (useCaseData), behandelt lade-/fehlerzustand und reicht fertige
// daten an DashboardView weiter, die nur noch darstellt. frueher stand beides in
// dieser einen datei (siehe UE4_CHANGES demo 5).
//
// ue5 demo 5: die status-aenderungen kommen als PROP vom gemeinsamen vorfahren
// (PageRouter); die seite liest NICHTS aus dem localStorage.
// ue5 demo 8: die bookmarks kommen nicht mehr als Prop, sondern aus dem CONTEXT
// (useBookmarks). die seite sieht eine bookmark-aenderung aus der evidence-seite
// SOFORT, beim naechsten rendern.
// ---------------------------------------------------------------------
import { useCaseData } from "../../shared/useCaseData";
import { useBookmarks } from "../../shared/BookmarksContext";
import { bookmarkedEvidence } from "../../shared/bookmarks";
import { applyReviewEdits, type ReviewEdit } from "../../shared/reviewEdits";
import { DashboardView } from "./DashboardView";

interface DashboardPageProps {
  reviewEdits: Readonly<Record<string, ReviewEdit>>;
}

export function DashboardPage({ reviewEdits }: DashboardPageProps) {
  const caseDataState = useCaseData();
  const { bookmarks } = useBookmarks();

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
