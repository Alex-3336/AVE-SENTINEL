import fs from "node:fs";
import path from "node:path";
import {
  loadDelegateWalletsCore,
  queryDelegateApprovalCore,
  queryDelegateOrderStatusCore,
  requestAmountOut
} from "../src/lib/trade_shared.mjs";

const DATA_BASE_URL = "https://data.ave-api.xyz/v2/";
const RADAR_SOURCE_PAGE_SIZE = 20;
const RADAR_RESULT_LIMIT = 40;
const RADAR_MIN_PER_CHAIN = 8;
const RADAR_SIGNAL_PAGE_SIZE = 80;
const RADAR_RISK_CONCURRENCY = 6;
const radarChains = [
  { api: "solana", label: "Solana" },
  { api: "bsc", label: "BSC" },
  { api: "base", label: "Base" },
  { api: "eth", label: "Ethereum" }
];

function readDotEnv() {
  const envPath = path.resolve(".env");
  const values = {};

  if (!fs.existsSync(envPath)) {
    return values;
  }

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    values[key] = value;
  }

  return values;
}

const dotEnv = readDotEnv();

function envValue(name, fallback = "") {
  return process.env[name] ?? dotEnv[name] ?? fallback;
}

const apiKey =
  envValue("AVE_API_KEY") ||
  envValue("VITE_AVE_API_KEY");
const proxyBaseUrl = envValue("AVE_PROXY_BASE_URL", "http://127.0.0.1:8787/api/ave");
const proxyTradeBaseUrl = envValue("AVE_TRADE_PROXY_BASE_URL", `${proxyBaseUrl}/trade`);
const proxyDelegateBaseUrl = envValue(
  "AVE_DELEGATE_PROXY_BASE_URL",
  `${proxyBaseUrl}/delegate`
);

function assertApiKey() {
  if (!apiKey) {
    throw new Error("缺少 AVE_API_KEY 或 VITE_AVE_API_KEY");
  }
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function getRecord(value) {
  return value && typeof value === "object" ? value : {};
}

function getList(value) {
  return Array.isArray(value) ? value : [];
}

function unwrapData(payload) {
  return payload?.data ?? payload;
}

function formatUsd(value) {
  const number = toNumber(value);

  if (!Number.isFinite(number) || number <= 0) return "--";
  if (number >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(2)}B`;
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`;
  if (number >= 1_000) return `$${(number / 1_000).toFixed(1)}K`;
  if (number >= 1) return `$${number.toFixed(3)}`;
  return `$${number.toFixed(6)}`;
}

function formatPercent(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return "--";
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

function formatCount(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number) || number <= 0) return "--";
  return Math.round(number).toLocaleString("en-US");
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
  const normalized = `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;

  return Number(normalized);
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

function shortAddress(address) {
  if (!address) return "--";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function toApiChain(input) {
  const value = String(input || "").toLowerCase();
  if (value === "bsc" || value === "bnb") return "bsc";
  if (value === "base") return "base";
  if (value === "eth" || value === "ethereum") return "eth";
  return "solana";
}

function toChainLabel(chain) {
  if (chain === "bsc") return "BSC";
  if (chain === "base") return "Base";
  if (chain === "eth") return "Ethereum";
  return "Solana";
}

function asPercentNumber(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return 0;
  return number <= 1 ? number * 100 : number;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLog(value, maxLog) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return clamp(Math.log10(value + 1) / maxLog, 0, 1);
}

function normalizeMomentum(value) {
  if (!Number.isFinite(value)) return 0.35;
  return clamp((value + 20) / 80, 0, 1);
}

function topHolderPct(holders) {
  return holders
    .slice(0, 10)
    .reduce((sum, item) => sum + asPercentNumber(item.percentage ?? item.percent), 0);
}

function hasRiskFlag(value) {
  return value === true || String(value).toLowerCase() === "true" || toNumber(value) > 0;
}

function deriveRadarRiskScore(item, risk) {
  const explicitScore = toNumber(risk.risk_score ?? item.risk_score);

  if (Number.isFinite(explicitScore) && explicitScore > 0) {
    return clamp(explicitScore, 1, 100);
  }

  const riskLevel = toNumber(risk.risk_level ?? risk.ave_risk_level ?? item.ave_risk_level);
  const baseScore =
    riskLevel >= 2 ? 35 : riskLevel === 1 ? 58 : riskLevel === 0 ? 78 : 55;
  const penalty =
    (hasRiskFlag(risk.is_honeypot ?? item.is_honeypot) ? 45 : 0) +
    (hasRiskFlag(risk.is_in_blacklist ?? item.is_in_blacklist) ? 35 : 0) +
    (hasRiskFlag(risk.has_black_method ?? item.has_black_method) ? 14 : 0) +
    (hasRiskFlag(risk.is_lp_not_locked ?? item.is_lp_not_locked) ? 12 : 0) +
    (hasRiskFlag(risk.has_mint_method ?? item.has_mint_method) ? 8 : 0) +
    (hasRiskFlag(risk.has_not_renounced ?? item.has_not_renounced) ? 7 : 0) +
    (hasRiskFlag(risk.has_not_open_source ?? item.has_not_open_source) ? 4 : 0) +
    (hasRiskFlag(risk.has_not_audited ?? item.has_not_audited) ? 3 : 0);

  return clamp(baseScore - penalty, 1, 100);
}

function deriveVerdict(riskScore, liquidity) {
  if (riskScore > 0 && riskScore < 45) return "回避";
  if (liquidity < 200_000 || riskScore < 65) return "观望";
  return "可做";
}

function deriveRadarVerdict(input) {
  if (
    input.honeypot ||
    (input.riskScore > 0 && input.riskScore < 45) ||
    (input.hasHolderData && input.top10Pct > 60) ||
    (input.liquidity < 30_000 && input.score < 68)
  ) {
    return "回避";
  }

  if (
    input.score >= 66 &&
    input.riskScore >= 65 &&
    input.liquidity >= 150_000
  ) {
    return "可做";
  }

  return "观望";
}

function rankRadarCandidate(item, risk, holders, signal, leadAction) {
  const riskScore = deriveRadarRiskScore(item, risk);
  const liquidity = toNumber(item.main_pair_tvl ?? item.tvl);
  const volume24h = toNumber(item.tx_volume_u_24h ?? item.token_tx_volume_usd_24h);
  const priceChange24h = toNumber(item.price_change_24h ?? item.token_price_change_24h);
  const top10Pct = topHolderPct(holders);
  const hasHolderData = holders.length > 0;
  const signalVolume = toNumber(leadAction?.quote_token_volume ?? leadAction?.quote_token_amount);
  const actionCount = toNumber(signal?.action_count);
  const signalScore = signal
    ? clamp(0.62 + Math.min(actionCount, 20) * 0.012 + normalizeLog(signalVolume, 6) * 0.14, 0, 1)
    : 0.32;
  const holderScore = hasHolderData ? clamp((60 - top10Pct) / 50, 0, 1) : 0.55;
  const score = Math.round(
    100 *
      (
        (riskScore / 100) * 0.28 +
        normalizeLog(liquidity, 7) * 0.18 +
        normalizeLog(volume24h, 8) * 0.18 +
        normalizeMomentum(priceChange24h) * 0.12 +
        holderScore * 0.14 +
        signalScore * 0.10
      )
  );
  const honeypot = hasRiskFlag(risk.is_honeypot ?? item.is_honeypot);
  const taxPenalty = toNumber(risk.buy_tax) > 10 || toNumber(risk.sell_tax) > 10 ? 8 : 0;
  const permissionPenalty =
    toNumber(risk.can_take_back_ownership) > 0 || toNumber(risk.owner_change_balance) > 0
      ? 6
      : 0;
  const finalScore = clamp(score - (honeypot ? 45 : 0) - taxPenalty - permissionPenalty, 1, 99);

  return {
    score: finalScore,
    verdict: deriveRadarVerdict({
      score: finalScore,
      riskScore,
      liquidity,
      top10Pct,
      hasHolderData,
      honeypot
    })
  };
}

function deriveNarrative(item, chainLabel) {
  const volume = toNumber(item.tx_volume_u_24h ?? item.token_tx_volume_usd_24h);
  const priceChange = toNumber(item.price_change_24h ?? item.token_price_change_24h);

  if (volume > 5_000_000 && priceChange > 20) {
    return chainLabel === "Solana" ? "social breakout / meme" : "momentum / meme";
  }

  if (priceChange > 10) {
    return "early strength";
  }

  return "hot candidate";
}

async function apiGet(pathname, params = {}) {
  assertApiKey();
  const url = new URL(pathname.replace(/^\//, ""), DATA_BASE_URL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "X-API-KEY": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`AVE data API ${response.status}`);
  }

  return response.json();
}

async function proxyJsonRequest(url, method, body) {
  assertApiKey();

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        "X-API-KEY": apiKey
      },
      body: method === "POST" && body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    throw new Error(
      `本地 proxy 不可用，请先运行 npm run proxy：${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    const raw = await response.text();
    let detail = "";

    try {
      const payload = JSON.parse(raw);
      detail = payload.detail || payload.msg || payload.message || "";
    } catch {
      detail = raw.trim();
    }

    throw new Error(detail ? `AVE proxy ${response.status}: ${detail}` : `AVE proxy ${response.status}`);
  }

  return response.json();
}

