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
    <div className="rounded-lg border border-qfc-border border-l-4 border-l-qfc-accent bg-qfc-bg-card p-4 sm:p-5">
      <p className="mb-1 text-[11px] uppercase tracking-wider text-qfc-muted sm:text-xs">{label}</p>
      <p className="text-xl font-bold text-qfc-text sm:text-2xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-qfc-muted">{sub}</p>}
    </div>
  );
}
