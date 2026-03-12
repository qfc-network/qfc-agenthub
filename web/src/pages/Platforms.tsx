import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import DataTable, { Column } from '../components/DataTable';

interface Credential {
  id: string;
  actor_id: string;
  platform: string;
  platform_user_id: string | null;
  base_url: string | null;
  created_at: string;
}

export default function Platforms() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-credentials'],
    queryFn: () => apiFetch<{ items: Credential[]; total: number }>('/platforms/credentials'),
  });

  const columns: Column<Credential>[] = [
    {
      header: 'Platform',
      accessor: (r) => (
        <span className="text-xs px-2 py-0.5 rounded bg-qfc-bg-light text-qfc-primary border border-qfc-border">
          {r.platform}
        </span>
      ),
    },
    { header: 'User ID', accessor: (r) => r.platform_user_id ?? '—' },
    { header: 'Base URL', accessor: (r) => r.base_url ?? 'default' },
    { header: 'Actor', accessor: (r) => r.actor_id.slice(0, 8) + '...' },
    {
      header: 'Connected',
      accessor: (r) => new Date(r.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Platform Integrations</h2>
        <span className="text-sm text-qfc-muted">{data?.total ?? 0} connected</span>
      </div>
      <div className="bg-qfc-bg-card border border-qfc-border rounded-lg">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          emptyMessage="No platform credentials configured"
        />
      </div>
    </div>
  );
}
