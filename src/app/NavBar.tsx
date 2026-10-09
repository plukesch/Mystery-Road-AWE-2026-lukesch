import { NavButton } from "./NavButton";
import type { ViewName } from "../shared/navigation";

interface NavBarProps {
  currentView: ViewName;
}

// feste liste statt aus daten generiert (anders als z.b. die filter-dropdowns
// in der vanilla-app) - die 5 views sind eine feste, kleine menge, kein
// grund, das aus irgendwelchen daten abzuleiten.
const NAV_ITEMS: { viewName: ViewName; label: string }[] = [
  { viewName: "dashboard", label: "Dashboard" },
  { viewName: "evidence", label: "Evidence" },
  { viewName: "people", label: "People & Locations" },
  { viewName: "timeline", label: "Timeline" },
  { viewName: "workspace", label: "Workspace" },
];

export function NavBar({ currentView }: NavBarProps) {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.viewName}
          viewName={item.viewName}
          label={item.label}
          isActive={item.viewName === currentView}
        />
      ))}
    </nav>
  );
}
