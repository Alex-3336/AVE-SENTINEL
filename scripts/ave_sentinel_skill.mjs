#!/usr/bin/env node

import fs from "node:fs";
import { loadRadarSnapshot, loadTokenSnapshot } from "./sentinel_core.mjs";
import {
  DATA_UPSTREAM,
  TRADE_UPSTREAM,
  buildDelegateSignature,
  resolveAveApiKey
} from "./ave_proxy.mjs";
import {
  getSkillDefinition,
  listSkillDefinitions,
  skillRegistry
} from "./ave_sentinel_skill_registry.mjs";

const API_KEY = resolveAveApiKey().trim();
const NATIVE_EVM_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const SUCCESS_STATUS = new Set([0, 1, 200]);

function toApiChain(input) {
  const value = String(input || "").trim().toLowerCase();
  if (value === "bnb" || value === "bsc") return "bsc";
  if (value === "ethereum" || value === "eth") return "eth";
  if (value === "base") return "base";
  return "solana";
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRecord(value) {
  return isObject(value) ? value : {};
}

function getList(value) {
  return Array.isArray(value) ? value : [];
}

function unwrapData(payload) {
  return payload?.data ?? payload;
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function toInteger(value) {
  return Math.trunc(toNumber(value));
}

function fromRawUnits(value, decimals) {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim();
  if (!raw || raw === "0") return 0;
  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  const safe = digits.replace(/^0+/, "") || "0";
  const padded = safe.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals) || "0";
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return Number(`${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`);
}

function toRawUnits(amount, decimals) {
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  const safeDecimals = Math.min(decimals, 8);
  const fixed = amount.toFixed(safeDecimals);
  const [whole, fraction = ""] = fixed.split(".");
  const raw =
    whole + fraction.padEnd(safeDecimals, "0") + "0".repeat(Math.max(decimals - safeDecimals, 0));
  return raw.replace(/^0+(?=\d)/, "") || "0";
}

function responseOk(payload) {
  const status = payload?.status;
  return status === undefined || SUCCESS_STATUS.has(status);
}

function createMessage(zh, en) {
  return { zh, en };
}

function createError(code, zh, en, detail = "") {
  return {
    code,
    message: createMessage(zh, en),
    ...(detail ? { detail } : {})
  };
}

function buildMeta() {
  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: skillRegistry.package.schemaVersion
  };
}

function buildResponse(skill, group, input, data, options = {}) {
  return {
    ok: options.ok ?? true,
    skill,
    group,
    mode: options.mode ?? "live",
    source: options.source ?? "ave",
    message: options.message ?? createMessage("", ""),
    input,
    data,
    error: options.error ?? null,
    meta: buildMeta()
  };
}

function successResponse(skill, group, input, data, zh, en, options = {}) {
  return buildResponse(skill, group, input, data, {
    ...options,
    ok: true,
    message: createMessage(zh, en),
    error: null
  });
}

function failureResponse(skill, group, input, code, zh, en, detail = "", options = {}) {
  return buildResponse(skill, group, input, {}, {
    ...options,
    ok: false,
    mode: options.mode ?? "fallback",
    source: options.source ?? "ave",
    message: createMessage(zh, en),
    error: createError(code, zh, en, detail)
  });
}

function parseJsonInput(text) {
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

function readFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return "";
  return args[index + 1] ?? "";
}

function hasFlag(args, name) {
  return args.includes(name);
}

function serializeQuery(params = {}) {
  const url = new URL("http://localhost/");
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.search;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { status: response.status, msg: text || "Non-JSON response", raw: text };
  }

  if (!response.ok) {
    throw new Error(payload?.msg ? `${payload.msg} (HTTP ${response.status})` : `HTTP ${response.status}`);
  }

  if (!responseOk(payload)) {
    throw new Error(payload?.msg ? `${payload.msg} (status ${payload.status})` : `status ${payload?.status ?? "unknown"}`);
  }

  return payload;
}

function ensureApiKey() {
  if (!API_KEY) {
    throw new Error("Missing AVE_API_KEY or VITE_AVE_API_KEY");
  }
}

async function dataGet(pathname, params = {}) {
  ensureApiKey();
  const url = `${DATA_UPSTREAM}/v2${pathname}${serializeQuery(params)}`;
  return requestJson(url, {
    headers: {
      "X-API-KEY": API_KEY
    }
  });
}

async function tradeGet(pathname, params = {}) {
  ensureApiKey();
  const url = `${TRADE_UPSTREAM}${pathname}${serializeQuery(params)}`;
  return requestJson(url, {
    headers: {
      "AVE-ACCESS-KEY": API_KEY
    }
  });
}

