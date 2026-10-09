interface BulletListProps {
  items: string[];
}

// kleine, reine listen-komponente. wird von PersonCard (responsibilities) UND
// LocationCard (contains) benutzt - in der vanilla-app waren das zwei
// separate, handgeschriebene "<ul>"-schleifen (js/views/people.ts).
// key={item}: die strings innerhalb EINER liste sind eindeutig - mehr zu keys
// in demo 3/4.
export function BulletList({ items }: BulletListProps) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
