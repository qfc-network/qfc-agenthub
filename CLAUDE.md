# QFC AgentHub — Developer Guide

## Project Overview
Agent-aware collaboration layer for software development — extends GitHub so both humans and AI agents can own work, receive assignments, delegate execution, and emit verifiable receipts. Optional on-chain identity via QFC Agent NFTs (ERC-721).

## Status
Early architecture repo. No production implementation yet. Design docs only.

## Repository Structure
```
docs/
  ARCHITECTURE.md    # Core architecture: actor model, ownership graph, system layers
  AGENT-NFT.md       # ERC-721 agent identity NFT design notes
README.md            # Project overview and phased roadmap
```

## Core Concepts
- **Actors**: Human or agent, both first-class identities
- **Ownership graph**: Acyclic graph — humans own agents, agents can own sub-agents, every agent resolves to a human root
- **Assignments**: Issues/tasks assigned to either humans or agents
- **Receipts**: Auditable execution records (actions, outputs, artifacts, status)
- **Agent NFTs**: ERC-721 on QFC chain for on-chain agent identity

## System Layers (planned)
1. **GitHub Bridge** — Webhook ingestion, issue/PR events, comment commands, write-back
2. **Agent Control Layer** — Registry, capability routing, ownership-aware permissions, delegation
3. **Receipt Layer** — Run logs, artifact links, summaries
4. **QFC Identity Layer** — ERC-721 NFTs, metadata anchoring, ownership verification

## Phased Roadmap
- **Phase 0**: Identity + domain model (Actor, OwnershipEdge, Assignment, AgentRun, Receipt)
- **Phase 1**: GitHub bridge MVP (webhook receiver, agent registry, assignment routing, inbox, receipt write-back)
- **Phase 2**: Delegation engine (agent-to-agent, escalation to humans)
- **Phase 3**: QFC on-chain integration (ERC-721, metadata, reputation)

## MVP Loop
1. Register agent
2. Assign GitHub issue to agent
3. Webhook notifies agent
4. Agent executes task
5. Receipt written back to GitHub

## QFC Integration
- Chain: QFC Testnet (Chain ID 9000) / Mainnet (Chain ID 9001)
- Agent NFT: ERC-721 standard
- On-chain: token ID, owner, metadata URI, active/revoked status
- Off-chain: task assignments, webhook config, execution logs, receipts

## Related Repos
- [qfc-contracts](https://github.com/qfc-network/qfc-contracts) — Smart contracts (AgentRegistry, inference contracts)
- [qfc-explorer](https://github.com/qfc-network/qfc-explorer) — Explorer frontend with agent pages
- [qfc-explorer-api](https://github.com/qfc-network/qfc-explorer-api) — Explorer API with agent indexer
- [qfc-core](https://github.com/qfc-network/qfc-core) — Blockchain node (Rust)

## Branch Strategy
- **main** — stable
- Feature branches → PR → merge to main
