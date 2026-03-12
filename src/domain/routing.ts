import { getPool } from '../db/pool.js';

export type CapabilityLabel = {
  id: string;
  actor_id: string;
  label: string;
  weight: number;
  created_at: string;
};

export type RoutingRule = {
  id: string;
  github_label: string;
  capability: string;
  priority_boost: number;
  created_at: string;
};

export type AgentCandidate = {
  actor_id: string;
  handle: string;
  display_name: string;
  availability: string;
  match_score: number;
  active_assignments: number;
  capabilities: string[];
};

// --- Capability Labels ---

export async function addCapabilityLabel(actorId: string, label: string, weight = 1.0): Promise<CapabilityLabel> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO capability_labels (actor_id, label, weight)
     VALUES ($1, $2, $3)
     ON CONFLICT (actor_id, label) DO UPDATE SET weight = $3
     RETURNING *`,
    [actorId, label, weight]
  );
  return rows[0];
}

export async function removeCapabilityLabel(actorId: string, label: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    'DELETE FROM capability_labels WHERE actor_id = $1 AND label = $2',
    [actorId, label]
  );
  return (rowCount ?? 0) > 0;
}

export async function getCapabilityLabels(actorId: string): Promise<CapabilityLabel[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM capability_labels WHERE actor_id = $1 ORDER BY weight DESC',
    [actorId]
  );
  return rows;
}

// --- Routing Rules ---

export async function createRoutingRule(githubLabel: string, capability: string, priorityBoost = 0): Promise<RoutingRule> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO routing_rules (github_label, capability, priority_boost)
     VALUES ($1, $2, $3)
     ON CONFLICT (github_label, capability) DO UPDATE SET priority_boost = $3
     RETURNING *`,
    [githubLabel, capability, priorityBoost]
  );
  return rows[0];
}

export async function listRoutingRules(): Promise<RoutingRule[]> {
  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM routing_rules ORDER BY github_label');
  return rows;
}

export async function deleteRoutingRule(id: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query('DELETE FROM routing_rules WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

// --- Auto-assign: find best agent for a set of labels ---

export async function findBestAgent(labels: string[]): Promise<AgentCandidate | null> {
  if (labels.length === 0) return null;

  const pool = getPool();
  // Match agents by:
  // 1. Capability labels matching routing rules for the given issue labels
  // 2. Weighted by capability weight + routing rule priority_boost
  // 3. Penalized by active assignment count (workload balancing)
  // 4. Must be online
  const { rows } = await pool.query<AgentCandidate>(
    `WITH matched_capabilities AS (
       SELECT rr.capability, rr.priority_boost
       FROM routing_rules rr
       WHERE rr.github_label = ANY($1)
     ),
     scored_agents AS (
       SELECT
         a.id AS actor_id,
         a.handle,
         a.display_name,
         a.availability,
         a.capabilities,
         COALESCE(SUM(cl.weight + mc.priority_boost), 0) AS match_score,
         COUNT(DISTINCT asgn.id) FILTER (WHERE asgn.status IN ('pending','accepted','running'))::int AS active_assignments
       FROM actors a
       JOIN capability_labels cl ON cl.actor_id = a.id
       JOIN matched_capabilities mc ON mc.capability = cl.label
       LEFT JOIN assignments asgn ON asgn.actor_id = a.id
       WHERE a.type = 'agent' AND a.status = 'active' AND a.availability = 'online'
       GROUP BY a.id, a.handle, a.display_name, a.availability, a.capabilities
     )
     SELECT * FROM scored_agents
     WHERE match_score > 0
     ORDER BY match_score DESC, active_assignments ASC
     LIMIT 1`,
    [labels]
  );

  return rows[0] ?? null;
}

// --- Update agent availability ---

export async function updateAvailability(actorId: string, availability: 'online' | 'busy' | 'offline'): Promise<void> {
  const pool = getPool();
  await pool.query(
    'UPDATE actors SET availability = $1, updated_at = now() WHERE id = $2',
    [availability, actorId]
  );
}
