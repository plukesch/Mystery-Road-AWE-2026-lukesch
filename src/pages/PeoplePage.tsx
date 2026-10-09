// ---------------------------------------------------------------------
// PEOPLE & LOCATIONS (ue4 demo 1) - ersetzt den ue3-platzhalter.
// bewusst OHNE tab-umschalter: die vanilla-version hatte einen people/
// locations-tab mit state (state.currentPeopleTab). ue4 verbietet state -
// beide listen stehen deshalb vorerst untereinander. der tab kommt in
// demo 8 als echte route zurueck (/team/people, /team/locations).
// ---------------------------------------------------------------------
import { useCaseData } from "../hooks/useCaseData";
import { countEvidenceForPerson } from "../lib/evidence";
import { PersonCard } from "../components/PersonCard";
import { LocationCard } from "../components/LocationCard";

export function PeoplePage() {
  const caseDataState = useCaseData();

  if (caseDataState.status === "loading") {
    return (
      <section>
        <h2>People &amp; Locations</h2>
        <p>Loading case file&hellip;</p>
      </section>
    );
  }

  if (caseDataState.status === "error") {
    return (
      <section>
        <h2>People &amp; Locations</h2>
        <p>Could not load the case data. Please reload the page.</p>
      </section>
    );
  }

  const { people, locations, evidence } = caseDataState.data;

  // demo 1 live-vorfuehrung (typfehler): naechste zeile einkommentieren, dann
  // meldet "npm run typecheck" einen fehler - LocationCard erwartet ein
  // Location-OBJEKT, kein string. zeile danach wieder auskommentieren.
  // const kaputt = <LocationCard location="L01" />;

  return (
    <section>
      <h2>People &amp; Locations</h2>

      <h3>People</h3>
      <div className="people-grid">
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            evidenceCount={countEvidenceForPerson(evidence, person)}
          />
        ))}
      </div>

      <h3>Locations</h3>
      <div className="locations-grid">
        {locations.map((location) => (
          <LocationCard key={location.id} location={location} />
        ))}
      </div>
    </section>
  );
}
