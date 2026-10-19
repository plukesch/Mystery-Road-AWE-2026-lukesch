// ---------------------------------------------------------------------
// INVESTIGATOR WORKSPACE (ue5 demo 1) - FEATURE/CONTAINER
// ersetzt den platzhalter aus UE3. spiegelbild von js/views/workspace.ts:
// gemerkte beweisstuecke, notizen, hypothesen-formular.
// ue5 demo 4: die seite haelt KEINE kopie der bookmarks; die liste wird bei
// jedem Rendern aus der id-liste ABGELEITET (bookmarkedEvidence), mit derselben
// funktion wie der dashboard-zaehler.
// ue5 demo 5: die notizen kommen als PROP vom gemeinsamen vorfahren (PageRouter).
// ue5 demo 8: die bookmarks kommen aus dem CONTEXT (useBookmarks), nicht mehr als
// Prop. nur das hypothesen-formular besitzt noch eigenen state (kein anderer
// braucht ihn).
// ---------------------------------------------------------------------
import { useCaseData } from "../../shared/useCaseData";
import { useBookmarks } from "../../shared/BookmarksContext";
import { bookmarkedEvidence } from "../../shared/bookmarks";
import { BookmarksList } from "./BookmarksList";
import { HypothesisForm } from "./HypothesisForm";
import { NotesList } from "./NotesList";
import { noteEntries } from "./workspaceHelpers";

interface WorkspacePageProps {
  notes: Readonly<Record<string, string>>;
}

export function WorkspacePage({ notes }: WorkspacePageProps) {
  const caseDataState = useCaseData();
  const { bookmarks } = useBookmarks();

  if (caseDataState.status === "loading") {
    return (
      <section>
        <h2>Investigator Workspace</h2>
        <p>Loading case file&hellip;</p>
      </section>
    );
  }

  if (caseDataState.status === "error") {
    return (
      <section>
        <h2>Investigator Workspace</h2>
        <p>Could not load the case data. Please reload the page.</p>
      </section>
    );
  }

  const { people, evidence } = caseDataState.data;

  return (
    <section>
      <h2>Investigator Workspace</h2>

      <div className="workspace-grid">
        <div className="workspace-col">
          <h3>Bookmarked Evidence</h3>
          <BookmarksList items={bookmarkedEvidence(evidence, bookmarks)} />
        </div>

        <div className="workspace-col">
          <h3>Personal Notes</h3>
          <p className="hint-text">
            Notes are attached to whichever evidence item is currently open in the Evidence view.
          </p>
          <NotesList entries={noteEntries(evidence, notes)} />
        </div>
      </div>

      <HypothesisForm people={people} evidence={evidence} />
    </section>
  );
}
