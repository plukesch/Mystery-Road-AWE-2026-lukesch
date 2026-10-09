// ---------------------------------------------------------------------
// DASHBOARD-DARSTELLUNG (ue4 demo 5) - PRESENTATIONAL
// beantwortet nur EINE frage: "wie sieht ein dashboard fuer diese daten aus?"
// reine funktion ihrer props - gleiche props, gleiche ausgabe. kein fetch,
// kein localStorage, kein wissen darueber, woher die daten kommen. deshalb
// laesst sie sich auch mit handgebauten daten rendern (z.b. in einer sandbox).
// die gegenstelle (laden, lade-/fehlerzustand, bookmark-zaehler lesen) ist
// DashboardPage - siehe UE4_THEORIE_ANTWORTEN demo 5 F1.
// ---------------------------------------------------------------------
import type { CaseData } from "../hooks/useCaseData";
import { IntroCard } from "./IntroCard";
import { CaseSummaryCard } from "./CaseSummaryCard";
import { StatCard } from "./StatCard";
import { ReviewProgressBar } from "./ReviewProgressBar";
import { RecentEvidenceList } from "./RecentEvidenceList";
import { RecentTimelineList } from "./RecentTimelineList";

interface DashboardViewProps {
  data: CaseData;
  bookmarkCount: number;
}

export function DashboardView({ data, bookmarkCount }: DashboardViewProps) {
  const { caseData, people, locations, evidence, timeline } = data;

  // abgeleitete werte: reine berechnung aus den props, bei jedem render frisch
  // (kein cache-flag noetig, siehe UE3 demo 10 F2/F3).
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
        <StatCard value={bookmarkCount} label="Bookmarked" />
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
