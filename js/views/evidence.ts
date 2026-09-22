// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE + EVIDENCE DETAIL
// liste und detail haengen eng zusammen (openEvidenceDetail aus der liste)
// -> bewusst EIN modul statt zwei
// ---------------------------------------------------------------------
// demo 7 (ue2): konvertiert. lese-schleifen auf for-of umgestellt; ungeguardete
// getElementById-aufrufe ueber requireElement() (js/dom.ts); zwei stellen, wo
// ein <select>-wert (immer "string") explizit auf unsere engeren
// ReviewStatus/Relevance-unions zugesichert wird (siehe UE2_CHANGES.md).
import state from "../state.js";
import { formatDate, getStatusBadgeClass, getRelevanceBadgeClass } from "../utils.js";
import {
  findEvidenceById,
  findPersonById,
  findLocationById,
  evidenceMentionsPerson,
} from "../lookup.js";
import { saveBookmarksToStorage, saveNoteForEvidence, loadNoteForEvidence } from "../storage.js";
import { requireElement } from "../dom.js";
import type { Evidence, ReviewStatus, Relevance } from "../types.js";

export function populateEvidenceDropdowns(): void {
  const typeSelect = document.getElementById("filterType");
  const personSelect = document.getElementById("filterPerson");
  const locationSelect = document.getElementById("filterLocation");
  if (!typeSelect || !personSelect || !locationSelect) return;

  const types: string[] = [];
  for (const ev of state.allEvidence) {
    const t = ev.type.toLowerCase();
    if (types.indexOf(t) === -1) types.push(t);
  }
  typeSelect.innerHTML = '<option value="">All types</option>';
  for (const t of types) {
    typeSelect.innerHTML += '<option value="' + t + '">' + t + "</option>";
  }

  personSelect.innerHTML = '<option value="">All people</option>';
  for (const person of state.allPeople) {
    personSelect.innerHTML += '<option value="' + person.id + '">' + person.name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (const loc of state.allLocations) {
    locationSelect.innerHTML +=
      '<option value="' + loc.id + '">' + loc.id + " - " + loc.name + "</option>";
  }
}

// intern: baut filteredEvidence bei jedem render neu aus allEvidence
function getFilteredEvidence(): Evidence[] {
  const searchBox = document.getElementById("evidenceSearch") as HTMLInputElement | null;
  const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  const typeVal = requireElement<HTMLSelectElement>("filterType").value;
  const personVal = requireElement<HTMLSelectElement>("filterPerson").value;
  const locationVal = requireElement<HTMLSelectElement>("filterLocation").value;
  const statusVal = requireElement<HTMLSelectElement>("filterStatus").value;
  const relevanceVal = requireElement<HTMLSelectElement>("filterRelevance").value;

  const results: Evidence[] = [];
  for (const item of state.allEvidence) {
    let matches = true;

    if (searchTerm) {
      const haystack = (item.title + " " + item.summary + " " + item.tags.join(" ")).toLowerCase();
      if (haystack.indexOf(searchTerm) === -1) matches = false;
    }
    if (matches && typeVal && item.type.toLowerCase() !== typeVal) matches = false;
    if (matches && personVal) {
      const person = findPersonById(personVal);
      if (!person || !evidenceMentionsPerson(item, person)) matches = false;
    }
    if (matches && locationVal && item.locationIds.indexOf(locationVal) === -1) matches = false;
    if (matches && statusVal && (item.status || "").toLowerCase() !== statusVal) matches = false;
    if (matches && relevanceVal && (item.relevance || "").toLowerCase() !== relevanceVal)
      matches = false;

    if (matches) results.push(item);
  }

  state.filteredEvidence = results;
  return results;
}

export function renderEvidenceList(): void {
  const container = document.getElementById("evidenceList");
  if (!container) return;

  const loadingIndicator = document.getElementById("evidenceLoadingIndicator");
  if (state.evidenceViewLoading) {
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }
  if (loadingIndicator) loadingIndicator.classList.add("hidden");

  const results = getFilteredEvidence();
  // demo 5 fix: sortierung hier bei JEDEM render anwenden.
  // vorher hat handleSortChange das filteredEvidence-array einmalig sortiert,
  // aber getFilteredEvidence baut es beim naechsten render frisch aus allEvidence
  // -> sortierung war sofort wieder weg (das dropdown tat sichtbar nichts,
  // sobald die liste nach den demo-2/3-fixes wirklich rendert).
  sortEvidenceInPlace(results);

  let html = "";
  if (results.length === 0) {
    html = "<p>No evidence matches the current filters.</p>";
  }
  for (const ev of results) {
    html += renderEvidenceCardHTML(ev);
  }
  container.innerHTML = html;

  // handleEvidenceListClick ist eine stabile funktionsreferenz -> der browser
  // dedupliziert gleiche (typ, listener) paare, mehrfaches addEventListener hier
  // legt also keinen zweiten listener an. (kein bug, aber siehe demo 8.)
  container.addEventListener("click", handleEvidenceListClick);
}

// results ist ein frisches array aus getFilteredEvidence -> in-place sort ok,
// allEvidence wird nicht angefasst (siehe demo-2-fix).
function sortEvidenceInPlace(list: Evidence[]): void {
  const sortValue = requireElement<HTMLSelectElement>("sortEvidence").value;
  // demo 10: die comparator-callbacks sind reine (a,b)-funktionen ohne `this` -> arrows
  if (sortValue === "title-asc") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortValue === "title-desc") {
    list.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortValue === "date-asc") {
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } else {
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

function renderEvidenceCardHTML(ev: Evidence): string {
  const isBookmarked = state.bookmarks.indexOf(ev.id) !== -1;
  let html = '<div class="evidence-card" data-id="' + ev.id + '">';
  html +=
    '<button class="bookmark-btn ' +
    (isBookmarked ? "active" : "") +
    '" data-action="bookmark" data-id="' +
    ev.id +
    '" aria-label="Toggle bookmark for ' +
    ev.title +
    '"><span class="bookmark-icon">' +
    (isBookmarked ? "★" : "☆") +
    "</span></button>";
  html += "<h3>" + ev.title + "</h3>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div>";
  html += '<div class="evidence-summary">' + ev.summary + "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<span class="badge badge-critical">Critical</span>';
  }
  html += '<span class="badge ' + getStatusBadgeClass(ev.status) + '">' + ev.status + "</span>";
  html +=
    '<span class="badge ' + getRelevanceBadgeClass(ev.relevance) + '">' + ev.relevance + "</span>";
  html += "<div>";
  for (const tag of ev.tags) {
    html += '<span class="tag-chip">' + tag + "</span>";
  }
  html += "</div>";
  html += "</div>";
  return html;
}

function handleEvidenceListClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  // demo 5 fix: vorher wurde nur target.dataset.action geprueft. der klick landet
  // aber oft auf dem <span class="bookmark-icon"> IN dem button -> kein data-action
  // -> stern-klick oeffnete das detail statt zu bookmarken. closest() geht vom
  // klick-ziel nach oben und findet den button auch bei klick aufs innere span.
  const bookmarkBtn = target.closest<HTMLElement>("[data-action='bookmark']");
  if (bookmarkBtn) {
    event.stopPropagation();
    if (bookmarkBtn.dataset.id) handleBookmarkClick(bookmarkBtn.dataset.id);
    return;
  }

  const card = target.closest<HTMLElement>(".evidence-card");
  if (card) {
    const cardId = card.getAttribute("data-id");
    if (cardId) openEvidenceDetail(cardId);
  }
}

