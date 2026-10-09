import type { ReviewStatus } from "../../js/types";
import { Badge, type BadgeVariant } from "./Badge";

interface StatusBadgeProps {
  status: ReviewStatus;
}

// fach-wrapper wie CertaintyBadge (timeline): uebersetzt den review-status in
// eine badge-variante. toLowerCase(), weil evidence.json nicht ganz sauber ist
// (E12 hat "Reviewed" gross, UE2 demo 6 F2) - die vanilla-version
// (getStatusBadgeClass in js/utils.ts) normalisiert ebenfalls. dort liefert die
// funktion einen CSS-klassennamen; hier einen typisierten BadgeVariant.
// ue4 demo 9: lag bis dahin in features/dashboard/. seit die person-detailseite
// (people-locations) den status ebenfalls anzeigt, hat die datei ZWEI nutzer in
// zwei features -> nach shared/ umgezogen (regel aus demo 6, siehe ARCHITECTURE.md).
function statusVariant(status: string): BadgeVariant {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "reviewed";
  if (s === "flagged") return "flagged";
  return "unreviewed";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}
