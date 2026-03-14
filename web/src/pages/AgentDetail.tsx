import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import DataTable, { Column } from '../components/DataTable';

interface Actor {
  id: string;
  type: string;
  handle: string;
  display_name: string;
  status: string;
  availability: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
  max_delegation_depth: number;
  created_at: string;
  updated_at: string;
}

interface Assignment {
  id: string;
  title: string;
  status: string;
  priority: number;
  created_at: string;
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const actor = useQuery({
    queryKey: ['actor', id],
    queryFn: () => apiFetch<Actor>(`/actors/${id}`),
  });

  const assignments = useQuery({
    queryKey: ['actor-assignments', id],
    queryFn: () => apiFetch<{ items: Assignment[]; total: number }>(`/assignments?actor_id=${id}`),
  });

  const assignmentCols: Column<Assignment>[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Status', accessor: (r) => <StatusBadge status={r.status} /> },
    { header: 'Priority', accessor: 'priority' },
    { header: 'Created', accessor: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  if (actor.isLoading) return <div className="py-12 text-center text-qfc-muted">Loading...</div>;
  if (actor.error) return <div className="py-12 text-center text-red-400">Failed to load actor</div>;

  const a = actor.data!;

  return (
    <div>
      <button
        onClick={() => navigate('/agents')}
        className="mb-4 inline-block text-sm text-qfc-muted hover:text-qfc-primary"
      >
        &larr; Back to Agents
      </button>

      <div className="mb-6 rounded-lg border border-qfc-border bg-qfc-bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold sm:text-2xl">{a.display_name}</h2>
            <p className="mt-1 break-all text-sm text-qfc-muted">@{a.handle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={a.status} />
            <StatusBadge status={a.availability} />
            <span
              className={`inline-flex rounded px-2 py-0.5 text-xs ${
                a.type === 'agent'
                  ? 'bg-qfc-accent/20 text-qfc-primary'
                  : 'bg-purple-900/30 text-purple-300'
              }`}
            >
              {a.type}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-qfc-muted">Max Delegation Depth</p>
            <p className="text-lg font-semibold">{a.max_delegation_depth}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-qfc-muted">Created</p>
            <p className="text-lg font-semibold">{new Date(a.created_at).toLocaleDateString()}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs uppercase text-qfc-muted">Capabilities</p>
            <div className="flex flex-wrap gap-1.5">
              {a.capabilities.length === 0 ? (
                <span className="text-sm text-qfc-muted">None</span>
              ) : (
                a.capabilities.map((c) => (
                  <span
                    key={c}
                    className="rounded border border-qfc-border bg-qfc-bg-light px-2 py-0.5 text-xs text-qfc-muted"
                  >
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-qfc-border bg-qfc-bg-card">
        <div className="border-b border-qfc-border px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-qfc-muted">
            Assignments ({assignments.data?.total ?? 0})
          </h3>
        </div>
        <DataTable
          columns={assignmentCols}
          data={assignments.data?.items ?? []}
          loading={assignments.isLoading}
          onRowClick={(r) => navigate(`/assignments/${r.id}`)}
          emptyMessage="No assignments"
        />
      </div>
    </div>
  );
}
