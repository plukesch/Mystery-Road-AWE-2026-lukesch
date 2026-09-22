// ---------------------------------------------------------------------
// TIMELINE VIEW (+ quick-view modal)
// ---------------------------------------------------------------------
// demo 7 (ue2): konvertiert.
import state from "../state.js";
import { formatDate } from "../utils.js";
import { findLocationById, findEvidenceById } from "../lookup.js";
import { navigateTo } from "../navigation.js";
import { openEvidenceDetail } from "./evidence.js";
import { requireElement } from "../dom.js";
import type { TimelineEvent, Certainty } from "../types.js";

export function populateTimelineDropdowns(): void {
  const personSelect = document.getElementById("timelinePersonFilter");
  const locationSelect = document.getElementById("timelineLocationFilter");
  const typeSelect = document.getElementById("timelineTypeFilter");
  if (!personSelect || !locationSelect || !typeSelect) return;

  personSelect.innerHTML = '<option value="">All people</option>';
  for (const person of state.allPeople) {
    personSelect.innerHTML += '<option value="' + person.id + '">' + person.name + "</option>";
  }

  locationSelect.innerHTML = '<option value="">All locations</option>';
  for (const loc of state.allLocations) {
    locationSelect.innerHTML += '<option value="' + loc.id + '">' + loc.id + "</option>";
  }

  const types: string[] = [];
  for (const evt of state.allTimeline) {
    if (types.indexOf(evt.type) === -1) types.push(evt.type);
  }
  typeSelect.innerHTML = '<option value="">All event types</option>';
  for (const t of types) {
    typeSelect.innerHTML += '<option value="' + t + '">' + t + "</option>";
  }
}

export function renderTimeline(): void {
  const container = document.getElementById("timelineContainer");
  if (!container) return;

  const order = requireElement<HTMLSelectElement>("timelineOrder").value;
  const personFilter = requireElement<HTMLSelectElement>("timelinePersonFilter").value;
  const locationFilter = requireElement<HTMLSelectElement>("timelineLocationFilter").value;
  const typeFilter = requireElement<HTMLSelectElement>("timelineTypeFilter").value;

  const filtered: TimelineEvent[] = [];
  for (const evt of state.allTimeline) {
    if (personFilter && evt.personIds.indexOf(personFilter) === -1) continue;
    if (locationFilter && evt.locationIds.indexOf(locationFilter) === -1) continue;
    if (typeFilter && evt.type !== typeFilter) continue;
    filtered.push(evt);
  }

  // demo 10: comparator ohne `this` -> arrow (block-body wegen der diff-zwischenvariable)
  const events = filtered.slice().sort((a, b) => {
    const diff = new Date(a.time).getTime() - new Date(b.time).getTime();
    return order === "desc" ? -diff : diff;
  });

  let html = "";
  for (const item of events) {
    html += '<div class="timeline-event certainty-' + item.certainty + '">';
    html +=
      '<div class="timeline-time">' +
      formatDate(item.time) +
      '&nbsp;&middot;&nbsp;<span class="badge badge-' +
      certaintyBadgeClass(item.certainty) +
      '">' +
      item.certainty +
      "</span></div>";
    html += "<h3>" + item.title + "</h3>";
    html += "<p>" + item.description + "</p>";

    const eventLocationNames: string[] = [];
    for (const locationId of item.locationIds) {
      const evtLoc = findLocationById(locationId);
      // demo 5 fix: .name statt des ganzen objekts.
      // vorher wurde evtLoc (ein objekt) ins array gepusht -> join() macht daraus
      // "Location: [object Object]" in der timeline.
      eventLocationNames.push(evtLoc ? evtLoc.name : locationId);
    }
    if (eventLocationNames.length > 0) {
      html += '<p class="evidence-meta">Location: ' + eventLocationNames.join(", ") + "</p>";
    }

    for (const evidenceId of item.evidenceIds) {
      html +=
        '<button type="button" class="evidence-link-btn" data-evidence-id="' +
        evidenceId +
        '">View ' +
        evidenceId +
        "</button>";
    }
    html += "</div>";
  }
  if (events.length === 0) {
    html = "<p>No timeline events match the current filters.</p>";
  }
  container.innerHTML = html;

  const linkButtons = container.querySelectorAll(".evidence-link-btn");
  for (const btn of linkButtons) {
    btn.addEventListener("click", (e) => {
      const evidenceId = (e.target as HTMLElement).getAttribute("data-evidence-id");
      if (evidenceId) openEvidenceModal(evidenceId);
    });
  }
}

// nur timeline nutzt das -> privat
function certaintyBadgeClass(certainty: Certainty): string {
  if (certainty === "confirmed") return "reviewed";
  if (certainty === "contradictory") return "critical";
  if (certainty === "reported") return "flagged";
  return "unreviewed";
}

// --- Quick-view modal (used from the timeline) -------------------------
function openEvidenceModal(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  let modal = document.getElementById("quickViewModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quickViewModal";
    document.body.appendChild(modal);
    // demo 5 fix: listener nur EINMAL beim erstellen des node.
    // vorher wurde bei jedem oeffnen ein weiterer click-listener auf dem
    // (wiederverwendeten) modal-node registriert -> stapelten sich, dazu
    // console-spam ("modal opened, active close listeners: N"). counter raus.
    modal.addEventListener("click", handleModalClick);
  }

  modal.innerHTML =
    '<div class="modal-backdrop"><div class="modal-box">' +
    '<button type="button" class="modal-close-btn" aria-label="Close">&times;</button>' +
    "<h3>" +
    ev.title +
    "</h3>" +
    '<p class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</p>" +
    "<p>" +
    ev.summary +
    "</p>" +
    '<button type="button" class="btn btn-primary btn-small" data-open-full="' +
    ev.id +
    '">Open full evidence</button>' +
    "</div></div>";
}

function handleModalClick(e: MouseEvent): void {
  const modal = document.getElementById("quickViewModal");
  if (!modal) return;
  const target = e.target as HTMLElement;
  if (target.classList.contains("modal-close-btn") || target.classList.contains("modal-backdrop")) {
    modal.innerHTML = "";
  }
  const openFullId = target.getAttribute && target.getAttribute("data-open-full");
  if (openFullId) {
    modal.innerHTML = "";
    navigateTo("evidence");
    setTimeout(() => openEvidenceDetail(openFullId), 0);
  }
}
