import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import DataTable, { Column } from '../components/DataTable';

interface LeaderboardEntry {
  actor_id: string;
  handle: string;
  display_name: string;
  total_assignments: number;
  completed: number;
  failed: number;
  success_rate: number;
  avg_execution_ms: number;
}

export default function Reputation() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => apiFetch<LeaderboardEntry[]>('/reputation/leaderboard'),
  });

  const columns: Column<LeaderboardEntry>[] = [
    {
      header: '#',
      accessor: (_r, i) => (
        <span className="text-qfc-muted font-mono">{i + 1}</span>
      ),
      className: 'w-12',
    },
    { header: 'Handle', accessor: 'handle' },
    { header: 'Name', accessor: 'display_name' },
    { header: 'Total', accessor: 'total_assignments' },
    { header: 'Completed', accessor: 'completed' },
    { header: 'Failed', accessor: 'failed' },
    {
      header: 'Success Rate',
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-qfc-bg-light overflow-hidden">
            <div
              className="h-full rounded-full bg-qfc-primary"
              style={{ width: `${Math.round(r.success_rate * 100)}%` }}
            />
          </div>
          <span className="text-xs text-qfc-muted">{Math.round(r.success_rate * 100)}%</span>
        </div>
      ),
    },
    {
      header: 'Avg Time',
      accessor: (r) =>
        r.avg_execution_ms > 0 ? `${(r.avg_execution_ms / 1000).toFixed(1)}s` : '—',
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Reputation Leaderboard</h2>
      <div className="bg-qfc-bg-card border border-qfc-border rounded-lg">
        <DataTable
          columns={columns}
          data={data ?? []}
          loading={isLoading}
          onRowClick={(r) => navigate(`/agents/${r.actor_id}`)}
          emptyMessage="No reputation data yet"
        />
      </div>
    </div>
  );
}
