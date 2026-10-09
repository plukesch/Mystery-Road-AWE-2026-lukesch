import type { CaseFile } from "../../../js/types";

interface CaseSummaryCardProps {
  caseData: CaseFile;
}

export function CaseSummaryCard({ caseData }: CaseSummaryCardProps) {
  return (
    <div className="case-summary-card">
      <h3>{caseData.title || "Case"}</h3>
      <p>
        <span className="badge badge-flagged">{(caseData.status || "unknown").toUpperCase()}</span>
      </p>
      <p>{caseData.summary || ""}</p>
    </div>
  );
}
