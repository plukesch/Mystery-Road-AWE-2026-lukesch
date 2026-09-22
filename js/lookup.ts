// ---------------------------------------------------------------------
// GENERIC LOOKUP HELPERS
// lesen nur aus dem state, schreiben nie -> eigenes modul
// ---------------------------------------------------------------------
// demo 5: hier stand anfangs ein "as unknown as AppStateShape"-umweg, weil
// state.js selbst noch nicht typisiert war (ts riet faelschlich "never[]"
// fuer die leeren array-literale). demo 7 konvertiert jetzt auch state.js
// selbst -> state ist ab hier einfach direkt echt getypt, kein umweg mehr noetig.
import state from "./state.js";
import type { Evidence, Person, Location } from "./types.js";

// noUncheckedIndexedAccess (bewusst angeschaltet, siehe tsconfig.json) macht
// state.allEvidence[i] zu "Evidence | undefined" statt blind "Evidence" -
// ts kann bei einem for-loop nicht beweisen, dass der index immer im bereich
// liegt. deshalb den wert einmal in eine variable holen und pruefen, statt ihn
// zweimal (im if UND im return) blind zu indizieren - verhalten unveraendert
// (weiterhin null bei "nicht gefunden"), nur jetzt auch fuer ts nachvollziehbar.
export function findEvidenceById(id: string): Evidence | null {
  for (let i = 0; i < state.allEvidence.length; i++) {
    const ev = state.allEvidence[i];
    if (ev && ev.id === id) return ev;
  }
  return null;
}

export function findPersonById(id: string): Person | null {
  for (let i = 0; i < state.allPeople.length; i++) {
    const person = state.allPeople[i];
    if (person && person.id === id) return person;
  }
  return null;
}

export function findLocationById(id: string): Location | null {
  for (let i = 0; i < state.allLocations.length; i++) {
    const loc = state.allLocations[i];
    if (loc && loc.id === id) return loc;
  }
  return null;
}

// evidence-daten sind inkonsistent: mal personId, mal name -> beides pruefen
// (die genaue geschichte dazu steht jetzt direkt am Evidence.personIds-feld
// in types.ts, demo 6 task 3)
// demo 10: pur, kein `this` -> arrow
export const evidenceMentionsPerson = (ev: Evidence, person: Person): boolean => {
  if (!ev.personIds) return false;
  return ev.personIds.indexOf(person.id) !== -1 || ev.personIds.indexOf(person.name) !== -1;
};

// bleibt bewusst function declaration (schleife + wird in mehreren modulen genutzt)
export function countEvidenceForPerson(person: Person): number {
  let count = 0;
  for (let i = 0; i < state.allEvidence.length; i++) {
    const ev = state.allEvidence[i];
    if (ev && evidenceMentionsPerson(ev, person)) count++;
  }
  return count;
}
