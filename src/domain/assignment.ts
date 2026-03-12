import { getPool } from '../db/pool.js';
import { badRequest } from '../lib/errors.js';

export type AssignmentStatus = 'pending' | 'accepted' | 'running' | 'completed' | 'failed' | 'cancelled';

export type Assignment = {
  id: string;
  actor_id: string;
  github_repo: string | null;
  github_issue_number: number | null;
  github_issue_url: string | null;
  title: string;
  description: string | null;
  status: AssignmentStatus;
  priority: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateAssignmentInput = {
  actor_id: string;
  title: string;
  description?: string;
  github_repo?: string;
  github_issue_number?: number;
  github_issue_url?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['running', 'cancelled'],
  running: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
};

export async function createAssignment(input: CreateAssignmentInput): Promise<Assignment> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO assignments (actor_id, title, description, github_repo, github_issue_number, github_issue_url, priority, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.actor_id, input.title, input.description ?? null,
      input.github_repo ?? null, input.github_issue_number ?? null, input.github_issue_url ?? null,
      input.priority ?? 0, input.metadata ?? {},
    ]
  );
  return rows[0];
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM assignments WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function listAssignments(filters?: {
  actor_id?: string;
  status?: AssignmentStatus;
  github_repo?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Assignment[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.actor_id) { conditions.push(`actor_id = $${idx++}`); params.push(filters.actor_id); }
  if (filters?.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
  if (filters?.github_repo) { conditions.push(`github_repo = $${idx++}`); params.push(filters.github_repo); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM assignments ${where}`, params);
  const total = countResult.rows[0].total;

  const { rows } = await pool.query(
    `SELECT * FROM assignments ${where} ORDER BY priority DESC, created_at ASC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return { items: rows, total };
}

export async function updateAssignmentStatus(id: string, newStatus: AssignmentStatus): Promise<Assignment | null> {
  const pool = getPool();
  const current = await getAssignmentById(id);
  if (!current) return null;

  const allowed = VALID_TRANSITIONS[current.status];
  if (!allowed?.includes(newStatus)) {
    throw badRequest(`Cannot transition from '${current.status}' to '${newStatus}'`);
  }

  const { rows } = await pool.query(
    'UPDATE assignments SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [newStatus, id]
  );
  return rows[0] ?? null;
}
