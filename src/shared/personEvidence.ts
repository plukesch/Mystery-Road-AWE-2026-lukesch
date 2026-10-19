import type { Evidence, Person } from "../../js/types";

// ob ein beweisstueck eine person erwaehnt. reine variante von
// evidenceMentionsPerson() aus js/lookup.ts (die vanilla-version liest ihre
// daten aus dem globalen state-singleton, den die react-seite bewusst NICHT
// importiert, siehe UE3 demo 6 F3 / demo 10).
// prueft BEIDES (id und anzeigename), weil evidence.json inkonsistent ist:
// E04 enthaelt "Nova Byte" statt der id "nova-byte" (siehe js/types.ts,
// Evidence.personIds, UE2 demo 6).
// ue5 demo 4: lag bis dahin in features/people-locations/ (nur dort benutzt).
// seit der evidence-filter "nach person" dieselbe pruefung braucht, hat die
// datei ZWEI nutzer in zwei features -> nach shared/ umgezogen (regel aus
// ue4 demo 6). EINE stelle fuer diese regel, damit "Nova Byte" in der
// personen-detailseite und im evidence-filter nie unterschiedlich zaehlt.
export function evidenceMentionsPerson(evidence: Evidence, person: Person): boolean {
  return evidence.personIds.includes(person.id) || evidence.personIds.includes(person.name);
}

// alle beweisstuecke, die eine person erwaehnen. ue4 demo 9: liefert die LISTE
// statt nur der anzahl - die person-detailseite zeigt die beweisstuecke selbst,
// der zaehler auf der karte ist einfach .length derselben liste.
export function evidenceMentioningPerson(
  evidence: readonly Evidence[],
  person: Person
): Evidence[] {
  return evidence.filter((item) => evidenceMentionsPerson(item, person));
}
