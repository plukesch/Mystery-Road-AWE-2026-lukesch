// ---------------------------------------------------------------------
// KLEINE FORMAT-/LOOKUP-UTILS (kein state, keine imports -> pur)
// nur die sachen hier rein die WIRKLICH von mehreren views gebraucht werden
// ---------------------------------------------------------------------
// demo 10: pure einzeiler-artige helfer ohne `this` -> arrow functions.
// als const exportiert; werden nur zur laufzeit aus anderen funktionen
// aufgerufen, hoisting ist also egal.

export const formatDate = (ts) => {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

export const getStatusBadgeClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
};

// nur evidence nutzt das aktuell, aber gehoert thematisch zu getStatusBadgeClass
// -> zusammen halten, damit man beide an einer stelle findet
export const getRelevanceBadgeClass = (relevance) => {
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-unreviewed";
};
