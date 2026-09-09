// ---------------------------------------------------------------------
// NAVIGATION / HASH ROUTING
// hinweis: die view-module importieren navigateTo von hier zurueck ->
// zirkulaerer import. ist ok weil der aufruf erst im click/hashchange
// passiert, nicht beim laden des moduls.
// ---------------------------------------------------------------------
import state from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderEvidenceList } from "./views/evidence.js";
import { renderPeople, renderLocations } from "./views/people.js";
import { renderTimeline } from "./views/timeline.js";
import { renderWorkspace } from "./views/workspace.js";

export function navigateTo(viewName) {
  window.location.hash = viewName;
  // handleHashChange() will pick this up via the hashchange listener
}

export function handleHashChange() {
  var hash = window.location.hash.replace("#", "");
  var validViews = ["dashboard", "evidence", "people", "timeline", "workspace"];
  if (validViews.indexOf(hash) === -1) {
    hash = "dashboard";
  }
  state.currentPage = hash;

  var sections = document.querySelectorAll(".view");
  for (var i = 0; i < sections.length; i++) {
    sections[i].classList.remove("active");
  }
  document.getElementById("view-" + hash).classList.add("active");

  var navButtons = document.querySelectorAll(".nav-btn");
  for (var n = 0; n < navButtons.length; n++) {
    navButtons[n].classList.remove("active");
    if (navButtons[n].getAttribute("data-view") === hash) {
      navButtons[n].classList.add("active");
    }
  }

  if (hash === "dashboard") {
    // demo 5 fix: dashboard bei JEDEM besuch neu rendern.
    // vorher hat der !viewRendered.dashboard-guard das nach dem ersten mal
    // eingefroren -> bookmark setzen und zurueck aufs dashboard: "Bookmarked"
    // stand weiter auf 0 bis zum reload. stats muessen den aktuellen stand zeigen.
    renderDashboard();
    state.viewRendered.dashboard = true;
  } else if (hash === "evidence" && !state.viewRendered.evidence) {
    renderEvidenceList();
    state.viewRendered.evidence = true;
  } else if (hash === "people" && !state.viewRendered.people) {
    renderPeople();
    renderLocations();
    state.viewRendered.people = true;
  } else if (hash === "timeline" && !state.viewRendered.timeline) {
    renderTimeline();
    state.viewRendered.timeline = true;
  } else if (hash === "workspace") {
    // workspace is cheap enough that it always re-renders
    renderWorkspace();
  }
}
