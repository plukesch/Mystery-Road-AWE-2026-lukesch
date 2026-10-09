// ---------------------------------------------------------------------
// HASH-ROUTING-HOOK (ue3 demo 9)
// spiegelbild von js/navigation.ts's state.currentPage + handleHashChange() -
// gleiche grund-idee (fensters hash liest man aus, unbekannte werte fallen
// auf "dashboard" zurueck), aber react-idiomatisch: statt eine mutable
// state-eigenschaft von hand zu setzen und danach manuell die betroffenen
// render-funktionen aufzurufen, ist "aktuelle view" hier waehrend react-state
// (useState) - aendert sich der wert, rendert react automatisch alles neu,
// was ihn liest. siehe UE3_THEORIE_ANTWORTEN demo 9 F1 fuer den direkten
// vergleich beider ansaetze.
// ---------------------------------------------------------------------
import { useEffect, useState } from "react";
import { VIEWS, type ViewName } from "../shared/navigation";

// unbekannter/leerer hash -> fallback "dashboard". exakt dasselbe verhalten
// wie handleHashChange()s "if (validViews.indexOf(hash) === -1) hash = 'dashboard'" -
// bewusst 1:1 gespiegelt, kein neues verhalten erfunden (siehe demo 9 F2).
function readCurrentView(): ViewName {
  const hash = window.location.hash.replace("#", "");
  return (VIEWS as readonly string[]).includes(hash) ? (hash as ViewName) : "dashboard";
}

export function useHashRoute(): ViewName {
  const [view, setView] = useState<ViewName>(() => readCurrentView());

  useEffect(() => {
    function handleHashChange() {
      setView(readCurrentView());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return view;
}
