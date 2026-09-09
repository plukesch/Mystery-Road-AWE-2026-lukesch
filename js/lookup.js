// ---------------------------------------------------------------------
// GENERIC LOOKUP HELPERS
// lesen nur aus dem state, schreiben nie -> eigenes modul
// ---------------------------------------------------------------------
import state from "./state.js";

export function findEvidenceById(id) {
  for (let i = 0; i < state.allEvidence.length; i++) {
    if (state.allEvidence[i].id === id) return state.allEvidence[i];
  }
  return null;
}

export function findPersonById(id) {
  for (let i = 0; i < state.allPeople.length; i++) {
    if (state.allPeople[i].id === id) return state.allPeople[i];
  }
  return null;
}

export function findLocationById(id) {
  for (let i = 0; i < state.allLocations.length; i++) {
    if (state.allLocations[i].id === id) return state.allLocations[i];
  }
  return null;
}

// evidence-daten sind inkonsistent: mal personId, mal name -> beides pruefen
// demo 10: pur, kein `this` -> arrow
export const evidenceMentionsPerson = (ev, person) => {
  if (!ev.personIds) return false;
  return ev.personIds.indexOf(person.id) !== -1 || ev.personIds.indexOf(person.name) !== -1;
};

// bleibt bewusst function declaration (schleife + wird in mehreren modulen genutzt)
export function countEvidenceForPerson(person) {
  let count = 0;
  for (let i = 0; i < state.allEvidence.length; i++) {
    if (evidenceMentionsPerson(state.allEvidence[i], person)) count++;
  }
  return count;
}
