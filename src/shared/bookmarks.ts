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
