import type { CaseFile } from "../../../js/types";
import { Badge } from "../../shared/Badge";

interface CaseSummaryCardProps {
  caseData: CaseFile;
}

export function CaseSummaryCard({ caseData }: CaseSummaryCardProps) {
  return (
    <div className="case-summary-card">
      <h3>{caseData.title || "Case"}</h3>
      <p>
        {/* feste variante "flagged", wie in der vanilla-version (js/views/dashboard.ts):
            der case-status faerbt sich NICHT nach seinem wert. grossschreibung macht
            der aufrufer, nicht die Badge-komponente. */}
        <Badge variant="flagged">{(caseData.status || "unknown").toUpperCase()}</Badge>
      </p>
      <p>{caseData.summary || ""}</p>
    </div>
  );
}
