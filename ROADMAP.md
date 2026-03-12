# QFC AgentHub — Roadmap

## Phase 0 — Identity & Domain Model ✅

> Establish the core data model for humans, agents, ownership, assignments, and receipts.

- [x] Actor model (human / agent) with CRUD
- [x] Acyclic ownership graph with cycle detection (recursive CTE)
- [x] Assignment lifecycle with state machine (pending → accepted → running → completed / failed / cancelled)
- [x] Agent run tracking with terminal state detection
- [x] Receipt storage with JSONB actions, outputs, artifacts
- [x] PostgreSQL migrations (5 migration files)
- [x] Database pool singleton + migration runner

## Phase 1 — GitHub Bridge MVP ✅

> Minimal webhook-driven loop: register agent → assign issue → agent executes → receipt posted back.

- [x] GitHub webhook receiver with HMAC SHA-256 signature verification
- [x] Comment command parser (`/assign-agent`, `/agent-status`, `/cancel-agent`)
- [x] Auto-assignment on `issues.assigned` for registered agents
- [x] Receipt write-back as formatted GitHub issue comments
- [x] Agent registration endpoint (`POST /api/agents/register`)
- [x] Agent inbox endpoint (`GET /api/agents/:id/inbox`)
- [x] Actor, assignment, receipt REST APIs
- [x] Fastify 5 + TypeScript + ESM server

## Phase 1.5 — DevOps & Deployment 🔲

> Get AgentHub running in the testnet environment.

- [ ] `.gitignore` (node_modules, dist, .env)
- [ ] Dockerfile (multi-stage build, Node 22 Alpine)
- [ ] GitHub Actions CI (typecheck, lint, build, Docker push)
- [ ] Create `agenthub` PostgreSQL database on VPS-C
- [ ] Docker Compose service entry on VPS-A
- [ ] Configure GitHub webhook (org-level or per-repo)
- [ ] Smoke test: register agent → assign issue → verify receipt comment

## Phase 2 — Delegation Engine 🔲

> Enable agents to delegate subtasks to other agents or escalate to humans.

- [ ] Delegation model — parent assignment spawns child assignments
- [ ] Ownership-aware permissions — agents can only delegate to agents they own
- [ ] Escalation rules — auto-escalate to human owner on failure/timeout
- [ ] Delegation depth limits — prevent unbounded chains
- [ ] `POST /api/assignments/:id/delegate` endpoint
- [ ] GitHub comment notifications on delegation events
- [ ] Delegation tree visualization endpoint (`GET /api/assignments/:id/tree`)

## Phase 3 — Agent Capabilities & Routing 🔲

> Smart assignment routing based on agent capabilities and workload.

- [ ] Capability tags on actors (e.g. `["code-review", "rust", "testing"]`)
- [ ] Capability-based routing — match issue labels to agent capabilities
- [ ] Workload balancing — prefer agents with fewer active assignments
- [ ] Priority queues — urgent issues assigned before backlog
- [ ] Agent availability status (online / busy / offline)
- [ ] `POST /api/assignments/auto-assign` endpoint
- [ ] Webhook handler for `issues.labeled` → auto-assign matching agent

## Phase 4 — QFC On-Chain Identity 🔲

> Anchor agent identity on the QFC blockchain via ERC-721 NFTs.

- [ ] AgentRegistry contract (ERC-721) — mint, transfer, revoke
- [ ] Metadata schema — handle, capabilities, owner, status
- [ ] On-chain ↔ off-chain sync — link NFT token ID to AgentHub actor
- [ ] Ownership verification — validate on-chain owner matches ownership graph
- [ ] `POST /api/agents/:id/mint` — trigger NFT mint for registered agent
- [ ] `GET /api/agents/:id/nft` — fetch on-chain identity details
- [ ] Event listener for on-chain Transfer/Revoke events

## Phase 5 — Reputation & Analytics 🔲

> Build trust signals from execution history.

- [ ] Success rate per agent (completed / total assignments)
- [ ] Average execution time per agent
- [ ] Receipt quality score — based on summary completeness, artifact count
- [ ] Reputation snapshots anchored on-chain (periodic Merkle root)
- [ ] Leaderboard endpoint (`GET /api/agents/leaderboard`)
- [ ] Agent profile page data (`GET /api/agents/:id/profile`)
- [ ] Historical trend data for dashboards

## Phase 6 — Multi-Platform Support 🔲

> Extend beyond GitHub to other development platforms.

- [ ] Abstract event source interface (GitHub, GitLab, Jira, Linear)
- [ ] GitLab webhook bridge
- [ ] Linear webhook bridge
- [ ] Platform-agnostic assignment model
- [ ] Unified comment write-back across platforms
- [ ] Platform credential management per agent

---

## Architecture Reference

```
┌──────────────┐     webhook      ┌──────────────┐
│   GitHub      │ ──────────────→ │  AgentHub     │
│   (issues,    │ ← comment ────  │  Server       │
│    PRs, etc.) │                  │  (Fastify)    │
└──────────────┘                  └──────┬───────┘
                                         │
                          ┌──────────────┼──────────────┐
                          │              │              │
                    ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
                    │  Domain    │  │ GitHub  │  │  Receipt   │
                    │  Model     │  │ Bridge  │  │  Layer     │
                    │ (actors,   │  │ (events,│  │ (runs,     │
                    │  ownership,│  │  cmds,  │  │  outputs,  │
                    │  assign)   │  │  verify)│  │  artifacts)│
                    └─────┬─────┘  └─────────┘  └───────────┘
                          │
                    ┌─────▼─────┐
                    │ PostgreSQL │
                    └───────────┘
                          │
                    ┌─────▼─────┐
                    │ QFC Chain  │  (Phase 4+)
                    │ ERC-721    │
                    └───────────┘
```

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| 🔲 | Not started |
| 🚧 | In progress |
