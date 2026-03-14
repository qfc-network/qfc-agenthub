import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
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
  delegated_by: string | null;
  escalated_to: string | null;
  escalation_reason: string | null;
  parent_id: string | null;
  platform: string | null;
  platform_issue_id: string | null;
  platform_issue_url: string | null;
  created_at: string;
  updated_at: string;
}

interface TreeNode {
  id: string;
  title: string;
  actor_id: string;
  status: string;
  delegation_depth: number;
  children?: TreeNode[];
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <div>
      <div
        className="flex items-start gap-2 rounded px-3 py-2 hover:bg-qfc-bg-light/30"
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {depth > 0 && <span className="text-qfc-border">&#x2514;</span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={node.status} />
            <span className="text-sm break-words">{node.title}</span>
          </div>
          <span className="mt-1 block text-xs text-qfc-muted">depth {node.delegation_depth}</span>
        </div>
      </div>
      {node.children?.map((child) => (
        <TreeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-qfc-border/70 bg-qfc-bg-light/20 p-3">
      <p className="text-xs uppercase text-qfc-muted">{label}</p>
      <div className="mt-1 break-words text-sm">{children}</div>
    </div>
  );
}

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const assignment = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => apiFetch<Assignment>(`/assignments/${id}`),
  });

  const tree = useQuery({
    queryKey: ['assignment-tree', id],
    queryFn: () => apiFetch<TreeNode>(`/assignments/${id}/tree`),
  });

  if (assignment.isLoading) return <div className="py-12 text-center text-qfc-muted">Loading...</div>;
  if (assignment.error) return <div className="py-12 text-center text-red-400">Failed to load assignment</div>;

  const a = assignment.data!;

  return (
    <div>
      <button
        onClick={() => navigate('/assignments')}
        className="mb-4 inline-block text-sm text-qfc-muted hover:text-qfc-primary"
      >
        &larr; Back to Assignments
      </button>

      <div className="mb-6 rounded-lg border border-qfc-border bg-qfc-bg-card p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="break-words text-xl font-bold sm:text-2xl">{a.title}</h2>
          <StatusBadge status={a.status} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Actor">
            <button
              onClick={() => navigate(`/agents/${a.actor_id}`)}
              className="break-all text-left text-qfc-primary hover:underline"
            >
              {a.actor_id}
            </button>
          </DetailItem>
          <DetailItem label="Priority">{a.priority}</DetailItem>
          <DetailItem label="Delegation Depth">{a.delegation_depth}</DetailItem>

          {a.github_repo && (
            <DetailItem label="GitHub">
              {a.github_repo}#{a.github_issue_number}
            </DetailItem>
          )}

          {a.platform && (
            <DetailItem label="Platform">
              <div className="space-y-1">
                <p>{a.platform}</p>
                {a.platform_issue_url && (
                  <a
                    href={a.platform_issue_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-qfc-primary hover:underline"
                  >
                    View issue
                  </a>
                )}
              </div>
            </DetailItem>
          )}

          {a.delegated_by && <DetailItem label="Delegated By">{a.delegated_by}</DetailItem>}

          {a.escalated_to && (
            <DetailItem label="Escalated To">
              <div className="space-y-1">
                <p>{a.escalated_to}</p>
                {a.escalation_reason && <p className="text-xs text-qfc-muted">{a.escalation_reason}</p>}
              </div>
            </DetailItem>
          )}

          <DetailItem label="Created">{new Date(a.created_at).toLocaleString()}</DetailItem>
          <DetailItem label="Updated">{new Date(a.updated_at).toLocaleString()}</DetailItem>
        </div>
      </div>

      {tree.data && (
        <div className="overflow-hidden rounded-lg border border-qfc-border bg-qfc-bg-card">
          <div className="border-b border-qfc-border px-4 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-qfc-muted">
              Delegation Tree
            </h3>
          </div>
          <div className="p-2 sm:p-3">
            <TreeItem node={tree.data} />
          </div>
        </div>
      )}
    </div>
  );
}
