-- Phase 6: Multi-platform support
CREATE TABLE platform_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID NOT NULL REFERENCES actors(id),
  platform        TEXT NOT NULL CHECK (platform IN ('github', 'gitlab', 'linear', 'jira')),
  platform_user_id TEXT,
  access_token    TEXT,
  refresh_token   TEXT,
  webhook_secret  TEXT,
  base_url        TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(actor_id, platform)
);

CREATE INDEX idx_platform_creds_actor ON platform_credentials(actor_id);
CREATE INDEX idx_platform_creds_platform ON platform_credentials(platform);

-- Add platform column to assignments to track source platform
ALTER TABLE assignments ADD COLUMN platform TEXT NOT NULL DEFAULT 'github'
  CHECK (platform IN ('github', 'gitlab', 'linear', 'jira'));
ALTER TABLE assignments ADD COLUMN platform_issue_id TEXT;
ALTER TABLE assignments ADD COLUMN platform_issue_url TEXT;

CREATE INDEX idx_assignments_platform ON assignments(platform);
