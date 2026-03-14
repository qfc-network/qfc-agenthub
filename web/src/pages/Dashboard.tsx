import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import StatCard from '../components/StatCard';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

interface Actor {
  id: string;
  type: string;
  handle: string;
  display_name: string;
  status: string;
  availability: string;
}

interface Assignment {
  id: string;
  title: string;
  status: string;
  actor_id: string;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const actors = useQuery({
    queryKey: ['actors'],
    queryFn: () => apiFetch<{ items: Actor[]; total: number }>('/actors'),
  });
  const assignments = useQuery({
    queryKey: ['assignments'],
    queryFn: () => apiFetch<{ items: Assignment[]; total: number }>('/assignments'),
  });

  const agentCount = actors.data?.items.filter((a) => a.type === 'agent').length ?? 0;
  const humanCount = actors.data?.items.filter((a) => a.type === 'human').length ?? 0;
  const totalAssignments = assignments.data?.total ?? 0;
  const activeAssignments =
    assignments.data?.items.filter((a) => a.status === 'running' || a.status === 'pending').length ?? 0;

  const recentAssignments = (assignments.data?.items ?? []).slice(0, 5);

  const assignmentCols: Column<Assignment>[] = [
    { header: 'Title', accessor: 'title' },
    {
      header: 'Status',
      accessor: (r) => <StatusBadge status={r.status} />,
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
          <h2 className="text-xl font-bold sm:text-2xl">Dashboard</h2>
          <p className="text-sm text-qfc-muted">Overview of actors, assignments, and recent activity.</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agents" value={agentCount} sub={`${humanCount} humans registered`} />
        <StatCard label="Total Assignments" value={totalAssignments} />
        <StatCard label="Active" value={activeAssignments} sub="running or pending" />
        <StatCard label="Total Actors" value={actors.data?.total ?? 0} />
      </div>

      <div className="overflow-hidden rounded-lg border border-qfc-border bg-qfc-bg-card">
        <div className="border-b border-qfc-border px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-qfc-muted">Recent Assignments</h3>
        </div>
        <DataTable
          columns={assignmentCols}
          data={recentAssignments}
          loading={assignments.isLoading}
          onRowClick={(r) => navigate(`/assignments/${r.id}`)}
          emptyMessage="No assignments yet"
        />
      </div>
    </div>
  );
}
