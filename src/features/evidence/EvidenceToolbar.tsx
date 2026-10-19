import type { Location, Person } from "../../../js/types";
import { FilterSelect } from "../../shared/FilterSelect";
import type { EvidenceFilters } from "./evidenceHelpers";

interface EvidenceToolbarProps {
  people: Person[];
  locations: Location[];
  types: string[];
  filters: EvidenceFilters;
  onFilterChange: (field: keyof EvidenceFilters, value: string) => void;
  onClearFilters: () => void;
}

// spiegelbild von #evidenceToolbar aus index.html + populateEvidenceDropdowns()
// (js/views/evidence.ts). PRESENTATIONAL: bekommt alles per props.
// ue5 demo 1: nur die STRUKTUR. ue5 demo 2: das suchfeld ist kontrolliert.
// ue5 demo 4: ALLE sieben elemente sind jetzt kontrolliert - ihr angezeigter
// wert kommt aus `filters` (value), jede eingabe meldet sich mit
// (feldname, neuer wert) per onFilterChange nach oben, dort stehen die
// useStates (EvidencePage). die toolbar haelt nichts selbst. "Clear filters"
// ruft onClearFilters auf.
export function EvidenceToolbar({
  people,
  locations,
  types,
  filters,
  onFilterChange,
  onClearFilters,
}: EvidenceToolbarProps) {
  return (
    <div className="toolbar" id="evidenceToolbar">
      <div className="toolbar-row">
        <label htmlFor="evidenceSearch" className="visually-hidden">
          Search evidence
        </label>
        <input
          type="text"
          id="evidenceSearch"
          placeholder="Search evidence by title, summary, or tag…"
          autoComplete="off"
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
        />
        <FilterSelect
          id="filterType"
          label="Filter by type"
          value={filters.type}
          onChange={(value) => onFilterChange("type", value)}
          options={[
            { value: "", label: "All types" },
            ...types.map((type) => ({ value: type, label: type })),
          ]}
        />
        <FilterSelect
          id="filterPerson"
          label="Filter by person"
          value={filters.person}
          onChange={(value) => onFilterChange("person", value)}
          options={[
            { value: "", label: "All people" },
            ...people.map((person) => ({ value: person.id, label: person.name })),
          ]}
        />
        <FilterSelect
          id="filterLocation"
          label="Filter by location"
          value={filters.location}
          onChange={(value) => onFilterChange("location", value)}
          options={[
            { value: "", label: "All locations" },
            ...locations.map((location) => ({
              value: location.id,
              label: `${location.id} - ${location.name}`,
            })),
          ]}
        />
      </div>
      <div className="toolbar-row">
        <FilterSelect
          id="filterStatus"
          label="Filter by status"
          value={filters.status}
          onChange={(value) => onFilterChange("status", value)}
          options={[
            { value: "", label: "All statuses" },
            { value: "unreviewed", label: "Unreviewed" },
            { value: "reviewed", label: "Reviewed" },
            { value: "flagged", label: "Flagged" },
          ]}
        />
        <FilterSelect
          id="filterRelevance"
          label="Filter by relevance"
          value={filters.relevance}
          onChange={(value) => onFilterChange("relevance", value)}
          options={[
            { value: "", label: "All relevance" },
            { value: "unknown", label: "Unknown" },
            { value: "relevant", label: "Relevant" },
            { value: "irrelevant", label: "Irrelevant" },
          ]}
        />
        <FilterSelect
          id="sortEvidence"
          label="Sort evidence"
          value={filters.sort}
          onChange={(value) => onFilterChange("sort", value)}
          options={[
            { value: "date-desc", label: "Newest first" },
            { value: "date-asc", label: "Oldest first" },
            { value: "title-asc", label: "Title (A–Z)" },
            { value: "title-desc", label: "Title (Z–A)" },
          ]}
        />
        <button
          type="button"
          id="clearFiltersBtn"
          className="btn btn-secondary"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
