import type { TimelineEvent } from "../../js/types";
import { formatDate } from "../../js/utils";
import { CertaintyBadge } from "./CertaintyBadge";

interface TimelineEventItemProps {
  event: TimelineEvent;
  locationNames: string[];
}

// spiegelbild eines einzelnen events aus renderTimeline() (js/views/timeline.ts).
// die "View E04"-buttons sind sichtbar, aber noch NICHT verdrahtet: in vanilla
// oeffnen sie ein modal (braucht state) - das kommt mit ue5.
export function TimelineEventItem({ event, locationNames }: TimelineEventItemProps) {
  return (
    // technik "template-string": die css-klasse haengt vom certainty-wert ab
    // (.certainty-contradictory faerbt den zeitstrahl-punkt rot).
    <div className={`timeline-event certainty-${event.certainty}`}>
      <div className="timeline-time">
        {formatDate(event.time)}&nbsp;&middot;&nbsp;
        <CertaintyBadge certainty={event.certainty} />
      </div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      {/* technik "&&": nur anzeigen, wenn es orte gibt. bewusst "> 0" statt nur
          ".length" - sonst wuerde bei 0 orten eine nackte "0" erscheinen (F1). */}
      {locationNames.length > 0 && (
        <p className="evidence-meta">Location: {locationNames.join(", ")}</p>
      )}
      {event.evidenceIds.map((evidenceId) => (
        <button type="button" className="evidence-link-btn" key={evidenceId}>
          View {evidenceId}
        </button>
      ))}
    </div>
  );
}
