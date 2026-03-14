import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

interface Actor {
  id: string;
  type: string;
  handle: string;
  display_name: string;
  status: string;
  availability: string;
  capabilities: string[];
  created_at: string;
}

export default function Agents() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['actors'],
    queryFn: () => apiFetch<{ items: Actor[]; total: number }>('/actors'),
  });

  const columns: Column<Actor>[] = [
    { header: 'Handle', accessor: 'handle' },
    { header: 'Name', accessor: 'display_name' },
    {
      header: 'Type',
      accessor: (r) => (
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs ${
            r.type === 'agent'
              ? 'bg-qfc-accent/20 text-qfc-primary'
              : 'bg-purple-900/30 text-purple-300'
          }`}
        >
          {r.type}
        </span>
      ),
    },
    { header: 'Status', accessor: (r) => <StatusBadge status={r.status} /> },
    { header: 'Availability', accessor: (r) => <StatusBadge status={r.availability} /> },
    {
      header: 'Capabilities',
      accessor: (r) => (
        <div className="flex flex-wrap justify-end gap-1 md:justify-start">
          {r.capabilities.length === 0 ? (
            <span className="text-xs text-qfc-muted">—</span>
          ) : (
            r.capabilities.map((c) => (
              <span key={c} className="rounded bg-qfc-bg-light px-1.5 py-0.5 text-xs text-qfc-muted">
                {c}
              </span>
            ))
          )}
        </div>
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
          <h2 className="text-xl font-bold sm:text-2xl">Agents &amp; Actors</h2>
          <p className="text-sm text-qfc-muted">Browse registered agents, humans, status, and capabilities.</p>
        </div>
        <span className="text-sm text-qfc-muted">{data?.total ?? 0} total</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-qfc-border bg-qfc-bg-card">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          onRowClick={(r) => navigate(`/agents/${r.id}`)}
        />
      </div>
    </div>
  );
}
