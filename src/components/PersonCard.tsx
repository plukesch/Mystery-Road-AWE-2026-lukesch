import type { Person } from "../../js/types";
import { Card } from "./Card";
import { BulletList } from "./BulletList";

interface PersonCardProps {
  person: Person;
  evidenceCount: number;
}

// spiegelbild eines einzelnen person-cards aus renderPeople() (js/views/people.ts).
// der "view"-button der vanilla-version fehlt bewusst: er filtert die
// evidence-liste und navigiert dorthin - beides braucht interaktivitaet bzw. die
// noch nicht migrierte evidence-seite (ue5). nur der zaehler bleibt.
export function PersonCard({ person, evidenceCount }: PersonCardProps) {
  return (
    <Card variant="person">
      <div className="person-card-header">
        <img className="person-avatar" src={person.avatar} alt={`Portrait of ${person.name}`} />
        <div>
          <h3>{person.name}</h3>
          <div className="person-role">{person.role}</div>
        </div>
      </div>
      <p>
        <strong>Speciality:</strong> {person.speciality}
      </p>
      <BulletList items={person.responsibilities} />
      <div className="person-statement">&ldquo;{person.statement}&rdquo;</div>
      <p>
        {evidenceCount} related evidence item{evidenceCount === 1 ? "" : "s"}
      </p>
    </Card>
  );
}
