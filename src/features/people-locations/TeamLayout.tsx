// ---------------------------------------------------------------------
// PEOPLE & LOCATIONS - gemeinsames LAYOUT der beiden routen (ue4 demo 8)
// war bis demo 7 eine einzelne seite (PeoplePage), die beide listen
// untereinander zeigte. in vanilla war es ein tab mit state
// (state.currentPeopleTab, ein click-handler, manuelles .hidden-umschalten).
// jetzt gibt es zwei ECHTE urls: /team/people und /team/locations. dieses
// layout liefert, was beide gemeinsam haben - ueberschrift, tab-leiste, und
// EINMAL die daten laden (FEATURE-komponente, siehe demo 5). die kinder
// bekommen die geladenen daten ueber den Outlet-context.
// ue5 demo 5: die status-aenderungen kommen als PROP vom gemeinsamen vorfahren
// (PageRouter) und werden hier ueber die geladenen beweisstuecke gelegt - die
// personen-detailseite zeigt so denselben status wie die evidence-seite.
// ---------------------------------------------------------------------
import { NavLink, Outlet } from "react-router";
import { useCaseData } from "../../shared/useCaseData";
import { ROUTES } from "../../shared/routes";
import { applyReviewEdits, type ReviewEdit } from "../../shared/reviewEdits";

interface TeamLayoutProps {
  reviewEdits: Readonly<Record<string, ReviewEdit>>;
}

export function TeamLayout({ reviewEdits }: TeamLayoutProps) {
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

  // abgeleitet (demo 4): die geladenen daten, bei denen die beweisstuecke die
  // aenderungen des nutzers tragen. die kinder (PeopleTab, PersonDetail) lesen
  // das ueber den Outlet-context und wissen nichts davon.
  const data = {
    ...caseDataState.data,
    evidence: applyReviewEdits(caseDataState.data.evidence, reviewEdits),
  };

  return (
    <section>
      <h2>People &amp; Locations</h2>
      {/* NavLink statt <button onClick>: der "tab" ist ein link auf eine URL,
          die aktive klasse setzt der router selbst. */}
      <div className="tab-bar">
        <NavLink to={ROUTES.people} className="tab-btn">
          People
        </NavLink>
        <NavLink to={ROUTES.locations} className="tab-btn">
          Locations
        </NavLink>
      </div>
      {/* daten EINMAL im layout laden: ein tab-wechsel tauscht nur das kind aus,
          das layout (und damit der fetch) bleibt bestehen. */}
      <Outlet context={data} />
    </section>
  );
}
