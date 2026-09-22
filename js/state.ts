// ---------------------------------------------------------------------
// SHARED STATE
// war vorher ~20 top-level var in app.js -> jetzt EIN objekt
// module koennen imported bindings nicht neu zuweisen, aber properties
// von einem importierten objekt schon -> deshalb objekt statt einzelne let
// ---------------------------------------------------------------------
// demo 7 (ue2): letzte "kern"-datei konvertiert. jetzt, wo state selbst
// eine echte form hat, brauchen lookup.ts/data.ts den "as unknown as
// AppStateShape"-umweg aus demo 5/6 nicht mehr - state.js WAR die luecke,
// die diesen umweg noetig gemacht hat.
import type { Evidence, Person, Location, TimelineEvent, CaseFile } from "./types.js";

export interface ViewRenderedFlags {
  dashboard: boolean;
  evidence: boolean;
  people: boolean;
  timeline: boolean;
  workspace: boolean;
}

export interface AppState {
  allEvidence: Evidence[];
  filteredEvidence: Evidence[];
  selectedEvidence: Evidence | null;
  bookmarks: string[];
  currentPage: string;

  allPeople: Person[];
  allLocations: Location[];
  allTimeline: TimelineEvent[];
  // caseData ist erst nach dem ersten erfolgreichen fetch wirklich ein
  // CaseFile (siehe data.ts). "{} as CaseFile" ist ein bewusster platzhalter
  // fuer den start, kein echter CaseFile - genau das gleiche muster wie
  // schon der "as unknown as X"-umweg in demo 5/6: eine gezielte, dokumentierte
  // zusicherung statt "any", und der einzige weg, das ohne eine invasivere
  // "CaseFile | null"-aenderung ueberall im code hinzubekommen.
  caseData: CaseFile;

  currentPeopleTab: string;
  loadingStepsRemaining: number;

  // demo 3: wird jetzt im .then/.catch von loadEvidenceData auf false gesetzt
  evidenceViewLoading: boolean;

  viewRendered: ViewRenderedFlags;

  notesStore: Record<string, string>;
}

// default export: dieses modul hat GENAU eine hauptsache (den state)
const state: AppState = {
  allEvidence: [],
  filteredEvidence: [],
  selectedEvidence: null,
  bookmarks: [],
  currentPage: "dashboard",

  allPeople: [],
  allLocations: [],
  allTimeline: [],
  caseData: {} as CaseFile,

  currentPeopleTab: "people",
  loadingStepsRemaining: 2,

  evidenceViewLoading: true,

  viewRendered: {
    dashboard: false,
    evidence: false,
    people: false,
    timeline: false,
    workspace: false,
  },

  notesStore: {},
};

export default state;

// named export: mehrere gleichrangige konstanten -> named passt besser als default
export const STORAGE_KEYS = {
  bookmarks: "remotion_bookmarks",
  notes: "remotion_notes",
  hypothesis: "remotion_hypothesis",
};
