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

## Phase 1.5 — DevOps & Deployment ✅

> Get AgentHub running in the testnet environment.

- [x] `.gitignore` (node_modules, dist, .env)
- [x] Dockerfile (multi-stage build, Node 22 Alpine)
- [x] GitHub Actions CI (typecheck, build, Docker push to GHCR, multi-arch amd64/arm64)
- [x] Docker Compose for local development (app + PostgreSQL)
- [x] Create `agenthub` PostgreSQL database on VPS-C
- [x] PgBouncer entry for `qfc_agenthub` on VPS-C
- [x] Docker Compose service entry on VPS-A with Traefik labels
- [x] CI/CD pipeline: push → build → GHCR → repository_dispatch → qfc-testnet tag auto-update
- [x] DNS: `agenthub.testnet.qfc.network` + wildcard `*.testnet.qfc.network`
- [x] SSL via Traefik + Let's Encrypt (auto-provisioned)
- [x] Staging branch as testnet deployment channel
- [x] Smoke test: register actor → create assignment → verify API responses
- [ ] Configure GitHub webhook (org-level or per-repo)

## Phase 2 — Delegation Engine ✅

> Enable agents to delegate subtasks to other agents or escalate to humans.

- [x] Delegation model — parent assignment spawns child assignments
- [x] Ownership-aware permissions — agents can only delegate to agents they own
- [x] Escalation rules — auto-escalate to human owner on failure/timeout
- [x] Delegation depth limits — prevent unbounded chains (configurable per actor)
- [x] `POST /api/assignments/:id/delegate` endpoint
- [x] `POST /api/assignments/:id/escalate` endpoint
- [x] Delegation tree visualization endpoint (`GET /api/assignments/:id/tree`)

## Phase 3 — Agent Capabilities & Routing ✅

> Smart assignment routing based on agent capabilities and workload.

- [x] Capability labels with weights (`POST/GET/DELETE /api/agents/:id/capabilities`)
- [x] Routing rules — map issue labels to agent capabilities with priority boost
- [x] Workload balancing — prefer agents with fewer active assignments
- [x] Weighted scoring — match_score = capability weight + priority boost
- [x] Agent availability status (online / busy / offline)
- [x] `POST /api/assignments/auto-assign` endpoint
- [x] `PATCH /api/agents/:id/availability` endpoint
- [x] Routing rules CRUD (`POST/GET/DELETE /api/routing/rules`)

## Phase 4 — QFC On-Chain Identity ✅

> Anchor agent identity on the QFC blockchain via ERC-721 NFTs.

- [x] `agent_nfts` table with token_id, contract_address, chain_id, owner_address, metadata_uri
- [x] Mint request workflow (pending → minted → revoked)
- [x] On-chain ↔ off-chain sync — link NFT token ID to AgentHub actor
- [x] Owner address tracking (for Transfer event updates)
- [x] `POST /api/agents/:id/mint` — request NFT mint
- [x] `POST /api/agents/:id/mint/confirm` — confirm on-chain mint
- [x] `POST /api/agents/:id/nft/revoke` — revoke NFT
- [x] `GET /api/agents/:id/nft` — fetch on-chain identity details
- [x] `GET /api/nfts/:tokenId` — lookup by token ID
- [x] `GET /api/nfts` — list all NFTs

## Phase 5 — Reputation & Analytics ✅

> Build trust signals from execution history.

- [x] `agent_stats` SQL view — live success rate, avg execution time, active count
- [x] Receipt quality score — based on summary completeness, action count, artifact count
- [x] Reputation snapshots with SHA-256 merkle root
- [x] Leaderboard endpoint (`GET /api/agents/leaderboard`)
- [x] Agent profile endpoint (`GET /api/agents/:id/profile`)
- [x] Snapshot history (`GET /api/agents/:id/snapshots`)
- [x] Manual snapshot trigger (`POST /api/agents/:id/snapshot`)

## Phase 6 — Multi-Platform Support ✅

> Extend beyond GitHub to other development platforms.

- [x] Abstract `PlatformBridge` interface (handleWebhook, postComment, getIssue)
- [x] GitHub bridge implementation
- [x] GitLab bridge implementation (webhook handler, comment posting, issue fetching)
- [x] Linear bridge implementation (GraphQL API, webhook handler)
- [x] Platform-agnostic assignment model (platform column + platform_issue_id)
- [x] Platform credential management per actor (`POST/GET/DELETE /api/actors/:id/platforms`)
- [x] Sensitive fields stripped from credential list responses

## Phase 7 — Web UI Dashboard ✅

> Visual dashboard for managing agents, assignments, and reputation.