function handleBookmarkClick(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  if (state.bookmarks.indexOf(evidenceId) === -1) {
    state.bookmarks.push(evidenceId);
    ev.bookmarked = true;
  } else {
    state.bookmarks = state.bookmarks.filter((id) => id !== evidenceId);
    ev.bookmarked = false;
  }
  saveBookmarksToStorage();
  if (state.currentPage === "evidence") renderEvidenceList();
}

// aus data.js aufgerufen nachdem evidence geladen ist
export function applyStoredBookmarkFlags(): void {
  for (const ev of state.allEvidence) {
    ev.bookmarked = state.bookmarks.indexOf(ev.id) !== -1;
  }
}

// window-export (index.html: <select id="sortEvidence" onchange="handleSortChange()">)
// die eigentliche sortierung passiert jetzt in renderEvidenceList/sortEvidenceInPlace,
// damit sie jeden render ueberlebt. hier reicht der re-render.
export function handleSortChange(): void {
  renderEvidenceList();
}

export function clearFilters(): void {
  requireElement<HTMLInputElement>("evidenceSearch").value = "";
  requireElement<HTMLSelectElement>("filterType").value = "";
  requireElement<HTMLSelectElement>("filterPerson").value = "";
  requireElement<HTMLSelectElement>("filterLocation").value = "";
  requireElement<HTMLSelectElement>("filterStatus").value = "";
  requireElement<HTMLSelectElement>("filterRelevance").value = "";
  renderEvidenceList();
}

// demo 8 (code smell): hier stand vorher simulateAsyncSearch() - ein 300ms-setTimeout,
// der eine netzwerk-suche vortaeuschte, plus ein latestSearchRequestId-race-guard dafuer.
// getFilteredEvidence liest den suchbegriff aber ohnehin live aus dem DOM, jeder andere
// filter rendert also sofort mit. der fake-delay hat das tippen nur traege gemacht.
// -> raus, handleSearchInput macht jetzt dasselbe wie die anderen filter: direkt rendern.
export function handleSearchInput(): void {
  renderEvidenceList();
}

// ---------------------------------------------------------------------
// EVIDENCE DETAIL
// ---------------------------------------------------------------------

