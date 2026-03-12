import { getPool } from '../db/pool.js';
import { conflict } from '../lib/errors.js';

export type OwnershipRole = 'owner' | 'manager' | 'operator';

export type OwnershipEdge = {
  id: string;
  owner_id: string;
  subject_id: string;
  role: OwnershipRole;
  created_at: string;
};

/**
 * Check if adding owner_id → subject_id would create a cycle.
 * Uses a recursive CTE to walk the ownership graph upward from owner_id.
 */
async function wouldCreateCycle(ownerId: string, subjectId: string): Promise<boolean> {
  const pool = getPool();
  const { rows } = await pool.query(
    `WITH RECURSIVE chain AS (
       SELECT owner_id FROM ownership_edges WHERE subject_id = $1
       UNION
       SELECT oe.owner_id FROM ownership_edges oe JOIN chain c ON oe.subject_id = c.owner_id
     )
     SELECT 1 FROM chain WHERE owner_id = $2 LIMIT 1`,
    [ownerId, subjectId]
  );
  return rows.length > 0;
}

export async function createOwnershipEdge(
  ownerId: string,
  subjectId: string,
  role: OwnershipRole
): Promise<OwnershipEdge> {
  if (ownerId === subjectId) {
    throw conflict('An actor cannot own itself');
  }

  if (await wouldCreateCycle(ownerId, subjectId)) {
    throw conflict('Adding this ownership edge would create a cycle');
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO ownership_edges (owner_id, subject_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (owner_id, subject_id, role) DO NOTHING
     RETURNING *`,
    [ownerId, subjectId, role]
  );

  if (rows.length === 0) {
    // Already exists
    const existing = await pool.query(
      'SELECT * FROM ownership_edges WHERE owner_id = $1 AND subject_id = $2 AND role = $3',
      [ownerId, subjectId, role]
    );
    return existing.rows[0];
  }

  return rows[0];
}

export async function getOwnedBy(ownerId: string): Promise<OwnershipEdge[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM ownership_edges WHERE owner_id = $1 ORDER BY created_at',
    [ownerId]
  );
  return rows;
}

export async function getOwnersOf(subjectId: string): Promise<OwnershipEdge[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM ownership_edges WHERE subject_id = $1 ORDER BY created_at',
    [subjectId]
  );
  return rows;
}

export async function removeOwnershipEdge(ownerId: string, subjectId: string, role: OwnershipRole): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    'DELETE FROM ownership_edges WHERE owner_id = $1 AND subject_id = $2 AND role = $3',
    [ownerId, subjectId, role]
  );
  return (rowCount ?? 0) > 0;
}
