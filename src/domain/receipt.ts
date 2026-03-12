import { getPool } from '../db/pool.js';

export type ReceiptStatus = 'success' | 'failure' | 'partial';

export type Receipt = {
  id: string;
  run_id: string;
  assignment_id: string;
  actor_id: string;
  status: ReceiptStatus;
  summary: string | null;
  actions: Array<{ type: string; description: string; timestamp?: string }>;
  outputs: Array<{ type: string; content?: string; url?: string }>;
  artifacts: Array<{ name: string; url: string; sha256?: string }>;
  github_comment_id: number | null;
  created_at: string;
};

export type CreateReceiptInput = {
  run_id: string;
  assignment_id: string;
  actor_id: string;
  status: ReceiptStatus;
  summary?: string;
  actions?: Receipt['actions'];
  outputs?: Receipt['outputs'];
  artifacts?: Receipt['artifacts'];
};

export async function createReceipt(input: CreateReceiptInput): Promise<Receipt> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO receipts (run_id, assignment_id, actor_id, status, summary, actions, outputs, artifacts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.run_id, input.assignment_id, input.actor_id, input.status,
      input.summary ?? null,
      JSON.stringify(input.actions ?? []),
      JSON.stringify(input.outputs ?? []),
      JSON.stringify(input.artifacts ?? []),
    ]
  );
  return rows[0];
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM receipts WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function listReceipts(filters?: {
  assignment_id?: string;
  actor_id?: string;
  run_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Receipt[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.assignment_id) { conditions.push(`assignment_id = $${idx++}`); params.push(filters.assignment_id); }
  if (filters?.actor_id) { conditions.push(`actor_id = $${idx++}`); params.push(filters.actor_id); }
  if (filters?.run_id) { conditions.push(`run_id = $${idx++}`); params.push(filters.run_id); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM receipts ${where}`, params);
  const total = countResult.rows[0].total;

  const { rows } = await pool.query(
    `SELECT * FROM receipts ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return { items: rows, total };
}

export async function setGithubCommentId(receiptId: string, commentId: number): Promise<void> {
  const pool = getPool();
  await pool.query(
    'UPDATE receipts SET github_comment_id = $1 WHERE id = $2',
    [commentId, receiptId]
  );
}
