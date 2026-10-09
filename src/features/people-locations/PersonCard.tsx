import { Link } from "react-router";
import type { Person } from "../../../js/types";
import { Card } from "./Card";
import { BulletList } from "./BulletList";

interface PersonCardProps {
  person: Person;
  evidenceCount: number;
  // ue4 demo 9: ziel des "view"-links. optional, weil dieselbe karte AUCH auf
  // der detailseite selbst steht - dort waere ein link "auf sich selbst" sinnlos.
  detailTo?: string;
}

// spiegelbild eines einzelnen person-cards aus renderPeople() (js/views/people.ts).
// der "view"-button der vanilla-version filterte die evidence-liste und
// navigierte dorthin (braucht die noch nicht migrierte evidence-seite, ue5).
// ersatz ab demo 9: "view" ist ein link auf die person-detailseite, die die
// zugehoerigen beweisstuecke selbst auflistet.
export function PersonCard({ person, evidenceCount, detailTo }: PersonCardProps) {
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
        {/* "&&" mit einem STRING links: bei "" (leer) rendert React nichts - die
            0-falle aus demo 2 betrifft nur Zahlen. */}
        {detailTo && (
          <>
            {" "}
            &mdash;{" "}
            <Link className="evidence-count-link" to={detailTo}>
              view
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
