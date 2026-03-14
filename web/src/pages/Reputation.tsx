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
      accessor: (_r, i) => <span className="font-mono text-qfc-muted">{i + 1}</span>,
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
        <div className="flex items-center justify-end gap-2 md:justify-start">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-qfc-bg-light">
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
      accessor: (r) => (r.avg_execution_ms > 0 ? `${(r.avg_execution_ms / 1000).toFixed(1)}s` : '—'),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Reputation Leaderboard</h2>
          <p className="text-sm text-qfc-muted">Trust signals derived from execution history.</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-qfc-border bg-qfc-bg-card">
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
