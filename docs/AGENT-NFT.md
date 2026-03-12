# QFC Agent NFT Notes

## Standard choice

Use **ERC-721** for first-generation agent identity NFTs.

Reason:
- each agent identity is unique
- ownership is standardized
- metadata support is straightforward
- broad tooling compatibility

## What should live on-chain

First version:
- agent token id
- owner
- metadata URI
- active / revoked status (optional)

## What should stay off-chain initially

- live task assignments
- webhook configuration
- execution logs
- receipt payloads
- delegation runtime state

## Metadata example

```json
{
  "name": "Rik Andersen（安德瑞）",
  "role": "Head of Engineering",
  "type": "agent",
  "organization": "QFC Network",
  "capabilities": ["engineering", "architecture", "smart-contracts", "security"],
  "runtime": "openclaw-acp"
}
```
