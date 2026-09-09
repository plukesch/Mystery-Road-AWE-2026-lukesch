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
    var raw = localStorage.getItem(STORAGE_KEYS.bookmarks);
    var parsed = raw ? JSON.parse(raw) : [];
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

// kein try/catch hier (im gegensatz zu bookmarks) - inkonsistent, bug bleibt drin
export function loadNotesFromStorage() {
  var raw = localStorage.getItem(STORAGE_KEYS.notes);
  if (!raw) {
    state.notesStore = {};
    return;
  }

  state.notesStore = JSON.parse(raw);
}

// gibt ein Promise zurueck obwohl daten schon da sind (fake-async)
// TODO demo 8: seit dem demo-4-fix nirgends mehr aufgerufen -> toter code, kann weg
export function loadNoteAsync(evidenceId) {
  return new Promise(function (resolve) {
    resolve(state.notesStore[evidenceId] || "");
  });
}
