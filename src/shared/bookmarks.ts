import type { Evidence } from "../../js/types";

// die beweisstuecke, deren id in den bookmarks steht - in der reihenfolge der
// evidence-daten. DIE eine stelle, die aus "welche ids sind gemerkt" ein
// "welche beweisstuecke sind das" macht (ue5 demo 4).
//
// wer das braucht: der workspace (die liste) UND das dashboard (der zaehler,
// als .length). beide leiten aus derselben id-liste mit derselben funktion ab,
// deshalb koennen zaehler und liste nicht auseinanderlaufen - es gibt keinen
// extra gespeicherten zaehler, der "vergessen" werden koennte.
// (vanilla: state.bookmarks.length fuer den zaehler, ein EXTRA-feld
// `ev.bookmarked` fuer die liste - zwei darstellungen derselben tatsache.)
// ids ohne passendes beweisstueck (z. B. ein veralteter localStorage-eintrag)
// werden weder gezaehlt noch angezeigt.
export function bookmarkedEvidence(
  evidence: readonly Evidence[],
  bookmarks: readonly string[]
): Evidence[] {
  return evidence.filter((item) => bookmarks.includes(item.id));
}

// bookmark an/aus als REINE funktion: bekommt die alte liste, gibt eine NEUE
// zurueck, fasst die alte nie an. vanilla (handleBookmarkClick) hat dieselbe
// aktion zweimal mutiert: state.bookmarks.push(id) bzw. ein neu zugewiesenes
// filter-ergebnis, dazu ev.bookmarked = true/false am beweisstueck.
// die zwei zweige liefern beide ein NEUES array: filter() baut immer ein
// neues, [...bookmarks, id] ebenfalls. "bookmarks.push(id); return bookmarks;"
// waere der erste instinkt - dasselbe array mit anderem inhalt, das react
// nicht als geaendert erkennt (siehe ue5 demo 3 F1).
// ue5 demo 5: lag bis dahin in features/evidence/evidenceHelpers.ts. der state
// liegt jetzt in der PageRouter-shell (app/), die keine feature-interna
// importieren soll -> neben bookmarkedEvidence nach shared/.
export function toggleBookmark(bookmarks: readonly string[], evidenceId: string): string[] {
  return bookmarks.includes(evidenceId)
    ? bookmarks.filter((id) => id !== evidenceId)
    : [...bookmarks, evidenceId];
}