async function mapWithConcurrency(items, limit, worker) {
  const results = [];
  let index = 0;

  async function run() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run())
  );

  return results;
}

async function loadTrendingItems(chain, targetSize = RADAR_SOURCE_PAGE_SIZE) {
  const plans = [
    { pageSize: 10, pages: Math.ceil(targetSize / 10) },
    { pageSize: 4, pages: Math.ceil(targetSize / 4) }
  ];
  let lastError = null;

  for (const plan of plans) {
    const items = [];
    let planFailed = false;

    for (let page = 1; page <= plan.pages; page += 1) {
      try {
        const response = await apiGet("/tokens/trending", {
          chain,
          current_page: page,
          page_size: plan.pageSize
        });
        const envelope = getRecord(unwrapData(response));
        const pageItems = getList(envelope.tokens);
        items.push(...pageItems);

        if (pageItems.length < plan.pageSize) {
          break;
        }
      } catch (error) {
        lastError = error;
        planFailed = true;
        break;
      }
    }

    if (!planFailed && items.length > 0) {
      return items.slice(0, targetSize);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Trending request failed");
}

function findTokenSignal(signals, address, symbol) {
  return findRawTokenSignal(signals, address, symbol);
}

function findRawTokenSignal(signals, address, symbol) {
  const targetAddress = String(address).toLowerCase();
  const targetSymbol = String(symbol).toUpperCase();
  const matched =
    signals.find((item) => String(item.token ?? "").toLowerCase() === targetAddress) ??
    signals.find((item) => String(item.symbol ?? "").toUpperCase() === targetSymbol) ??
    null;

  if (!matched) {
    return { signal: null, leadAction: null };
  }

  const actions = getList(matched.actions).sort(
    (left, right) =>
      toNumber(right.quote_token_volume ?? right.quote_token_amount) -
      toNumber(left.quote_token_volume ?? left.quote_token_amount)
  );

  return {
    signal: matched,
    leadAction: actions[0] ?? null
  };
}

function getWalletAddress(payload) {
  if (!payload) return "";
  return (
    payload.address ??
    payload.wallet_address ??
    payload.wallet ??
    ""
  );
}

function resolvePair(tokenEnvelope, rawPair) {
  const tokenPairs = getList(tokenEnvelope.pairs);
  const pairRecord = getRecord(rawPair);
  return Object.keys(pairRecord).length > 0 ? pairRecord : tokenPairs[0] ?? null;
}

function buildTradeContext(chain, address, tokenDetail, pair) {
  const token0Address = String(pair?.token0_address ?? "");
  const token1Address = String(pair?.token1_address ?? "");
  const candidateIsToken1 = token1Address && token1Address.toLowerCase() === address.toLowerCase();
  const baseTokenAddress = candidateIsToken1 ? token0Address : token1Address;
  const baseTokenDecimals = toNumber(
    candidateIsToken1 ? pair?.token0_decimal : pair?.token1_decimal
  ) || (chain === "solana" ? 9 : 18);
  const tokenDecimals = toNumber(
    candidateIsToken1 ? pair?.token1_decimal : pair?.token0_decimal ?? tokenDetail.decimal
  ) || 6;
  const baseTokenPriceUsd = toNumber(
    candidateIsToken1 ? pair?.token0_price_usd : pair?.token1_price_usd
  );
  const baseSymbol = String(
    (candidateIsToken1 ? pair?.token0_symbol : pair?.token1_symbol) ??
    (chain === "solana" ? "SOL" : chain === "bsc" ? "BNB" : "ETH")
  );

  return {
    priceUsd: toNumber(tokenDetail.current_price_usd),
    liquidityUsd: toNumber(pair?.tvl ?? tokenDetail.main_pair_tvl ?? tokenDetail.tvl),
    priceChange24h: toNumber(tokenDetail.price_change_24h ?? tokenDetail.token_price_change_24h),
    txCount24h: toNumber(tokenDetail.tx_count_24h ?? tokenDetail.token_tx_count_24h),
    baseTokenAddress,
    baseTokenDecimals,
    baseTokenPriceUsd,
    baseSymbol,
    tokenDecimals,
    route: String(pair?.amm ?? tokenDetail.issue_platform ?? "main pair")
  };
}

function resolveQuoteInputToken(chain, trade) {
  if (chain === "solana") {
    if (trade.baseSymbol.toUpperCase() === "SOL" || trade.baseTokenAddress === "So11111111111111111111111111111111111111112") {
      return "sol";
    }
  }

  if (chain === "bsc" && trade.baseSymbol.toUpperCase().includes("BNB")) {
    return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  }

  if (chain !== "solana" && trade.baseSymbol.toUpperCase().includes("ETH")) {
    return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  }

  return trade.baseTokenAddress;
}

function buildSnapshot(data) {
  const {
    address,
    chain,
    tokenDetail,
    pair,
    risk,
    holders,
    signal,
    leadAction,
    walletInfo,
    tokenPnl,
    walletTxs,
    liqTxs
  } = data;

  const chainLabel = toChainLabel(chain);
  const symbol = String(tokenDetail.symbol ?? "UNKNOWN");
  const riskScore = toNumber(risk.risk_score) || 55;
  const liquidityUsd = toNumber(pair?.tvl ?? tokenDetail.main_pair_tvl ?? tokenDetail.tvl);
  const top10Pct = holders
    .slice(0, 10)
    .reduce((sum, item) => sum + asPercentNumber(item.percentage ?? item.percent), 0);
  const riskLevelRaw = toNumber(risk.risk_level);
  const riskLevel =
    riskLevelRaw >= 2 ? "HIGH" : riskLevelRaw === 1 ? "MEDIUM" : riskLevelRaw === 0 ? "LOW" : String(risk.risk_level ?? "UNKNOWN");
  const latestLiquidityTx = liqTxs[0];
  const signalWalletAddress = getWalletAddress(leadAction);
  const latestWalletTx = walletTxs[0];
  const latestWalletAction =
    latestWalletTx
      ? `${String(latestWalletTx.from_symbol ?? "--")} -> ${String(latestWalletTx.to_symbol ?? "--")}`
      : "暂无 token 级交易";
  const tokenProfit = toNumber(tokenPnl.profit_realized);
  const walletWinRate = toNumber(walletInfo.total_win_ratio);
  const verdict = deriveVerdict(riskScore, liquidityUsd);
  const trade = buildTradeContext(chain, address, tokenDetail, pair);

  return {
    address,
    chain,
    chainLabel,
    symbol,
    narrative: deriveNarrative(tokenDetail, chainLabel),
    priceUsd: toNumber(tokenDetail.current_price_usd),
    priceText: formatUsd(tokenDetail.current_price_usd),
    volume24hText: formatUsd(tokenDetail.tx_volume_u_24h ?? tokenDetail.token_tx_volume_usd_24h),
    liquidityText: formatUsd(liquidityUsd),
    marketCapText: formatUsd(tokenDetail.market_cap),
    fdvText: formatUsd(tokenDetail.fdv),
    priceChange24hText: formatPercent(tokenDetail.price_change_24h ?? tokenDetail.token_price_change_24h),
    txCount24hText: formatCount(tokenDetail.tx_count_24h ?? tokenDetail.token_tx_count_24h),
    riskLevel,
    riskScore,
    top10Pct,
    honeypot: toNumber(risk.is_honeypot) > 0,
    buyTax: toNumber(risk.buy_tax),
    sellTax: toNumber(risk.sell_tax),
    liquidityEventText: latestLiquidityTx
      ? `${String(latestLiquidityTx.type)} / ${formatUsd(latestLiquidityTx.amount_usd)}`
      : "暂无近期事件",
    contractPosture:
      toNumber(risk.can_take_back_ownership) > 0 || toNumber(risk.owner_change_balance) > 0
        ? "权限偏敏感"
        : "权限相对稳定",
    signalTag: String(signal?.tag ?? "--"),
    signalCount: toNumber(signal?.action_count) || 0,
    signalWalletAddress,
    signalWalletAlias: String(leadAction?.wallet_alias ?? "").trim(),
    walletWinRate,
    tokenProfitText:
      Number.isFinite(tokenProfit) && tokenProfit !== 0 ? formatUsd(tokenProfit) : "接近持平 / 未实现",
    latestWalletAction,
    pairAddress: String(pair?.pair_address ?? pair?.address ?? ""),
    verdict,
    score: Math.max(
      25,
      Math.min(
        95,
        Math.round(
          (toNumber(tokenDetail.price_change_24h ?? tokenDetail.token_price_change_24h) + 100) * 0.15 +
            liquidityUsd / 120_000 +
            riskScore * 0.45
        )
      )
    ),
    reasons: buildReasons({
      riskScore,
      liquidityUsd,
      top10Pct,
      honeypot: toNumber(risk.is_honeypot) > 0,
      signalWalletAddress,
      walletWinRate,
      tokenProfit
    }),
    trade
  };
}

function buildReasons(input) {
  const reasons = [];

  if (input.honeypot) {
    reasons.push("存在 honeypot 标记，应直接回避。");
  }

  if (input.liquidityUsd >= 200_000) {
    reasons.push(`主 pair 流动性 ${formatUsd(input.liquidityUsd)}，具备基本承接能力。`);
  } else {
    reasons.push(`主 pair 流动性只有 ${formatUsd(input.liquidityUsd)}，偏薄。`);
  }

  if (input.top10Pct > 40) {
    reasons.push(`Top10 持仓 ${input.top10Pct.toFixed(2)}%，集中度偏高。`);
  } else {
    reasons.push(`Top10 持仓 ${input.top10Pct.toFixed(2)}%，集中度可接受。`);
  }

  if (input.signalWalletAddress) {
    reasons.push(`存在信号钱包参与，钱包胜率 ${input.walletWinRate > 0 ? `${input.walletWinRate.toFixed(2)}%` : "待确认"}。`);
  } else {
    reasons.push("当前没有抓到明确的 token 级信号钱包。");
  }

  if (Number.isFinite(input.tokenProfit) && input.tokenProfit > 0) {
    reasons.push(`信号钱包在当前 token 上已有正收益，说明背书更可信。`);
  }

  if (input.riskScore >= 65 && input.liquidityUsd >= 200_000 && !input.honeypot) {
    reasons.push("可以进入试算池，但仍应控仓。");
  } else if (!input.honeypot) {
    reasons.push("保留观察，不建议直接追价。");
  }

  return reasons;
}

export async function loadRadarSnapshot(options = {}) {
  const pageSize = options.pageSize ?? RADAR_SOURCE_PAGE_SIZE;
  const resultLimit = options.resultLimit ?? RADAR_RESULT_LIMIT;
  const chains = options.chains ?? radarChains.map((chain) => chain.api);

  const responses = await Promise.all(
    chains.map((chain) => loadTrendingItems(chain, pageSize).catch(() => []))
  );
  const signalResponses = await Promise.all(
    chains.map((chain) =>
      apiGet("/signals/public/list", {
        chain,
        pageSize: RADAR_SIGNAL_PAGE_SIZE,
        pageNO: 1
      }).catch(() => ({ data: [] }))
    )
  );

  const sourceRows = responses.flatMap((payload, index) => {
    const chain = chains[index];
    const signals = getList(unwrapData(signalResponses[index]));

    return payload.map((item) => ({ item, chain, signals }));
  });

  if (sourceRows.length === 0) {
    throw new Error("No trending rows returned");
  }

  const rankedCandidates = (await mapWithConcurrency(sourceRows, RADAR_RISK_CONCURRENCY, async (row) => {
    const address = row.item.token ?? row.item.address ?? row.item.token_address;
    if (!address) return null;

    const symbol = String(row.item.symbol ?? "UNKNOWN");
    const riskResponse = await apiGet(`/contracts/${address}-${row.chain}`).catch(() => ({ data: null }));
    const risk = getRecord(unwrapData(riskResponse));
    const holders = getList(risk.token_holders_rank);
    const { signal, leadAction } = findRawTokenSignal(row.signals, address, symbol);
    const ranking = rankRadarCandidate(row.item, risk, holders, signal, leadAction);

    return {
      chain: row.chain,
      chainLabel: toChainLabel(row.chain),
      symbol,
      address: String(address),
      pairAddress: String(row.item.main_pair ?? ""),
      narrative: deriveNarrative(row.item, toChainLabel(row.chain)),
      priceText: formatUsd(row.item.current_price_usd),
      volume24hText: formatUsd(row.item.tx_volume_u_24h ?? row.item.token_tx_volume_usd_24h),
      liquidityText: formatUsd(row.item.main_pair_tvl ?? row.item.tvl),
      score: ranking.score,
      verdict: ranking.verdict
    };
  }))
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);
  const reserved = chains.flatMap((chain) =>
    rankedCandidates
      .filter((candidate) => candidate.chain === chain)
      .slice(0, RADAR_MIN_PER_CHAIN)
  );
  const reservedKeys = new Set(reserved.map((candidate) => `${candidate.chain}-${candidate.address}`));
  const candidates = [
    ...reserved,
    ...rankedCandidates.filter(
      (candidate) => !reservedKeys.has(`${candidate.chain}-${candidate.address}`)
    )
  ]
    .sort((left, right) => right.score - left.score)
    .slice(0, resultLimit);

  return { candidates };
}

export async function loadTokenSnapshot(address, chainInput) {
  const chain = toApiChain(chainInput);
  const [tokenDetailResponse, riskResponse, signalResponse] = await Promise.all([
    apiGet(`/tokens/${address}-${chain}`),
    apiGet(`/contracts/${address}-${chain}`),
    apiGet("/signals/public/list", {
      chain,
      pageSize: 20,
      pageNO: 1
    })
  ]);

  const tokenEnvelope = getRecord(unwrapData(tokenDetailResponse));
  const tokenDetail = getRecord(tokenEnvelope.token);
  const rawPair = tokenEnvelope.pairs?.[0] ?? null;
  const pair = resolvePair(tokenEnvelope, rawPair);
  const risk = getRecord(unwrapData(riskResponse));
  const holders = getList(risk.token_holders_rank);
  const signals = getList(unwrapData(signalResponse));
  const { signal, leadAction } = findTokenSignal(signals, address, tokenDetail.symbol);
  const signalWalletAddress = getWalletAddress(leadAction);

  const [walletInfoResponse, tokenPnlResponse, walletTxResponse, liqTxResponse] = await Promise.all([
    signalWalletAddress
      ? apiGet("/address/walletinfo", {
          wallet_address: signalWalletAddress,
          chain
        })
      : Promise.resolve({ data: null }),
    signalWalletAddress
      ? apiGet("/address/pnl", {
          wallet_address: signalWalletAddress,
          chain,
          token_address: address
        })
      : Promise.resolve({ data: null }),
    signalWalletAddress
      ? apiGet("/address/tx", {
          wallet_address: signalWalletAddress,
          chain,
          token_address: address,
          page_size: 3
        })
      : Promise.resolve({ data: null }),
    pair
      ? apiGet(`/txs/liq/${pair.pair_address ?? pair.address}-${chain}`, {
          limit: 5,
          sort: "desc",
          type: "all"
        })
      : Promise.resolve({ data: null })
  ]);

  const walletInfo = getRecord(unwrapData(walletInfoResponse));
  const tokenPnl = getRecord(unwrapData(tokenPnlResponse));
  const walletTxEnvelope = getRecord(unwrapData(walletTxResponse));
  const walletTxs = getList(walletTxEnvelope.result);
  const liqTxEnvelope = getRecord(unwrapData(liqTxResponse));
  const liqTxs = getList(liqTxEnvelope.txs);

  return buildSnapshot({
    address,
    chain,
    tokenDetail,
    pair,
    risk,
    holders,
    signal,
    leadAction,
    walletInfo,
    tokenPnl,
    walletTxs,
    liqTxs
  });
}

export async function loadQuoteSnapshot(snapshot, budgetUsd) {
  const budget = Number(budgetUsd);
  if (!Number.isFinite(budget) || budget <= 0) {
    throw new Error("需要有效的 USD 预算");
  }

  const trade = snapshot.trade;
  const inputAmount = trade.baseTokenPriceUsd > 0 ? budget / trade.baseTokenPriceUsd : 0;
  if (inputAmount <= 0) {
    throw new Error("缺少基础报价，无法生成官方 quote");
  }

  const quote = await requestAmountOut(proxyJsonRequest, {
    baseUrl: proxyTradeBaseUrl,
    chain: snapshot.chain,
    inAmount: toRawUnits(inputAmount, trade.baseTokenDecimals),
    inTokenAddress: resolveQuoteInputToken(snapshot.chain, trade),
    outTokenAddress: snapshot.address,
    swapType: "buy",
    outputDecimals: trade.tokenDecimals
  });

  return {
    source: "AVE official",
    budgetUsd: budget,
    inputAmount,
    inputSymbol: trade.baseSymbol,
    estimatedTokens: quote.estimatedAmount,
    spender: quote.spender,
    route: trade.route
  };
}

export async function loadDelegateWalletSnapshot(assetsId = "") {
  const wallets = await loadDelegateWalletsCore(proxyJsonRequest, proxyDelegateBaseUrl, assetsId);
  return {
    wallets,
    wallet:
      (assetsId
        ? wallets.find((item) => item.assetsId === assetsId)
        : wallets[0]) ?? null
  };
}

export async function loadDelegateApprovalSnapshot(chain, orderId) {
  return queryDelegateApprovalCore(proxyJsonRequest, proxyDelegateBaseUrl, {
    chain,
    orderId
  });
}

export async function loadDelegateOrderSnapshot(input) {
  return queryDelegateOrderStatusCore(proxyJsonRequest, proxyDelegateBaseUrl, input);
}

export function renderRadarText(snapshot) {
  const lines = [
    "AVE Sentinel / Radar",
    ""
  ];

  snapshot.candidates.forEach((candidate, index) => {
    lines.push(
      `${index + 1}. ${candidate.symbol} · ${candidate.chainLabel} · ${candidate.verdict}`,
      `   价格 ${candidate.priceText} | 24h 成交 ${candidate.volume24hText} | TVL ${candidate.liquidityText} | Score ${candidate.score}`,
      `   地址 ${shortAddress(candidate.address)}`,
      `   叙事 ${candidate.narrative}`,
      ""
    );
  });

  return lines.join("\n").trim();
}

export function renderTokenText(snapshot) {
  return [
    `AVE Sentinel / Token`,
    "",
    `${snapshot.symbol} · ${snapshot.chainLabel} · ${snapshot.verdict}`,
    `地址 ${snapshot.address}`,
    `价格 ${snapshot.priceText} | 24h ${snapshot.priceChange24hText} | 24h 成交 ${snapshot.volume24hText}`,
    `TVL ${snapshot.liquidityText} | 市值 ${snapshot.marketCapText} | FDV ${snapshot.fdvText}`,
    `Risk ${snapshot.riskLevel} / ${snapshot.riskScore} | Top10 ${snapshot.top10Pct.toFixed(2)}%`,
    `Signal ${snapshot.signalTag} | 钱包 ${snapshot.signalWalletAddress ? shortAddress(snapshot.signalWalletAddress) : "--"}`,
    "",
    "判断摘要：",
    ...snapshot.reasons.map((reason) => `- ${reason}`)
  ].join("\n");
}

export function renderRiskText(snapshot) {
  return [
    `AVE Sentinel / Risk`,
    "",
    `${snapshot.symbol} · ${snapshot.chainLabel} · ${snapshot.verdict}`,
    `Risk Level ${snapshot.riskLevel} / Score ${snapshot.riskScore}`,
    `Honeypot ${snapshot.honeypot ? "YES" : "NO"} | Buy Tax ${snapshot.buyTax || 0} | Sell Tax ${snapshot.sellTax || 0}`,
    `Top10 持仓 ${snapshot.top10Pct.toFixed(2)}%`,
    `流动性事件 ${snapshot.liquidityEventText}`,
    `合约姿态 ${snapshot.contractPosture}`,
    "",
    "风险结论：",
    ...snapshot.reasons
      .filter((reason) => reason.includes("流动性") || reason.includes("持仓") || reason.includes("honeypot") || reason.includes("回避") || reason.includes("观察"))
      .map((reason) => `- ${reason}`)
  ].join("\n");
}

export function renderQuoteText(snapshot, quote) {
  return [
    `AVE Sentinel / Quote`,
    "",
    `${snapshot.symbol} · ${snapshot.chainLabel}`,
    `预算 ${quote.budgetUsd} USD`,
    `支出 ${quote.inputAmount.toFixed(6)} ${quote.inputSymbol}`,
    `预计获得 ${quote.estimatedTokens.toFixed(4)} ${snapshot.symbol}`,
    `Route ${quote.route}`,
    `Spender ${quote.spender || "--"}`,
    "",
    `结论 ${snapshot.verdict}：${snapshot.verdict === "可做" ? "可以进入小仓位试算。" : snapshot.verdict === "观望" ? "只建议观察或极小试算。" : "不建议进入交易动作。"}`
  ].join("\n");
}

export function renderBriefText(radarSnapshot) {
  const proceed = radarSnapshot.candidates.filter((item) => item.verdict === "可做").length;
  const watch = radarSnapshot.candidates.filter((item) => item.verdict === "观望").length;
  const avoid = radarSnapshot.candidates.filter((item) => item.verdict === "回避").length;
  const top = radarSnapshot.candidates[0];

  return [
    "AVE Sentinel / Daily Brief",
    "",
    `候选 ${radarSnapshot.candidates.length} | 可做 ${proceed} | 观望 ${watch} | 回避 ${avoid}`,
    top
      ? `当前最高优先级 ${top.symbol} · ${top.chainLabel} · Score ${top.score} · ${top.verdict}`
      : "当前没有候选",
    "",
    "建议：先看 Radar，再打开 Token 与 Risk，最后再做 Quote。"
  ].join("\n");
}

function normalizeTelegramLanguage(value) {
  return String(value ?? "").trim().toLowerCase() === "en" ? "en" : "zh";
}

function shortValue(value) {
  const text = String(value ?? "");
  if (!text) return "--";
  if (text.length <= 18) return text;
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
}

function isTerminalStatus(status) {
  const normalized = String(status ?? "").trim().toLowerCase();
  return /(filled|success|done|completed|executed|settled|fail|error|cancel|reject|expired|take_profit|stop_loss|tp_|sl_)/.test(
    normalized
  );
}

function detectOrderAlertKind(status) {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (
    normalized.includes("take_profit") ||
    normalized.includes("take-profit") ||
    normalized.includes("take profit") ||
    /(^|[_-])tp($|[_-])/.test(normalized)
  ) {
    return "take_profit";
  }
  if (
    normalized.includes("stop_loss") ||
    normalized.includes("stop-loss") ||
    normalized.includes("stop loss") ||
    /(^|[_-])sl($|[_-])/.test(normalized)
  ) {
    return "stop_loss";
  }
  if (/(filled|success|done|completed|executed|settled)/.test(normalized)) {
    return "success";
  }
  if (/(fail|error|cancel|reject|expired)/.test(normalized)) {
    return "failure";
  }
  return "change";
}

function renderTelegramHelpText(lang = "zh") {
  if (lang === "en") {
    return [
      "AVE Sentinel / Telegram",
      "",
      "/radar",
      "/brief",
      "/token <address> <solana|bsc|base|eth>",
      "/risk <address> <solana|bsc|base|eth>",
      "/quote <address> <solana|bsc|base|eth> <usd>",
      "/wallets",
      "/wallet <assetsId>",
      "/order <orderId> <market|limit> <chain> [assetsId]",
      "/approve <approvalId> <chain>",
      "/refresh <orderId> <market|limit> <chain> [assetsId]",
      "/status",
      "/unwatch <order|approval> <id>",
      "/pause [strategy]",
      "/resume [strategy]",
      "/lang zh|en"
    ].join("\n");
  }

  return [
    "AVE Sentinel / Telegram",
    "",
    "/radar",
    "/brief",
    "/token <address> <solana|bsc|base|eth>",
    "/risk <address> <solana|bsc|base|eth>",
    "/quote <address> <solana|bsc|base|eth> <usd>",
    "/wallets",
    "/wallet <assetsId>",
    "/order <orderId> <market|limit> <chain> [assetsId]",
    "/approve <approvalId> <chain>",
    "/refresh <orderId> <market|limit> <chain> [assetsId]",
    "/status",
    "/unwatch <order|approval> <id>",
    "/pause [strategy]",
    "/resume [strategy]",
    "/lang zh|en"
  ].join("\n");
}

function renderDelegateWalletListText(wallets, selectedAssetsId, lang) {
  if (!wallets.length) {
    return lang === "en"
      ? "AVE Sentinel / Wallet\n\nNo delegate wallet found."
      : "AVE Sentinel / Wallet\n\n当前没有 Delegate Wallet。";
  }

  const lines = [
    "AVE Sentinel / Wallets",
    ""
  ];

  wallets.slice(0, 8).forEach((wallet, index) => {
    const selected = wallet.assetsId === selectedAssetsId;
    lines.push(
      `${index + 1}. ${wallet.assetsName || "Delegate Wallet"}${selected ? (lang === "en" ? " · selected" : " · 当前") : ""}`,
      `${lang === "en" ? "ID" : "ID"} ${shortValue(wallet.assetsId)} | ${lang === "en" ? "Status" : "状态"} ${wallet.status || "--"}`
    );
  });

  return lines.join("\n");
}

function renderDelegateWalletText(wallet, lang, selectedAssetsId) {
  const lines = [
    "AVE Sentinel / Wallet",
    "",
    `${wallet.assetsName || "Delegate Wallet"}${wallet.assetsId === selectedAssetsId ? (lang === "en" ? " · selected" : " · 当前") : ""}`,
    `ID ${wallet.assetsId}`,
    `${lang === "en" ? "Status" : "状态"} ${wallet.status || "--"}`,
    `Solana ${wallet.addresses.Solana ? shortValue(wallet.addresses.Solana) : "--"}`,
    `BSC ${wallet.addresses.BSC ? shortValue(wallet.addresses.BSC) : "--"}`,
    `Base ${wallet.addresses.Base ? shortValue(wallet.addresses.Base) : "--"}`,
    `ETH ${wallet.addresses.Ethereum ? shortValue(wallet.addresses.Ethereum) : "--"}`
  ];

  return lines.join("\n");
}

function renderDelegateApprovalText(payload, lang, tracked) {
  const lines = [
    "AVE Sentinel / Approval",
    "",
    `${lang === "en" ? "Approval" : "授权单"} ${payload.orderId || "--"}`,
    `${lang === "en" ? "Status" : "状态"} ${payload.status || "--"}`,
    `Tx ${payload.txHash ? shortValue(payload.txHash) : "--"}`
  ];

  if (payload.errorMessage) {
    lines.push(`${lang === "en" ? "Error" : "原因"} ${payload.errorMessage}`);
  }

  if (tracked) {
    lines.push("", lang === "en" ? "Tracking enabled." : "已加入通知跟踪。");
  }

  return lines.join("\n");
}

function renderDelegateOrderText(payload, lang, tracked) {
  const lines = [
    "AVE Sentinel / Order",
    "",
    `${lang === "en" ? "Order" : "订单"} ${payload.orderId || "--"}`,
    `${lang === "en" ? "Type" : "类型"} ${payload.orderType} · ${toChainLabel(payload.chain)}`,
    `${lang === "en" ? "Status" : "状态"} ${payload.status || "--"}`,
    `${lang === "en" ? "Side" : "方向"} ${payload.swapType || "--"}`,
    `Tx ${payload.txHash ? shortValue(payload.txHash) : "--"}`
  ];

  if (payload.txPriceUsd) {
    lines.push(`${lang === "en" ? "Fill Price" : "成交价"} $${payload.txPriceUsd}`);
  }
  if (payload.limitPrice) {
    lines.push(`${lang === "en" ? "Limit" : "限价"} ${payload.limitPrice}`);
  }
  if (payload.assetsId) {
    lines.push(`${lang === "en" ? "Wallet" : "钱包"} ${shortValue(payload.assetsId)}`);
  }
  if (payload.errorMessage) {
    lines.push(`${lang === "en" ? "Error" : "原因"} ${payload.errorMessage}`);
  }
  if (tracked) {
    lines.push("", lang === "en" ? "Tracking enabled." : "已加入通知跟踪。");
  }

  return lines.join("\n");
}

function renderStrategyControlText(name, paused, lang) {
  if (lang === "en") {
    return [
      "AVE Sentinel / Control",
      "",
      `Strategy ${name} ${paused ? "paused" : "resumed"}.`
    ].join("\n");
  }

  return [
    "AVE Sentinel / Control",
    "",
    `策略 ${name} 已${paused ? "暂停" : "恢复"}。`
  ].join("\n");
}

function renderTelegramStatusText(chatState, controlState, lang) {
  const watches = Object.values(chatState.watches ?? {});
  const strategies = Object.entries(controlState.strategies ?? {});
  const lines = [
    "AVE Sentinel / Status",
    "",
    `${lang === "en" ? "Language" : "语言"} ${chatState.language || lang}`,
    `${lang === "en" ? "Wallet" : "钱包"} ${chatState.selectedAssetsId ? shortValue(chatState.selectedAssetsId) : "--"}`,
    `${lang === "en" ? "Tracked" : "跟踪"} ${watches.length}`
  ];

  if (strategies.length > 0) {
    lines.push("", lang === "en" ? "Strategies" : "策略状态");
    strategies.slice(0, 8).forEach(([name, value]) => {
      lines.push(`- ${name} · ${value?.paused ? (lang === "en" ? "paused" : "已暂停") : (lang === "en" ? "running" : "运行中")}`);
    });
  }

  if (watches.length > 0) {
    lines.push("", lang === "en" ? "Active Watches" : "当前跟踪");
    watches.slice(0, 8).forEach((watch) => {
      if (watch.kind === "approval") {
        lines.push(`- approval ${shortValue(watch.orderId)} · ${watch.chain} · ${watch.lastStatus || "--"}`);
        return;
      }
      lines.push(`- ${watch.orderType} ${shortValue(watch.orderId)} · ${watch.chain} · ${watch.lastStatus || "--"}`);
    });
  }

  return lines.join("\n");
}

function clearTelegramWatches(chatState, rawKind, rawId) {
  const targetKind =
    rawKind === "order" || rawKind === "approval"
      ? rawKind
      : "";
  const targetId = targetKind ? rawId : rawKind;

  if (!targetId) {
    return 0;
  }

  const entries = Object.entries(chatState.watches ?? {});
  const matches = entries.filter(([, watch]) => {
    if (targetKind && watch.kind !== targetKind) {
      return false;
    }
    return watch.orderId === targetId;
  });

  matches.forEach(([key]) => {
    delete chatState.watches[key];
  });

  return matches.length;
}

function formatTelegramError(error, lang) {
  const message = error instanceof Error ? error.message : String(error);
  if (lang === "en") {
    return `Request failed.\n\n${message}`;
  }
  return `请求失败。\n\n${message}`;
}

export function renderTelegramNotification(event, lang = "zh") {
  if (event.kind === "approval") {
    const success = /(success|done|completed|approved)/i.test(event.currentStatus || "");
    const failed = /(fail|error|cancel|reject|expired)/i.test(event.currentStatus || "");
    const title =
      lang === "en"
        ? success
          ? "Approval Success"
          : failed
            ? "Approval Failed"
            : "Approval Update"
        : success
          ? "授权完成"
          : failed
            ? "授权失败"
            : "授权状态变化";

    return [
      `AVE Sentinel / ${title}`,
      "",
      `${lang === "en" ? "Approval" : "授权单"} ${event.payload.orderId || "--"}`,
      `${lang === "en" ? "Status" : "状态"} ${event.currentStatus || "--"}`,
      `Tx ${event.payload.txHash ? shortValue(event.payload.txHash) : "--"}`,
      event.payload.errorMessage ? `${lang === "en" ? "Error" : "原因"} ${event.payload.errorMessage}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  const alertKind = detectOrderAlertKind(event.currentStatus);
  const title =
    lang === "en"
      ? alertKind === "take_profit"
        ? "Take Profit Triggered"
        : alertKind === "stop_loss"
          ? "Stop Loss Triggered"
          : alertKind === "success"
            ? "Trade Filled"
            : alertKind === "failure"
              ? "Trade Failed"
              : "Order Status Changed"
      : alertKind === "take_profit"
        ? "止盈触发"
        : alertKind === "stop_loss"
          ? "止损触发"
          : alertKind === "success"
            ? "成交成功"
            : alertKind === "failure"
              ? "成交失败"
              : "订单状态变化";

  return [
    `AVE Sentinel / ${title}`,
    "",
    `${lang === "en" ? "Order" : "订单"} ${event.payload.orderId || "--"}`,
    `${lang === "en" ? "Type" : "类型"} ${event.payload.orderType} · ${toChainLabel(event.payload.chain)}`,
    `${lang === "en" ? "Status" : "状态"} ${event.previousStatus || "--"} -> ${event.currentStatus || "--"}`,
    `Tx ${event.payload.txHash ? shortValue(event.payload.txHash) : "--"}`,
    event.payload.errorMessage ? `${lang === "en" ? "Error" : "原因"} ${event.payload.errorMessage}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function parseOrderArgs(parts, selectedAssetsId, lang) {
  const orderId = parts[1] ?? "";
  const orderType = String(parts[2] ?? "market").toLowerCase();
  const chain = parts[3] ?? "solana";
  const assetsId = parts[4] ?? selectedAssetsId ?? "";

  if (!orderId) {
    return {
      error: lang === "en" ? "Missing order ID." : "缺少订单 ID。"
    };
  }
  if (orderType !== "market" && orderType !== "limit") {
    return {
      error: lang === "en" ? "Order type must be market or limit." : "订单类型只能是 market 或 limit。"
    };
  }
  if (orderType === "limit" && !assetsId) {
    return {
      error:
        lang === "en"
          ? "Limit order status needs assetsId. Use /wallet first or pass assetsId."
          : "查询限价单状态需要 assetsId。请先 /wallet，或直接带上 assetsId。"
    };
  }

  return {
    orderId,
    orderType,
    chain,
    assetsId
  };
}

export function renderHelpText(channel = "cli") {
  if (channel === "telegram") {
    return renderTelegramHelpText("zh");
  }

  return [
    "AVE Sentinel CLI",
    "",
    "radar",
    "brief",
    "token <address> --chain solana|bsc|base|eth",
    "risk <address> --chain solana|bsc|base|eth",
    "quote <address> --chain solana|bsc|base|eth --usd 500"
  ].join("\n");
}

export async function handleTelegramAction(input, options = {}) {
  const trimmed = String(input || "").trim();
  const chatState = options.chatState ?? {};
  const controlState = options.controlState ?? { strategies: {} };
  const language = normalizeTelegramLanguage(
    options.language ?? chatState.language ?? envValue("SENTINEL_TG_DEFAULT_LANGUAGE", "zh")
  );

  if (!trimmed) {
    return { text: renderTelegramHelpText(language), language };
  }

  try {
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();

    if (command === "/radar") {
      return { text: renderRadarText(await loadRadarSnapshot()), language };
    }

    if (command === "/brief") {
      return { text: renderBriefText(await loadRadarSnapshot()), language };
    }

    if (command === "/token" || command === "/risk" || command === "/quote") {
      const address = parts[1];
      const chain = parts[2] ?? "solana";
      if (!address) {
        return {
          text: language === "en" ? "Missing token address." : "缺少 token 地址。",
          language
        };
      }
      const snapshot = await loadTokenSnapshot(address, chain);

      if (command === "/token") return { text: renderTokenText(snapshot), language };
      if (command === "/risk") return { text: renderRiskText(snapshot), language };

      const usd = Number(parts[3] ?? "500");
      const quote = await loadQuoteSnapshot(snapshot, usd);
      return { text: renderQuoteText(snapshot, quote), language };
    }

    if (command === "/wallets") {
      const payload = await loadDelegateWalletSnapshot();
      return {
        text: renderDelegateWalletListText(payload.wallets, chatState.selectedAssetsId ?? "", language),
        language
      };
    }

    if (command === "/wallet") {
      const requestedAssetsId = parts[1] ?? chatState.selectedAssetsId ?? "";
      const payload = await loadDelegateWalletSnapshot(requestedAssetsId);
      if (!payload.wallet) {
        return {
          text: language === "en" ? "Delegate wallet not found." : "未找到对应的 Delegate Wallet。",
          language
        };
      }
      chatState.selectedAssetsId = payload.wallet.assetsId;
      return {
        text: renderDelegateWalletText(payload.wallet, language, chatState.selectedAssetsId),
        language
      };
    }

    if (command === "/approve") {
      const orderId = parts[1] ?? "";
      const chain = parts[2] ?? "solana";
      if (!orderId) {
        return {
          text: language === "en" ? "Missing approval ID." : "缺少授权单 ID。",
          language
        };
      }
      const payload = await loadDelegateApprovalSnapshot(chain, orderId);
      return {
        text: renderDelegateApprovalText(payload, language, options.track !== false),
        language,
        watches:
          options.track === false
            ? []
            : [{
                kind: "approval",
                orderId: payload.orderId || orderId,
                chain,
                lastStatus: payload.status || "",
                lastTxHash: payload.txHash || "",
                lastErrorMessage: payload.errorMessage || ""
              }]
      };
    }

    if (command === "/order" || command === "/refresh") {
      const parsed = parseOrderArgs(parts, chatState.selectedAssetsId ?? "", language);
      if (parsed.error) {
        return {
          text: parsed.error,
          language
        };
      }
      const payload = await loadDelegateOrderSnapshot(parsed);
      if (parsed.assetsId) {
        chatState.selectedAssetsId = parsed.assetsId;
      }
      return {
        text: renderDelegateOrderText({ ...payload, orderType: parsed.orderType, assetsId: parsed.assetsId }, language, options.track !== false),
        language,
        watches:
          options.track === false
            ? []
            : [{
                kind: "order",
                orderId: payload.orderId || parsed.orderId,
                orderType: parsed.orderType,
                chain: parsed.chain,
                assetsId: parsed.assetsId,
                lastStatus: payload.status || "",
                lastTxHash: payload.txHash || "",
                lastErrorMessage: payload.errorMessage || ""
              }]
      };
    }

    if (command === "/status" || command === "/watches") {
      return {
        text: renderTelegramStatusText(chatState, controlState, language),
        language
      };
    }

    if (command === "/unwatch") {
      const removed = clearTelegramWatches(chatState, parts[1] ?? "", parts[2] ?? "");
      return {
        text:
          language === "en"
            ? `Removed ${removed} watch item(s).`
            : `已取消 ${removed} 个跟踪项。`,
        language
      };
    }

    if (command === "/pause" || command === "/resume") {
      const name = parts[1] ?? "default";
      controlState.strategies = controlState.strategies ?? {};
      controlState.strategies[name] = {
        paused: command === "/pause",
        updatedAt: new Date().toISOString(),
        source: "telegram"
      };
      return {
        text: renderStrategyControlText(name, command === "/pause", language),
        language
      };
    }

    if (command === "/lang") {
      const nextLanguage = normalizeTelegramLanguage(parts[1] ?? "zh");
      chatState.language = nextLanguage;
      return {
        text: nextLanguage === "en" ? "Language set to English." : "语言已切换为中文。",
        language: nextLanguage
      };
    }

    if (command === "/help" || command === "/start") {
      return { text: renderTelegramHelpText(language), language };
    }

    return { text: renderTelegramHelpText(language), language };
  } catch (error) {
    return {
      text: formatTelegramError(error, language),
      language
    };
  }
}

export async function handleTelegramCommand(input, options = {}) {
  const result = await handleTelegramAction(input, {
    ...options,
    track: false
  });
  return result.text;
}
