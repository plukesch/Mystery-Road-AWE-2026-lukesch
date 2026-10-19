import type { NoteEntry } from "./workspaceHelpers";

interface NotesListProps {
  entries: NoteEntry[];
}

// die liste der notizen (renderNotesList() in vanilla). PRESENTATIONAL.
// der notiz-text steht als {entry.text} im JSX: react setzt ihn als TEXT, nicht
// als HTML. vanilla schrieb ihn per innerHTML in die seite (code smell, siehe
// UE2 demo 8): eine notiz mit "<img src=x onerror=...>" waere dort ausgefuehrt
// worden. hier wird sie einfach angezeigt.
export function NotesList({ entries }: NotesListProps) {
  return (
    <div className="notes-list">
      {entries.length === 0 ? (
        <p>No notes yet. Add one from an evidence item&apos;s detail view.</p>
      ) : (
        entries.map((entry) => (
          <div className="mini-list-item" key={entry.evidenceId}>
            <strong>{entry.evidenceId}</strong> &mdash; {entry.title}
            <div>{entry.text}</div>
          </div>
        ))
      )}
    </div>
  );
}
