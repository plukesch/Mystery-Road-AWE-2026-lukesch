// ---------------------------------------------------------------------
// TIMELINE (ue4 demo 2, demo 10: filter-leiste + ?person=...)
// liest ?person=<id> EINMAL pro render aus der URL und leitet daraus die
// angezeigte liste ab. KEIN useState, KEIN onChange: die URL ist die einzige
// quelle, die seite ist eine reine funktion aus (URL, daten). die dropdowns
// stehen sichtbar da, filtern aber (noch) nichts, wenn man sie aendert -
// das kommt mit ue5.
// ue5 demo 9: die daten kommen FERTIG als Prop `data` (PageRouter laedt sie
// einmal). der "early return" fuer lade-/fehlerzustand (ue4 demo 2), der hier
// stand, steht jetzt EINMAL in PageRouter statt in fuenf seiten.
// ---------------------------------------------------------------------
import { useSearchParams } from "react-router";
import type { CaseData } from "../../shared/useCaseData";
import {
  filterByPerson,
  resolveLocationNames,
  sortByTimeAscending,
  uniqueEventTypes,
} from "./timelineHelpers";
import { TimelineEventItem } from "./TimelineEventItem";
import { TimelineToolbar } from "./TimelineToolbar";

interface TimelinePageProps {
  data: CaseData;
}

export function TimelinePage({ data }: TimelinePageProps) {
  // nur der lesende teil [0] wird benutzt - kein setter, die seite aendert die
  // URL nie selbst.
  const [searchParams] = useSearchParams();
  const { timeline, locations, people } = data;

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
