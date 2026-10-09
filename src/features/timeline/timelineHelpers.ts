import type { Location, TimelineEvent } from "../../../js/types";

// orts-ids eines events in anzeigenamen aufloesen. unbekannte id -> die id
// selbst anzeigen (wie in vanilla: "evtLoc ? evtLoc.name : locationId").
export function resolveLocationNames(event: TimelineEvent, locations: Location[]): string[] {
  return event.locationIds.map((id) => locations.find((loc) => loc.id === id)?.name ?? id);
}

// aelteste zuerst (= der vanilla-default "asc"). arbeitet auf einer KOPIE:
// ein in-place-sort auf dem original-array waere genau der aliasing-bug aus
// UE1 demo 2 (filteredEvidence === allEvidence, sort zerlegte die master-liste).
export function sortByTimeAscending(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

// ue4 demo 10: nur die events, in denen diese person vorkommt (wie der
// person-filter in vanilla: "evt.personIds.indexOf(personFilter) === -1 -> skip").
// leere id = kein filter. events OHNE personIds (T11-T13 in timeline.json) fallen
// bei JEDEM konkreten filter heraus, wie in vanilla.
export function filterByPerson(events: TimelineEvent[], personId: string): TimelineEvent[] {
  if (!personId) return events;
  return events.filter((event) => event.personIds.includes(personId));
}

// die event-typen fuer das typ-dropdown, in der reihenfolge ihres ersten auftretens
// in den daten (wie vanilla: "if (types.indexOf(evt.type) === -1) types.push(...)").
export function uniqueEventTypes(events: TimelineEvent[]): string[] {
  return [...new Set(events.map((event) => event.type))];
}
