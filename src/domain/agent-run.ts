import { getPool } from '../db/pool.js';

export type RunStatus = 'started' | 'running' | 'completed' | 'failed' | 'cancelled';

export type AgentRun = {
  id: string;
  assignment_id: string;
  actor_id: string;
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
};

export async function createRun(assignmentId: string, actorId: string): Promise<AgentRun> {
  const pool = getPool();
  const { rows } = await pool.query(
    'INSERT INTO agent_runs (assignment_id, actor_id) VALUES ($1, $2) RETURNING *',
    [assignmentId, actorId]
  );
  return rows[0];
}

export async function updateRunStatus(
  id: string,
  status: RunStatus,
  errorMessage?: string
): Promise<AgentRun | null> {
  const pool = getPool();
  const finishedAt = ['completed', 'failed', 'cancelled'].includes(status) ? 'now()' : 'NULL';
  const { rows } = await pool.query(
    `UPDATE agent_runs SET status = $1, finished_at = ${finishedAt}, error_message = $2 WHERE id = $3 RETURNING *`,
    [status, errorMessage ?? null, id]
  );
  return rows[0] ?? null;
}

export async function getRunById(id: string): Promise<AgentRun | null> {
  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM agent_runs WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function listRunsByAssignment(assignmentId: string): Promise<AgentRun[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM agent_runs WHERE assignment_id = $1 ORDER BY started_at DESC',
    [assignmentId]
  );
  return rows;
}
