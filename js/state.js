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

  // demo 3: wird jetzt im .then/.catch von loadEvidenceData auf false gesetzt
  evidenceViewLoading: true,

  viewRendered: {
    dashboard: false,
    evidence: false,
    people: false,
    timeline: false,
    workspace: false
  },

  notesStore: {}
};

export default state;

// named export: mehrere gleichrangige konstanten -> named passt besser als default
export const STORAGE_KEYS = {
  bookmarks: "remotion_bookmarks",
  notes: "remotion_notes",
  hypothesis: "remotion_hypothesis"
};
