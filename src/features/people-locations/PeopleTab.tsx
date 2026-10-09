import { useOutletContext } from "react-router";
import type { CaseData } from "../../shared/useCaseData";
import { personPath } from "../../shared/routes";
import { evidenceMentioningPerson } from "./personEvidence";
import { PersonCard } from "./PersonCard";

// inhalt der route /team/people. die daten kommen aus dem Outlet-context des
// TeamLayout (liest vom router -> feature-seite, nicht presentational).
export function PeopleTab() {
  const { people, evidence } = useOutletContext<CaseData>();

  return (
    <div className="people-grid">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          evidenceCount={evidenceMentioningPerson(evidence, person).length}
          detailTo={personPath(person.id)}
        />
      ))}
    </div>
  );
}
