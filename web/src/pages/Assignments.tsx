import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

interface Assignment {
  id: string;
  title: string;
  actor_id: string;
  status: string;
  priority: number;
  github_repo: string | null;
  github_issue_number: number | null;
  delegation_depth: number;
  platform: string | null;
  created_at: string;
}

export default function Assignments() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => apiFetch<{ items: Assignment[]; total: number }>('/assignments'),
  });

  const columns: Column<Assignment>[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Status', accessor: (r) => <StatusBadge status={r.status} /> },
    { header: 'Priority', accessor: 'priority' },
    {
      header: 'Source',
      accessor: (r) =>
        r.github_repo ? (
          <span className="text-xs text-qfc-muted">
            {r.github_repo}#{r.github_issue_number}
          </span>
        ) : r.platform ? (
          <span className="text-xs text-qfc-muted">{r.platform}</span>
        ) : (
          <span className="text-xs text-qfc-muted">—</span>
        ),
    },
    {
      header: 'Delegation',
      accessor: (r) =>
        r.delegation_depth > 0 ? (
          <span className="text-xs px-1.5 py-0.5 rounded bg-qfc-bg-light text-qfc-muted">
            depth {r.delegation_depth}
          </span>
        ) : (
          <span className="text-xs text-qfc-muted">—</span>
        ),
    },
    {
      header: 'Created',
      accessor: (r) => new Date(r.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Assignments</h2>
        <span className="text-sm text-qfc-muted">{data?.total ?? 0} total</span>
      </div>
      <div className="bg-qfc-bg-card border border-qfc-border rounded-lg">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          onRowClick={(r) => navigate(`/assignments/${r.id}`)}
        />
      </div>
    </div>
  );
}
