-- Phase 3: Agent capabilities & routing
ALTER TABLE actors ADD COLUMN availability TEXT NOT NULL DEFAULT 'online'
  CHECK (availability IN ('online', 'busy', 'offline'));

-- Capability labels table for structured capability matching
CREATE TABLE capability_labels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  weight      REAL NOT NULL DEFAULT 1.0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(actor_id, label)
);

CREATE INDEX idx_capability_labels_label ON capability_labels(label);
CREATE INDEX idx_capability_labels_actor ON capability_labels(actor_id);

-- Routing rules: map issue labels to agent capabilities
CREATE TABLE routing_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_label    TEXT NOT NULL,
  capability      TEXT NOT NULL,
  priority_boost  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(github_label, capability)
);

CREATE INDEX idx_routing_rules_label ON routing_rules(github_label);
