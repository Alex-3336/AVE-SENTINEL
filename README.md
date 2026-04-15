# AVE Sentinel

AVE Sentinel is an address-first multi-chain research and execution terminal built on AVE.

It is designed for fast, noisy, early-stage on-chain markets where traders need to answer one practical question quickly:

**Given a contract address, is this worth doing, worth watching, or worth avoiding?**

AVE already provides the raw browsing layer for k-lines, holders, transactions, pairs, and risk reports.  
AVE Sentinel does not try to rebuild a heavier version of those native views. It focuses on the decision layer:

- `SENTINEL-8` scoring
- risk gates
- evidence explanation
- quote preparation
- execution readiness

The same product logic is exposed through:

- Web workspace
- Telegram query surface
- CLI / Skill runtime

## Table of Contents

- [What AVE Sentinel Is](#what-ave-sentinel-is)
- [Why It Exists](#why-it-exists)
- [Core Product Thesis](#core-product-thesis)
- [Current Capability Surface](#current-capability-surface)
- [Entry Surfaces](#entry-surfaces)
- [Main Workflow](#main-workflow)
- [SENTINEL-8](#sentinel-8)
- [Current Modules](#current-modules)
- [Supported Chains](#supported-chains)
- [Quick Start](#quick-start)
- [Environment](#environment)
- [Command Entry Points](#command-entry-points)
- [Repository Structure](#repository-structure)

---

## What AVE Sentinel Is

AVE Sentinel is a complete decision system for early-stage on-chain assets.

It is not:

- just a trending board
- just a token dashboard
- just a wallet tracker
- just a quote tool
- just a trading bot

It is a single workflow that connects:

`address lookup -> score -> evidence -> risk gate -> quote / execution prep -> monitoring / replay`

---

## Why It Exists

In early-stage on-chain trading, the main problem is usually not missing data.  
The real problem is fragmented judgement.

Users often need to move across multiple tools to:

- spot a candidate
- inspect structure
- check risk
- understand wallet or signal context
- prepare a quote
- decide whether to act

That fragmentation leads to:

- slower judgement
- later risk checks
- broken execution flow
- weak replay after the decision

AVE Sentinel compresses those steps into one clearer path.

---

## Core Product Thesis

AVE Sentinel is complementary to AVE, not a replacement for it.

The split is intentional:

| Layer | AVE | AVE Sentinel |
|---|---|---|
| Raw browsing | k-lines, holders, transactions, pairs, risk reports | not the primary focus |
| Decision logic | partial inputs and platform primitives | primary product focus |
| Score model | no unified product-side decision layer | `SENTINEL-8` |
| Risk gating | risk endpoints and warnings | action-level gating before execution |
| Execution prep | quote / trade capabilities | decision-linked execution preparation |

This is the product boundary:

- AVE is the capability substrate
- AVE Sentinel is the research-and-decision layer

---

## Current Capability Surface

The current workspace already supports:

- direct contract-address lookup
- Radar candidate discovery
- `SENTINEL-8` score modeling
- single-token evidence review
- risk gating before action
- official AVE quote preview
- unsigned transaction preparation
- chain-wallet and delegate-wallet execution paths
- replay-friendly decision flow
- Web / Telegram / CLI reuse of the same core

---

## Entry Surfaces

### 1. Web

The primary workspace for:

- full token analysis
- score interpretation
- risk review
- quote preparation
- execution readiness

### 2. Telegram

The lightweight mobile surface for:

- quick token lookup
- fast risk checks
- quote queries
- brief summaries

### 3. CLI / Skill Runtime

The structured runtime surface for:

- natural-language agent use
- scriptable workflows
- JSON-based skill calls
- future automation

---

## Main Workflow

AVE Sentinel is built around an address-first path.

### Primary path

1. Enter a contract address
2. Generate a `SENTINEL-8` score
3. Inspect the evidence page
4. Apply risk gates
5. Pull an official AVE quote
6. Prepare execution
7. Revisit the outcome

### Alternate path

Users can also start from Radar and then enter the same per-token workflow.

---

## SENTINEL-8

`SENTINEL-8` is the core decision model of AVE Sentinel.

It combines eight dimensions:

- `L` Liquidity depth
- `V` Volume quality
- `M` Momentum
- `A` Activity acceleration
- `C` Holder concentration
- `R` Risk posture
- `S` Signal quality
- `F` Freshness

The model is not presented as a cosmetic score.  
It is exposed as an inspectable product surface with:

- factor values
- weight contribution
- risk multipliers
- final score
- verdict output

Verdict is always emitted as:

- `Actionable`
- `Watch`
- `Avoid`

For the Chinese UI:

- `可做`
- `观望`
- `回避`

---

## Current Modules

### Overview

The product identity, workflow summary, and multi-entry orientation page.

### Radar

The multi-chain staging board for candidate discovery, filtering, and direct address lookup.

### Score Model

The dedicated `SENTINEL-8` page for factor breakdown, contribution, and risk-gate flow.

### Token Dossier

The focused evidence page.  
It keeps only the fields needed for modelling and judgement, rather than replicating full AVE browsing surfaces.

### Risk Guard

The action gate that turns structure and contract evidence into execution constraints.

### Opportunity Desk

The execution-preparation surface for:

- official AVE quote
- route visibility
- slippage and gas hints
- unsigned transaction preparation
- chain-wallet and delegate-wallet paths

### Docs

The in-product guide covering:

- product positioning
- workflow
- scoring model
- runtime usage
- data-source rules

### Access

The user-tier and rollout layer for future quota, priority, and access-policy expansion.

---

## Supported Chains

Current product support:

- Solana
- BSC
- Base
- Ethereum

The current thesis started from Solana and BSC, but the live workspace already operates across all four chains above.

---

## Quick Start

### Install

```bash
npm install
```

### Start the local AVE proxy

```bash
npm run proxy
```

### Start the web app

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## Environment

Copy `.env.example` to `.env`.

Minimum variables:

```env
VITE_AVE_API_KEY=your_key
AVE_API_SECRET=your_secret
```

Notes:

- Web reads `VITE_AVE_API_KEY`
- proxy and delegate-wallet paths read `AVE_API_SECRET`
- if `VITE_AVE_API_KEY` is missing, the web frontend falls back to mock / fallback data

For browser use, keep the local proxy running so requests can bypass cross-origin restrictions:

```bash
npm run proxy
```

---

## Command Entry Points

### CLI

```bash
npm run cli -- help
npm run cli -- radar
npm run cli -- brief
npm run cli -- token <address> --chain solana
npm run cli -- risk <address> --chain bsc
npm run cli -- quote <address> --chain solana --usd 500
```

### Skill Runtime

```bash
npm run skill -- list
npm run skill -- schema radar_scan
npm run skill -- call radar_scan --input-json '{"chains":["solana","bsc"],"limit":10}'
npm run skill -- call trade_quote --input-json '{"chain":"solana","tokenAddress":"<token>","side":"buy","amount":0.1}'
```

### Telegram command entry

```bash
npm run tg -- "/radar"
npm run tg -- "/brief"
npm run tg -- "/token <address> solana"
npm run tg -- "/risk <address> bsc"
npm run tg -- "/quote <address> solana 500"
```

---

## Repository Structure

```text
src/                    React web app
src/lib/                AVE data, trade, wallet, and runtime logic
src/components/         UI modules
scripts/                proxy, CLI, Telegram, and skill runtime entry points
skills/                 structured skill definitions
test/claude-skill-bundle/  Claude / agent test bundle
```

---

## Recommended Read Order

If you are new to the project:

1. Read this README
2. Try the Web workspace
3. Try the Skill runtime from CLI

---

## One-Line Summary

**One address in. Score, risk, evidence, and execution readiness out.**
