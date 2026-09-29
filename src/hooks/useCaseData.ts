// ---------------------------------------------------------------------
// DATEN-LADE-HOOK fuers dashboard (ue3 demo 10)
// spiegelbild von js/data.ts's loadAllData() - gleiche fetch()-quellen,
// gleiche json-dateien - aber bewusst EIGENSTAENDIG: kein import von
// js/data.ts oder js/state.ts, um die in demo 6/9 getroffene trennung nicht
// aufzuweichen (siehe UE3_THEORIE_ANTWORTEN demo 10 F1 fuer die begruendung,
// warum das noch ein bewusster platzhalter ist, kein finaler zustand).
// ---------------------------------------------------------------------
import { useEffect, useState } from "react";
import type { CaseFile, Person, Location, Evidence, TimelineEvent } from "../../js/types";

export interface CaseData {
  caseData: CaseFile;
  people: Person[];
  locations: Location[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
}

export type CaseDataState =
  { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; data: CaseData };

export function useCaseData(): CaseDataState {
  const [state, setState] = useState<CaseDataState>({ status: "loading" });

  useEffect(() => {
    // schutz gegen die race condition, die js/data.ts NICHT hat (siehe
    // UE3_THEORIE_ANTWORTEN demo 4 F2): wird diese komponente vor
    // abschluss des fetches wieder entmountet (schneller view-wechsel),
    // darf das ergebnis keinen state mehr setzen.
    let cancelled = false;

    async function load() {
      try {
        // parallel statt sequenziell (js/data.ts awaitet case/people/locations
        // nacheinander) - fuer 5 kleine, unabhaengige dateien gibt es keinen
        // grund, auf eine zu warten, bevor die naechste startet.
        const [caseRes, peopleRes, locationsRes, evidenceRes, timelineRes] = await Promise.all([
          fetch("data/case.json"),
          fetch("data/people.json"),
          fetch("data/locations.json"),
          fetch("data/evidence.json"),
          fetch("data/timeline.json"),
        ]);
        const [caseData, people, locations, evidence, timeline] = await Promise.all([
          caseRes.json() as Promise<CaseFile>,
          peopleRes.json() as Promise<Person[]>,
          locationsRes.json() as Promise<Location[]>,
          evidenceRes.json() as Promise<Evidence[]>,
          timelineRes.json() as Promise<TimelineEvent[]>,
        ]);
        if (!cancelled) {
          setState({
            status: "ready",
            data: { caseData, people, locations, evidence, timeline },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: "error", error });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
