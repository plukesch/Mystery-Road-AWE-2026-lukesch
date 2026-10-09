import type { Evidence, Person } from "../../../js/types";

// alle beweisstuecke, die eine person erwaehnen. reine variante von
// countEvidenceForPerson()/evidenceMentionsPerson() aus js/lookup.ts - die
// vanilla-version liest ihre daten aus dem globalen state-singleton
// (js/state.ts), den die react-seite bewusst NICHT importiert (siehe UE3 demo 6
// F3 / demo 10). hier bekommt die funktion die evidence-liste als parameter.
// prueft BEIDES (id und anzeigename), weil evidence.json inkonsistent ist:
// E04 enthaelt "Nova Byte" statt der id "nova-byte" (siehe js/types.ts,
// Evidence.personIds, UE2 demo 6).
// ue4 demo 9: liefert jetzt die LISTE statt nur der anzahl (vorher
// countEvidenceForPerson) - die person-detailseite zeigt die beweisstuecke
// selbst, der zaehler auf der karte ist einfach .length derselben liste.
export function evidenceMentioningPerson(evidence: Evidence[], person: Person): Evidence[] {
  return evidence.filter(
    (ev) => ev.personIds.includes(person.id) || ev.personIds.includes(person.name)
  );
}
