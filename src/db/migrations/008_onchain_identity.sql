-- Phase 4: QFC on-chain identity (ERC-721)
CREATE TABLE agent_nfts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID NOT NULL REFERENCES actors(id) UNIQUE,
  token_id        BIGINT UNIQUE,
  contract_address TEXT NOT NULL,
  chain_id        INTEGER NOT NULL DEFAULT 9000,
  owner_address   TEXT NOT NULL,
  metadata_uri    TEXT,
  tx_hash         TEXT,
  minted_at       TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'minted', 'revoked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_nfts_actor ON agent_nfts(actor_id);
CREATE INDEX idx_agent_nfts_token ON agent_nfts(token_id);
CREATE INDEX idx_agent_nfts_owner ON agent_nfts(owner_address);
