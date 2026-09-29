// ue3 demo 10: liest bewusst NUR den localStorage-key, nicht js/state.ts
// selbst - ein import von dort wuerde das modul mit seinem eigenen mutable-
// state-singleton laden, genau die laufzeit-kopplung, die die demo-6/9-
// trennung (react.html komplett separat von index.html) vermeiden soll.
// der string-key ist deshalb bewusst dupliziert statt importiert - muss von
// hand synchron zu STORAGE_KEYS.bookmarks (js/state.ts) gehalten werden.
// kein reaktiver listener: die evidence-seite (wo bookmarks gesetzt werden)
// ist noch ein platzhalter (kommt ue4/5), der wert kann sich also innerhalb
// der react-app aktuell noch gar nicht aendern - siehe UE3_THEORIE_ANTWORTEN
// demo 10 F1.
const BOOKMARKS_STORAGE_KEY = "remotion_bookmarks";

export function getBookmarkCount(): number {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
