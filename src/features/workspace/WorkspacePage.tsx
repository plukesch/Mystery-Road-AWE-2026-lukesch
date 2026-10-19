// ---------------------------------------------------------------------
// INVESTIGATOR WORKSPACE (ue5 demo 1) - FEATURE/CONTAINER
// ersetzt den platzhalter aus UE3. spiegelbild von js/views/workspace.ts:
// gemerkte beweisstuecke, notizen, hypothesen-formular.
// provisorisch (wie in EvidencePage vermerkt): bookmarks und notizen werden hier
// EINMAL beim Einblenden der Seite aus dem localStorage gelesen. das stimmt,
// solange man die Seite nur ueber die Navigation betritt - es ist aber ein
// zweiter Leser derselben Tatsache. demo 5 zieht den State nach oben, demo 9
// benennt das als "duplizierter Zustand".
// ---------------------------------------------------------------------
import { useState } from "react";
import { useCaseData } from "../../shared/useCaseData";
import { loadBookmarks, loadNotes } from "../../shared/storage";
import { BookmarksList } from "./BookmarksList";
import { HypothesisForm } from "./HypothesisForm";
import { NotesList } from "./NotesList";
import { bookmarkedEvidence, noteEntries } from "./workspaceHelpers";

export function WorkspacePage() {
  const caseDataState = useCaseData();
  // kein Setter: die seite aendert beides nicht (das tut die evidence-seite).
  const [bookmarks] = useState<string[]>(loadBookmarks);
  const [notes] = useState<Record<string, string>>(loadNotes);

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
