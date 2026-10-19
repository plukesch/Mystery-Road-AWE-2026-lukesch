import type { Location, Person } from "../../../js/types";
import { FilterSelect } from "../../shared/FilterSelect";

interface EvidenceToolbarProps {
  people: Person[];
  locations: Location[];
  types: string[];
}

// spiegelbild von #evidenceToolbar aus index.html + populateEvidenceDropdowns()
// (js/views/evidence.ts). PRESENTATIONAL: bekommt alles per props.
// ue5 demo 1: nur die STRUKTUR - alle sieben elemente sind sichtbar, aber noch
// nicht verdrahtet (kein onChange/onClick). die suche wird in demo 2
// kontrolliert, die filter laufen ab demo 4/7 ueber einen gemeinsamen zustand.
// das suchfeld ist ohne "value" ein UNKONTROLLIERTES eingabefeld: der browser
// haelt den getippten text, react weiss nichts davon (siehe demo 2).
export function EvidenceToolbar({ people, locations, types }: EvidenceToolbarProps) {
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
        />
        <FilterSelect
          id="filterType"
          label="Filter by type"
          defaultValue=""
          options={[
            { value: "", label: "All types" },
            ...types.map((type) => ({ value: type, label: type })),
          ]}
        />
        <FilterSelect
          id="filterPerson"
          label="Filter by person"
          defaultValue=""
          options={[
            { value: "", label: "All people" },
            ...people.map((person) => ({ value: person.id, label: person.name })),
          ]}
        />
        <FilterSelect
          id="filterLocation"
          label="Filter by location"
          defaultValue=""
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
          defaultValue=""
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
          defaultValue=""
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
          defaultValue="date-desc"
          options={[
            { value: "date-desc", label: "Newest first" },
            { value: "date-asc", label: "Oldest first" },
            { value: "title-asc", label: "Title (A–Z)" },
            { value: "title-desc", label: "Title (Z–A)" },
          ]}
        />
        <button type="button" id="clearFiltersBtn" className="btn btn-secondary">
          Clear filters
        </button>
      </div>
    </div>
  );
}
