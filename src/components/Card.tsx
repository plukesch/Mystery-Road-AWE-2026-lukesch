import type { ReactNode } from "react";

interface CardProps {
  variant: "person" | "location";
  children: ReactNode;
}

// ue4 demo 1: die "huelle" (rahmen, hintergrund, schatten - alles im css unter
// .person-card/.location-card) ist fuer beide karten gleich, der INHALT nicht.
// deshalb kein daten-prop, sondern children: die aufrufende komponente
// entscheidet selbst, was in der huelle steht (siehe THEORIE_ANTWORTEN demo 1 F3).
export function Card({ variant, children }: CardProps) {
  return <div className={`${variant}-card`}>{children}</div>;
}
