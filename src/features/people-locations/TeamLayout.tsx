// ---------------------------------------------------------------------
// PEOPLE & LOCATIONS - gemeinsames LAYOUT der beiden routen (ue4 demo 8)
// war bis demo 7 eine einzelne seite (PeoplePage), die beide listen
// untereinander zeigte. in vanilla war es ein tab mit state
// (state.currentPeopleTab, ein click-handler, manuelles .hidden-umschalten).
// jetzt gibt es zwei ECHTE urls: /team/people und /team/locations. dieses
// layout liefert, was beide gemeinsam haben - ueberschrift und tab-leiste - und
// reicht die daten ueber den Outlet-context an die kinder weiter.
// ue5 demo 9: die daten kommen FERTIG als Prop `data` von PageRouter (einmal
// geladen, die status-aenderungen schon eingerechnet). frueher lud dieses layout
// sie selbst (useCaseData) und legte reviewEdits selbst ueber die beweisstuecke -
// wie vier andere seiten auch.
// ---------------------------------------------------------------------
import { NavLink, Outlet } from "react-router";
import type { CaseData } from "../../shared/useCaseData";
import { ROUTES } from "../../shared/routes";

interface TeamLayoutProps {
  data: CaseData;
}

export function TeamLayout({ data }: TeamLayoutProps) {
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
      {/* ein tab-wechsel tauscht nur das kind aus; die daten bleiben dieselben. */}
      <Outlet context={data} />
    </section>
  );
}
