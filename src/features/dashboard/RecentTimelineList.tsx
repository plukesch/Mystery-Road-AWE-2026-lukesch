import type { TimelineEvent } from "../../../js/types";
import { formatDate } from "../../../js/utils";

interface RecentTimelineListProps {
  items: TimelineEvent[];
}

export function RecentTimelineList({ items }: RecentTimelineListProps) {
  return (
    <div className="dashboard-panel">
      <h3>Recent timeline events</h3>
      {items.length === 0 ? (
        <p>No timeline events loaded yet.</p>
      ) : (
        items.map((evt) => (
          <div className="mini-list-item" key={evt.id}>
            <strong>{formatDate(evt.time)}</strong>
            <br />
            {evt.title}
          </div>
        ))
      )}
    </div>
  );
}
