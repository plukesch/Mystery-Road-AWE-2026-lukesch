import { useOutletContext } from "react-router";
import type { CaseData } from "../../shared/useCaseData";
import { LocationCard } from "./LocationCard";

// inhalt der route /team/locations (daten wie bei PeopleTab aus dem Outlet-context).
export function LocationsTab() {
  const { locations } = useOutletContext<CaseData>();

  return (
    <div className="locations-grid">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  );
}
