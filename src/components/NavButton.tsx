import { navigateTo } from "../lib/navigation";
import type { ViewName } from "../hooks/useHashRoute";

interface NavButtonProps {
  viewName: ViewName;
  label: string;
  isActive: boolean;
}

// vanilla-aequivalent: der ".nav-btn"-loop in js/navigation.ts, der von hand
// ".active" auf/ab setzt. hier ist "active" einfach ein bool-prop, aus dem
// react die klasse jedes mal frisch ableitet - kein separater "geh alle
// buttons durch und raeum die alte active-klasse weg"-schritt noetig.
export function NavButton({ viewName, label, isActive }: NavButtonProps) {
  return (
    <button
      type="button"
      className={"nav-btn" + (isActive ? " active" : "")}
      data-view={viewName}
      onClick={() => navigateTo(viewName)}
    >
      {label}
    </button>
  );
}
