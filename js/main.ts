// ---------------------------------------------------------------------
// ENTRY POINT
// wird als <script type="module" src="js/main.js"> geladen.
// verdrahtet navigation + event listener beim start.
// ---------------------------------------------------------------------
// demo 7 (ue2): letzte konvertierte datei.
import { navigateTo, handleHashChange } from "./navigation.js";
import { loadAllData } from "./data.js";
import { loadBookmarksFromStorage, loadNotesFromStorage } from "./storage.js";
import {
  renderEvidenceList,
  handleSearchInput,
  clearFilters,
  handleSortChange,
  closeEvidenceDetail,
  saveCurrentNote,
} from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";
import { switchPeopleTab } from "./views/people.js";
import { saveHypothesis } from "./views/workspace.js";
import { requireElement } from "./dom.js";

// demo 7 fund: "window.navigateTo = ..." ist ohne weiteres ein TS-fehler -
// die eingebauten Window-typen kennen unsere eigenen, an window gehaengten
// funktionen natuerlich nicht ("Property 'navigateTo' does not exist on
// type 'Window'"). "declare global { interface Window { ... } }" ist TS's
// vorgesehener weg, ein eingebautes interface um eigene felder zu erweitern
// ("declaration merging") - sagt dem compiler ehrlich, was hier zur laufzeit
// tatsaechlich an window haengt, statt es mit "any"/"as any" zu verstecken.
declare global {
  interface Window {
    navigateTo: (viewName: string) => void;
    switchPeopleTab: (tab: string) => void;
    handleSortChange: () => void;
    saveHypothesis: () => void;
    closeEvidenceDetail: () => void;
    saveCurrentNote: () => void;
  }
}

// ---------------------------------------------------------------------
// module scope ist NICHT global. index.html hat noch inline onclick/onchange
// attribute -> die funktionen dahinter muessen auf window liegen.
// (wird in einer spaeteren uebung sauber auf addEventListener umgestellt)
// ---------------------------------------------------------------------
window.navigateTo = navigateTo;
window.switchPeopleTab = switchPeopleTab;
window.handleSortChange = handleSortChange;
window.saveHypothesis = saveHypothesis;
window.closeEvidenceDetail = closeEvidenceDetail;
window.saveCurrentNote = saveCurrentNote;

// ---------------------------------------------------------------------
// EVENT LISTENER SETUP
// ---------------------------------------------------------------------

function setupEventListeners(): void {
  window.addEventListener("hashchange", handleHashChange);

  // demo 8: hier stand ein for-(var i)-loop, der jedem .nav-btn einen click-listener
  // gab, dessen einziger inhalt "console.log('nav clicked:', navButtons[i]...)" war.
  // - toter debug-code (navigation laeuft ueber die inline onclick + hashchange)
  // - und wegen "var i" + closure war i beim klick === navButtons.length -> das
  //   throw "Cannot read properties of undefined (reading 'getAttribute')".
  // ersatzlos entfernt.

  requireElement("evidenceSearch").addEventListener("input", handleSearchInput);

  requireElement("filterType").addEventListener("change", renderEvidenceList);
  requireElement("filterPerson").addEventListener("change", renderEvidenceList);
  requireElement("filterLocation").addEventListener("change", renderEvidenceList);
  // demo 8: filterStatus war doppelt verdrahtet - addEventListener UND
  // setAttribute("onchange", "renderEvidenceList()") -> render lief 2x pro aenderung,
  // und nur wegen der onchange-zeile brauchte es window.renderEvidenceList. beides raus.
  requireElement("filterStatus").addEventListener("change", renderEvidenceList);
  requireElement("filterRelevance").addEventListener("change", renderEvidenceList);

  requireElement("clearFiltersBtn").addEventListener("click", clearFilters);

  requireElement("timelineOrder").addEventListener("change", renderTimeline);
  requireElement("timelinePersonFilter").addEventListener("change", renderTimeline);
  requireElement("timelineLocationFilter").addEventListener("change", renderTimeline);
  requireElement("timelineTypeFilter").addEventListener("change", renderTimeline);

  // demo 10: anonymer addEventListener-callback -> arrow (nutzt e.target, kein `this`)
  requireElement("hypConfidence").addEventListener("input", (e) => {
    requireElement("hypConfidenceValue").textContent = (e.target as HTMLInputElement).value;
  });
}

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------

function initApp(): void {
  loadBookmarksFromStorage();
  loadNotesFromStorage();
  setupEventListeners();

  loadAllData().then(() => {
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
