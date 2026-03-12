export default function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-qfc-bg-card border border-qfc-border rounded-lg p-5 border-l-4 border-l-qfc-accent">
      <p className="text-xs uppercase tracking-wider text-qfc-muted mb-1">{label}</p>
      <p className="text-2xl font-bold text-qfc-text">{value}</p>
      {sub && <p className="text-xs text-qfc-muted mt-1">{sub}</p>}
    </div>
  );
}
