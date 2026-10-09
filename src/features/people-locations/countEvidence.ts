import type { Evidence, Person } from "../../../js/types";

// reine variante von countEvidenceForPerson()/evidenceMentionsPerson() aus
// js/lookup.ts - die vanilla-version liest ihre daten aus dem globalen
// state-singleton (js/state.ts), den die react-seite bewusst NICHT importiert
// (siehe UE3 demo 6 F3 / demo 10). hier bekommt die funktion die evidence-liste
// stattdessen als parameter.
// prueft BEIDES (id und anzeigename), weil evidence.json inkonsistent ist:
// E04 enthaelt "Nova Byte" statt der id "nova-byte" (siehe js/types.ts,
// Evidence.personIds, UE2 demo 6).
export function countEvidenceForPerson(evidence: Evidence[], person: Person): number {
  let count = 0;
  for (const ev of evidence) {
    if (ev.personIds.includes(person.id) || ev.personIds.includes(person.name)) {
      count++;
    }
  }
  return count;
}
