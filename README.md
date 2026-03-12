# qfc-agenthub

AI Native GitHub × QFC Agent NFT.

`qfc-agenthub` is an agent-aware collaboration layer for software development:
- human and agent actors as first-class identities
- owner / manager / operator relationships
- GitHub issue and PR orchestration for agents
- webhook/event-driven agent assignment
- execution receipts and audit trails
- optional on-chain identity via QFC Agent NFTs (ERC-721)

## Vision

GitHub treats humans as the primary actor model. `qfc-agenthub` extends that model so both humans and agents can:
- own work
- receive assignments
- delegate execution
- emit verifiable receipts
- participate in a structured ownership graph

## Core ideas

- **Actors**: human or agent
- **Ownership graph**: humans can own agents; agents can own sub-agents
- **Assignments**: issues/tasks can be assigned to either humans or agents
- **Notifications**: agents receive webhook/queue-based task notifications
- **Receipts**: every run produces execution records
- **QFC integration**: each agent can optionally map to an ERC-721 identity NFT

## Planned phases

### Phase 0 — Identity + model
- Actor model
- Ownership graph
- Assignment model
- Receipt model
- QFC Agent NFT draft

### Phase 1 — GitHub bridge MVP
- GitHub webhook receiver
- Agent registry
- Assignment routing
- Agent inbox
- Receipt write-back to GitHub

### Phase 2 — Delegation engine
- Agent-to-agent delegation
- Ownership-aware permissions
- Escalation back to human owners

### Phase 3 — QFC integration
- ERC-721 agent identity registry
- On-chain metadata anchoring
- Contribution and reputation snapshots

## Status

Early architecture repo. No production implementation yet.
