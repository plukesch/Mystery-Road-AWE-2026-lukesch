// ---------------------------------------------------------------------
// DASHBOARD-VIEW, react-version (ue3 demo 10)
// spiegelbild von js/views/dashboard.ts's renderDashboard() - gleiche
// berechnungen (reviewedCount, progressPct, "letzte 5, umgedreht"), gleiche
// css-klassen (wiederverwendet, keine neuen), aber als komponenten-baum
// statt einer einzigen string-bau-funktion. siehe UE3_THEORIE_ANTWORTEN
// demo 10 fuer den direkten vergleich (F1/F2/F3).
// ---------------------------------------------------------------------
import { useCaseData } from "../hooks/useCaseData";
import { getBookmarkCount } from "../lib/bookmarks";
import { IntroCard } from "../components/IntroCard";
import { CaseSummaryCard } from "../components/CaseSummaryCard";
import { StatCard } from "../components/StatCard";
import { ReviewProgressBar } from "../components/ReviewProgressBar";
import { RecentEvidenceList } from "../components/RecentEvidenceList";
import { RecentTimelineList } from "../components/RecentTimelineList";

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

  const { caseData, people, locations, evidence, timeline } = caseDataState.data;

  // demo 10 fund: reviewedCount/progressPct werden bei JEDEM render dieser
  // funktion frisch aus "evidence" neu berechnet - kein manuelles cache-flag
  // noetig (vgl. vanilla's state.viewRendered.dashboard, js/navigation.ts).
  // react ruft diese funktion beim naechsten render einfach erneut auf.
  let reviewedCount = 0;
  for (const ev of evidence) {
    if ((ev.status || "").toLowerCase() === "reviewed") reviewedCount++;
  }
  const progressPct =
    evidence.length === 0 ? 0 : Math.round((reviewedCount / evidence.length) * 100);

  const recentEvidence = evidence.slice(-5).reverse();
  const recentTimeline = timeline.slice(-5).reverse();

  return (
    <section>
      <h2>Case Dashboard</h2>

      <IntroCard />

      <CaseSummaryCard caseData={caseData} />

      <div className="stat-grid">
        <StatCard value={evidence.length} label="Evidence items" />
        <StatCard value={people.length} label="People" />
        <StatCard value={locations.length} label="Locations" />
        <StatCard value={getBookmarkCount()} label="Bookmarked" />
        <StatCard value={reviewedCount} label="Reviewed" />
      </div>

      <ReviewProgressBar percent={progressPct} />

      <div className="dashboard-columns">
        <RecentEvidenceList items={recentEvidence} />
        <RecentTimelineList items={recentTimeline} />
      </div>
    </section>
  );
}
