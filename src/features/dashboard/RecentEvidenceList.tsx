import type { Evidence } from "../../../js/types";
import { StatusBadge } from "./StatusBadge";

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
            <strong>{ev.id}</strong> &mdash; {ev.title} <StatusBadge status={ev.status} />
          </div>
        ))
      )}
    </div>
  );
}
