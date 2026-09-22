// ---------------------------------------------------------------------
// DASHBOARD VIEW
// ---------------------------------------------------------------------
// demo 7 (ue2): konvertiert. die reinen lese-schleifen (kein index noetig)
// sind dabei auf for-of umgestellt - das umgeht das ganze
// noUncheckedIndexedAccess-"koennte undefined sein"-thema von vornherein,
// statt es an jeder stelle mit einer capture+check-zeile abzufangen.
import state from "../state.js";
import { formatDate, getStatusBadgeClass } from "../utils.js";
import type { Evidence } from "../types.js";

export function renderDashboard(): void {
  const container = document.getElementById("dashboardContent");
  if (!container) return;

  let reviewedCount = 0;
  // demo 4 live-vorfuehrung: naechste zeile einkommentieren, dann zeigt
  // "npm run lint": 'unreviewedCount' is assigned a value but never used  no-unused-vars
  //const unreviewedCount = 0;
  for (const ev of state.allEvidence) {
    if ((ev.status || "").toLowerCase() === "reviewed") reviewedCount++;
  }

  const progressPct =
    state.allEvidence.length === 0
      ? 0
      : Math.round((reviewedCount / state.allEvidence.length) * 100);

  let html = "";
  html += '<div class="case-summary-card">';
  html += "<h3>" + (state.caseData.title || "Case") + "</h3>";
  html +=
    '<p><span class="badge badge-flagged">' +
    (state.caseData.status || "unknown").toUpperCase() +
    "</span></p>";
  html += "<p>" + (state.caseData.summary || "") + "</p>";
  html += "</div>";

  html += '<div class="stat-grid">';
  html += statCardHTML(state.allEvidence.length, "Evidence items");
  html += statCardHTML(state.allPeople.length, "People");
  html += statCardHTML(state.allLocations.length, "Locations");
  html += statCardHTML(state.bookmarks.length, "Bookmarked");
  html += statCardHTML(reviewedCount, "Reviewed");
  html += "</div>";

  html += '<div class="dashboard-panel">';
  html += "<h3>Review progress</h3>";
  html +=
    '<div class="progress-bar-outer"><div class="progress-bar-inner" style="width:' +
    progressPct +
    '%;"></div></div>';
  html += "<p>" + progressPct + "% of evidence reviewed</p>";
  html += "</div>";

  html += '<div class="dashboard-columns">';

  html += '<div class="dashboard-panel"><h3>Recent evidence</h3>';
  const recentEvidence: Evidence[] = state.allEvidence.slice(-5).reverse();
  if (recentEvidence.length === 0) {
    html += "<p>No evidence loaded yet.</p>";
  }
  for (const ev of recentEvidence) {
    html +=
      '<div class="mini-list-item"><strong>' +
      ev.id +
      "</strong> &mdash; " +
      ev.title +
      ' <span class="badge ' +
      getStatusBadgeClass(ev.status) +
      '">' +
      ev.status +
      "</span></div>";
  }
  html += "</div>";

  html += '<div class="dashboard-panel"><h3>Recent timeline events</h3>';
  const recentTimeline = state.allTimeline.slice(-5).reverse();
  if (recentTimeline.length === 0) {
    html += "<p>No timeline events loaded yet.</p>";
  }
  for (const evt of recentTimeline) {
    html +=
      '<div class="mini-list-item"><strong>' +
      formatDate(evt.time) +
      "</strong><br>" +
      evt.title +
      "</div>";
  }
  html += "</div>";

  html += "</div>"; // dashboard-columns

  container.innerHTML = html;
}

// nur das dashboard braucht das -> nicht exportiert
function statCardHTML(value: number, label: string): string {
  return (
    '<div class="stat-card"><div class="stat-value">' +
    value +
    '</div><div class="stat-label">' +
    label +
    "</div></div>"
  );
}
