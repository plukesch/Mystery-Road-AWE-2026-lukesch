import type { ReviewStatus } from "../../../js/types";
import { Badge, type BadgeVariant } from "../../shared/Badge";

interface StatusBadgeProps {
  status: ReviewStatus;
}

// fach-wrapper wie CertaintyBadge (timeline): uebersetzt den review-status in
// eine badge-variante. toLowerCase(), weil evidence.json nicht ganz sauber ist
// (E12 hat "Reviewed" gross, UE2 demo 6 F2) - die vanilla-version
// (getStatusBadgeClass in js/utils.ts) normalisiert ebenfalls. dort liefert die
// funktion einen CSS-klassennamen; hier einen typisierten BadgeVariant.
function statusVariant(status: string): BadgeVariant {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "reviewed";
  if (s === "flagged") return "flagged";
  return "unreviewed";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}
