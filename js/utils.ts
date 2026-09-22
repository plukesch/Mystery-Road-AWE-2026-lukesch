// ---------------------------------------------------------------------
// KLEINE FORMAT-/LOOKUP-UTILS (kein state, keine imports -> pur)
// nur die sachen hier rein die WIRKLICH von mehreren views gebraucht werden
// ---------------------------------------------------------------------
// demo 10: pure einzeiler-artige helfer ohne `this` -> arrow functions.
// als const exportiert; werden nur zur laufzeit aus anderen funktionen
// aufgerufen, hoisting ist also egal.
// demo 5 (ue2): erste .ts-datei. komplett eigenstaendig (keine imports),
// deshalb der einfachste moegliche erster schritt - kein any noetig.

// string | undefined | null statt any: so wird ts.timestamp/ev.time aus den
// json-daten wirklich benutzt - kann fehlen, ist aber nie eine zahl/objekt.
// demo 5 live-vorfuehrung: naechste zeile kurz reinlassen -> "npm run build"
// bricht schon bei tsc ab, "vite build" laeuft gar nicht erst an.
// const kaputterTest: string = 5;

export const formatDate = (ts: string | undefined | null): string => {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return (
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
};

export const getStatusBadgeClass = (status: string | undefined | null): string => {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
};

// nur evidence nutzt das aktuell, aber gehoert thematisch zu getStatusBadgeClass
// -> zusammen halten, damit man beide an einer stelle findet
export const getRelevanceBadgeClass = (relevance: string | undefined | null): string => {
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-unreviewed";
};
