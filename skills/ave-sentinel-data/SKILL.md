---
name: ave-sentinel-data
version: 0.1.0
description: |
  Query AVE SENTINEL token intelligence as stable JSON for agent workflows.
  Use this skill for radar discovery, token dossier lookup, risk checks, wallet intel,
  and public smart-signal lookup.
license: MIT
---

# ave-sentinel-data

Use this skill when the task is read-only and the goal is structured token intelligence.

## Operations

- `radar_scan`
- `token_dossier`
- `risk_guard`
- `wallet_intel`
- `smart_signal_lookup`

## Runtime

Inspect schema first:

```bash
npm run skill -- schema radar_scan
npm run skill -- schema token_dossier
```

Call an operation:

```bash
npm run skill -- call radar_scan --input-json '{"chains":["solana","bsc"],"limit":10}'
npm run skill -- call token_dossier --input-json '{"chain":"solana","tokenAddress":"<token>"}'
```

## Rules

- Keep outputs machine-readable. Use `data` fields, not free-form prose.
- Field names are stable English.
- Human-facing text only goes in `message.zh` and `message.en`.
- If the task may lead to execution, finish the data preflight here before switching to a trade skill.
