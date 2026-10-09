// ---------------------------------------------------------------------
// DETAILSEITE EINER PERSON (ue4 demo 9) - route /team/people/:personId
// liest die id aus der URL (useParams), sucht die person in den daten, die
// das TeamLayout per Outlet-context bereitstellt, und zeigt sie samt der
// zugehoerigen beweisstuecke. FEATURE-komponente (liest vom router).
// ---------------------------------------------------------------------
import { Link, useOutletContext, useParams } from "react-router";
import type { CaseData } from "../../shared/useCaseData";
import { ROUTES, timelinePath } from "../../shared/routes";
import { StatusBadge } from "../../shared/StatusBadge";
import { evidenceMentioningPerson } from "./personEvidence";
import { PersonCard } from "./PersonCard";

export function PersonDetail() {
  // useParams() liefert fuer JEDEN parameter "string | undefined" - der router
  // kann zur compile-zeit nicht wissen, ob die route wirklich diesen
  // parameter hat, und die url kommt vom nutzer. siehe THEORIE_ANTWORTEN demo 9 F1.
  const { personId } = useParams();
  const { people, evidence } = useOutletContext<CaseData>();

  // ist die id nicht bekannt (tippfehler im link, geloeschte person), liefert
  // find() undefined. DAS ist der fall, den der router NICHT fuer uns abfaengt:
  // die url /team/people/xyz passt auf die route - nur die DATEN passen nicht.
  const person = people.find((p) => p.id === personId);

  if (!person) {
    return (
      <div>
        <p>There is no person with the id &ldquo;{personId}&rdquo;.</p>
        <Link to={ROUTES.people}>&larr; Back to all people</Link>
      </div>
    );
  }

  const related = evidenceMentioningPerson(evidence, person);

  return (
    <div>
      <p>
        <Link to={ROUTES.people}>&larr; Back to all people</Link>
      </p>
      <PersonCard person={person} evidenceCount={related.length} />
      {/* ue4 demo 10: link auf die timeline mit vorausgewaehlter person
          (/timeline?person=<id>) - die query ist eine EINSTELLUNG der timeline,
          keine eigene seite (siehe demo 9 F2). */}
      <p>
        <Link to={timelinePath(person.id)}>
          Show {person.name}&rsquo;s events on the timeline &rarr;
        </Link>
      </p>
      <h3>Related evidence</h3>
      {related.length === 0 ? (
        <p>No evidence mentions this person.</p>
      ) : (
        related.map((ev) => (
          <div className="mini-list-item" key={ev.id}>
            <strong>{ev.id}</strong> &mdash; {ev.title} <StatusBadge status={ev.status} />
          </div>
        ))
      )}
    </div>
  );
}
