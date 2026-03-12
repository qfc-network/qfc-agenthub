CREATE TABLE ownership_edges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'operator')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, subject_id, role),
  CHECK (owner_id != subject_id)
);

CREATE INDEX idx_ownership_owner ON ownership_edges(owner_id);
CREATE INDEX idx_ownership_subject ON ownership_edges(subject_id);