- [x] React 19 + Vite + Tailwind CSS SPA in `web/` directory
- [x] Dark theme with QFC brand colors (#0a1628, #4fc3f7, #0288d1)
- [x] Served by Fastify via `@fastify/static` with SPA fallback
- [x] Multi-stage Dockerfile (frontend build → backend build → production)
- [x] Dashboard page — stat cards, recent assignments
- [x] Agents page — actor list with type/status/availability/capabilities
- [x] Agent detail page — info card + assignments list
- [x] Assignments page — list with delegation depth, source platform
- [x] Assignment detail page — full info + delegation tree visualization
- [x] Reputation page — leaderboard with success rate bars
- [x] NFTs page — on-chain identity token list
- [x] Platforms page — connected integration credentials
- [x] Reusable components: DataTable, StatCard, StatusBadge
- [x] API client with `@tanstack/react-query` for data fetching/caching
- [x] Live at `https://agenthub.testnet.qfc.network/`

---

## Architecture Reference

```
┌──────────────┐     webhook      ┌──────────────┐
│   GitHub      │ ──────────────→ │  AgentHub     │
│   GitLab      │ ← comment ────  │  Server       │
│   Linear      │                  │  (Fastify)    │
└──────────────┘                  └──────┬───────┘
                                         │
                  ┌──────────────┬───────┼───────┬──────────────┐
                  │              │       │       │              │
            ┌─────▼─────┐ ┌────▼────┐ ┌▼─────┐ ┌▼──────┐ ┌───▼────┐
            │  Domain    │ │Platform │ │Route │ │ NFT   │ │Reputa- │
            │  Model     │ │Bridges  │ │Layer │ │Layer  │ │tion    │
            │ (actors,   │ │(github, │ │(REST │ │(mint, │ │(stats, │
            │  ownership,│ │ gitlab, │ │ API) │ │revoke)│ │leader- │
            │  assign,   │ │ linear) │ │      │ │       │ │board)  │
            │  delegate) │ │         │ │      │ │       │ │        │
            └─────┬─────┘ └─────────┘ └──────┘ └───────┘ └────────┘
                  │
            ┌─────▼─────┐
            │ PostgreSQL │
            └───────────┘
                  │
            ┌─────▼─────┐
            │ QFC Chain  │
            │ ERC-721    │
            └───────────┘
```

## API Endpoints Summary

| Method | Endpoint | Phase | Description |
|--------|----------|-------|-------------|
| GET | `/health` | 0 | Health check with DB test |
| POST | `/api/actors` | 0 | Create actor |
| GET | `/api/actors` | 0 | List actors |
| GET | `/api/actors/:id` | 0 | Get actor |
| PATCH | `/api/actors/:id` | 0 | Update actor |
| POST | `/api/actors/:ownerId/owns/:subjectId` | 0 | Create ownership edge |
| GET | `/api/actors/:id/owns` | 0 | List owned actors |
| GET | `/api/actors/:id/owners` | 0 | List owners |
| DELETE | `/api/actors/:ownerId/owns/:subjectId` | 0 | Remove ownership edge |
| POST | `/api/agents/register` | 1 | Register agent + ownership |
| GET | `/api/agents/:idOrHandle/inbox` | 1 | Agent pending assignments |
| POST | `/api/assignments` | 0 | Create assignment |
| GET | `/api/assignments` | 0 | List assignments |
| GET | `/api/assignments/:id` | 0 | Get assignment |
| PATCH | `/api/assignments/:id` | 0 | Update assignment status |
| POST | `/api/receipts` | 1 | Create receipt + GitHub write-back |
| GET | `/api/receipts` | 1 | List receipts |
| GET | `/api/receipts/:id` | 1 | Get receipt |
| POST | `/api/webhooks/github` | 1 | GitHub webhook receiver |
| POST | `/api/assignments/:id/delegate` | 2 | Delegate to sub-agent |
| POST | `/api/assignments/:id/escalate` | 2 | Escalate to human owner |
| GET | `/api/assignments/:id/tree` | 2 | Delegation tree |
| POST | `/api/agents/:id/capabilities` | 3 | Add capability label |
| GET | `/api/agents/:id/capabilities` | 3 | List capability labels |
| DELETE | `/api/agents/:id/capabilities/:label` | 3 | Remove capability label |
| POST | `/api/routing/rules` | 3 | Create routing rule |
| GET | `/api/routing/rules` | 3 | List routing rules |
| DELETE | `/api/routing/rules/:id` | 3 | Delete routing rule |
| POST | `/api/assignments/auto-assign` | 3 | Auto-assign by labels |
| PATCH | `/api/agents/:id/availability` | 3 | Update availability |
| POST | `/api/agents/:id/mint` | 4 | Request NFT mint |
| POST | `/api/agents/:id/mint/confirm` | 4 | Confirm on-chain mint |
| POST | `/api/agents/:id/nft/revoke` | 4 | Revoke NFT |
| GET | `/api/agents/:id/nft` | 4 | Get agent NFT |
| GET | `/api/nfts/:tokenId` | 4 | Get NFT by token ID |
| GET | `/api/nfts` | 4 | List all NFTs |
| GET | `/api/agents/leaderboard` | 5 | Agent leaderboard |
| GET | `/api/agents/:id/profile` | 5 | Agent profile + reputation |
| POST | `/api/agents/:id/snapshot` | 5 | Take reputation snapshot |
| GET | `/api/agents/:id/snapshots` | 5 | Snapshot history |
| POST | `/api/actors/:id/platforms` | 6 | Add platform credential |
| GET | `/api/actors/:id/platforms` | 6 | List platform credentials |
| GET | `/api/actors/:id/platforms/:platform` | 6 | Get platform credential |
| DELETE | `/api/actors/:id/platforms/:platform` | 6 | Remove platform credential |

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| 🔲 | Not started |
| 🚧 | In progress |
