// ---------------------------------------------------------------------
// WORKSPACE VIEW (bookmarks list, notes list, hypothesis form)
// hypothesis-storage liegt hier statt in storage.js, weil save/load
// komplett am DOM haengt (form-felder lesen/schreiben)
// ---------------------------------------------------------------------
// demo 7 (ue2): konvertiert.
import state, { STORAGE_KEYS } from "../state.js";
import { navigateTo } from "../navigation.js";
import { openEvidenceDetail } from "./evidence.js";
import { requireElement } from "../dom.js";
import type { HypothesisDraft } from "../types.js";

export function renderWorkspace(): void {
  renderBookmarksList();
  renderNotesList();
  populateHypothesisDropdowns();
  loadHypothesisFromStorage();
}

function renderBookmarksList(): void {
  const container = document.getElementById("bookmarksList");
  if (!container) return;

  const bookmarkedItems = state.allEvidence.filter((ev) => ev.bookmarked);

  if (bookmarkedItems.length === 0) {
    container.innerHTML =
      "<p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>";
    return;
  }

  let html = "";
  for (const ev of bookmarkedItems) {
    html +=
      '<div class="mini-list-item"><strong>' +
      ev.id +
      "</strong> &mdash; " +
      ev.title +
      ' <button type="button" class="btn btn-small btn-secondary" data-open-evidence="' +
      ev.id +
      '">Open</button></div>';
  }
  container.innerHTML = html;

  const openButtons = container.querySelectorAll("[data-open-evidence]");
  for (const btn of openButtons) {
    btn.addEventListener("click", (e) => {
      navigateTo("evidence");
      const id = (e.target as HTMLElement).getAttribute("data-open-evidence");
      if (id) setTimeout(() => openEvidenceDetail(id), 0);
    });
  }
}

interface NoteEntry {
  index: number;
  evidenceId: string;
  title: string;
  text: string;
}

function renderNotesList(): void {
  const container = document.getElementById("notesList");
  if (!container) return;

  const noteEntries: NoteEntry[] = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const ev = state.allEvidence[i];
    if (!ev) continue;
    const note = state.notesStore[ev.id];
    if (note) {
      noteEntries.push({ index: i, evidenceId: ev.id, title: ev.title, text: note });
    }
  }

  if (noteEntries.length === 0) {
    container.innerHTML = "<p>No notes yet. Add one from an evidence item's detail view.</p>";
    return;
  }

  let html = "";
  for (const entry of noteEntries) {
    html +=
      '<div class="mini-list-item"><strong>' +
      entry.evidenceId +
      "</strong> &mdash; " +
      entry.title;
    html += '<div id="noteText-' + entry.index + '">' + entry.text + "</div></div>"; // TODO: user-text via innerHTML - XSS-smell, siehe CHANGES demo 8
  }
  container.innerHTML = html;
}

export function populateHypothesisDropdowns(): void {
  const suspectSelect = document.getElementById("hypSuspect") as HTMLSelectElement | null;
  const evidenceSelect = document.getElementById("hypEvidence") as HTMLSelectElement | null;
  if (!suspectSelect || !evidenceSelect) return;

  const currentSuspect = suspectSelect.value;
  suspectSelect.innerHTML = '<option value="">Select a person…</option>';
  for (const person of state.allPeople) {
    suspectSelect.innerHTML += '<option value="' + person.id + '">' + person.name + "</option>";
  }
  suspectSelect.value = currentSuspect;

  evidenceSelect.innerHTML = "";
  for (const ev of state.allEvidence) {
    evidenceSelect.innerHTML +=
      '<option value="' + ev.id + '">' + ev.id + " - " + ev.title + "</option>";
  }
}

// window-export (index.html: onclick="saveHypothesis()")
export function saveHypothesis(): void {
  const draft: HypothesisDraft = {
    suspectId: requireElement<HTMLSelectElement>("hypSuspect").value,
    nature: requireElement<HTMLSelectElement>("hypNature").value,
    evidenceIds: getSelectedOptions(requireElement<HTMLSelectElement>("hypEvidence")),
    confidence: requireElement<HTMLInputElement>("hypConfidence").value,
    explanation: requireElement<HTMLTextAreaElement>("hypExplanation").value,
    alternative: requireElement<HTMLTextAreaElement>("hypAlternative").value,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.hypothesis, JSON.stringify(draft));
  } catch (err) {
    console.error("Could not save hypothesis draft", err);
    alert("Your hypothesis could not be saved to local storage.");
    return;
  }

  const msg = requireElement("hypothesisSavedMsg");
  msg.classList.remove("hidden");
  setTimeout(() => msg.classList.add("hidden"), 2000);
}

// nur saveHypothesis nutzt das -> privat
function getSelectedOptions(selectEl: HTMLSelectElement): string[] {
  const result: string[] = [];
  for (const option of selectEl.options) {
    if (option.selected) result.push(option.value);
  }
  return result;
}

// demo 5 fix: JSON.parse in try/catch. vorher konnte ein kaputter
// remotion_hypothesis-eintrag renderWorkspace() mit einer SyntaxError abbrechen.
function loadHypothesisFromStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEYS.hypothesis);
  if (!raw) return;

  let draft: unknown;
  try {
    draft = JSON.parse(raw);
  } catch (err) {
    console.warn("Could not read stored hypothesis draft, ignoring it", err);
    return;
  }
  if (!draft || typeof draft !== "object") return;
  // demo 7 fund: ein aus localStorage geladenes (und potenziell von hand
  // editiertes/veraltetes) objekt ist nie garantiert vollstaendig -
  // Partial<HypothesisDraft> statt HypothesisDraft ist die ehrlichere
  // zusicherung, jedes feld bleibt "vielleicht da", genau wie es die
  // bestehenden "|| ''"-fallbacks unten schon immer angenommen haben.
  const parsed = draft as Partial<HypothesisDraft>;

  requireElement<HTMLSelectElement>("hypSuspect").value = parsed.suspectId || "";
  requireElement<HTMLSelectElement>("hypNature").value = parsed.nature || "";
  requireElement<HTMLInputElement>("hypConfidence").value = parsed.confidence || "50";
  requireElement("hypConfidenceValue").textContent = parsed.confidence || "50";
  requireElement<HTMLTextAreaElement>("hypExplanation").value = parsed.explanation || "";
  requireElement<HTMLTextAreaElement>("hypAlternative").value = parsed.alternative || "";

  const evidenceSelect = requireElement<HTMLSelectElement>("hypEvidence");
  const savedIds = parsed.evidenceIds || [];
  for (const option of evidenceSelect.options) {
    option.selected = savedIds.indexOf(option.value) !== -1;
  }
}
