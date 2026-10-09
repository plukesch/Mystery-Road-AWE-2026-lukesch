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
