// ---------------------------------------------------------------------
// GENERIC LOOKUP HELPERS
// lesen nur aus dem state, schreiben nie -> eigenes modul
// ---------------------------------------------------------------------
// demo 5 (ue2): zweite .ts-datei. state.js selbst ist noch NICHT konvertiert
// (kommt in demo 6/7 mit den echten domain-typen Evidence/Person/Location).
// bis dahin tippen wir hier bewusst die GRENZEN unserer eigenen funktionen
// (parameter, rueckgabewerte) explizit selbst, statt uns auf ts's raterei aus
// dem untypisierten state.js zu verlassen -> unser code schreibt nirgends "any".
// demo 6: die anfangs lokalen EvidenceRecord/PersonRecord/LocationRecord sind
// jetzt durch die echten domain-typen aus types.ts ersetzt (ueberholt, siehe
// UE2_CHANGES.md).
import stateJs from "./state.js";
import type { Evidence, Person, Location, AppStateShape } from "./types.js";

// state.js ist selbst noch nicht typisiert (kommt in demo 7). ts leitet aus
// dem leeren array-literal "allEvidence: []" in state.js foelschlicherweise
// "never[]" ab, weil es nirgends im fuer ts sichtbaren code befuellt wird -
// das passiert erst zur laufzeit per fetch(), unsichtbar fuer den compiler.
// deshalb hier ein gezielter, eng begrenzter type-assertion statt "any": wir
// sagen ts nur fuer DIESE eine importstelle, was state tatsaechlich enthaelt.
// kein any, weil "any" JEDE pruefung fuer den wert abschalten wuerde (auch
// tippfehler bei property-namen) - "as AppStateShape" prueft weiterhin
// strukturell mit. der umweg ueber "unknown" ist noetig, weil state.js's
// eigenes "caseData: {}" (leeres objekt als startwert) laut ts zu wenig mit
// CaseFile (9 pflichtfelder) gemeinsam hat, um es ts direkt glauben zu
// lassen - "as unknown as X" ist ts's eigener, ausdruecklicher weg zu sagen
// "ich weiss es hier wirklich besser", nur EINMAL an dieser stelle, nicht
// (wie bei any) fuer immer und ueberall wo der wert danach hinfliesst.
const state = stateJs as unknown as AppStateShape;

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
