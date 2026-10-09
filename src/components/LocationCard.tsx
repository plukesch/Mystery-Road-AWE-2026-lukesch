import type { Location } from "../../js/types";
import { Card } from "./Card";
import { BulletList } from "./BulletList";

interface LocationCardProps {
  location: Location;
}

// spiegelbild eines einzelnen location-cards aus renderLocations() (js/views/people.ts).
export function LocationCard({ location }: LocationCardProps) {
  return (
    <Card variant="location">
      <h3>
        {location.id} &mdash; {location.name}
      </h3>
      <p>{location.description}</p>
      <p>
        <strong>Contains:</strong>
      </p>
      <BulletList items={location.contains} />
    </Card>
  );
}
