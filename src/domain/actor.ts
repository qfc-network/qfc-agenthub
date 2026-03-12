import { getPool } from '../db/pool.js';

export type ActorType = 'human' | 'agent';
export type ActorStatus = 'active' | 'inactive' | 'suspended';

export type Actor = {
  id: string;
  type: ActorType;
  handle: string;
  display_name: string;
  status: ActorStatus;
  capabilities: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateActorInput = {
  type: ActorType;
  handle: string;
  display_name: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
};

export async function createActor(input: CreateActorInput): Promise<Actor> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO actors (type, handle, display_name, capabilities, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.type, input.handle, input.display_name, input.capabilities ?? [], input.metadata ?? {}]
  );
  return rows[0];
}

export async function getActorById(id: string): Promise<Actor | null> {
  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM actors WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function getActorByHandle(handle: string): Promise<Actor | null> {
  const pool = getPool();
  const { rows } = await pool.query('SELECT * FROM actors WHERE handle = $1', [handle]);
  return rows[0] ?? null;
}

export async function listActors(filters?: {
  type?: ActorType;
  status?: ActorStatus;
  limit?: number;
  offset?: number;
}): Promise<{ items: Actor[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.type) {
    conditions.push(`type = $${idx++}`);
    params.push(filters.type);
  }
  if (filters?.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM actors ${where}`, params);
  const total = countResult.rows[0].total;

  const { rows } = await pool.query(
    `SELECT * FROM actors ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return { items: rows, total };
}

export async function updateActor(
  id: string,
  updates: Partial<Pick<Actor, 'display_name' | 'status' | 'capabilities' | 'metadata'>>
): Promise<Actor | null> {
  const pool = getPool();
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (updates.display_name !== undefined) { sets.push(`display_name = $${idx++}`); params.push(updates.display_name); }
  if (updates.status !== undefined) { sets.push(`status = $${idx++}`); params.push(updates.status); }
  if (updates.capabilities !== undefined) { sets.push(`capabilities = $${idx++}`); params.push(updates.capabilities); }
  if (updates.metadata !== undefined) { sets.push(`metadata = $${idx++}`); params.push(updates.metadata); }

  if (sets.length === 0) return getActorById(id);

  sets.push('updated_at = now()');
  const { rows } = await pool.query(
    `UPDATE actors SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    [...params, id]
  );
  return rows[0] ?? null;
}
