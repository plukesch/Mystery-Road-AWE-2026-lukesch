import type { Location, Person } from "../../../js/types";

interface SelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  options: SelectOption[];
  defaultValue: string;
}

// ein dropdown samt (visuell versteckter) label. defaultValue statt value:
// das dropdown ist UNKONTROLLIERT - es startet mit dem uebergebenen wert, der
// browser verwaltet danach die auswahl selbst. genau das verlangt UE4: die
// leiste ist "visuell komplett", aber noch NICHT an die liste gekoppelt (kein
// onChange). mit "value" ohne onChange waere das dropdown dagegen schreibgeschuetzt.
function FilterSelect({ id, label, options, defaultValue }: FilterSelectProps) {
  return (
    <>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <select id={id} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}

interface TimelineToolbarProps {
  people: Person[];
  locations: Location[];
  eventTypes: string[];
  selectedPersonId: string;
}

// spiegelbild von #timelineToolbar aus index.html + populateTimelineDropdowns()
// (js/views/timeline.ts). PRESENTATIONAL: bekommt alles per props.
export function TimelineToolbar({
  people,
  locations,
  eventTypes,
  selectedPersonId,
}: TimelineToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <FilterSelect
          id="timelineOrder"
          label="Order"
          defaultValue="asc"
          options={[
            { value: "asc", label: "Oldest first" },
            { value: "desc", label: "Newest first" },
          ]}
        />
        {/* key={selectedPersonId}: defaultValue gilt nur beim ERSTEN rendern. aendert
            sich die URL von ?person=a auf ?person=b, bleibt dieselbe komponente
            stehen - ohne neuen key wuerde das dropdown "a" weiter anzeigen, waehrend
            die liste schon nach "b" gefiltert ist (live getestet, siehe UE4_CHANGES
            demo 10). ein neuer key = ein NEUES element (siehe demo 3 F1) und damit
            ein frischer defaultValue. */}
        <FilterSelect
          key={selectedPersonId}
          id="timelinePersonFilter"
          label="Filter by person"
          defaultValue={selectedPersonId}
          options={[
            { value: "", label: "All people" },
            ...people.map((person) => ({ value: person.id, label: person.name })),
          ]}
        />
        <FilterSelect
          id="timelineLocationFilter"
          label="Filter by location"
          defaultValue=""
          options={[
            { value: "", label: "All locations" },
            ...locations.map((location) => ({ value: location.id, label: location.id })),
          ]}
        />
        <FilterSelect
          id="timelineTypeFilter"
          label="Filter by event type"
          defaultValue=""
          options={[
            { value: "", label: "All event types" },
            ...eventTypes.map((type) => ({ value: type, label: type })),
          ]}
        />
      </div>
    </div>
  );
}
