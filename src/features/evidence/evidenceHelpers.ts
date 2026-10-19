// ---------------------------------------------------------------------
// reine hilfsfunktionen fuer den evidence-katalog (ue5 demo 1)
// kein state, kein localStorage: alles kommt als parameter, alles geht als
// rueckgabewert raus - wie timelineHelpers.ts.
// ---------------------------------------------------------------------
import type { Evidence, Location, Person } from "../../../js/types";

// neueste zuerst = der default von #sortEvidence in vanilla ("date-desc").
// sortiert eine KOPIE ([...evidence]): Array.sort() sortiert sonst das
// ORIGINAL-array in place - genau der aliasing-fehler aus UE1 demo 2, bei dem
// die urspruengliche reihenfolge dauerhaft verloren ging (siehe demo 3).
export function sortNewestFirst(evidence: Evidence[]): Evidence[] {
  return [...evidence].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// die typen fuer das dropdown, kleingeschrieben und ohne doppelte, in der
// reihenfolge ihres ersten auftretens - wie populateEvidenceDropdowns() in
// vanilla. evidence.json ist nicht einheitlich (z. B. "test-report" neben
// "Test-Report"); die vanilla-filter vergleichen deshalb mit toLowerCase().
export function uniqueTypes(evidence: Evidence[]): string[] {
  const types: string[] = [];
  for (const item of evidence) {
    const type = item.type.toLowerCase();
    if (!types.includes(type)) types.push(type);
  }
  return types;
}

// personIds enthaelt meistens eine id ("kernel-colt"), bei E04 aber den
// ANZEIGENAMEN ("Nova Byte", siehe js/types.ts). findet sich keine person zur
// id, wird der rohe wert angezeigt - wie renderEvidenceDetail() in vanilla.
export function resolvePersonNames(personIds: string[], people: Person[]): string[] {
  return personIds.map((id) => people.find((person) => person.id === id)?.name ?? id);
}

export function resolveLocationLabels(locationIds: string[], locations: Location[]): string[] {
  return locationIds.map((id) => {
    const location = locations.find((loc) => loc.id === id);
    return location ? `${location.id} - ${location.name}` : id;
  });
}
