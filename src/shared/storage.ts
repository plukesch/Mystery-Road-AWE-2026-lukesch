// ---------------------------------------------------------------------
// localStorage-helfer fuer bookmarks und notizen (ue5 demo 1)
// spiegelbild von js/storage.ts, aber OHNE den globalen state aus
// js/state.ts (den importiert die react-seite bewusst nie, siehe
// ARCHITECTURE.md): jede funktion bekommt ihre daten als parameter bzw.
// gibt sie zurueck. dieselben localStorage-keys wie in vanilla, damit beide
// apps im selben browser dieselben bookmarks/notizen sehen.
// liegt in shared/, weil evidence (setzt/liest sie) UND workspace (zeigt sie)
// sie brauchen - zwei nutzer in zwei features (regel aus ue4 demo 6).
// ---------------------------------------------------------------------
const STORAGE_KEYS = {
  bookmarks: "remotion_bookmarks",
  notes: "remotion_notes",
} as const;

// der localStorage-inhalt ist zur compile-zeit unbekannt (nutzer/browser
// koennen ihn veraendern) -> "unknown" parsen und pruefen, nie blind casten.
export function loadBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.bookmarks);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    return [];
  }
}

export function saveBookmarks(bookmarks: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
  } catch (err) {
    console.warn("Could not store bookmarks", err);
  }
}

export function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notes);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    // nur string-werte uebernehmen: ein von hand veraenderter eintrag soll die
    // seite nicht mit einem falschen typ ueberraschen.
    const notes: Record<string, string> = {};
    for (const [evidenceId, text] of Object.entries(parsed)) {
      if (typeof text === "string") notes[evidenceId] = text;
    }
    return notes;
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    return {};
  }
}

export function saveNotes(notes: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
  } catch (err) {
    console.warn("Could not store notes", err);
  }
}
