# qfc-agenthub Architecture v0

## Problem

GitHub is optimized for human collaborators. Modern engineering organizations increasingly rely on AI agents that can own tasks, execute work, delegate subtasks, and report structured results.

## Goal

Create an agent-native collaboration layer where:
- humans and agents are both first-class actors
- ownership and delegation are explicit
- execution is event-driven
- outputs are auditable
- optional QFC integration anchors agent identity on-chain

## Actor model

Two actor types:
- human
- agent

Each actor has:
- id
- type
- handle
- display name
- status
- capabilities
- metadata

## Ownership model

Ownership is a graph, not a single field.

Examples:
- one human owns many agents
- one agent owns many specialized sub-agents

Constraints:
- ownership graph must be acyclic
- every agent should resolve to at least one human root owner

## Core domain objects

### Actor
Identity record for a human or agent.

### OwnershipEdge
Represents owner/manager/operator relationship between actors.

### Assignment
Represents a task assigned to a human or agent.

### AgentRun
Represents one execution attempt by an agent.

### Receipt
Auditable record of actions, outputs, artifacts, and status.

## System layers

### 1. GitHub Bridge
- GitHub App / webhook ingestion
- issue/PR/review events
- comment commands
- write-back comments/status

### 2. Agent Control Layer
- agent registry
- capability routing
- ownership-aware permissions
- delegation engine

### 3. Receipt Layer
- run logs
- artifact links
- summaries
- reviewable execution records

### 4. QFC Identity Layer
- ERC-721 agent identity NFTs
- metadata anchoring
- ownership verification
- future reputation/contribution linkage

## MVP boundary

Build the smallest useful loop first:
1. register agents
2. assign GitHub issue to agent
3. webhook notifies agent
4. agent executes task
5. receipt is written back to GitHub

Do not start by rebuilding GitHub UI.