export function openEvidenceDetail(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;
  state.selectedEvidence = ev;

  const section = requireElement("evidenceDetailSection");
  section.classList.remove("hidden");

  renderEvidenceDetail(ev);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// window-export (generiertes html: onclick="closeEvidenceDetail()")
export function closeEvidenceDetail(): void {
  const section = requireElement("evidenceDetailSection");
  section.classList.add("hidden");
  section.innerHTML = "";
  state.selectedEvidence = null;
}

function renderEvidenceDetail(ev: Evidence): void {
  const section = requireElement("evidenceDetailSection");

  const personNames: string[] = [];
  for (const personId of ev.personIds) {
    const person = findPersonById(personId);
    personNames.push(person ? person.name : personId);
  }

  const locationNames: string[] = [];
  for (const locationId of ev.locationIds) {
    const loc = findLocationById(locationId);
    locationNames.push(loc ? loc.id + " - " + loc.name : locationId);
  }

  let tagsHtml = "";
  for (const tag of ev.tags) {
    tagsHtml += '<span class="tag-chip">' + tag + "</span>";
  }

  const storedNote = loadNoteForEvidence(ev.id);

  let html = "";
  html += '<div class="evidence-detail-header">';
  html += "<div><h2>" + ev.title + "</h2>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div></div>";
  html +=
    '<button type="button" class="btn btn-secondary btn-small" onclick="closeEvidenceDetail()">Close</button>';
  html += "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<div class="warning-banner">This item is tagged as critical evidence.</div>';
  }

  html += '<div class="detail-field"><strong>Summary</strong>' + ev.summary + "</div>";
  html += '<div class="evidence-detail-content">' + ev.content + "</div>";
  html +=
    '<div class="detail-field"><strong>Related people</strong>' + personNames.join(", ") + "</div>";
  html +=
    '<div class="detail-field"><strong>Related locations</strong>' +
    locationNames.join(", ") +
    "</div>";
  html += '<div class="detail-field"><strong>Tags</strong>' + tagsHtml + "</div>";

  html += '<div class="detail-field"><strong>Review status</strong>';
  html += '<select id="detailStatusSelect">';
  html += statusOptionHTML(ev.status, "unreviewed", "Unreviewed");
  html += statusOptionHTML(ev.status, "reviewed", "Reviewed");
  html += statusOptionHTML(ev.status, "flagged", "Flagged");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Relevance</strong>';
  html += '<select id="detailRelevanceSelect">';
  html += statusOptionHTML(ev.relevance, "unknown", "Unknown");
  html += statusOptionHTML(ev.relevance, "relevant", "Relevant");
  html += statusOptionHTML(ev.relevance, "irrelevant", "Irrelevant");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Investigator note</strong>';
  html +=
    '<textarea id="evidenceNoteInput" class="note-textarea" rows="3" data-evidence-id="' +
    ev.id +
    '" placeholder="Add a private note about this evidence...">' +
    storedNote +
    "</textarea>";
  html +=
    '<button type="button" class="btn btn-primary btn-small" style="margin-top:6px;" onclick="saveCurrentNote()">Save note</button>';
  html += "</div>";

  html +=
    '<div class="detail-field"><strong>Note preview</strong><div id="notePreview">' +
    storedNote +
    "</div></div>";

  section.innerHTML = html;

  // demo 10: addEventListener-callbacks als arrows. sie lesen e.target, nicht `this`
  // -> die fehlende `this`-bindung von arrows stoert hier nicht, im gegenteil:
  // ev/renderEvidenceDetail/state werden lexikalisch aus renderEvidenceDetail geerbt.
  // demo 7 fund: e.target.value ist ein normaler "string" (jedes <select> liefert
  // das), aber ev.status/ev.relevance sind unsere engeren
  // ReviewStatus/Relevance-unions. "as ReviewStatus"/"as Relevance" ist hier
  // gerechtfertigt, weil WIR selbst die <option value="..."> oben erzeugt haben
  // (statusOptionHTML) - die werte koennen nur genau diese sein.
  requireElement<HTMLSelectElement>("detailStatusSelect").addEventListener("change", (e) => {
    ev.status = (e.target as HTMLSelectElement).value as ReviewStatus; // direct mutation of the loaded evidence object
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
  requireElement<HTMLSelectElement>("detailRelevanceSelect").addEventListener("change", (e) => {
    ev.relevance = (e.target as HTMLSelectElement).value as Relevance;
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
}

// nur im detail gebraucht -> privat
function statusOptionHTML(current: string, value: string, label: string): string {
  const currentLower = (current || "").toLowerCase();
  const selected = currentLower === value ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + label + "</option>";
}

// window-export (generiertes html: onclick="saveCurrentNote()")
export function saveCurrentNote(): void {
  const textarea = document.getElementById("evidenceNoteInput") as HTMLTextAreaElement | null;
  if (!textarea) return;
  const evidenceId = textarea.getAttribute("data-evidence-id"); // note id is read back off the DOM
  if (!evidenceId) return;
  const text = textarea.value;
  saveNoteForEvidence(evidenceId, text);
  const preview = document.getElementById("notePreview");
  if (preview) preview.innerHTML = text; // TODO code smell (demo 8): user-text via innerHTML -> XSS, siehe CHANGES
}
