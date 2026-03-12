-- Phase 5: Reputation & analytics
CREATE TABLE reputation_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID NOT NULL REFERENCES actors(id),
  total_assignments INTEGER NOT NULL DEFAULT 0,
  completed       INTEGER NOT NULL DEFAULT 0,
  failed          INTEGER NOT NULL DEFAULT 0,
  cancelled       INTEGER NOT NULL DEFAULT 0,
  success_rate    REAL NOT NULL DEFAULT 0,
  avg_execution_ms BIGINT NOT NULL DEFAULT 0,
  receipt_quality_score REAL NOT NULL DEFAULT 0,
  merkle_root     TEXT,
  snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reputation_actor ON reputation_snapshots(actor_id);
CREATE INDEX idx_reputation_snapshot_at ON reputation_snapshots(snapshot_at DESC);

-- Materialized view for quick leaderboard queries
CREATE VIEW agent_stats AS
SELECT
  a.id AS actor_id,
  a.handle,
  a.display_name,
  a.capabilities,
  a.availability,
  COUNT(asgn.id)::int AS total_assignments,
  COUNT(CASE WHEN asgn.status = 'completed' THEN 1 END)::int AS completed,
  COUNT(CASE WHEN asgn.status = 'failed' THEN 1 END)::int AS failed,
  COUNT(CASE WHEN asgn.status = 'cancelled' THEN 1 END)::int AS cancelled,
  COUNT(CASE WHEN asgn.status IN ('pending', 'accepted', 'running') THEN 1 END)::int AS active,
  CASE
    WHEN COUNT(CASE WHEN asgn.status IN ('completed', 'failed') THEN 1 END) > 0
    THEN ROUND(
      COUNT(CASE WHEN asgn.status = 'completed' THEN 1 END)::numeric /
      COUNT(CASE WHEN asgn.status IN ('completed', 'failed') THEN 1 END)::numeric, 4
    )::real
    ELSE 0
  END AS success_rate,
  COALESCE(AVG(
    CASE WHEN r.finished_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (r.finished_at - r.started_at)) * 1000
    END
  )::bigint, 0) AS avg_execution_ms
FROM actors a
LEFT JOIN assignments asgn ON asgn.actor_id = a.id
LEFT JOIN agent_runs r ON r.assignment_id = asgn.id
WHERE a.type = 'agent'
GROUP BY a.id, a.handle, a.display_name, a.capabilities, a.availability;
