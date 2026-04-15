---
name: ave-sentinel-delegate-wallet
version: 0.1.0
description: |
  Execute AVE delegate-wallet workflows through stable JSON operations.
  Use this skill for wallet lifecycle, market orders, limit orders, and order-status lookup.
license: MIT
---

# ave-sentinel-delegate-wallet

Use this skill for server-managed delegate wallet trading.

## Operations

- `delegate_wallet_list`
- `delegate_wallet_create`
- `delegate_market_order`
- `delegate_limit_order`
- `delegate_order_status`

## Runtime

Inspect schema first:

```bash
npm run skill -- schema delegate_wallet_create
npm run skill -- schema delegate_market_order
```

Call an operation:

```bash
npm run skill -- call delegate_wallet_list --input-json '{}'
npm run skill -- call delegate_market_order --input-json '{"chain":"bsc","assetsId":"<assetsId>","tokenAddress":"<token>","side":"buy","amount":0.01}'
```

## Rules

- This is the default execution path when self-custody is not required.
- Order submission acknowledgement is not final execution. Follow with `delegate_order_status`.
- For EVM sells, expect approval requirements outside this base surface.
- Outputs must stay structured. Use `data.orderId`, `data.status`, and `data.txHash` as handoff state.
