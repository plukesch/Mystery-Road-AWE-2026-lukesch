import type { Evidence } from "../../js/types";
// pure, seiteneffektfreie helfer-funktion aus der vanilla-app wiederverwendet
// (nicht dupliziert) - anders als bei js/state.ts (siehe src/lib/bookmarks.ts)
// haengt hier kein mutable modul-singleton dran, nur eine reine funktion.
import { getStatusBadgeClass } from "../../js/utils";

interface RecentEvidenceListProps {
  items: Evidence[];
}

export function RecentEvidenceList({ items }: RecentEvidenceListProps) {
  return (
    <div className="dashboard-panel">
      <h3>Recent evidence</h3>
      {items.length === 0 ? (
        <p>No evidence loaded yet.</p>
      ) : (
        items.map((ev) => (
          <div className="mini-list-item" key={ev.id}>
            <strong>{ev.id}</strong> &mdash; {ev.title}{" "}
            <span className={"badge " + getStatusBadgeClass(ev.status)}>{ev.status}</span>
          </div>
        ))
      )}
    </div>
  );
}
