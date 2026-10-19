// ---------------------------------------------------------------------
// DASHBOARD-SEITE (ue3 demo 10, ue4 demo 5 aufgeteilt) - FEATURE/CONTAINER
// beantwortet nur EINE frage: "woher kommen die daten und sind sie schon da?"
// holt sie (useCaseData), behandelt lade-/fehlerzustand, liest die gemerkten
// bookmark-ids aus dem localStorage - und reicht fertige daten an
// DashboardView weiter, die nur noch darstellt. frueher stand beides in
// dieser einen datei (siehe UE4_CHANGES demo 5).
// ---------------------------------------------------------------------
import { useCaseData } from "../../shared/useCaseData";
import { bookmarkedEvidence } from "../../shared/bookmarks";
import { loadBookmarks } from "../../shared/storage";
import { DashboardView } from "./DashboardView";

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
  // ue5 demo 4: der zaehler ist die LAENGE derselben abgeleiteten liste, die der
  // workspace anzeigt (bookmarkedEvidence) - kein eigener zaehler, kein eigener
  // localStorage-key-string mehr (frueher: features/dashboard/bookmarks.ts, ein
  // zweiter parser fuer denselben key).
  const bookmarkCount = bookmarkedEvidence(caseDataState.data.evidence, loadBookmarks()).length;
  return <DashboardView data={caseDataState.data} bookmarkCount={bookmarkCount} />;
}
