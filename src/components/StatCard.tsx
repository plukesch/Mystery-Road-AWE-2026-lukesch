interface StatCardProps {
  value: number;
  label: string;
}

// spiegelbild von statCardHTML() aus js/views/dashboard.ts - dort eine reine
// string-bau-funktion, hier eine reine, wiederverwendbare komponente
// (siehe UE3 Demo 7, props/daten-tabelle).
export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
