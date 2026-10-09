// ---------------------------------------------------------------------
// TIMELINE (ue4 demo 2) - ersetzt den ue3-platzhalter.
// noch ohne filter-leiste (kommt in demo 10) und ohne modal (ue5).
// ---------------------------------------------------------------------
import { useCaseData } from "../hooks/useCaseData";
import { resolveLocationNames, sortByTimeAscending } from "../lib/timeline";
import { TimelineEventItem } from "../components/TimelineEventItem";

export function TimelinePage() {
  const caseDataState = useCaseData();

  // technik "early return": zwei sonderfaelle werden VOR dem eigentlichen
  // inhalt abgehandelt, der rest der funktion muss sie nicht mehr beachten.
  if (caseDataState.status === "loading") {
    return (
      <section>
        <h2>Investigation Timeline</h2>
        <p>Loading case file&hellip;</p>
      </section>
    );
  }

  if (caseDataState.status === "error") {
    return (
      <section>
        <h2>Investigation Timeline</h2>
        <p>Could not load the case data. Please reload the page.</p>
      </section>
    );
  }

  const { timeline, locations } = caseDataState.data;
  const events = sortByTimeAscending(timeline);

  return (
    <section>
      <h2>Investigation Timeline</h2>
      <div className="timeline-container">
        {/* technik "ternary": GENAU zwei faelle (leer / nicht leer), beide liefern
            etwas anzuzeigendes - ein if/else, das einen wert ergibt. */}
        {events.length === 0 ? (
          <p>No timeline events match the current filters.</p>
        ) : (
          events.map((event) => (
            <TimelineEventItem
              key={event.id}
              event={event}
              locationNames={resolveLocationNames(event, locations)}
            />
          ))
        )}
      </div>
    </section>
  );
}
