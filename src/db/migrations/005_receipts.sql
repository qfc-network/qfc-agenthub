CREATE TABLE receipts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID NOT NULL REFERENCES agent_runs(id),
  assignment_id       UUID NOT NULL REFERENCES assignments(id),
  actor_id            UUID NOT NULL REFERENCES actors(id),
  status              TEXT NOT NULL CHECK (status IN ('success', 'failure', 'partial')),
  summary             TEXT,
  actions             JSONB NOT NULL DEFAULT '[]',
  outputs             JSONB NOT NULL DEFAULT '[]',
  artifacts           JSONB NOT NULL DEFAULT '[]',
  github_comment_id   BIGINT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_receipts_run ON receipts(run_id);
CREATE INDEX idx_receipts_assignment ON receipts(assignment_id);
CREATE INDEX idx_receipts_actor ON receipts(actor_id);
