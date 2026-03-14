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
        <span className="inline-flex rounded border border-qfc-border bg-qfc-bg-light px-2 py-0.5 text-xs text-qfc-primary">
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
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Platform Integrations</h2>
          <p className="text-sm text-qfc-muted">Connected credentials across supported platforms.</p>
        </div>
        <span className="text-sm text-qfc-muted">{data?.total ?? 0} connected</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-qfc-border bg-qfc-bg-card">
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
