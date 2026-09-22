// ---------------------------------------------------------------------
// LOCAL STORAGE HELPERS (bookmarks & notes)
// hypothesis-storage liegt bewusst NICHT hier, weil das stark am DOM haengt
// -> das bleibt im workspace-modul
// ---------------------------------------------------------------------
// demo 7 (ue2): konvertiert.
import state, { STORAGE_KEYS } from "./state.js";

export function saveBookmarksToStorage(): void {
  localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(state.bookmarks));
}

export function loadBookmarksFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.bookmarks);
    // localStorage-inhalt ist zur compile-zeit unbekannt (kommt zur laufzeit
    // vom nutzer/browser) -> JSON.parse ist von natur aus "any", "as unknown"
    // + Array.isArray-check statt any weiterzureichen.
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    state.bookmarks = Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    state.bookmarks = [];
  }
}

export function saveNoteForEvidence(evidenceId: string, text: string): void {
  state.notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(state.notesStore));
}

export function loadNoteForEvidence(evidenceId: string): string {
  return state.notesStore[evidenceId] || "";
}

// demo 5 fix: JSON.parse in try/catch (wie loadBookmarksFromStorage).
// vorher ohne -> ein kaputter remotion_notes-eintrag hat in initApp eine
// SyntaxError geworfen, loadAllData() lief nie -> KOMPLETTE app leer.
export function loadNotesFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notes);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    state.notesStore =
      parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    state.notesStore = {};
  }
}
