CREATE TABLE agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES assignments(id),
  actor_id        UUID NOT NULL REFERENCES actors(id),
  status          TEXT NOT NULL DEFAULT 'started'
                    CHECK (status IN ('started', 'running', 'completed', 'failed', 'cancelled')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_agent_runs_assignment ON agent_runs(assignment_id);
CREATE INDEX idx_agent_runs_actor ON agent_runs(actor_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
