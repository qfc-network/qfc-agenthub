-- Phase 2: Delegation engine
ALTER TABLE assignments ADD COLUMN parent_id UUID REFERENCES assignments(id);
ALTER TABLE assignments ADD COLUMN delegation_depth INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assignments ADD COLUMN delegated_by UUID REFERENCES actors(id);
ALTER TABLE assignments ADD COLUMN escalated_to UUID REFERENCES actors(id);
ALTER TABLE assignments ADD COLUMN escalation_reason TEXT;

CREATE INDEX idx_assignments_parent ON assignments(parent_id);
CREATE INDEX idx_assignments_delegated_by ON assignments(delegated_by);

-- Max delegation depth configurable per org, default 5
ALTER TABLE actors ADD COLUMN max_delegation_depth INTEGER NOT NULL DEFAULT 5;
