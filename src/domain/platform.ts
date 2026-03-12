import { getPool } from '../db/pool.js';

export type PlatformType = 'github' | 'gitlab' | 'linear' | 'jira';

export type PlatformCredential = {
  id: string;
  actor_id: string;
  platform: PlatformType;
  platform_user_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  webhook_secret: string | null;
  base_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateCredentialInput = {
  actor_id: string;
  platform: PlatformType;
  platform_user_id?: string;
  access_token?: string;
  refresh_token?: string;
  webhook_secret?: string;
  base_url?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Abstract event source interface.
 * Each platform bridge implements this.
 */
export interface PlatformBridge {
  platform: PlatformType;
  handleWebhook(headers: Record<string, string>, body: unknown): Promise<void>;
  postComment(issueId: string, body: string, credential: PlatformCredential): Promise<string | null>;
  getIssue(issueId: string, credential: PlatformCredential): Promise<PlatformIssue | null>;
}

export type PlatformIssue = {
  id: string;
  title: string;
  body: string | null;
  url: string;
  labels: string[];
  assignees: string[];
  platform: PlatformType;
};

// --- Credential CRUD ---

export async function createCredential(input: CreateCredentialInput): Promise<PlatformCredential> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO platform_credentials (actor_id, platform, platform_user_id, access_token, refresh_token, webhook_secret, base_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (actor_id, platform) DO UPDATE SET
       platform_user_id = COALESCE($3, platform_credentials.platform_user_id),
       access_token = COALESCE($4, platform_credentials.access_token),
       refresh_token = COALESCE($5, platform_credentials.refresh_token),
       webhook_secret = COALESCE($6, platform_credentials.webhook_secret),
       base_url = COALESCE($7, platform_credentials.base_url),
       metadata = $8,
       updated_at = now()
     RETURNING *`,
    [
      input.actor_id, input.platform,
      input.platform_user_id ?? null, input.access_token ?? null,
      input.refresh_token ?? null, input.webhook_secret ?? null,
      input.base_url ?? null, input.metadata ?? {},
    ]
  );
  return rows[0];
}

export async function getCredential(actorId: string, platform: PlatformType): Promise<PlatformCredential | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM platform_credentials WHERE actor_id = $1 AND platform = $2',
    [actorId, platform]
  );
  return rows[0] ?? null;
}

export async function listCredentials(actorId: string): Promise<PlatformCredential[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM platform_credentials WHERE actor_id = $1 ORDER BY platform',
    [actorId]
  );
  return rows;
}

export async function deleteCredential(actorId: string, platform: PlatformType): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    'DELETE FROM platform_credentials WHERE actor_id = $1 AND platform = $2',
    [actorId, platform]
  );
  return (rowCount ?? 0) > 0;
}
