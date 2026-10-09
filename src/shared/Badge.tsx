import type { ReactNode } from "react";

// die fuenf varianten, die styles.css kennt (.badge-critical, .badge-reviewed, ...).
// geschlossener union-typ statt "string": ein tippfehler ("revewed") ist ein
// compiler-fehler und kein stiller, ungestylter badge.
export type BadgeVariant = "reviewed" | "flagged" | "unreviewed" | "critical" | "relevant";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

// ue4 demo 7 - wiederverwendbarer baustein. wird von CertaintyBadge (timeline),
// StatusBadge (dashboard) und CaseSummaryCard (dashboard) benutzt.
//
// FEST in der komponente: das <span>, die basis-klasse "badge", das namensschema
// "badge-<variante>". VARIABEL per prop: nur `variant` (wie sieht er aus) und
// `children` (was steht drin).
//
// bewusst KEINE props fuer: grossschreibung (der aufrufer macht .toUpperCase()),
// fach-begriffe wie "status"/"certainty" (die komponente soll nicht wissen, was
// ein badge BEDEUTET - das mappen die wrapper in den features), `className`
// zum durchreichen (damit koennte man das variantenvokabular umgehen) oder
// klick-verhalten. siehe UE4_THEORIE_ANTWORTEN demo 7 F1.
export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
