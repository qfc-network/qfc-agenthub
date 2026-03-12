const statusColors: Record<string, string> = {
  active: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  inactive: 'bg-gray-900/50 text-gray-400 border-gray-700',
  suspended: 'bg-red-900/50 text-red-300 border-red-700',
  pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  running: 'bg-blue-900/50 text-blue-300 border-blue-700',
  completed: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  failed: 'bg-red-900/50 text-red-300 border-red-700',
  cancelled: 'bg-gray-900/50 text-gray-400 border-gray-700',
  minted: 'bg-purple-900/50 text-purple-300 border-purple-700',
  revoked: 'bg-red-900/50 text-red-300 border-red-700',
  online: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  offline: 'bg-gray-900/50 text-gray-400 border-gray-700',
  busy: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = statusColors[status] ?? 'bg-gray-900/50 text-gray-400 border-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${cls}`}>
      {status}
    </span>
  );
}
