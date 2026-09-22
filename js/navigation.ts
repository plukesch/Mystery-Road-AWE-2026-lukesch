// ---------------------------------------------------------------------
// NAVIGATION / HASH ROUTING
// hinweis: die view-module importieren navigateTo von hier zurueck ->
// zirkulaerer import. ist ok weil der aufruf erst im click/hashchange
// passiert, nicht beim laden des moduls.
// ---------------------------------------------------------------------
// demo 7 (ue2): konvertiert.
import state from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderEvidenceList } from "./views/evidence.js";
import { renderPeople, renderLocations } from "./views/people.js";
import { renderTimeline } from "./views/timeline.js";
import { renderWorkspace } from "./views/workspace.js";

export function navigateTo(viewName: string): void {
  window.location.hash = viewName;
  // handleHashChange() will pick this up via the hashchange listener
}

export function handleHashChange(): void {
  // let, weil unten ggf. auf "dashboard" umgesetzt
  let hash = window.location.hash.replace("#", "");
  const validViews = ["dashboard", "evidence", "people", "timeline", "workspace"];
  if (validViews.indexOf(hash) === -1) {
    hash = "dashboard";
  }
  state.currentPage = hash;

  // demo 7: for-of statt index-schleife ueber die NodeList - kein
  // "koennte undefined sein"-problem mehr (noUncheckedIndexedAccess),
  // gleiches ergebnis, weniger code.
  const sections = document.querySelectorAll(".view");
  for (const section of sections) {
    section.classList.remove("active");
  }
  // demo 7 fund (compiler-pedanterie, kein echter bug): getElementById gibt
  // laut typ "HTMLElement | null" zurueck, weil eine beliebige id fehlen
  // koennte. hier ist "view-" + hash IMMER eine der 5 fest in index.html
  // stehenden sections (durch das validViews-array oben abgesichert) -
  // deshalb das "!" (non-null-assertion): "ich weiss hier mehr als der
  // allgemeine typ von getElementById sagt". aendert nichts zur laufzeit.
  document.getElementById("view-" + hash)!.classList.add("active");

  const navButtons = document.querySelectorAll(".nav-btn");
  for (const btn of navButtons) {
    btn.classList.remove("active");
    if (btn.getAttribute("data-view") === hash) {
      btn.classList.add("active");
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
