// ---------------------------------------------------------------------
// TIMELINE (ue4 demo 2, demo 10: filter-leiste + ?person=...)
// liest ?person=<id> EINMAL pro render aus der URL und leitet daraus die
// angezeigte liste ab. KEIN useState, KEIN onChange: die URL ist die einzige
// quelle, die seite ist eine reine funktion aus (URL, daten). die dropdowns
// stehen sichtbar da, filtern aber (noch) nichts, wenn man sie aendert -
// das kommt mit ue5.
// ---------------------------------------------------------------------
import { useSearchParams } from "react-router";
import { useCaseData } from "../../shared/useCaseData";
import {
  filterByPerson,
  resolveLocationNames,
  sortByTimeAscending,
  uniqueEventTypes,
} from "./timelineHelpers";
import { TimelineEventItem } from "./TimelineEventItem";
import { TimelineToolbar } from "./TimelineToolbar";

export function TimelinePage() {
  const caseDataState = useCaseData();
  // hooks muessen VOR den fruehen returns stehen (regel der hooks: immer in
  // derselben reihenfolge aufrufen). nur der lesende teil [0] wird benutzt - kein
  // setter, die seite aendert die URL nie selbst.
  const [searchParams] = useSearchParams();

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

  const { timeline, locations, people } = caseDataState.data;

  // der query-parameter ist EINGABE VOM NUTZER (er kann ihn beliebig tippen):
  // get() liefert "string | null". eine id, die zu keiner person gehoert, wird
  // IGNORIERT (= alle events) - eine query ist eine optionale einstellung, kein
  // pflicht-wert. das dropdown zeigt dann ehrlich "All people". siehe
  // THEORIE_ANTWORTEN demo 10 F1.
  const requestedPersonId = searchParams.get("person");
  const selectedPerson = people.find((person) => person.id === requestedPersonId);
  const selectedPersonId = selectedPerson ? selectedPerson.id : "";

  const events = sortByTimeAscending(filterByPerson(timeline, selectedPersonId));

  return (
    <section>
      <h2>Investigation Timeline</h2>
      <TimelineToolbar
        people={people}
        locations={locations}
        eventTypes={uniqueEventTypes(timeline)}
        selectedPersonId={selectedPersonId}
      />
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
