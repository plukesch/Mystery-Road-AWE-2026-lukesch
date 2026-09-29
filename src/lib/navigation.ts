import type { ViewName } from "../hooks/useHashRoute";

// spiegelbild von navigateTo() aus js/navigation.ts. an einer stelle gebuendelt,
// weil sowohl NavButton als auch die "Go to X"-buttons in IntroCard denselben
// einzeiler brauchen.
export function navigateTo(viewName: ViewName): void {
  window.location.hash = viewName;
}
