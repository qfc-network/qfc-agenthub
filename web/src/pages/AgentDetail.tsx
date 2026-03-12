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

  if (actor.isLoading) return <div className="text-qfc-muted py-12 text-center">Loading...</div>;
  if (actor.error) return <div className="text-red-400 py-12 text-center">Failed to load actor</div>;

  const a = actor.data!;

  return (
    <div>
      <button
        onClick={() => navigate('/agents')}
        className="text-sm text-qfc-muted hover:text-qfc-primary mb-4 inline-block"
      >
        &larr; Back to Agents
      </button>

      <div className="bg-qfc-bg-card border border-qfc-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{a.display_name}</h2>
            <p className="text-qfc-muted text-sm">@{a.handle}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={a.status} />
            <StatusBadge status={a.availability} />
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                a.type === 'agent'
                  ? 'bg-qfc-accent/20 text-qfc-primary'
                  : 'bg-purple-900/30 text-purple-300'
              }`}
            >
              {a.type}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-qfc-muted uppercase">Max Delegation Depth</p>
            <p className="text-lg font-semibold">{a.max_delegation_depth}</p>
          </div>
          <div>
            <p className="text-xs text-qfc-muted uppercase">Created</p>
            <p className="text-lg font-semibold">{new Date(a.created_at).toLocaleDateString()}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-qfc-muted uppercase mb-1">Capabilities</p>
            <div className="flex flex-wrap gap-1">
              {a.capabilities.length === 0 ? (
                <span className="text-qfc-muted text-sm">None</span>
              ) : (
                a.capabilities.map((c) => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded bg-qfc-bg-light text-qfc-muted border border-qfc-border">
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-qfc-bg-card border border-qfc-border rounded-lg">
        <div className="px-4 py-3 border-b border-qfc-border">
          <h3 className="text-sm font-semibold text-qfc-muted uppercase tracking-wider">
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