async function tradePost(pathname, payload = {}) {
  ensureApiKey();
  return requestJson(`${TRADE_UPSTREAM}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "AVE-ACCESS-KEY": API_KEY
    },
    body: JSON.stringify(payload)
  });
}

async function delegateGet(pathname, params = {}) {
  ensureApiKey();
  const requestPath = `${pathname}${serializeQuery(params)}`;
  return requestJson(`${TRADE_UPSTREAM}${requestPath}`, {
    headers: buildDelegateSignature("GET", requestPath)
  });
}

async function delegatePost(pathname, payload = {}) {
  ensureApiKey();
  const bodyBuffer = Buffer.from(JSON.stringify(payload));
  return requestJson(`${TRADE_UPSTREAM}${pathname}`, {
    method: "POST",
    headers: buildDelegateSignature("POST", pathname, bodyBuffer),
    body: bodyBuffer
  });
}

function normalizeNativeToken(chain, symbol, tokenAddress) {
  const normalizedChain = toApiChain(chain);
  const upperSymbol = String(symbol || "").trim().toUpperCase();
  const normalizedAddress = String(tokenAddress || "").trim();

  if (normalizedChain === "solana") {
    if (upperSymbol === "SOL" || normalizedAddress === SOL_MINT || normalizedAddress === "sol") {
      return "sol";
    }
    return normalizedAddress;
  }

  if (
    upperSymbol.includes("BNB") ||
    upperSymbol.includes("ETH") ||
    normalizedAddress.toLowerCase() === NATIVE_EVM_TOKEN
  ) {
    return NATIVE_EVM_TOKEN;
  }

  return normalizedAddress;
}

function isNativeTradeToken(chain, tokenAddress) {
  const normalizedChain = toApiChain(chain);
  const normalizedAddress = String(tokenAddress || "").trim();
  if (normalizedChain === "solana") {
    return normalizedAddress === "sol";
  }
  return normalizedAddress.toLowerCase() === NATIVE_EVM_TOKEN;
}

function buildTradeSideContext(snapshot, side) {
  const trade = snapshot.trade ?? {};
  const baseTokenAddress = normalizeNativeToken(
    snapshot.chain,
    trade.baseSymbol,
    trade.baseTokenAddress
  );

  if (side === "buy") {
    return {
      inputSymbol: String(trade.baseSymbol ?? ""),
      inputTokenAddress: baseTokenAddress,
      inputDecimals: toInteger(trade.baseTokenDecimals),
      outputSymbol: String(snapshot.symbol ?? ""),
      outputTokenAddress: String(snapshot.address ?? ""),
      outputDecimals: toInteger(trade.tokenDecimals)
    };
  }

  return {
    inputSymbol: String(snapshot.symbol ?? ""),
    inputTokenAddress: String(snapshot.address ?? ""),
    inputDecimals: toInteger(trade.tokenDecimals),
    outputSymbol: String(trade.baseSymbol ?? ""),
    outputTokenAddress: baseTokenAddress,
    outputDecimals: toInteger(trade.baseTokenDecimals)
  };
}

function normalizeTradeContext(snapshot) {
  return {
    route: String(snapshot.trade?.route ?? ""),
    baseSymbol: String(snapshot.trade?.baseSymbol ?? ""),
    baseTokenAddress: normalizeNativeToken(
      snapshot.chain,
      snapshot.trade?.baseSymbol,
      snapshot.trade?.baseTokenAddress
    ),
    baseTokenDecimals: toInteger(snapshot.trade?.baseTokenDecimals),
    baseTokenPriceUsd: toNumber(snapshot.trade?.baseTokenPriceUsd),
    tokenDecimals: toInteger(snapshot.trade?.tokenDecimals)
  };
}

function normalizeDelegateWallet(item) {
  const addresses = {};
  getList(item.addressList).forEach((entry) => {
    const chain = String(entry.chain ?? "").toLowerCase();
    const address = String(entry.address ?? "");
    if (chain === "solana") addresses.Solana = address;
    if (chain === "bsc") addresses.BSC = address;
    if (chain === "base") addresses.Base = address;
    if (chain === "eth") addresses.Ethereum = address;
  });

  return {
    assetsId: String(item.assetsId ?? ""),
    assetsName: String(item.assetsName ?? ""),
    type: String(item.type ?? ""),
    status: String(item.status ?? ""),
    addresses
  };
}

async function resolveSnapshot(chain, tokenAddress) {
  return loadTokenSnapshot(String(tokenAddress).trim(), toApiChain(chain));
}

async function getChainWalletHints(snapshot, useMev = false) {
  const chain = toApiChain(snapshot.chain);
  const [slippageResponse, gasTipResponse] = await Promise.all([
    tradePost("/v1/thirdParty/chainWallet/getAutoSlippage", {
      chain,
      tokenAddress: snapshot.address,
      useMev
    }),
    tradeGet("/v1/thirdParty/chainWallet/getGasTip")
  ]);

  const slippage = getRecord(unwrapData(slippageResponse));
  const gasTips = getList(unwrapData(gasTipResponse));
  const gasTipMatch =
    gasTips.find(
      (item) =>
        String(item.chain ?? "").toLowerCase() === chain &&
        (chain === "solana" ? Boolean(item.mev) === Boolean(useMev) : true)
    ) ??
    gasTips.find((item) => String(item.chain ?? "").toLowerCase() === chain) ??
    {};

  return {
    slippageBps: toInteger(slippage.slippage),
    gasTipLow: String(gasTipMatch.low ?? "--"),
    gasTipAverage: String(gasTipMatch.average ?? "--"),
    gasTipHigh: String(gasTipMatch.high ?? "--"),
    gasLimit: String(gasTipMatch.gasLimit ?? "--")
  };
}

function selectGasTip(hints, gasTier, useMev) {
  const selected =
    gasTier === "low"
      ? hints.gasTipLow
      : gasTier === "high"
        ? hints.gasTipHigh
        : hints.gasTipAverage;

  const parsed = String(selected || "").trim();
  if (!parsed || parsed === "--") {
    return useMev ? "1000000" : "500000";
  }

  if (useMev && toNumber(parsed) < 1000000) {
    return "1000000";
  }

  return parsed;
}

async function fetchQuoteBundle(input) {
  const snapshot = await resolveSnapshot(input.chain, input.tokenAddress);
  const side = input.side;
  const amount = toNumber(input.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const context = buildTradeSideContext(snapshot, side);

  if (!context.inputTokenAddress || !context.outputTokenAddress) {
    throw new Error("Missing trade context for token pair");
  }

  const [quoteResponse, hints] = await Promise.all([
    tradePost("/v1/thirdParty/chainWallet/getAmountOut", {
      chain: snapshot.chain,
      inAmount: toRawUnits(amount, context.inputDecimals),
      inTokenAddress: context.inputTokenAddress,
      outTokenAddress: context.outputTokenAddress,
      swapType: side
    }),
    getChainWalletHints(snapshot, input.useMev)
  ]);

  const quote = getRecord(unwrapData(quoteResponse));
  const estimatedAmount = fromRawUnits(
    quote.estimateOut,
    toInteger(quote.decimals) || context.outputDecimals
  );
  const spender = String(quote.spender ?? "");

  return {
    snapshot,
    context,
    hints,
    quote: {
      side,
      inputSymbol: context.inputSymbol,
      inputTokenAddress: context.inputTokenAddress,
      inputAmount: amount,
      outputSymbol: context.outputSymbol,
      outputTokenAddress: context.outputTokenAddress,
      estimatedAmount,
      spender,
      requiresApproval:
        snapshot.chain !== "solana" &&
        !isNativeTradeToken(snapshot.chain, context.inputTokenAddress) &&
        spender !== ""
    }
  };
}

function normalizeHolderRow(item) {
  return {
    address: String(item.wallet_address ?? item.address ?? ""),
    percent: toNumber(item.percentage ?? item.percent),
    quantity: String(item.balance ?? item.quantity ?? ""),
    tag: String(item.tag ?? item.mark ?? item.wallet_tag ?? "")
  };
}

function buildRiskBlockers(snapshot, topHolders) {
  const blockers = [];

  if (snapshot.honeypot) {
    blockers.push("honeypot flag detected");
  }
  if (snapshot.top10Pct > 60) {
    blockers.push("top10 concentration above 60%");
  }
  if (snapshot.buyTax > 10 || snapshot.sellTax > 10) {
    blockers.push("tax above 10%");
  }
  if (snapshot.contractPosture.includes("敏感")) {
    blockers.push("owner permissions are sensitive");
  }
  if (topHolders.length === 0) {
    blockers.push("holder data is missing");
  }

  return blockers;
}

function normalizeRecentWalletTransaction(item) {
  return {
    txHash: String(item.tx_hash ?? item.hash ?? ""),
    fromSymbol: String(item.from_symbol ?? ""),
    toSymbol: String(item.to_symbol ?? ""),
    fromAmount: String(item.from_amount ?? ""),
    toAmount: String(item.to_amount ?? ""),
    time: String(item.block_unix_time ?? item.time ?? "")
  };
}

function normalizeSignalMatch(item) {
  return {
    id: String(item.id ?? ""),
    tokenAddress: String(item.token ?? item.token_address ?? ""),
    symbol: String(item.symbol ?? ""),
    tag: String(item.tag ?? ""),
    actionCount: toInteger(item.action_count),
    firstSignalPrice: String(item.first_signal_price ?? ""),
    currentMcap: String(item.current_mcap ?? ""),
    maxPriceChange: String(item.max_price_change ?? ""),
    walletAddress: String(item.wallet_address ?? item.wallet ?? ""),
    walletAlias: String(item.wallet_alias ?? ""),
    quoteTokenVolume: String(item.quote_token_volume ?? item.quote_token_amount ?? "")
  };
}

function matchesSignal(item, tokenAddress, symbol) {
  const targetAddress = String(tokenAddress || "").toLowerCase();
  const targetSymbol = String(symbol || "").toUpperCase();
  return (
    String(item.token ?? item.token_address ?? "").toLowerCase() === targetAddress ||
    String(item.symbol ?? "").toUpperCase() === targetSymbol
  );
}

function deriveTxLookupStatus(detail) {
  const record = getRecord(detail);
  const rawValues = [
    record.status,
    record.tx_status,
    record.transaction_status,
    record.confirmed,
    record.success,
    record.finalized
  ].map((value) => String(value).toLowerCase());

  if (rawValues.some((value) => value === "confirmed" || value === "success" || value === "true" || value === "finalized")) {
    return { status: "confirmed", confirmed: true };
  }
  if (rawValues.some((value) => value === "error" || value === "failed" || value === "false")) {
    return { status: "error", confirmed: false };
  }
  if (Object.keys(record).length > 0) {
    return { status: "observed", confirmed: false };
  }
  return { status: "unknown", confirmed: false };
}

async function handleRadarScan(input) {
  const snapshot = await loadRadarSnapshot({
    chains: input.chains,
    resultLimit: input.limit
  });
  const candidates = getList(snapshot.candidates)
    .filter((candidate) => toInteger(candidate.score) >= input.minScore)
    .filter((candidate) => input.verdicts.includes(String(candidate.verdict)))
    .slice(0, input.limit)
    .map((candidate) => ({
      address: String(candidate.address ?? ""),
      pairAddress: String(candidate.pairAddress ?? ""),
      symbol: String(candidate.symbol ?? ""),
      chain: String(candidate.chain ?? ""),
      chainLabel:
        String(candidate.chain ?? "") === "solana"
          ? "Solana"
          : String(candidate.chain ?? "") === "bsc"
            ? "BSC"
            : String(candidate.chain ?? "") === "base"
              ? "Base"
              : "Ethereum",
      narrative: String(candidate.narrative ?? ""),
      priceText: String(candidate.priceText ?? ""),
      volume24hText: String(candidate.volume24hText ?? ""),
      liquidityText: String(candidate.liquidityText ?? ""),
      score: toInteger(candidate.score),
      verdict: String(candidate.verdict ?? "")
    }));

  const byChain = {};
  const byVerdict = {};
  candidates.forEach((candidate) => {
    byChain[candidate.chain] = (byChain[candidate.chain] ?? 0) + 1;
    byVerdict[candidate.verdict] = (byVerdict[candidate.verdict] ?? 0) + 1;
  });

  return successResponse(
    "radar_scan",
    "data",
    input,
    {
      summary: {
        total: candidates.length,
        byChain,
        byVerdict
      },
      candidates
    },
    `Radar 已返回 ${candidates.length} 个候选。`,
    `Radar returned ${candidates.length} candidates.`
  );
}

async function handleTokenDossier(input) {
  const snapshot = await resolveSnapshot(input.chain, input.tokenAddress);

  return successResponse(
    "token_dossier",
    "data",
    input,
    {
      token: {
        address: snapshot.address,
        symbol: snapshot.symbol,
        chain: snapshot.chain,
        chainLabel: snapshot.chainLabel,
        narrative: snapshot.narrative,
        pairAddress: snapshot.pairAddress
      },
      market: {
        priceUsd: toNumber(snapshot.priceUsd),
        priceText: snapshot.priceText,
        marketCapText: snapshot.marketCapText,
        fdvText: snapshot.fdvText,
        liquidityText: snapshot.liquidityText,
        volume24hText: snapshot.volume24hText,
        priceChange24hText: snapshot.priceChange24hText,
        txCount24hText: snapshot.txCount24hText
      },
      risk: {
        verdict: snapshot.verdict,
        riskLevel: snapshot.riskLevel,
        riskScore: snapshot.riskScore,
        top10Pct: snapshot.top10Pct,
        honeypot: Boolean(snapshot.honeypot),
        buyTax: snapshot.buyTax,
        sellTax: snapshot.sellTax,
        contractPosture: snapshot.contractPosture,
        liquidityEventText: snapshot.liquidityEventText
      },
      wallet: {
        signalTag: snapshot.signalTag,
        signalCount: snapshot.signalCount,
        signalWalletAddress: snapshot.signalWalletAddress,
        signalWalletAlias: snapshot.signalWalletAlias,
        walletWinRate: snapshot.walletWinRate,
        tokenProfitText: snapshot.tokenProfitText,
        latestWalletAction: snapshot.latestWalletAction
      },
      tradeContext: normalizeTradeContext(snapshot),
      reasons: getList(snapshot.reasons).map((item) => String(item))
    },
    `已获取 ${snapshot.symbol} 的结构化 dossier。`,
    `Structured dossier loaded for ${snapshot.symbol}.`
  );
}

async function handleRiskGuard(input) {
  const snapshot = await resolveSnapshot(input.chain, input.tokenAddress);
  const riskResponse = await dataGet(`/contracts/${snapshot.address}-${snapshot.chain}`);
  const risk = getRecord(unwrapData(riskResponse));
  const topHolders = getList(risk.token_holders_rank).slice(0, 10).map(normalizeHolderRow);
  const blockers = buildRiskBlockers(snapshot, topHolders);

  return successResponse(
    "risk_guard",
    "data",
    input,
    {
      verdict: snapshot.verdict,
      riskLevel: snapshot.riskLevel,
      riskScore: snapshot.riskScore,
      honeypot: Boolean(snapshot.honeypot),
      buyTax: snapshot.buyTax,
      sellTax: snapshot.sellTax,
      top10Pct: snapshot.top10Pct,
      contractPosture: snapshot.contractPosture,
      liquidityEventText: snapshot.liquidityEventText,
      topHolders,
      blockers
    },
    `已完成 ${snapshot.symbol} 的风险拦截检查。`,
    `Risk guard check completed for ${snapshot.symbol}.`
  );
}

async function handleWalletIntel(input) {
  const snapshot = await resolveSnapshot(input.chain, input.tokenAddress);
  let recentTransactions = [];

  if (snapshot.signalWalletAddress) {
    const walletTxResponse = await dataGet("/address/tx", {
      wallet_address: snapshot.signalWalletAddress,
      chain: snapshot.chain,
      token_address: snapshot.address,
      page_size: 5
    }).catch(() => ({ data: null }));
    const envelope = getRecord(unwrapData(walletTxResponse));
    recentTransactions = getList(envelope.result).slice(0, 5).map(normalizeRecentWalletTransaction);
  }

  return successResponse(
    "wallet_intel",
    "data",
    input,
    {
      signalTag: snapshot.signalTag,
      signalCount: snapshot.signalCount,
      leadWallet: {
        address: snapshot.signalWalletAddress,
        alias: snapshot.signalWalletAlias,
        winRate: snapshot.walletWinRate,
        tokenProfitText: snapshot.tokenProfitText,
        latestAction: snapshot.latestWalletAction
      },
      recentTransactions
    },
    `已提取 ${snapshot.symbol} 的钱包情报。`,
    `Wallet intelligence extracted for ${snapshot.symbol}.`
  );
}

async function handleSmartSignalLookup(input) {
  const snapshot = await resolveSnapshot(input.chain, input.tokenAddress);
  const signalResponse = await dataGet("/signals/public/list", {
    chain: snapshot.chain,
    pageSize: input.pageSize,
    pageNO: input.pageNo
  });
  const signals = getList(unwrapData(signalResponse));
  const matchedSignals = signals.filter((item) => matchesSignal(item, snapshot.address, snapshot.symbol));
  const matches = matchedSignals
    .slice(0, input.maxMatches)
    .map(normalizeSignalMatch);
  const leadAction = matches[0] ?? {};

  return successResponse(
    "smart_signal_lookup",
    "data",
    input,
    {
      tokenAddress: snapshot.address,
      symbol: snapshot.symbol,
      totalMatches: matchedSignals.length,
      matches,
      leadAction
    },
    `已匹配 ${matches.length} 条 ${snapshot.symbol} 的 smart signal。`,
    `Matched ${matches.length} smart signals for ${snapshot.symbol}.`
  );
}

async function handleTradeQuote(input) {
  const bundle = await fetchQuoteBundle(input);

  return successResponse(
    "trade_quote",
    "chain_wallet",
    input,
    {
      quote: bundle.quote,
      hints: bundle.hints,
      tradeContext: normalizeTradeContext(bundle.snapshot)
    },
    `已获取 ${bundle.snapshot.symbol} 的 Chain Wallet quote。`,
    `Chain-wallet quote loaded for ${bundle.snapshot.symbol}.`
  );
}

async function handleTradeBuildUnsigned(input) {
  const bundle = await fetchQuoteBundle(input);
  const slippageBps = input.slippageBps ?? bundle.hints.slippageBps ?? 500;
  const autoSlippage = input.slippageBps === undefined && bundle.hints.slippageBps > 0;
  const rawInputAmount = toRawUnits(bundle.quote.inputAmount, bundle.context.inputDecimals);

  const response =
    bundle.snapshot.chain === "solana"
      ? await tradePost("/v1/thirdParty/chainWallet/createSolanaTx", {
          creatorAddress: input.walletAddress,
          inAmount: rawInputAmount,
          inTokenAddress: bundle.context.inputTokenAddress,
          outTokenAddress: bundle.context.outputTokenAddress,
          swapType: input.side,
          slippage: String(slippageBps),
          fee: selectGasTip(bundle.hints, input.gasTier, input.useMev),
          useMev: input.useMev,
          autoSlippage
        })
      : await tradePost("/v1/thirdParty/chainWallet/createEvmTx", {
          chain: bundle.snapshot.chain,
          creatorAddress: input.walletAddress,
          inAmount: rawInputAmount,
          inTokenAddress: bundle.context.inputTokenAddress,
          outTokenAddress: bundle.context.outputTokenAddress,
          swapType: input.side,
          slippage: String(slippageBps),
          autoSlippage
        });

  const payload = getRecord(unwrapData(response));
  const txContent = payload.txContent ?? payload.txContext ?? null;
  const txPreviewSize =
    typeof txContent === "string"
      ? txContent.length
      : isObject(txContent)
        ? Object.keys(txContent).length
        : 0;

  return successResponse(
    "trade_build_unsigned",
    "chain_wallet",
    input,
    {
      preflight: {
        approvalRequired: bundle.quote.requiresApproval,
        spender: bundle.quote.spender,
        quote: bundle.quote,
        hints: bundle.hints
      },
      build: {
        side: input.side,
        requestTxId: String(payload.requestTxId ?? ""),
        creatorAddress: input.walletAddress,
        estimateAmount: fromRawUnits(
          payload.estimateOut,
          bundle.context.outputDecimals
        ),
        minReturnAmount: fromRawUnits(
          payload.minReturn,
          bundle.context.outputDecimals
        ),
        appliedSlippage: toNumber(payload.slippage),
        txTarget:
          typeof txContent === "string"
            ? "solana unsigned tx"
            : String(getRecord(txContent).to ?? ""),
        txValue:
          typeof txContent === "string"
            ? String(payload.inAmount ?? "")
            : String(getRecord(txContent).value ?? ""),
        gasLimit: String(payload.gasLimit ?? ""),
        priorityFee: String(payload.priorityFee ?? ""),
        bundleTip: String(payload.bundleTip ?? ""),
        recentBlockhash: String(payload.recentBlockhash ?? ""),
        amms: getList(payload.amms).map((item) => String(item)),
        txPreviewSize,
        txContent,
        txFormat:
          typeof txContent === "string"
            ? "solana_base64"
            : isObject(txContent)
              ? "evm_object"
              : "unknown"
      },
      tradeContext: normalizeTradeContext(bundle.snapshot)
    },
    `已生成 ${bundle.snapshot.symbol} 的未签名交易。`,
    `Unsigned transaction built for ${bundle.snapshot.symbol}.`
  );
}

async function handleTradeSendSigned(input) {
  const response =
    toApiChain(input.chain) === "solana"
      ? await tradePost("/v1/thirdParty/chainWallet/sendSignedSolanaTx", {
          requestTxId: input.requestTxId,
          signedTx: input.signedTx,
          useMev: input.useMev
        })
      : await tradePost("/v1/thirdParty/chainWallet/sendSignedEvmTx", {
          chain: toApiChain(input.chain),
          requestTxId: input.requestTxId,
          signedTx: input.signedTx,
          useMev: input.useMev
        });

  const payload = getRecord(unwrapData(response));

  return successResponse(
    "trade_send_signed",
    "chain_wallet",
    input,
    {
      requestTxId: input.requestTxId,
      txHash: String(payload.hash ?? ""),
      bundleId: String(payload.bundleId ?? ""),
      errorMessage: String(payload.err ?? ""),
      useMev: Boolean(input.useMev)
    },
    "已提交签名交易。",
    "Signed transaction submitted."
  );
}

async function handleTradeStatus(input) {
  const response = await dataGet("/txs/detail", {
    chain: toApiChain(input.chain),
    account_address: input.accountAddress,
    tx_hash: input.txHash
  });
  const detail = getRecord(unwrapData(response));
  const lookup = deriveTxLookupStatus(detail);

  return successResponse(
    "trade_status",
    "chain_wallet",
    input,
    {
      requestTxId: String(input.requestTxId ?? ""),
      txHash: input.txHash,
      accountAddress: input.accountAddress,
      lookupType: "tx_hash_detail",
      status: lookup.status,
      confirmed: lookup.confirmed,
      detail
    },
    "已查询交易状态。",
    "Transaction status lookup completed."
  );
}

async function handleDelegateWalletList(input) {
  const response = await delegateGet("/v1/thirdParty/user/getUserByAssetsId", {
    assetsIds: getList(input.assetsIds).join(",")
  });
  const wallets = getList(unwrapData(response)).map((item) => normalizeDelegateWallet(getRecord(item)));

  return successResponse(
    "delegate_wallet_list",
    "delegate_wallet",
    input,
    {
      wallets
    },
    `已返回 ${wallets.length} 个 Delegate Wallet。`,
    `Returned ${wallets.length} delegate wallets.`
  );
}

async function handleDelegateWalletCreate(input) {
  const response = await delegatePost("/v1/thirdParty/user/generateWallet", {
    assetsName: input.walletName.trim(),
    returnMnemonic: false
  });
  const rows = getList(unwrapData(response));
  const wallet = rows[0] ? normalizeDelegateWallet(getRecord(rows[0])) : null;

  return successResponse(
    "delegate_wallet_create",
    "delegate_wallet",
    input,
    {
      wallet
    },
    wallet ? "已创建新的 Delegate Wallet。" : "未返回新的 Delegate Wallet。",
    wallet ? "Delegate wallet created." : "Delegate wallet was not returned.",
    {
      mode: wallet ? "live" : "fallback"
    }
  );
}

async function submitDelegateOrder(input, orderType) {
  const snapshot = await resolveSnapshot(input.chain, input.tokenAddress);
  const context = buildTradeSideContext(snapshot, input.side);
  const rawInputAmount = toRawUnits(input.amount, context.inputDecimals);
  const payload = {
    chain: snapshot.chain,
    assetsId: input.assetsId,
    inTokenAddress: context.inputTokenAddress,
    outTokenAddress: context.outputTokenAddress,
    inAmount: rawInputAmount,
    swapType: input.side,
    slippage: String(input.slippageBps ?? 500),
    useMev: input.useMev,
    autoSlippage: input.autoSlippage,
    autoGas: input.autoGas
  };

  if (snapshot.chain === "solana") {
    const hints = await getChainWalletHints(snapshot, input.useMev);
    payload.gas = selectGasTip(hints, input.autoGas, input.useMev);
  } else {
    payload.extraGas = "0";
  }

  if (orderType === "limit") {
    payload.limitPrice = String(input.limitPrice);
    payload.expireTime = String(input.expireTime ?? 604800);
  }

  const response = await delegatePost(
    `/v1/thirdParty/tx/${orderType === "market" ? "sendSwapOrder" : "sendLimitOrder"}`,
    payload
  );
  const record = getRecord(unwrapData(response));

  return {
    snapshot,
    orderType,
    orderId: String(record.id ?? ""),
    approvalRequired: snapshot.chain !== "solana" && input.side === "sell"
  };
}

async function handleDelegateMarketOrder(input) {
  const result = await submitDelegateOrder(input, "market");

  return successResponse(
    "delegate_market_order",
    "delegate_wallet",
    input,
    {
      orderType: result.orderType,
      orderId: result.orderId,
      approvalRequired: result.approvalRequired,
      tradeContext: normalizeTradeContext(result.snapshot)
    },
    "已提交 Delegate Market Order。",
    "Delegate market order submitted."
  );
}

async function handleDelegateLimitOrder(input) {
  const result = await submitDelegateOrder(input, "limit");

  return successResponse(
    "delegate_limit_order",
    "delegate_wallet",
    input,
    {
      orderType: result.orderType,
      orderId: result.orderId,
      limitPrice: toNumber(input.limitPrice),
      expireTime: toInteger(input.expireTime),
      approvalRequired: result.approvalRequired,
      tradeContext: normalizeTradeContext(result.snapshot)
    },
    "已提交 Delegate Limit Order。",
    "Delegate limit order submitted."
  );
}

async function handleDelegateOrderStatus(input) {
  const query =
    input.orderType === "market"
      ? {
          path: "/v1/thirdParty/tx/getSwapOrder",
          params: {
            chain: toApiChain(input.chain),
            ids: input.orderId
          }
        }
      : {
          path: "/v1/thirdParty/tx/getLimitOrder",
          params: {
            chain: toApiChain(input.chain),
            assetsId: input.assetsId,
            pageSize: 20,
            pageNo: 0
          }
        };

  const response = await delegateGet(query.path, query.params);
  const rows = getList(unwrapData(response));
  const record =
    input.orderType === "market"
      ? getRecord(rows[0])
      : getRecord(rows.find((item) => String(item.id ?? "") === input.orderId));

  return successResponse(
    "delegate_order_status",
    "delegate_wallet",
    input,
    {
      orderType: input.orderType,
      orderId: String(record.id ?? input.orderId),
      status: String(record.status ?? ""),
      chain: String(record.chain ?? toApiChain(input.chain)),
      swapType:
        String(record.swapType ?? "") === "buy" || String(record.swapType ?? "") === "sell"
          ? String(record.swapType)
          : "",
      txHash: String(record.txHash ?? ""),
      errorMessage: String(record.errorMessage ?? ""),
      txPriceUsd: String(record.txPriceUsd ?? ""),
      inAmount: String(record.inAmount ?? ""),
      outAmount: String(record.outAmount ?? ""),
      limitPrice: String(record.limitPrice ?? ""),
      createPrice: String(record.createPrice ?? ""),
      expireAt: String(record.expireAt ?? ""),
      trailingPriceChange: String(record.trailingPriceChange ?? "")
    },
    "已刷新 Delegate Order 状态。",
    "Delegate order status refreshed."
  );
}

const handlers = {
  radar_scan: handleRadarScan,
  token_dossier: handleTokenDossier,
  risk_guard: handleRiskGuard,
  wallet_intel: handleWalletIntel,
  smart_signal_lookup: handleSmartSignalLookup,
  trade_quote: handleTradeQuote,
  trade_build_unsigned: handleTradeBuildUnsigned,
  trade_send_signed: handleTradeSendSigned,
  trade_status: handleTradeStatus,
  delegate_wallet_list: handleDelegateWalletList,
  delegate_wallet_create: handleDelegateWalletCreate,
  delegate_market_order: handleDelegateMarketOrder,
  delegate_limit_order: handleDelegateLimitOrder,
  delegate_order_status: handleDelegateOrderStatus
};

function applyDefaults(schema, value) {
  if (schema.anyOf) {
    const objectOption = schema.anyOf.find((option) => option.type === "object");
    if (objectOption) {
      return applyDefaults(objectOption, value);
    }
  }

  if (value === undefined && schema.default !== undefined) {
    return schema.default;
  }

  if (schema.type === "object") {
    const source = isObject(value) ? value : {};
    const result = {};
    const properties = schema.properties ?? {};
    Object.entries(properties).forEach(([key, propertySchema]) => {
      const normalized = applyDefaults(propertySchema, source[key]);
      if (normalized !== undefined) {
        result[key] = normalized;
      }
    });
    return result;
  }

  if (schema.type === "array") {
    const source = Array.isArray(value) ? value : schema.default ?? [];
    return source.map((item) => applyDefaults(schema.items, item));
  }

  return value;
}

function validateSchema(schema, value, path = "input") {
  const errors = [];

  if (schema.anyOf) {
    const matched = schema.anyOf.some((option) => validateSchema(option, value, path).length === 0);
    if (!matched) {
      errors.push(`${path} does not match any allowed schema`);
    }
    return errors;
  }

  if (value === undefined || value === null) {
    return errors;
  }

  if (schema.type === "object") {
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return errors;
    }
    const properties = schema.properties ?? {};
    const required = schema.required ?? [];
    required.forEach((key) => {
      if (value[key] === undefined) {
        errors.push(`${path}.${key} is required`);
      }
    });
    Object.entries(properties).forEach(([key, propertySchema]) => {
      errors.push(...validateSchema(propertySchema, value[key], `${path}.${key}`));
    });
    return errors;
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return errors;
    }
    value.forEach((item, index) => {
      errors.push(...validateSchema(schema.items, item, `${path}[${index}]`));
    });
    return errors;
  }

  if (schema.type === "string") {
    if (typeof value !== "string") {
      errors.push(`${path} must be a string`);
      return errors;
    }
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${path} must be one of ${schema.enum.join(", ")}`);
    }
    return errors;
  }

  if (schema.type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(`${path} must be a number`);
      return errors;
    }
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path} must be >= ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path} must be <= ${schema.maximum}`);
    }
    return errors;
  }

  if (schema.type === "integer") {
    if (!Number.isInteger(value)) {
      errors.push(`${path} must be an integer`);
      return errors;
    }
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path} must be >= ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path} must be <= ${schema.maximum}`);
    }
    return errors;
  }

  if (schema.type === "boolean") {
    if (typeof value !== "boolean") {
      errors.push(`${path} must be a boolean`);
    }
    return errors;
  }

  return errors;
}

