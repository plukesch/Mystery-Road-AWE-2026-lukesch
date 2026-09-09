// ---------------------------------------------------------------------
// DATA LOADING
// laedt die json-dateien und stupst danach die betroffenen views an.
// die requests laufen bewusst NACHEINANDER (nicht parallel) - so war es
// vorher auch, wird erst in einer spaeteren uebung optimiert.
// ---------------------------------------------------------------------
import state from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderEvidenceList, applyStoredBookmarkFlags } from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";
import { populateAllDropdowns } from "./dropdowns.js";

function showLoadingOverlay(msg) {
  var overlay = document.getElementById("loadingOverlay");
  var text = document.getElementById("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep() {
  state.loadingStepsRemaining--;
  if (state.loadingStepsRemaining <= 0) {
    var overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }
}

// 3 ebenen tief verschachtelte .then() (case -> people -> locations)
function loadCorePeopleAndLocations() {
  return fetch("data/case.json").then(function (caseRes) {
    return caseRes.json().then(function (caseJson) {
      state.caseData = caseJson;

      return fetch("data/people.json").then(function (peopleRes) {
        return peopleRes.json().then(function (peopleJson) {
          state.allPeople = peopleJson;

          return fetch("data/locations.json").then(function (locationsRes) {
            return locationsRes.json().then(function (locationsJson) {
              state.allLocations = locationsJson;

              hideLoadingStep();
              renderDashboard();
              populateAllDropdowns();
            });
          });
        });
      });
    });
  });
}

function loadEvidenceData() {
  fetch("data/evidence.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      // demo 3 fix: ladeflag hier ausschalten, wenn der fetch fertig ist.
      // vorher wurde evidenceViewLoading nur EINMAL (bei true) gesetzt und nie
      // wieder -> renderEvidenceList() ist immer frueh mit spinner rausgesprungen,
      // obwohl die daten laengst da waren. muss VOR renderEvidenceList() stehen,
      // sonst greift der frueh-return im selben callback noch.
      state.evidenceViewLoading = false;

      state.allEvidence = data;
      applyStoredBookmarkFlags();
      // demo 2 fix: KOPIE statt gleicher referenz.
      // vorher war filteredEvidence === allEvidence -> handleSortChange sortiert
      // filteredEvidence in-place und hat damit die master-liste mitzerlegt
      // (dashboard "Recent evidence" zeigte danach muell). .slice() macht eine
      // flache kopie des arrays -> eigenes array, gleiche item-objekte.
      state.filteredEvidence = state.allEvidence.slice();
      renderDashboard();
      populateAllDropdowns();
      if (state.currentPage === "evidence") renderEvidenceList();
    })
    .catch(function (err) {
      // auch im fehlerfall ist "loading" vorbei - sonst haengt der spinner ewig
      // (z.b. bei 404). renderEvidenceList zeigt dann den leer-zustand statt spinner.
      state.evidenceViewLoading = false;
      console.error("Failed to load evidence.json", err);
      alert("Evidence could not be loaded. Some views may be incomplete.");
      if (state.currentPage === "evidence") renderEvidenceList();
    });
}

function loadTimelineData() {
  return fetch("data/timeline.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      state.allTimeline = data;
      renderDashboard();
      if (state.currentPage === "timeline") renderTimeline();
      populateAllDropdowns();
    })
    .catch(function (err) {
      console.log("timeline load error", err);
    })
    .finally(function () {
      hideLoadingStep();
    });
}

export function loadAllData() {
  showLoadingOverlay("Loading case file…");
  state.loadingStepsRemaining = 2;
  return loadCorePeopleAndLocations().then(function () {
    // achtung: die beiden werden NICHT awaited -> loadAllData().then() feuert
    // schon bevor evidence/timeline fertig sind (bug bleibt fuer demo 1 drin)
    loadEvidenceData();
    loadTimelineData();
  });
}
