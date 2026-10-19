import type { Relevance } from "../../../js/types";
import { Badge, type BadgeVariant } from "../../shared/Badge";

interface RelevanceBadgeProps {
  relevance: Relevance;
}

// fach-wrapper wie CertaintyBadge (timeline) und StatusBadge (shared):
// uebersetzt die relevanz in eine badge-variante. spiegelbild von
// getRelevanceBadgeClass() in js/utils.ts - nur "relevant" faerbt sich,
// "unknown" und "irrelevant" sehen aus wie "unreviewed". toLowerCase(), weil
// evidence.json nicht ganz sauber ist (E12 hat "Unknown" gross).
// genau EIN nutzer (EvidenceCard) -> bleibt im feature (regel aus ue4 demo 6).
function relevanceVariant(relevance: string): BadgeVariant {
  return relevance.toLowerCase() === "relevant" ? "relevant" : "unreviewed";
}

export function RelevanceBadge({ relevance }: RelevanceBadgeProps) {
  return <Badge variant={relevanceVariant(relevance)}>{relevance}</Badge>;
}
