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
        className="flex items-center gap-2 py-2 px-3 hover:bg-qfc-bg-light/30 rounded"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {depth > 0 && <span className="text-qfc-border">&#x2514;</span>}
        <StatusBadge status={node.status} />
        <span className="text-sm">{node.title}</span>
        <span className="text-xs text-qfc-muted ml-auto">depth {node.delegation_depth}</span>
      </div>
      {node.children?.map((child) => (
        <TreeItem key={child.id} node={child} depth={depth + 1} />
      ))}
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

  if (assignment.isLoading)
    return <div className="text-qfc-muted py-12 text-center">Loading...</div>;
  if (assignment.error)
    return <div className="text-red-400 py-12 text-center">Failed to load assignment</div>;

  const a = assignment.data!;

  return (
    <div>
      <button
        onClick={() => navigate('/assignments')}
        className="text-sm text-qfc-muted hover:text-qfc-primary mb-4 inline-block"
      >
        &larr; Back to Assignments
      </button>

      <div className="bg-qfc-bg-card border border-qfc-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold">{a.title}</h2>
          <StatusBadge status={a.status} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-qfc-muted uppercase">Actor</p>
            <button
              onClick={() => navigate(`/agents/${a.actor_id}`)}
              className="text-qfc-primary hover:underline"
            >
              {a.actor_id.slice(0, 8)}...
            </button>
          </div>
          <div>
            <p className="text-xs text-qfc-muted uppercase">Priority</p>
            <p>{a.priority}</p>
          </div>
          <div>
            <p className="text-xs text-qfc-muted uppercase">Delegation Depth</p>
            <p>{a.delegation_depth}</p>
          </div>

          {a.github_repo && (
            <div>
              <p className="text-xs text-qfc-muted uppercase">GitHub</p>
              <p>
                {a.github_repo}#{a.github_issue_number}
              </p>
            </div>
          )}

          {a.platform && (
            <div>
              <p className="text-xs text-qfc-muted uppercase">Platform</p>
              <p>{a.platform}</p>
              {a.platform_issue_url && (
                <a
                  href={a.platform_issue_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-qfc-primary hover:underline text-xs"
                >
                  View issue
                </a>
              )}
            </div>
          )}

          {a.delegated_by && (
            <div>
              <p className="text-xs text-qfc-muted uppercase">Delegated By</p>
              <p className="text-xs">{a.delegated_by}</p>
            </div>
          )}

          {a.escalated_to && (
            <div>
              <p className="text-xs text-qfc-muted uppercase">Escalated To</p>
              <p className="text-xs">{a.escalated_to}</p>
              {a.escalation_reason && (
                <p className="text-xs text-qfc-muted">{a.escalation_reason}</p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-qfc-muted uppercase">Created</p>
            <p>{new Date(a.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-qfc-muted uppercase">Updated</p>
            <p>{new Date(a.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {tree.data && (
        <div className="bg-qfc-bg-card border border-qfc-border rounded-lg">
          <div className="px-4 py-3 border-b border-qfc-border">
            <h3 className="text-sm font-semibold text-qfc-muted uppercase tracking-wider">
              Delegation Tree
            </h3>
          </div>
          <div className="p-2">
            <TreeItem node={tree.data} />
          </div>
        </div>
      )}
    </div>
  );
}
