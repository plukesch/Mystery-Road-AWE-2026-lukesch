import { NavLink } from "react-router";
import { ROUTES } from "../shared/routes";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

// feste liste statt aus daten generiert - die 5 views sind eine feste, kleine menge.
// "People & Locations" zeigt auf /team (nicht /team/people), damit der button auch
// auf /team/locations aktiv bleibt; /team leitet selbst auf /team/people weiter.
// "end" beim Dashboard: ohne waere "/" ein praefix von JEDEM pfad und der
// dashboard-button immer aktiv.
const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.dashboard, label: "Dashboard", end: true },
  { to: ROUTES.evidence, label: "Evidence" },
  { to: ROUTES.team, label: "People & Locations" },
  { to: ROUTES.timeline, label: "Timeline" },
  { to: ROUTES.workspace, label: "Workspace" },
];

// NavLink haengt von sich aus die klasse "active" an, wenn sein ziel zur
// aktuellen url passt - das war in vanilla die handgeschriebene schleife in
// js/navigation.ts, und in demo 9 der isActive-prop von NavButton.
export function NavBar() {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="nav-btn">
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
