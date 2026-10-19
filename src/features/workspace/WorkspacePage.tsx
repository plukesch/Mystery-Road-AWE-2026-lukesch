// ---------------------------------------------------------------------
// INVESTIGATOR WORKSPACE (ue5 demo 1) - FEATURE/CONTAINER
// ersetzt den platzhalter aus UE3. spiegelbild von js/views/workspace.ts:
// gemerkte beweisstuecke, notizen, hypothesen-formular.
// ue5 demo 4: die seite haelt KEINEN eigenen Zustand mehr. vorher hatte sie
// `useState(loadBookmarks)` - eine KOPIE der gespeicherten bookmarks, beim
// Einblenden gezogen und danach eingefroren. jetzt wird die liste bei jedem
// Rendern aus der gespeicherten id-liste ABGELEITET (bookmarkedEvidence), mit
// derselben funktion wie der dashboard-zaehler. provisorisch: die id-liste
// kommt noch direkt aus dem localStorage; demo 5 zieht den State nach oben.
// ---------------------------------------------------------------------
import { useCaseData } from "../../shared/useCaseData";
import { bookmarkedEvidence } from "../../shared/bookmarks";
import { loadBookmarks, loadNotes } from "../../shared/storage";
import { BookmarksList } from "./BookmarksList";
import { HypothesisForm } from "./HypothesisForm";
import { NotesList } from "./NotesList";
import { noteEntries } from "./workspaceHelpers";

export function WorkspacePage() {
  const caseDataState = useCaseData();

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
  const bookmarks = loadBookmarks();
  const notes = loadNotes();

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
