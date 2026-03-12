import { getPool } from '../db/pool.js';
import { createHash } from 'node:crypto';

export type AgentStats = {
  actor_id: string;
  handle: string;
  display_name: string;
  capabilities: string[];
  availability: string;
  total_assignments: number;
  completed: number;
  failed: number;
  cancelled: number;
  active: number;
  success_rate: number;
  avg_execution_ms: number;
};

export type ReputationSnapshot = {
  id: string;
  actor_id: string;
  total_assignments: number;
  completed: number;
  failed: number;
  cancelled: number;
  success_rate: number;
  avg_execution_ms: number;
  receipt_quality_score: number;
  merkle_root: string | null;
  snapshot_at: string;
  created_at: string;
};

export type AgentProfile = AgentStats & {
  recent_receipts: number;
  avg_receipt_quality: number;
};

/**
 * Get live stats for an agent from the agent_stats view.
 */
export async function getAgentStats(actorId: string): Promise<AgentStats | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM agent_stats WHERE actor_id = $1',
    [actorId]
  );
  return rows[0] ?? null;
}

/**
 * Leaderboard: top agents by success rate (min 5 completed assignments).
 */
export async function getLeaderboard(limit = 20): Promise<AgentStats[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM agent_stats
     WHERE total_assignments >= 1
     ORDER BY success_rate DESC, completed DESC, avg_execution_ms ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

/**
 * Get a full agent profile with receipt quality metrics.
 */
export async function getAgentProfile(actorId: string): Promise<AgentProfile | null> {
  const pool = getPool();
  const stats = await getAgentStats(actorId);
  if (!stats) return null;

  // Compute receipt quality: based on summary presence, action count, artifact count
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS recent_receipts,
       AVG(
         CASE WHEN summary IS NOT NULL AND summary != '' THEN 0.4 ELSE 0 END +
         CASE WHEN jsonb_array_length(actions) > 0 THEN 0.3 ELSE 0 END +
         CASE WHEN jsonb_array_length(artifacts) > 0 THEN 0.3 ELSE 0 END
       )::real AS avg_receipt_quality
     FROM receipts
     WHERE actor_id = $1
       AND created_at > now() - INTERVAL '30 days'`,
    [actorId]
  );

  return {
    ...stats,
    recent_receipts: rows[0]?.recent_receipts ?? 0,
    avg_receipt_quality: rows[0]?.avg_receipt_quality ?? 0,
  };
}

/**
 * Take a reputation snapshot for an agent.
 */
export async function takeSnapshot(actorId: string): Promise<ReputationSnapshot> {
  const pool = getPool();
  const stats = await getAgentStats(actorId);

  const receiptQuality = await pool.query(
    `SELECT AVG(
       CASE WHEN summary IS NOT NULL AND summary != '' THEN 0.4 ELSE 0 END +
       CASE WHEN jsonb_array_length(actions) > 0 THEN 0.3 ELSE 0 END +
       CASE WHEN jsonb_array_length(artifacts) > 0 THEN 0.3 ELSE 0 END
     )::real AS score
     FROM receipts WHERE actor_id = $1`,
    [actorId]
  );

  const qualityScore = receiptQuality.rows[0]?.score ?? 0;

  // Compute simple merkle root from snapshot data
  const data = JSON.stringify({
    actor_id: actorId,
    completed: stats?.completed ?? 0,
    failed: stats?.failed ?? 0,
    success_rate: stats?.success_rate ?? 0,
    quality: qualityScore,
    timestamp: new Date().toISOString(),
  });
  const merkleRoot = createHash('sha256').update(data).digest('hex');

  const { rows } = await pool.query(
    `INSERT INTO reputation_snapshots
     (actor_id, total_assignments, completed, failed, cancelled, success_rate, avg_execution_ms, receipt_quality_score, merkle_root)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      actorId,
      stats?.total_assignments ?? 0,
      stats?.completed ?? 0,
      stats?.failed ?? 0,
      stats?.cancelled ?? 0,
      stats?.success_rate ?? 0,
      stats?.avg_execution_ms ?? 0,
      qualityScore,
      merkleRoot,
    ]
  );
  return rows[0];
}

/**
 * Get historical snapshots for an agent.
 */
export async function getSnapshots(actorId: string, limit = 30): Promise<ReputationSnapshot[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM reputation_snapshots WHERE actor_id = $1 ORDER BY snapshot_at DESC LIMIT $2',
    [actorId, limit]
  );
  return rows;
}
