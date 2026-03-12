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
          className={`text-xs px-2 py-0.5 rounded ${
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
        <div className="flex flex-wrap gap-1">
          {r.capabilities.map((c) => (
            <span key={c} className="text-xs px-1.5 py-0.5 rounded bg-qfc-bg-light text-qfc-muted">
              {c}
            </span>
          ))}
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Agents &amp; Actors</h2>
        <span className="text-sm text-qfc-muted">{data?.total ?? 0} total</span>
      </div>
      <div className="bg-qfc-bg-card border border-qfc-border rounded-lg">
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
