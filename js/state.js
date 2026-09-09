// ---------------------------------------------------------------------
// SHARED STATE
// war vorher ~20 top-level var in app.js -> jetzt EIN objekt
// module koennen imported bindings nicht neu zuweisen, aber properties
// von einem importierten objekt schon -> deshalb objekt statt einzelne let
// ---------------------------------------------------------------------

// default export: dieses modul hat GENAU eine hauptsache (den state)
const state = {
  allEvidence: [],
  filteredEvidence: [],
  selectedEvidence: null,
  bookmarks: [],
  currentPage: "dashboard",

  allPeople: [],
  allLocations: [],
  allTimeline: [],
  caseData: {},

  currentPeopleTab: "people",
  loadingStepsRemaining: 2,

  // wird nirgends auf false gesetzt (bug bleibt fuer demo 1 drin!)
  evidenceViewLoading: true,

  viewRendered: {
    dashboard: false,
    evidence: false,
    people: false,
    timeline: false,
    workspace: false
  },

  notesStore: {},
  modalCloseListenerCount: 0,

  // race-guard fuer die such-eingabe
  latestSearchRequestId: 0
};

export default state;

// named export: mehrere gleichrangige konstanten -> named passt besser als default
export const STORAGE_KEYS = {
  bookmarks: "remotion_bookmarks",
  notes: "remotion_notes",
  hypothesis: "remotion_hypothesis"
};
