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
          <span className="inline-flex rounded bg-qfc-bg-light px-1.5 py-0.5 text-xs text-qfc-muted">
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
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Assignments</h2>
          <p className="text-sm text-qfc-muted">Track work items, sources, and delegation depth.</p>
        </div>
        <span className="text-sm text-qfc-muted">{data?.total ?? 0} total</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-qfc-border bg-qfc-bg-card">
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
