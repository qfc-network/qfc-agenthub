import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

interface Nft {
  id: string;
  actor_id: string;
  token_id: number | null;
  contract_address: string;
  chain_id: number;
  owner_address: string | null;
  status: string;
  metadata_uri: string | null;
  tx_hash: string | null;
  minted_at: string | null;
  created_at: string;
}

function truncateAddr(addr: string | null) {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Nfts() {
  const { data, isLoading } = useQuery({
    queryKey: ['nfts'],
    queryFn: () => apiFetch<{ items: Nft[]; total: number }>('/nfts'),
  });

  const columns: Column<Nft>[] = [
    {
      header: 'Token ID',
      accessor: (r) => (r.token_id != null ? `#${r.token_id}` : '—'),
    },
    { header: 'Status', accessor: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Owner',
      accessor: (r) => (
        <span className="font-mono text-xs">{truncateAddr(r.owner_address)}</span>
      ),
    },
    {
      header: 'Contract',
      accessor: (r) => (
        <span className="font-mono text-xs">{truncateAddr(r.contract_address)}</span>
      ),
    },
    { header: 'Chain', accessor: 'chain_id' },
    {
      header: 'TX',
      accessor: (r) =>
        r.tx_hash ? (
          <span className="font-mono text-xs">{truncateAddr(r.tx_hash)}</span>
        ) : (
          '—'
        ),
    },
    {
      header: 'Minted',
      accessor: (r) => (r.minted_at ? new Date(r.minted_at).toLocaleDateString() : '—'),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Agent NFTs</h2>
        <span className="text-sm text-qfc-muted">{data?.total ?? 0} total</span>
      </div>
      <div className="bg-qfc-bg-card border border-qfc-border rounded-lg">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={isLoading}
          emptyMessage="No NFTs minted yet"
        />
      </div>
    </div>
  );
}
