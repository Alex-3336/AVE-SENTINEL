---
name: ave-sentinel-suite
version: 0.1.0
description: |
  Top-level natural-language router for AVE SENTINEL.
  Use this skill whenever the user talks naturally about a token, CA, risk, smart money,
  quote, buy, sell, unsigned transaction, delegate wallet, limit order, or order status.

  This skill is the default AVE SENTINEL entrypoint for OpenClaw-like agents.
license: MIT
metadata:
  openclaw:
    primaryEnv: AVE_API_KEY
---

# ave-sentinel-suite

This is the default natural-language router for AVE SENTINEL.

Use this skill first when the user says things like:

- "帮我看看这个 token"
- "帮我看一下这个 CA"
- "这个币安全吗"
- "帮我查一下风险"
- "看看聪明钱有没有进"
- "给我做个买入 quote"
- "帮我买这个币"
- "帮我挂个限价单"
- "查一下我的订单"
- "用我的钱包签名"
- "我想用 delegate wallet 下单"

Also trigger on English requests such as:

- "check this token"
- "check this CA"
- "is this token safe"
- "show me the risk"
- "look up smart money"
- "give me a buy quote"
- "buy this token"
- "place a limit order"
- "check my order status"
- "sign with my wallet"
- "use delegate wallet"

## Core Rule

The user should be able to speak naturally.

Do not make them choose raw commands when the intent is already clear.

Your job is:

1. detect intent from natural language
2. choose the correct underlying operation
3. inspect schema before calling
4. pass structured JSON input
5. carry state forward across steps

## Runtime

Always use the structured runtime:

```bash
npm run skill -- schema <operation>
npm run skill -- call <operation> --input-json '<json>'
```

Never invent parameters.

Inspect the schema first whenever:

- the operation is being used for the first time in the conversation
- an input is optional or ambiguous
- a multi-step workflow is about to continue into execution

## Route Selection

### Read-only token intelligence

| User intent | Operation |
|---|---|
| "看看这个币" / "check this token" | `token_dossier` |
| "看看风险" / "is this safe" | `risk_guard` |
| "看看聪明钱" / "smart money" | `wallet_intel` |
| "查公开 signal" / "public signal" | `smart_signal_lookup` |
| "看看最近有什么机会" / "what should I look at" | `radar_scan` |

### Quote and self-custody trade path

| User intent | Operation |
|---|---|
| "给我做个 quote" / "give me a quote" | `trade_quote` |
| "构建未签名交易" / "build unsigned tx" | `trade_build_unsigned` |
| "发送已签名交易" / "send signed tx" | `trade_send_signed` |
| "查这笔 tx 状态" / "check tx status" | `trade_status` |

### Delegate wallet path

| User intent | Operation |
|---|---|
| "列出我的 delegate wallet" / "list delegate wallets" | `delegate_wallet_list` |
| "新建 delegate wallet" / "create delegate wallet" | `delegate_wallet_create` |
| "市价买入" / "market buy" | `delegate_market_order` |
| "挂限价单" / "place limit order" | `delegate_limit_order` |
| "查订单状态" / "check order status" | `delegate_order_status` |

## Trade Path Decision

When the user wants to trade, route like this:

### Route to Chain Wallet

Use the self-custody path if the user explicitly mentions:

- 我的钱包
- 本地签名
- 私钥
- 助记词
- external signer
- unsigned tx
- sign locally
- self-custody

Then use:

1. `trade_quote`
2. `trade_build_unsigned`
3. wait for user confirmation or signed payload
4. `trade_send_signed`
5. `trade_status`

### Route to Delegate Wallet

Use the delegate path if the user explicitly mentions:

- delegate wallet
- assetsId
- bot wallet
- 代理钱包
- 机器人钱包
- 限价单
- order status

Also use the delegate path as the default execution path when:

- the user wants to buy or sell
- self-custody is not explicitly required
- the user is asking for actual order placement, not just a quote

Then use:

1. `delegate_wallet_list` if wallet context is missing
2. `delegate_market_order` or `delegate_limit_order`
3. `delegate_order_status`

### Special Rule for Quote

If the user only wants a quote or preview, use `trade_quote` even if the final execution path is not yet chosen.

Reason:

- it is non-executing
- it is safe
- it gives route, slippage, spender, and output estimate

## Default Workflows

### Workflow A: "帮我看一下这个 token 风险"

1. If token address or chain is missing, ask the smallest possible clarification.
2. Call `risk_guard`.
3. Return the structured risk result in user-friendly language.

### Workflow B: "给我做个买入 quote"

1. Resolve `chain`, `tokenAddress`, `amount`.
2. Call `trade_quote`.
3. Return estimated output, slippage hints, and whether approval is required.

### Workflow C: "帮我买这个币"

If self-custody is explicit:

1. `risk_guard`
2. `trade_quote`
3. `trade_build_unsigned`
4. wait for confirmation or signed payload
5. `trade_send_signed`
6. `trade_status`

If self-custody is not explicit:

1. `risk_guard`
2. `delegate_wallet_list` if needed
3. `delegate_market_order`
4. `delegate_order_status`

### Workflow D: "帮我挂一个限价买单"

1. Resolve `chain`, `tokenAddress`, `assetsId`, `amount`, `limitPrice`
2. `risk_guard`
3. `delegate_limit_order`
4. `delegate_order_status`

## Minimal Clarification Rules

Ask only when a safe assumption is not possible.

Ask for:

- `tokenAddress` if the user has not provided a resolvable token
- `chain` if the address is EVM-style and chain is unclear
- `amount` if the user wants quote or execution but has not given a spend size
- `walletAddress` for `trade_build_unsigned`
- `assetsId` for delegate execution when more than one wallet exists or none is selected
- `txHash` plus `accountAddress` for `trade_status`

Do not ask the user to choose a command name.

## State Handoff

Carry these fields across turns whenever known:

- `chain`
- `tokenAddress`
- `amount`
- `side`
- `walletAddress`
- `assetsId`
- `limitPrice`
- `orderId`
- `requestTxId`
- `txHash`

Do not drop these values once already established.

## Safety Rules

- For unfamiliar tokens, run `risk_guard` before execution.
- For self-custody, do not skip `trade_build_unsigned`.
- For delegate execution, do not treat order submission as final. Always follow with `delegate_order_status`.
- Do not write credentials to files.
- Use the smallest practical notional for tests.

## Trigger Bias

Bias toward triggering this skill when the request mentions any of these:

- token
- CA
- contract
- 风险
- honeypot
- quote
- 买入
- 卖出
- build tx
- unsigned
- signed tx
- delegate wallet
- assetsId
- order status
- smart money
- signal wallet

If the request is about AVE token data or trading and the correct operation is not already explicit, trigger this skill.
