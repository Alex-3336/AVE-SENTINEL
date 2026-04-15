---
name: ave-sentinel-chain-wallet
version: 0.1.0
description: |
  Build and send self-custody AVE chain-wallet trades through stable JSON operations.
  Use this skill for quote, unsigned transaction build, signed send, and tx-hash status lookup.
license: MIT
---

# ave-sentinel-chain-wallet

Use this skill only for self-custody or external-signer workflows.

## Operations

- `trade_quote`
- `trade_build_unsigned`
- `trade_send_signed`
- `trade_status`

## Runtime

Inspect schema first:

```bash
npm run skill -- schema trade_quote
npm run skill -- schema trade_build_unsigned
```

Call an operation:

```bash
npm run skill -- call trade_quote --input-json '{"chain":"solana","tokenAddress":"<token>","side":"buy","amount":0.1}'
npm run skill -- call trade_build_unsigned --input-json '{"chain":"solana","tokenAddress":"<token>","side":"buy","amount":0.1,"walletAddress":"<wallet>"}'
```

## Rules

- No implicit execution. Use `trade_build_unsigned` before `trade_send_signed`.
- Do not store private keys, mnemonics, or signed payloads in files.
- For EVM sells, pay attention to `data.preflight.approvalRequired`.
- `trade_status` is hash-based lookup. It needs `txHash` and `accountAddress`.
