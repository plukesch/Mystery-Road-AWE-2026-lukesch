// ---------------------------------------------------------------------
// LOCAL STORAGE HELPERS (bookmarks & notes)
// hypothesis-storage liegt bewusst NICHT hier, weil das stark am DOM haengt
// -> das bleibt im workspace-modul
// ---------------------------------------------------------------------
import state, { STORAGE_KEYS } from "./state.js";

export function saveBookmarksToStorage() {
  localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(state.bookmarks));
}

export function loadBookmarksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.bookmarks);
    const parsed = raw ? JSON.parse(raw) : [];
    state.bookmarks = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    state.bookmarks = [];
  }
}

export function saveNoteForEvidence(evidenceId, text) {
  state.notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(state.notesStore));
}

export function loadNoteForEvidence(evidenceId) {
  return state.notesStore[evidenceId] || "";
}

// demo 5 fix: JSON.parse in try/catch (wie loadBookmarksFromStorage).
// vorher ohne -> ein kaputter remotion_notes-eintrag hat in initApp eine
// SyntaxError geworfen, loadAllData() lief nie -> KOMPLETTE app leer.
export function loadNotesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notes);
    const parsed = raw ? JSON.parse(raw) : {};
    state.notesStore = parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    state.notesStore = {};
  }
}