function normalizeInput(skillName, rawInput) {
  const definition = getSkillDefinition(skillName);
  const normalized = applyDefaults(definition.inputSchema, rawInput);
  const errors = validateSchema(definition.inputSchema, normalized);
  return { normalized, errors };
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

async function loadInputPayload(args) {
  const inputJson = readFlag(args, "--input-json");
  if (inputJson) {
    return parseJsonInput(inputJson);
  }

  const inputFile = readFlag(args, "--input-file");
  if (inputFile) {
    return parseJsonInput(fs.readFileSync(inputFile, "utf8"));
  }

  if (!process.stdin.isTTY) {
    const text = await readStdin();
    return parseJsonInput(text);
  }

  return {};
}

async function main() {
  const args = process.argv.slice(2);
  const command = String(args[0] ?? "help").toLowerCase();

  if (command === "help" || command === "--help" || command === "-h") {
    printJson({
      package: skillRegistry.package,
      commands: {
        list: "node scripts/ave_sentinel_skill.mjs list",
        schema: "node scripts/ave_sentinel_skill.mjs schema <skill_name>",
        call: "node scripts/ave_sentinel_skill.mjs call <skill_name> --input-json '{\"chain\":\"solana\",\"tokenAddress\":\"...\"}'"
      }
    });
    return;
  }

  if (command === "list") {
    printJson({
      package: skillRegistry.package,
      skills: listSkillDefinitions()
    });
    return;
  }

  if (command === "schema") {
    const skillName = String(args[1] ?? "").trim();
    const definition = getSkillDefinition(skillName);

    if (!definition) {
      printJson({
        error: createError(
          "unknown_skill",
          `未知 skill：${skillName || "(empty)"}`,
          `Unknown skill: ${skillName || "(empty)"}`
        )
      });
      process.exitCode = 1;
      return;
    }

    printJson({
      package: skillRegistry.package,
      skill: skillName,
      group: definition.group,
      summary: definition.summary,
      inputSchema: definition.inputSchema,
      responseSchema: definition.responseSchema
    });
    return;
  }

  if (command === "call") {
    const skillName = String(args[1] ?? "").trim();
    const definition = getSkillDefinition(skillName);
    const handler = handlers[skillName];

    if (!definition || !handler) {
      printJson({
        ok: false,
        error: createError(
          "unknown_skill",
          `未知 skill：${skillName || "(empty)"}`,
          `Unknown skill: ${skillName || "(empty)"}`
        ),
        meta: buildMeta()
      });
      process.exitCode = 1;
      return;
    }

    let rawInput = {};

    try {
      rawInput = await loadInputPayload(args);
    } catch (error) {
      printJson(
        failureResponse(
          skillName,
          definition.group,
          {},
          "invalid_json",
          "输入 JSON 解析失败。",
          "Failed to parse input JSON.",
          error instanceof Error ? error.message : String(error)
        )
      );
      process.exitCode = 1;
      return;
    }

    const { normalized, errors } = normalizeInput(skillName, rawInput);
    if (errors.length > 0) {
      printJson(
        failureResponse(
          skillName,
          definition.group,
          normalized,
          "invalid_input",
          "输入不符合 schema。",
          "Input does not match the schema.",
          errors.join("; ")
        )
      );
      process.exitCode = 1;
      return;
    }

    try {
      const response = await handler(normalized);
      printJson(response);
      return;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const code =
        detail.includes("AVE_API_KEY") || detail.includes("AVE_API_SECRET")
          ? "missing_credentials"
          : "skill_execution_failed";

      printJson(
        failureResponse(
          skillName,
          definition.group,
          normalized,
          code,
          "Skill 调用失败。",
          "Skill execution failed.",
          detail
        )
      );
      process.exitCode = 1;
      return;
    }
  }

  printJson({
    error: createError("unknown_command", `未知命令：${command}`, `Unknown command: ${command}`),
    meta: buildMeta()
  });
  process.exitCode = 1;
}

main().catch((error) => {
  printJson({
    error: createError(
      "unexpected_error",
      "发生未处理异常。",
      "Unhandled exception occurred.",
      error instanceof Error ? error.message : String(error)
    ),
    meta: buildMeta()
  });
  process.exitCode = 1;
});
