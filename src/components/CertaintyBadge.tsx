import type { Certainty } from "../../js/types";

// ue4 demo 2 - technik "lookup/mapping": welche badge-variante gehoert zu
// welcher certainty? in der vanilla-app war das eine if-kette
// (certaintyBadgeClass() in js/views/timeline.ts). Record<Certainty, string>
// zwingt den compiler, ALLE drei faelle zu behandeln - kommt ein vierter
// certainty-wert in types.ts dazu, meldet tsc hier sofort einen fehler.
const BADGE_VARIANT: Record<Certainty, string> = {
  confirmed: "reviewed",
  reported: "flagged",
  contradictory: "critical",
};

interface CertaintyBadgeProps {
  certainty: Certainty;
}

export function CertaintyBadge({ certainty }: CertaintyBadgeProps) {
  // "?? unreviewed": die vanilla-version hatte diesen fallback. die typen
  // sagen, er sei unnoetig - aber JSON-daten werden von tsc nie geprueft
  // (UE2 demo 6 F2: E12 hatte "Reviewed" gross), also bleibt er als netz.
  const variant = BADGE_VARIANT[certainty] ?? "unreviewed";
  return <span className={`badge badge-${variant}`}>{certainty}</span>;
}
