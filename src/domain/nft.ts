import { getPool } from '../db/pool.js';
import { config } from '../config.js';
import { notFound } from '../lib/errors.js';

export type AgentNft = {
  id: string;
  actor_id: string;
  token_id: number | null;
  contract_address: string;
  chain_id: number;
  owner_address: string;
  metadata_uri: string | null;
  tx_hash: string | null;
  minted_at: string | null;
  revoked_at: string | null;
  status: 'pending' | 'minted' | 'revoked';
  created_at: string;
  updated_at: string;
};

export type MintRequest = {
  actor_id: string;
  owner_address: string;
  metadata_uri?: string;
};

/**
 * Create a pending NFT mint record.
 * Actual minting happens via on-chain tx (separate process).
 */
export async function requestMint(input: MintRequest): Promise<AgentNft> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO agent_nfts (actor_id, contract_address, chain_id, owner_address, metadata_uri, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     ON CONFLICT (actor_id) DO UPDATE SET
       owner_address = $4,
       metadata_uri = COALESCE($5, agent_nfts.metadata_uri),
       updated_at = now()
     RETURNING *`,
    [
      input.actor_id,
      config.agentRegistryContract,
      config.chainId,
      input.owner_address,
      input.metadata_uri ?? null,
    ]
  );
  return rows[0];
}

/**
 * Record a successful mint (called after on-chain confirmation).
 */
export async function confirmMint(
  actorId: string,
  tokenId: number,
  txHash: string
): Promise<AgentNft> {
  const pool = getPool();
  const { rows } = await pool.query(
    `UPDATE agent_nfts
     SET token_id = $1, tx_hash = $2, status = 'minted', minted_at = now(), updated_at = now()
     WHERE actor_id = $3
     RETURNING *`,
    [tokenId, txHash, actorId]
  );
  if (rows.length === 0) throw notFound('NFT record not found');
  return rows[0];
}

/**
 * Revoke an NFT (called after on-chain revocation).
 */
export async function revokeNft(actorId: string): Promise<AgentNft> {
  const pool = getPool();
  const { rows } = await pool.query(
    `UPDATE agent_nfts
     SET status = 'revoked', revoked_at = now(), updated_at = now()
     WHERE actor_id = $1
     RETURNING *`,
    [actorId]
  );
  if (rows.length === 0) throw notFound('NFT record not found');
  return rows[0];
}

/**
 * Get NFT details for an agent.
 */
export async function getNftByActorId(actorId: string): Promise<AgentNft | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM agent_nfts WHERE actor_id = $1',
    [actorId]
  );
  return rows[0] ?? null;
}

/**
 * Get NFT by token ID.
 */
export async function getNftByTokenId(tokenId: number): Promise<AgentNft | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM agent_nfts WHERE token_id = $1',
    [tokenId]
  );
  return rows[0] ?? null;
}

/**
 * Update on-chain owner (called when Transfer event detected).
 */
export async function updateNftOwner(tokenId: number, newOwner: string): Promise<AgentNft | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `UPDATE agent_nfts
     SET owner_address = $1, updated_at = now()
     WHERE token_id = $2
     RETURNING *`,
    [newOwner, tokenId]
  );
  return rows[0] ?? null;
}

/**
 * List all minted NFTs.
 */
export async function listNfts(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: AgentNft[]; total: number }> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM agent_nfts ${where}`, params);
  const total = countResult.rows[0].total;

  const { rows } = await pool.query(
    `SELECT * FROM agent_nfts ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return { items: rows, total };
}
