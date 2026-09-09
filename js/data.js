// ---------------------------------------------------------------------
// DATA LOADING
// laedt die json-dateien und stupst danach die betroffenen views an.
// die requests laufen bewusst NACHEINANDER (nicht parallel) - so war es
// vorher auch, wird erst in einer spaeteren uebung optimiert.
// demo 9: die .then()-ketten hier sind auf async/await umgestellt.
// verhalten identisch (inkl. sequenziell + gleiche fehlerbehandlung).
// ---------------------------------------------------------------------
import state from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderEvidenceList, applyStoredBookmarkFlags } from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";
import { populateAllDropdowns } from "./dropdowns.js";

function showLoadingOverlay(msg) {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep() {
  state.loadingStepsRemaining--;
  if (state.loadingStepsRemaining <= 0) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }
}

// war vorher 6 ebenen tief verschachteltes .then()
// (fetch case -> .json() -> fetch people -> .json() -> fetch locations -> .json()).
// jedes fetch startet erst, wenn der body der vorigen datei geparst ist -> sequenziell.
// kein .catch im original -> hier auch keins (verhalten 1:1). jedes await ist ein
// punkt, an dem die vorige stufe fertig sein MUSS, bevor die naechste zeile laeuft.
async function loadCorePeopleAndLocations() {
  const caseRes = await fetch("data/case.json");
  state.caseData = await caseRes.json();

  const peopleRes = await fetch("data/people.json");
  state.allPeople = await peopleRes.json();

  const locationsRes = await fetch("data/locations.json");
  state.allLocations = await locationsRes.json();

  hideLoadingStep();
  renderDashboard();
  populateAllDropdowns();
}

// vorher .then(res => res.json()).then(data => {...}).catch(err => {...})
// -> try/catch. der catch-inhalt (flag, console.error, alert, ggf. re-render) unveraendert.
async function loadEvidenceData() {
  try {
    const res = await fetch("data/evidence.json");
    const data = await res.json();

    // demo 3 fix: ladeflag hier ausschalten, wenn der fetch fertig ist.
    // vorher wurde evidenceViewLoading nur EINMAL (bei true) gesetzt und nie
    // wieder -> renderEvidenceList() ist immer frueh mit spinner rausgesprungen,
    // obwohl die daten laengst da waren. muss VOR renderEvidenceList() stehen,
    // sonst greift der frueh-return im selben durchlauf noch.
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
  } catch (err) {
    // auch im fehlerfall ist "loading" vorbei - sonst haengt der spinner ewig
    // (z.b. bei 404). renderEvidenceList zeigt dann den leer-zustand statt spinner.
    state.evidenceViewLoading = false;
    console.error("Failed to load evidence.json", err);
    alert("Evidence could not be loaded. Some views may be incomplete.");
    if (state.currentPage === "evidence") renderEvidenceList();
  }
}

// vorher .then(res => res.json()).then(data => {...}).catch(err => {...}).finally(() => {...})
// -> try/catch/finally. catch = console.log wie im original, finally = hideLoadingStep.
async function loadTimelineData() {
  try {
    const res = await fetch("data/timeline.json");
    const data = await res.json();
    state.allTimeline = data;
    renderDashboard();
    if (state.currentPage === "timeline") renderTimeline();
    populateAllDropdowns();
  } catch (err) {
    console.log("timeline load error", err);
  } finally {
    hideLoadingStep();
  }
}

export async function loadAllData() {
  showLoadingOverlay("Loading case file…");
  state.loadingStepsRemaining = 2;
  await loadCorePeopleAndLocations();
  // achtung: die beiden werden bewusst NICHT awaited - genau wie vorher
  // (loadAllData ist "fertig", sobald core da ist; evidence/timeline laufen
  // im hintergrund weiter). wird in einer spaeteren uebung angefasst.
  loadEvidenceData();
  loadTimelineData();
}
