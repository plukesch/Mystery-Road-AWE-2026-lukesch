// ---------------------------------------------------------------------
// ENTRY POINT
// wird als <script type="module" src="js/main.js"> geladen.
// verdrahtet navigation + event listener beim start.
// ---------------------------------------------------------------------
import { navigateTo, handleHashChange } from "./navigation.js";
import { loadAllData } from "./data.js";
import { loadBookmarksFromStorage, loadNotesFromStorage } from "./storage.js";
import {
  renderEvidenceList,
  handleSearchInput,
  clearFilters,
  handleSortChange,
  closeEvidenceDetail,
  saveCurrentNote
} from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";
import { switchPeopleTab } from "./views/people.js";
import { saveHypothesis } from "./views/workspace.js";

// ---------------------------------------------------------------------
// module scope ist NICHT global. das index.html hat aber noch inline
// onclick/onchange attribute (und app.js setzt eins per setAttribute).
// die suchen ihre funktion auf window -> hier explizit dranhaengen.
// (wird in einer spaeteren uebung sauber auf addEventListener umgestellt)
// ---------------------------------------------------------------------
window.navigateTo = navigateTo;
window.switchPeopleTab = switchPeopleTab;
window.handleSortChange = handleSortChange;
window.saveHypothesis = saveHypothesis;
window.closeEvidenceDetail = closeEvidenceDetail;
window.saveCurrentNote = saveCurrentNote;
window.renderEvidenceList = renderEvidenceList;

// ---------------------------------------------------------------------
// EVENT LISTENER SETUP
// ---------------------------------------------------------------------

function setupEventListeners() {
  window.addEventListener("hashchange", handleHashChange);

  var navButtons = document.querySelectorAll(".nav-btn");
  for (var i = 0; i < navButtons.length; i++) {
    navButtons[i].addEventListener("click", function () {
      var targetView = navButtons[i].getAttribute("data-view");
      console.log("nav clicked:", targetView);
    });
  }

  document.getElementById("evidenceSearch").addEventListener("input", handleSearchInput);

  document.getElementById("filterType").addEventListener("change", renderEvidenceList);
  document.getElementById("filterPerson").addEventListener("change", renderEvidenceList);
  document.getElementById("filterLocation").addEventListener("change", renderEvidenceList);

  document.getElementById("filterStatus").addEventListener("change", renderEvidenceList);
  document.getElementById("filterStatus").setAttribute("onchange", "renderEvidenceList()");

  document.getElementById("filterRelevance").addEventListener("change", renderEvidenceList);

  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);

  document.getElementById("timelineOrder").addEventListener("change", renderTimeline);
  document.getElementById("timelinePersonFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineLocationFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineTypeFilter").addEventListener("change", renderTimeline);

  document.getElementById("hypConfidence").addEventListener("input", function (e) {
    document.getElementById("hypConfidenceValue").textContent = e.target.value;
  });
}

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------

function initApp() {
  loadBookmarksFromStorage();
  loadNotesFromStorage();
  setupEventListeners();

  loadAllData().then(function () {
    handleHashChange();
    // demo 4 fix: hier stand
    //   var firstNote = loadNoteAsync("E01");
    //   console.log("First note preview:", firstNote);
    // loadNoteAsync gibt ein Promise zurueck, kein string -> die konsole hat
    // "First note preview: Promise {<fulfilled>: ''}" geloggt statt des notiz-textes.
    // der log rendert nirgends etwas, ist reiner debug-rest -> ersatzlos raus.
  });
}

window.addEventListener("DOMContentLoaded", initApp);
window.addEventListener("hashchange", handleHashChange);
