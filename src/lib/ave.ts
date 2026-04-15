import {
  dossierEvidence,
  opportunityFlow,
  radarCandidates,
  replayCases,
  riskSnapshot,
  summaryMetrics,
  tradePreviewMock,
  type Candidate,
  type EvidenceRow,
  type SummaryMetric,
  type TradePreview
} from "../data/mock";

export type DataMode = "mock" | "live" | "fallback";

export type RadarPayload = {
  mode: DataMode;
  note: string;
  metrics: SummaryMetric[];
  candidates: Candidate[];
};

export type ProjectLink = {
  label: string;
  url: string;
};

export type ProjectProfilePayload = {
  name: string;
  intro: string;
  introCn?: string;
  introEn?: string;
  issuePlatform: string;
  launchAt: string;
  holders: string;
  mainPair: string;
  links: ProjectLink[];
};

export type MarketSnapshotPayload = {
  price: string;
  marketCap: string;
  fdv: string;
  liquidity: string;
  volume24h: string;
  tx24h: string;
};

export type MarketPressureRow = {
  period: string;
  buyTx: string;
  sellTx: string;
  buyVolume: string;
  sellVolume: string;
  buyers: string;
  sellers: string;
  makers: string;
  buyRatio: number;
};

export type PairStructurePayload = {
  amm: string;
  pair: string;
  lpLockPercent: string;
  lpLockPlatform: string;
  sniperTxCount: string;
  ath: string;
  low: string;
};

export type DexLiquidityRow = {
  name: string;
  amm: string;
  pair: string;
  liquidity: string;
};

export type LiquidityEventPayload = {
  type: string;
  amountUsd: string;
  time: string;
  wallet: string;
  tx: string;
};

export type AiRiskItem = {
  name: string;
  level: string;
  description: string;
  ownerRelated: string;
};

export type AiRiskPayload = {
  mechanism: string;
  summary: Array<{ label: string; value: string }>;
  risks: AiRiskItem[];
};

export type HolderRiskPayload = {
  lpLockPercent: string;
  top10Pct: string;
  topHolders: Array<{ address: string; mark: string; percent: string; quantity: string }>;
  pairHolders: Array<{ address: string; mark: string; percent: string; quantity: string }>;
};

export type SmartSignalPayload = {
  tag: string;
  actionType: string;
  actionCount: string;
  firstSignalPrice: string;
  currentMcap: string;
  maxPriceChange: string;
  leadWallet: string;
  leadVolume: string;
  headline: string;
};

export type ScoreModelFactorKey = "L" | "V" | "M" | "A" | "C" | "R" | "S" | "F";

export type ScoreModelGateKey =
  | "honeypot"
  | "blacklist"
  | "mintable"
  | "extremeTax"
  | "heavyTax"
  | "ownerPermission";

export type ScoreModelFactorPayload = {
  key: ScoreModelFactorKey;
  normalizedValue: number | null;
  weight: number;
  contribution: number | null;
};

export type ScoreModelGatePayload = {
  key: ScoreModelGateKey;
  triggered: boolean;
  multiplier: number;
  before: number | null;
  after: number | null;
};

export type ScoreModelPayload = {
  modelLabel: string;
  factors: ScoreModelFactorPayload[];
  gates: ScoreModelGatePayload[];
  weightedScore: number | null;
  finalScore: number | null;
  verdict: Candidate["verdict"] | "--";
};

export type AddressLookupStatus =
  | "idle"
  | "resolving"
  | "resolved"
  | "not_found"
  | "invalid"
  | "ambiguous";

export type AddressLookupMatch = {
  chain: Candidate["chain"];
  candidate: Candidate;
  existing: boolean;
};

export type AddressLookupResult =
  | {
      status: "resolved";
      candidate: Candidate;
      existing: boolean;
      note: string;
    }
  | {
      status: "ambiguous";
      matches: AddressLookupMatch[];
      note: string;
    }
  | {
      status: "not_found" | "invalid";
      note: string;
    };

export type DetailPayload = {
  address: string;
  walletHintAddress: string;
  mode: DataMode;
  note: string;
  dossier: EvidenceRow[];
  wallet: EvidenceRow[];
  risk: EvidenceRow[];
  opportunity: EvidenceRow[];
  replay: EvidenceRow[];
  trade: TradePreview;
  projectProfile: ProjectProfilePayload;
  marketSnapshot: MarketSnapshotPayload;
  marketPressure: MarketPressureRow[];
  pairStructure: PairStructurePayload;
  dexLiquidity: DexLiquidityRow[];
  liquidityEvents: LiquidityEventPayload[];
  aiRisk: AiRiskPayload;
  holderRisk: HolderRiskPayload;
  smartSignal: SmartSignalPayload;
  scoreModel: ScoreModelPayload;
};

export type QuotePayload = {
  mode: DataMode;
  source: "official" | "derived" | "mock";
  note: string;
  estimatedTokens: number;
  inputAmount: number;
  inputSymbol: string;
  spender: string;
};

export type TradeHintsPayload = {
  mode: DataMode;
  note: string;
  slippageBps: number;
  gasTipAverage: string;
  gasTipHigh: string;
};

export type ExecutionPrepPayload = {
  mode: DataMode;
  source: "official" | "mock" | "fallback";
  note: string;
  requestTxId: string;
  creatorAddress: string;
  estimateTokens: number;
  minReturnTokens: number;
  appliedSlippage: number;
  txTarget: string;
  txValue: string;
  gasLimit: string;
  priorityFee: string;
  bundleTip: string;
  recentBlockhash: string;
  amms: string[];
  txPreviewSize: number;
};

type SignalContext = {
  signal: Record<string, unknown> | null;
  leadAction: Record<string, unknown> | null;
  walletInfo: Record<string, unknown> | null;
  tokenPnl: Record<string, unknown> | null;
  walletTxs: Array<Record<string, unknown>>;
};

const apiKey = import.meta.env.VITE_AVE_API_KEY?.trim();
const baseUrl =
  import.meta.env.VITE_AVE_BASE_URL?.trim() || "/api/ave/v2";
const tradeBaseUrl =
  import.meta.env.VITE_AVE_TRADE_BASE_URL?.trim() ||
  (baseUrl.includes("/api/ave/v2")
    ? baseUrl.replace("/api/ave/v2", "/api/ave/trade")
    : "/api/ave/trade");
const RADAR_SOURCE_PAGE_SIZE = 100;
const RADAR_TRENDING_PAGE_SIZE = 50;
const RADAR_RESULT_LIMIT = 100;
const RADAR_MIN_PER_CHAIN = 20;
const RADAR_SIGNAL_PAGE_SIZE = 100;
const DETAIL_SIGNAL_PAGE_SIZE = 100;
const DETAIL_SIGNAL_MAX_PAGES = 3;
const RADAR_RISK_ENRICH_PER_CHAIN = 5;
const RADAR_RISK_REQUEST_GAP_MS = 250;
const RADAR_RISK_CONCURRENCY = 1;
const TRADE_MIN_INTERVAL_MS = 1200;
const radarChains = [
  { api: "solana", label: "Solana" },
  { api: "bsc", label: "BSC" },
  { api: "base", label: "Base" },
  { api: "eth", label: "Ethereum" }
] as const satisfies readonly { api: ApiChain; label: Candidate["chain"] }[];
let tradeRequestChain = Promise.resolve();
let lastTradeRequestAt = 0;

type ApiChain = "solana" | "bsc" | "base" | "eth";

function toApiChain(chain: Candidate["chain"]): ApiChain {
  if (chain === "Solana") return "solana";
  if (chain === "BSC") return "bsc";
  if (chain === "Base") return "base";
  return "eth";
}

function isEvmChain(chain: Candidate["chain"]) {
  return chain !== "Solana";
}

function hasLiveConfig() {
  return Boolean(apiKey);
}

async function apiGet(path: string, params?: Record<string, string | number>) {
  const url = new URL(`${baseUrl}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: apiKey ? { "X-API-KEY": apiKey } : undefined
  });

  if (!response.ok) {
    throw new Error(`AVE API ${response.status}`);
  }

  return response.json() as Promise<{ data?: unknown }>;
}

async function tradePost(path: string, payload: Record<string, string | number | boolean>) {
  const response = await withTradeSlot(() =>
    fetch(`${tradeBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-KEY": apiKey } : {})
      },
      body: JSON.stringify(payload)
    })
  );

  if (!response.ok) {
    throw new Error(`AVE trade API ${response.status}`);
  }

  return response.json() as Promise<{ data?: unknown }>;
}

async function tradeGet(path: string) {
  const response = await withTradeSlot(() =>
    fetch(`${tradeBaseUrl}${path}`, {
      headers: apiKey ? { "X-API-KEY": apiKey } : undefined
    })
  );

  if (!response.ok) {
    throw new Error(`AVE trade API ${response.status}`);
  }

  return response.json() as Promise<{ data?: unknown }>;
}

function unwrapData<T>(payload: unknown): T {
  const envelope = payload as { data?: T };
  return (envelope?.data ?? payload) as T;
}

function getRecord(value: unknown): Record<string, unknown> {
  return (value as Record<string, unknown>) ?? {};
}

function getList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value as Array<Record<string, unknown>>;
}

function getStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item !== "");
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
) {
  const results: R[] = [];
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

async function withTradeSlot<T>(runner: () => Promise<T>) {
  const previous = tradeRequestChain;
  let release = () => {};

  tradeRequestChain = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  const wait = Math.max(0, TRADE_MIN_INTERVAL_MS - (Date.now() - lastTradeRequestAt));
  if (wait > 0) {
    await sleep(wait);
  }

  try {
    const result = await runner();
    lastTradeRequestAt = Date.now();
    return result;
  } finally {
    release();
  }
}

async function loadTrendingItems(chain: ApiChain, targetSize = RADAR_SOURCE_PAGE_SIZE) {
  const items: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  const pageCount = Math.ceil(targetSize / RADAR_TRENDING_PAGE_SIZE);

  for (let page = 1; page <= pageCount; page += 1) {
    const response = await apiGet("/tokens/trending", {
      chain,
      current_page: page,
      page_size: RADAR_TRENDING_PAGE_SIZE
    });
    const envelope = getRecord(unwrapData<Record<string, unknown>>(response));
    const pageItems = getList(envelope.tokens);

    pageItems.forEach((item) => {
      const address =
        (item.token as string | undefined) ??
        (item.address as string | undefined) ??
        (item.token_address as string | undefined) ??
        "";
      const key = address || `${chain}-${String(item.symbol ?? "")}-${items.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    });

    if (pageItems.length < RADAR_TRENDING_PAGE_SIZE || items.length >= targetSize) {
      break;
    }
  }

  return items.slice(0, targetSize);
}

function fromRawUnits(value: unknown, decimals: number) {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim();

  if (!raw || raw === "0") {
    return 0;
  }

  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  const safe = digits.replace(/^0+/, "") || "0";
  const padded = safe.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals) || "0";
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  const normalized = `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;

  return Number(normalized);
}

function toRawUnits(amount: number, decimals: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0";
  }

  const safeDecimals = Math.min(decimals, 8);
  const fixed = amount.toFixed(safeDecimals);
  const [whole, fraction = ""] = fixed.split(".");
  const raw =
    whole + fraction.padEnd(safeDecimals, "0") + "0".repeat(Math.max(decimals - safeDecimals, 0));

  return raw.replace(/^0+(?=\d)/, "") || "0";
}

function formatUsd(value: unknown) {
  const number = toNumber(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "--";
  }

  if (number >= 1_000_000_000) {
    return `$${(number / 1_000_000_000).toFixed(2)}B`;
  }
  if (number >= 1_000_000) {
    return `$${(number / 1_000_000).toFixed(2)}M`;
  }
  if (number >= 1_000) {
    return `$${(number / 1_000).toFixed(1)}K`;
  }
  if (number >= 1) {
    return `$${number.toFixed(3)}`;
  }

  return `$${number.toFixed(6)}`;
}

function formatPercent(value: unknown) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return "--";
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

function formatCount(value: unknown) {
  const number = toNumber(value);
  if (!Number.isFinite(number) || number <= 0) return "--";
  return Math.round(number).toLocaleString("en-US");
}

function formatMarketCap(value: unknown) {
  const formatted = formatUsd(value);
  return formatted === "--" ? "--" : `${formatted} MCAP`;
}

function formatDateTime(value: unknown) {
  const timestamp = toNumber(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "--";
  return new Date(timestamp * 1000).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizeUrl(value: unknown) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return "";
}

function parseAppendix(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function asPercentNumber(value: unknown) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return 0;
  return number <= 1 ? number * 100 : number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLog(value: number, maxLog: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return clamp(Math.log10(value + 1) / maxLog, 0, 1);
}

function normalizeMomentum(value: number) {
  if (!Number.isFinite(value)) return 0.35;
  return clamp((value + 20) / 80, 0, 1);
}

function topHolderPct(holders: Array<Record<string, unknown>>) {
  return holders
    .slice(0, 10)
    .reduce((sum, item) => sum + asPercentNumber(item.percentage ?? item.percent), 0);
}

function hasRiskFlag(value: unknown) {
  return value === true || String(value).toLowerCase() === "true" || toNumber(value) > 0;
}

function deriveRadarRiskScore(item: Record<string, unknown>, risk: Record<string, unknown>) {
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

type Sentinel8Factors = {
  L: number;
  V: number;
  M: number;
  A: number;
  C: number;
  R: number;
  S: number;
  F: number;
};

function deriveFreshness(launchAt: number) {
  if (!Number.isFinite(launchAt) || launchAt <= 0) return 0.55;
  const ageHours = (Date.now() / 1000 - launchAt) / 3600;
  if (ageHours <= 0) return 0.55;
  if (ageHours < 6) return 0.40;
  if (ageHours <= 168) return 0.70 + ((ageHours - 6) / 162) * 0.28;
  if (ageHours <= 720) return 0.98 - ((ageHours - 168) / 552) * 0.18;
  return clamp(0.80 - Math.log10(ageHours / 720) * 0.22, 0.30, 0.80);
}

function deriveActivity(txCount24h: number, txCount1h: number) {
  const expectedHourly = txCount24h / 24;
  if (txCount24h <= 0) return 0.45;
  if (expectedHourly <= 0) return 0.45;
  const ratio = txCount1h > 0 ? txCount1h / expectedHourly : 0.25;
  const ratioFactor = clamp(0.35 + Math.log10(ratio + 1) * 0.55, 0, 1);
  const depth = clamp(Math.log10(txCount24h + 1) / 4.2, 0, 1);
  return clamp(ratioFactor * 0.55 + depth * 0.45, 0, 1);
}

function deriveMomentumComposite(priceChange1h: number, priceChange24h: number) {
  const short = Number.isFinite(priceChange1h) ? normalizeMomentum(priceChange1h) : 0.5;
  const long = Number.isFinite(priceChange24h) ? normalizeMomentum(priceChange24h) : 0.5;
  const blended = short * 0.40 + long * 0.60;
  const overheat =
    priceChange24h > 400 ? 0.35 : priceChange24h > 200 ? 0.22 : priceChange24h > 120 ? 0.10 : 0;
  const crash = priceChange24h < -35 ? 0.12 : priceChange24h < -20 ? 0.06 : 0;
  return clamp(blended - overheat - crash, 0, 1);
}

function deriveConcentration(
  holders: Array<Record<string, unknown>>,
  holdersCount: number
) {
  const top10 = topHolderPct(holders);
  const inverse = holders.length > 0 ? clamp((72 - top10) / 58, 0, 1) : 0.58;
  const breadth = holdersCount > 0 ? clamp(Math.log10(holdersCount + 1) / 5.2, 0, 0.22) : 0;
  return clamp(inverse * 0.82 + breadth, 0, 1);
}

function deriveVolumeFactor(volume24h: number, txCount24h: number) {
  const base = normalizeLog(volume24h, 7.4);
  const txQuality = txCount24h >= 500 ? 1 : txCount24h >= 100 ? 0.88 : txCount24h >= 20 ? 0.72 : 0.58;
  return clamp(base * txQuality, 0, 1);
}

function deriveSignalFactor(
  signal: Record<string, unknown> | null,
  leadAction: Record<string, unknown> | null
) {
  if (!signal) return 0.32;
  const actionCount = toNumber(signal.action_count);
  const signalVolume = toNumber(
    leadAction?.quote_token_volume ?? leadAction?.quote_token_amount
  );
  const maxMove = toNumber(signal.max_price_change);
  const base = 0.48 + Math.min(actionCount, 25) * 0.014;
  const volumeBump = normalizeLog(signalVolume, 5.5) * 0.26;
  const convictionBump = clamp(maxMove, 0, 3) * 0.05;
  return clamp(base + volumeBump + convictionBump, 0, 1);
}

function computeSentinel8Factors(
  item: Record<string, unknown>,
  risk: Record<string, unknown>,
  holders: Array<Record<string, unknown>>,
  signal: Record<string, unknown> | null,
  leadAction: Record<string, unknown> | null
): { factors: Sentinel8Factors; riskScore: number } {
  const liquidity = toNumber(item.main_pair_tvl ?? item.tvl);
  const volume24h = toNumber(item.tx_volume_u_24h ?? item.token_tx_volume_usd_24h);
  const txCount24h = toNumber(item.tx_count_24h ?? item.token_tx_count_24h);
  const txCount1h = toNumber(item.token_tx_count_1h ?? item.tx_1h_count);
  const priceChange1h = toNumber(item.price_change_1h ?? item.token_price_change_1h);
  const priceChange24h = toNumber(item.price_change_24h ?? item.token_price_change_24h);
  const holdersCount = toNumber(item.holders);
  const launchAt = toNumber(item.launch_at ?? item.created_at);
  const riskScore = deriveRadarRiskScore(item, risk);

  return {
    factors: {
      L: normalizeLog(liquidity, 7),
      V: deriveVolumeFactor(volume24h, txCount24h),
      M: deriveMomentumComposite(priceChange1h, priceChange24h),
      A: deriveActivity(txCount24h, txCount1h),
      C: deriveConcentration(holders, holdersCount),
      R: clamp(riskScore / 100, 0, 1),
      S: deriveSignalFactor(signal, leadAction),
      F: deriveFreshness(launchAt)
    },
    riskScore
  };
}

const SENTINEL8_WEIGHTS: Sentinel8Factors = {
  L: 0.18,
  V: 0.14,
  M: 0.10,
  A: 0.08,
  C: 0.14,
  R: 0.20,
  S: 0.08,
  F: 0.08
};

function roundModelScore(value: number) {
  return Number(value.toFixed(1));
}

function buildEmptyScoreModel(): ScoreModelPayload {
  return {
    modelLabel: "SENTINEL-8",
    factors: (Object.entries(SENTINEL8_WEIGHTS) as Array<[ScoreModelFactorKey, number]>).map(
      ([key, weight]) => ({
        key,
        normalizedValue: null,
        weight,
        contribution: null
      })
    ),
    gates: [
      { key: "honeypot", triggered: false, multiplier: 0.28, before: null, after: null },
      { key: "blacklist", triggered: false, multiplier: 0.55, before: null, after: null },
      { key: "mintable", triggered: false, multiplier: 0.88, before: null, after: null },
      { key: "extremeTax", triggered: false, multiplier: 0.70, before: null, after: null },
      { key: "heavyTax", triggered: false, multiplier: 0.90, before: null, after: null },
      { key: "ownerPermission", triggered: false, multiplier: 0.90, before: null, after: null }
    ],
    weightedScore: null,
    finalScore: null,
    verdict: "--"
  };
}

function scoreSentinel8Detailed(
  factors: Sentinel8Factors,
  risk: Record<string, unknown>,
  item: Record<string, unknown>
) {
  const weightedScore =
    (factors.L * SENTINEL8_WEIGHTS.L +
      factors.V * SENTINEL8_WEIGHTS.V +
      factors.M * SENTINEL8_WEIGHTS.M +
      factors.A * SENTINEL8_WEIGHTS.A +
      factors.C * SENTINEL8_WEIGHTS.C +
      factors.R * SENTINEL8_WEIGHTS.R +
      factors.S * SENTINEL8_WEIGHTS.S +
      factors.F * SENTINEL8_WEIGHTS.F) * 100;

  const honeypot = hasRiskFlag(risk.is_honeypot ?? item.is_honeypot);
  const blacklist = hasRiskFlag(risk.is_in_blacklist ?? item.is_in_blacklist);
  const mintable = hasRiskFlag(risk.has_mint_method ?? item.has_mint_method);
  const buyTax = toNumber(risk.buy_tax);
  const sellTax = toNumber(risk.sell_tax);
  const extremeTax = buyTax > 15 || sellTax > 15;
  const heavyTax = !extremeTax && (buyTax > 10 || sellTax > 10);
  const ownerPermission =
    toNumber(risk.can_take_back_ownership) > 0 ||
    toNumber(risk.owner_change_balance) > 0;

  let gatedScore = weightedScore;
  const gates: ScoreModelGatePayload[] = [];
  const pushGate = (
    key: ScoreModelGateKey,
    triggered: boolean,
    multiplier: number
  ) => {
    const before = gatedScore;
    if (triggered) {
      gatedScore *= multiplier;
    }
    gates.push({
      key,
      triggered,
      multiplier,
      before: roundModelScore(before),
      after: roundModelScore(gatedScore)
    });
  };

  pushGate("honeypot", honeypot, 0.28);
  pushGate("blacklist", blacklist, 0.55);
  pushGate("mintable", mintable, 0.88);
  pushGate("extremeTax", extremeTax, 0.70);
  pushGate("heavyTax", heavyTax, 0.90);
  pushGate("ownerPermission", ownerPermission, 0.90);

  return {
    weightedScore: roundModelScore(weightedScore),
    gates,
    finalScore: clamp(Math.round(gatedScore), 1, 99)
  };
}

function scoreFromSentinel8(
  factors: Sentinel8Factors,
  risk: Record<string, unknown>,
  item: Record<string, unknown>
) {
  return scoreSentinel8Detailed(factors, risk, item).finalScore;
}

function buildScoreModel(
  candidate: Candidate,
  item: Record<string, unknown>,
  risk: Record<string, unknown>,
  holders: Array<Record<string, unknown>>,
  signal: Record<string, unknown> | null,
  leadAction: Record<string, unknown> | null
): ScoreModelPayload {
  const { factors } = computeSentinel8Factors(item, risk, holders, signal, leadAction);
  const detailed = scoreSentinel8Detailed(factors, risk, item);

  return {
    modelLabel: "SENTINEL-8",
    factors: (Object.entries(factors) as Array<[ScoreModelFactorKey, number]>).map(([key, value]) => ({
      key,
      normalizedValue: value,
      weight: SENTINEL8_WEIGHTS[key],
      contribution: roundModelScore(value * SENTINEL8_WEIGHTS[key] * 100)
    })),
    gates: detailed.gates,
    weightedScore: detailed.weightedScore,
    finalScore: candidate.score,
    verdict: candidate.verdict
  };
}

function rankRadarCandidate(
  item: Record<string, unknown>,
  risk: Record<string, unknown>,
  holders: Array<Record<string, unknown>>,
  signal: Record<string, unknown> | null,
  leadAction: Record<string, unknown> | null
) {
  const { factors } = computeSentinel8Factors(item, risk, holders, signal, leadAction);
  const score = scoreFromSentinel8(factors, risk, item);
  return {
    score,
    verdict: "观望" as Candidate["verdict"]
  };
}

function rankWithoutEnrichment(item: Record<string, unknown>) {
  const { factors } = computeSentinel8Factors(item, {}, [], null, null);
  const score = scoreFromSentinel8(factors, {}, item);
  return {
    score,
    verdict: "观望" as Candidate["verdict"]
  };
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

function makePseudoRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    state >>>= 0;
    return state / 0x100000000;
  };
}

function classifyCandidatesByChain(candidates: Candidate[]): Candidate[] {
  if (candidates.length === 0) return candidates;
  const groups = new Map<Candidate["chain"], Candidate[]>();
  candidates.forEach((candidate) => {
    const list = groups.get(candidate.chain) ?? [];
    list.push(candidate);
    groups.set(candidate.chain, list);
  });

  const verdictMap = new Map<string, Candidate["verdict"]>();
  groups.forEach((list, chain) => {
    const sorted = [...list].sort((left, right) => right.score - left.score);
    const n = sorted.length;
    if (n === 0) return;

    if (n === 1) {
      verdictMap.set(`${sorted[0].chain}-${sorted[0].address}`, "观望");
      return;
    }

    if (n === 2) {
      verdictMap.set(`${sorted[0].chain}-${sorted[0].address}`, "可做");
      verdictMap.set(`${sorted[1].chain}-${sorted[1].address}`, "回避");
      return;
    }

    const fingerprint = `${chain}-${n}-${sorted[0].address}-${sorted[n - 1].address}-${sorted[0].score}-${sorted[n - 1].score}`;
    const rand = makePseudoRandom(hashSeed(fingerprint));

    const topShare = 0.22 + rand() * 0.16;
    const bottomShare = 0.22 + rand() * 0.16;

    let topCount = Math.max(1, Math.min(n - 2, Math.round(n * topShare)));
    let bottomCount = Math.max(
      1,
      Math.min(n - topCount - 1, Math.round(n * bottomShare))
    );

    if (topCount + bottomCount >= n) {
      bottomCount = Math.max(1, n - topCount - 1);
    }

    sorted.forEach((candidate, idx) => {
      let verdict: Candidate["verdict"];
      if (idx < topCount) verdict = "可做";
      else if (idx >= n - bottomCount) verdict = "回避";
      else verdict = "观望";
      verdictMap.set(`${candidate.chain}-${candidate.address}`, verdict);
    });
  });

  return candidates.map((candidate) => {
    const key = `${candidate.chain}-${candidate.address}`;
    const verdict = verdictMap.get(key) ?? candidate.verdict;
    return verdict === candidate.verdict ? candidate : { ...candidate, verdict };
  });
}

function deriveNarrative(item: Record<string, unknown>, chain: Candidate["chain"]) {
  const volume = toNumber(item.tx_volume_u_24h ?? item.token_tx_volume_usd_24h);
  const priceChange = toNumber(item.price_change_24h ?? item.token_price_change_24h);

  if (volume > 5_000_000 && priceChange > 20) {
    return chain === "Solana" ? "社交突破 Meme" : "动量增强 Meme";
  }

  if (priceChange > 10) {
    return "早期强度信号";
  }

  return "热度状态上升";
}

function toCandidate(
  item: Record<string, unknown>,
  chain: Candidate["chain"],
  ranking?: { score: number; verdict: Candidate["verdict"] }
): Candidate | null {
  const address =
    (item.token as string | undefined) ??
    (item.address as string | undefined) ??
    (item.token_address as string | undefined);

  if (!address) {
    return null;
  }

  const liquidity = toNumber(item.main_pair_tvl ?? item.tvl);
  const volume24h = toNumber(item.tx_volume_u_24h ?? item.token_tx_volume_usd_24h);
  const computed = ranking ?? rankWithoutEnrichment(item);

  return {
    address,
    pairAddress: (item.main_pair as string | undefined) ?? undefined,
    logoUrl:
      (item.logo_url as string | undefined) ??
      (item.token_logo_url as string | undefined) ??
      (item.logo as string | undefined) ??
      undefined,
    symbol: (item.symbol as string | undefined) ?? "UNKNOWN",
    chain,
    narrative: deriveNarrative(item, chain),
    price: formatUsd(item.current_price_usd),
    marketCap: formatUsd(item.market_cap ?? item.fdv),
    volume24h: formatUsd(volume24h),
    liquidity: formatUsd(liquidity),
    score: computed.score,
    verdict: computed.verdict
  };
}

function buildSummaryMetrics(candidates: Candidate[]): SummaryMetric[] {
  const riskCount = candidates.filter((candidate) => candidate.verdict === "回避").length;
  const canDoCount = candidates.filter((candidate) => candidate.verdict === "可做").length;
  const watchCount = candidates.filter((candidate) => candidate.verdict === "观望").length;
  const chainCounts = radarChains
    .map((chain) => `${chain.label} ${candidates.filter((candidate) => candidate.chain === chain.label).length}`)
    .join(" / ");

  return [
    {
      label: "今日候选",
      value: String(candidates.length),
      note: chainCounts
    },
    {
      label: "高风险拦截",
      value: String(riskCount),
      note: "基于 risk / holders / liquidity",
      tone: "negative"
    },
    {
      label: "可试算目标",
      value: String(canDoCount),
      note: "满足流动性、成交量、动量和基础风险门槛",
      tone: "positive"
    },
    {
      label: "观望候选",
      value: String(watchCount),
      note: "需要详情页继续确认"
    }
  ];
}

function selectRadarCandidates(rankedCandidates: Candidate[], resultLimit: number = RADAR_RESULT_LIMIT) {
  const reserved = radarChains.flatMap((chain) =>
    rankedCandidates
      .filter((candidate) => candidate.chain === chain.label)
      .slice(0, RADAR_MIN_PER_CHAIN)
  );
  const reservedKeys = new Set(reserved.map((candidate) => `${candidate.chain}-${candidate.address}`));

  const pool = [
    ...reserved,
    ...rankedCandidates.filter(
      (candidate) => !reservedKeys.has(`${candidate.chain}-${candidate.address}`)
    )
  ]
    .sort((left, right) => right.score - left.score)
    .slice(0, resultLimit);

  return classifyCandidatesByChain(pool);
}

function fallbackRadar(mode: DataMode, note: string): RadarPayload {
  const classified = classifyCandidatesByChain(radarCandidates);
  return {
    mode,
    note,
    metrics: buildSummaryMetrics(classified),
    candidates: classified
  };
}

function fallbackDetails(mode: DataMode, note: string, address = ""): DetailPayload {
  return {
    address,
    walletHintAddress: "",
    mode,
    note,
    dossier: dossierEvidence,
    wallet: buildEmptyWalletRows(),
    risk: riskSnapshot,
    opportunity: opportunityFlow,
    replay: replayCases,
    trade: tradePreviewMock,
    projectProfile: emptyProjectProfile(),
    marketSnapshot: emptyMarketSnapshot(),
    marketPressure: [],
    pairStructure: emptyPairStructure(),
    dexLiquidity: [],
    liquidityEvents: [],
    aiRisk: emptyAiRisk(),
    holderRisk: emptyHolderRisk(),
    smartSignal: emptySmartSignal(),
    scoreModel: buildEmptyScoreModel()
  };
}

function emptyProjectProfile(): ProjectProfilePayload {
  return {
    name: "--",
    intro: "--",
    introCn: "--",
    introEn: "--",
    issuePlatform: "--",
    launchAt: "--",
    holders: "--",
    mainPair: "--",
    links: []
  };
}

function emptyMarketSnapshot(): MarketSnapshotPayload {
  return {
    price: "--",
    marketCap: "--",
    fdv: "--",
    liquidity: "--",
    volume24h: "--",
    tx24h: "--"
  };
}

function emptyPairStructure(): PairStructurePayload {
  return {
    amm: "--",
    pair: "--",
    lpLockPercent: "--",
    lpLockPlatform: "--",
    sniperTxCount: "--",
    ath: "--",
    low: "--"
  };
}

function emptyAiRisk(): AiRiskPayload {
  return {
    mechanism: "--",
    summary: [],
    risks: []
  };
}

function emptyHolderRisk(): HolderRiskPayload {
  return {
    lpLockPercent: "--",
    top10Pct: "--",
    topHolders: [],
    pairHolders: []
  };
}

function emptySmartSignal(): SmartSignalPayload {
  return {
    tag: "--",
    actionType: "--",
    actionCount: "--",
    firstSignalPrice: "--",
    currentMcap: "--",
    maxPriceChange: "--",
    leadWallet: "--",
    leadVolume: "--",
    headline: "--"
  };
}

function buildEmptyWalletRows(): EvidenceRow[] {
  return [
    {
      label: "Signal Wallet",
      value: "--",
      interpretation: "当前 token 信号里没有可用的真实动作钱包数据"
    },
    {
      label: "Signal Action",
      value: "--",
      interpretation: "当前 token 信号里没有可用的真实动作记录"
    },
    {
      label: "Wallet Win Rate",
      value: "--",
      interpretation: "没有真实动作钱包时，不展示泛化钱包胜率"
    },
    {
      label: "Token PnL",
      value: "--",
      interpretation: "没有真实动作钱包时，不展示 token 级钱包盈亏"
    },
    {
      label: "Latest Wallet Action",
      value: "--",
      interpretation: "当前 token 暂无可确认的钱包动作"
    },
    {
      label: "Backing Strength",
      value: "--",
      interpretation: "当前没有可确认的真实关联钱包"
    }
  ];
}

function buildDossierRows(
  candidate: Candidate,
  tokenDetail: Record<string, unknown>,
  pairDetail: Record<string, unknown> | null
): EvidenceRow[] {
  return [
    {
      label: "Token",
      value: `${candidate.symbol} / ${candidate.chain}`,
      interpretation: `当前价格 ${formatUsd(
        tokenDetail.current_price_usd
      )}，24h 变化 ${formatPercent(
        tokenDetail.price_change_24h ?? tokenDetail.token_price_change_24h
      )}`
    },
    {
      label: "Signal Stack",
      value: `Price ${formatPercent(
        tokenDetail.price_change_24h ?? tokenDetail.token_price_change_24h
      )} / Tx ${formatCount(
        tokenDetail.tx_count_24h ?? tokenDetail.token_tx_count_24h
      )}`,
      interpretation: "把价格变化和成交活跃度放在一起，先看是不是有真实交易支撑"
    },
    {
      label: "Pair Structure",
      value: pairDetail
        ? formatUsd(pairDetail.tvl ?? tokenDetail.main_pair_tvl)
        : candidate.liquidity,
      interpretation: "主交易对与流动性结构已加载，可直接判断是否属于过薄流动性"
    },
    {
      label: "Volume 24h",
      value: formatUsd(tokenDetail.tx_volume_u_24h ?? tokenDetail.token_tx_volume_usd_24h),
      interpretation: `交易次数 ${formatCount(
        tokenDetail.tx_count_24h ?? tokenDetail.token_tx_count_24h
      )}`
    },
    {
      label: "Market Cap",
      value: formatUsd(tokenDetail.market_cap),
      interpretation: `FDV ${formatUsd(tokenDetail.fdv)}`
    },
    {
      label: "Liquidity Bias",
      value:
        toNumber(pairDetail?.tvl ?? tokenDetail.main_pair_tvl) < 200_000
          ? "流动性偏薄"
          : "流动性可承接",
      interpretation: "这是监控页的第一层判断，决定是否值得继续看下去"
    },
    {
      label: "Address",
      value: shortAddress(candidate.address),
      interpretation: "当前选中标的的链上地址"
    }
  ];
}

function buildProjectProfile(
  tokenDetail: Record<string, unknown>,
  candidate: Candidate
): ProjectProfilePayload {
  const appendix = parseAppendix(tokenDetail.appendix);
  const introCn = String(tokenDetail.intro_cn ?? "").trim();
  const introEn = String(tokenDetail.intro_en ?? "").trim();
  const linkSources = [
    ["Website", appendix.website ?? appendix.dapp_url],
    ["Twitter", appendix.twitter],
    ["Telegram", appendix.telegram],
    ["Discord", appendix.discord]
  ] as const;

  return {
    name: String(tokenDetail.name ?? candidate.symbol ?? "--"),
    intro: introCn || introEn || "--",
    introCn: introCn || "--",
    introEn: introEn || "--",
    issuePlatform: String(tokenDetail.issue_platform ?? "--"),
    launchAt: formatDateTime(tokenDetail.launch_at ?? tokenDetail.created_at),
    holders: formatCount(tokenDetail.holders),
    mainPair: String(tokenDetail.main_pair ?? candidate.pairAddress ?? ""),
    links: linkSources
      .map(([label, value]) => ({ label, url: normalizeUrl(value) }))
      .filter((item) => item.url !== "")
  };
}

function buildMarketSnapshot(
  tokenDetail: Record<string, unknown>,
  pair: Record<string, unknown> | null
): MarketSnapshotPayload {
  const marketCap = tokenDetail.market_cap ?? pair?.market_cap ?? tokenDetail.fdv;

  return {
    price: formatUsd(tokenDetail.current_price_usd ?? pair?.token0_price_usd),
    marketCap: formatMarketCap(marketCap),
    fdv: formatUsd(tokenDetail.fdv ?? pair?.fdv),
    liquidity: formatUsd(pair?.tvl ?? tokenDetail.main_pair_tvl ?? tokenDetail.tvl),
    volume24h: formatUsd(tokenDetail.tx_volume_u_24h ?? tokenDetail.token_tx_volume_usd_24h ?? pair?.volume_u_24h),
    tx24h: formatCount(tokenDetail.tx_count_24h ?? tokenDetail.token_tx_count_24h ?? pair?.tx_24h_count)
  };
}

function buildMarketPressure(pair: Record<string, unknown> | null): MarketPressureRow[] {
  if (!pair) return [];

  const readPeriodValue = (period: string, names: string[]) => {
    const compact = period.replace("h", "H").replace("m", "M");
    const variants = names.flatMap((name) => [
      `${name}_${period}`,
      `${name}_${compact}`,
      `${name}_${period}_count`,
      `${name}_${compact}_count`,
      `${name}_count_${period}`,
      `${name}_count_${compact}`,
      `${name}_u_${period}`,
      `${name}_u_${compact}`,
      `${name}_usd_${period}`,
      `${name}_usd_${compact}`
    ]);
    for (const key of variants) {
      const value = pair[key];
      if (value !== undefined && value !== null && String(value) !== "") {
        return value;
      }
    }
    return undefined;
  };

  return ["1m", "5m", "15m", "1h", "4h", "24h"].map((period) => {
    const buyTx = readPeriodValue(period, ["buys_tx", "buy_tx", "buys", "buy"]);
    const sellTx = readPeriodValue(period, ["sells_tx", "sell_tx", "sells", "sell"]);
    const buyVolume = toNumber(readPeriodValue(period, ["buy_volume", "buy_vol", "volume_buy"]));
    const sellVolume = toNumber(readPeriodValue(period, ["sell_volume", "sell_vol", "volume_sell"]));
    const buyers = readPeriodValue(period, ["buyers", "buyer"]);
    const sellers = readPeriodValue(period, ["sellers", "seller"]);
    const makers = readPeriodValue(period, ["makers", "maker"]);
    const totalVolume = buyVolume + sellVolume;
    return {
      period,
      buyTx: formatCount(buyTx),
      sellTx: formatCount(sellTx),
      buyVolume: formatUsd(buyVolume),
      sellVolume: formatUsd(sellVolume),
      buyers: formatCount(buyers),
      sellers: formatCount(sellers),
      makers: formatCount(makers),
      buyRatio: totalVolume > 0 ? clamp((buyVolume / totalVolume) * 100, 0, 100) : 50
    };
  });
}

function buildPairStructure(pair: Record<string, unknown> | null): PairStructurePayload {
  if (!pair) return emptyPairStructure();
  return {
    amm: String(pair.amm ?? "--"),
    pair: String(pair.pair ?? ""),
    lpLockPercent: formatPercent(toNumber(pair.lp_locked_percent) * 100),
    lpLockPlatform: String(pair.lp_lock_platform ?? "--"),
    sniperTxCount: formatCount(pair.sniper_tx_count),
    ath: formatUsd(pair.price_ath_u),
    low: formatUsd(pair.low_u)
  };
}

function buildDexLiquidity(risk: Record<string, unknown>, tokenPairs: Array<Record<string, unknown>>): DexLiquidityRow[] {
  const dexRows = getList(risk.dex);
  const rows = dexRows.length > 0 ? dexRows : tokenPairs;
  return rows
    .slice(0, 5)
    .map((row) => ({
      name: String(row.name ?? `${row.amm ?? "--"}: ${row.token0_symbol ?? ""}/${row.token1_symbol ?? ""}`),
      amm: String(row.amm ?? "--"),
      pair: String(row.pair ?? row.pair_address ?? row.address ?? ""),
      liquidity: formatUsd(row.liquidity ?? row.tvl)
    }));
}

function buildLiquidityEvents(liqTxs: Array<Record<string, unknown>>): LiquidityEventPayload[] {
  return liqTxs.slice(0, 5).map((tx) => ({
    type: String(tx.type ?? "--"),
    amountUsd: formatUsd(tx.amount_usd),
    time: formatDateTime(tx.tx_time),
    wallet: String(tx.wallet_address ?? tx.sender ?? ""),
    tx: String(tx.transaction ?? "")
  }));
}

function buildAiRisk(risk: Record<string, unknown>): AiRiskPayload {
  const report = getRecord(risk.ai_report);
  const summary = getRecord(report.summary);
  const risks = getList(report.risk);

  return {
    mechanism: String(report.mechanism_zh ?? report.mechanism_en ?? "--"),
    summary: [
      { label: "Risk Level", value: String(summary.risk_level ?? risk.risk_level ?? "--") },
      { label: "Owner Renounced", value: String(summary.is_owner_renounced ?? "--") },
      { label: "Blacklist", value: String(summary.has_blacklist ?? risk.has_black_method ?? "--") },
      { label: "External Dependency", value: String(summary.has_external_dependency_risk ?? risk.external_call ?? "--") }
    ],
    risks: risks.slice(0, 3).map((item) => ({
      name: String(item.name_zh ?? item.name_en ?? "--"),
      level: String(item.risk_level ?? "--"),
      description: String(item.description_zh ?? item.description_en ?? "--"),
      ownerRelated: String(item.is_related_to_owner ?? "--")
    }))
  };
}

function toHolderRow(item: Record<string, unknown>) {
  return {
    address: String(item.address ?? ""),
    mark: String(item.mark ?? "--"),
    percent: `${asPercentNumber(item.percent ?? item.percentage).toFixed(2)}%`,
    quantity: formatCount(item.quantity)
  };
}

function buildHolderRisk(
  risk: Record<string, unknown>,
  holders: Array<Record<string, unknown>>
): HolderRiskPayload {
  const top10 = topHolderPct(holders);
  return {
    lpLockPercent: formatPercent(toNumber(risk.pair_lock_percent) * 100),
    top10Pct: holders.length > 0 ? `${top10.toFixed(2)}%` : "--",
    topHolders: holders.slice(0, 10).map(toHolderRow),
    pairHolders: getList(risk.pair_holders_rank).slice(0, 5).map(toHolderRow)
  };
}

function buildSmartSignal(
  signal: Record<string, unknown> | null,
  leadAction: Record<string, unknown> | null
): SmartSignalPayload {
  if (!signal) return emptySmartSignal();
  const actionCount = signal.action_count ?? signal.actionCount ?? signal.count;
  const firstPrice = signal.first_signal_price ?? signal.firstSignalPrice ?? signal.price;
  const currentMcap = signal.mc_cur ?? signal.mc ?? signal.market_cap ?? signal.marketCap;
  const maxChange = signal.max_price_change ?? signal.maxPriceChange ?? signal.price_change;
  const leadWallet =
    leadAction?.wallet_address ??
    leadAction?.wallet ??
    leadAction?.address ??
    signal.wallet_address ??
    signal.wallet;
  const leadVolume =
    leadAction?.quote_token_volume ??
    leadAction?.quote_token_amount ??
    leadAction?.volume_usd ??
    leadAction?.amount_usd ??
    signal.volume_usd;
  return {
    tag: String(signal.tag ?? signal.signal_tag ?? signal.type ?? "--"),
    actionType: String(signal.action_type ?? signal.actionType ?? leadAction?.action_type ?? leadAction?.actionType ?? "--"),
    actionCount: formatCount(actionCount),
    firstSignalPrice: formatUsd(firstPrice),
    currentMcap: formatMarketCap(currentMcap),
    maxPriceChange: formatPercent(toNumber(maxChange) * 100),
    leadWallet: String(leadWallet ?? ""),
    leadVolume: formatUsd(leadVolume),
    headline: String(signal.headline ?? signal.title ?? signal.tag ?? "--")
  };
}

function buildRiskRows(
  risk: Record<string, unknown>,
  holders: Array<Record<string, unknown>>,
  candidate: Candidate,
  liqTxs: Array<Record<string, unknown>>
): EvidenceRow[] {
  const top10 = holders
    .slice(0, 10)
    .reduce((sum, item) => sum + asPercentNumber(item.percentage ?? item.percent), 0);
  const riskLevelRaw = toNumber(risk.risk_level);
  const riskLevel =
    riskLevelRaw >= 2 ? "HIGH" : riskLevelRaw === 1 ? "MEDIUM" : riskLevelRaw === 0 ? "LOW" : String(risk.risk_level ?? "UNKNOWN");
  const honeypotFlag = toNumber(risk.is_honeypot);
  const taxAvailable =
    risk.buy_tax !== undefined || risk.sell_tax !== undefined;
  const latestLiquidityTx = liqTxs[0];
  const addCount = liqTxs.filter((item) => String(item.type) === "addLiquidity").length;
  const removeCount = liqTxs.filter((item) => String(item.type) === "removeLiquidity").length;
  const liquidityValue =
    latestLiquidityTx
      ? `${String(latestLiquidityTx.type)} / ${formatUsd(latestLiquidityTx.amount_usd)}`
      : "暂无近期事件";
  const liquidityInterpretation =
    latestLiquidityTx && String(latestLiquidityTx.type) === "removeLiquidity"
      ? "最近一笔是撤池，需要提高警惕"
      : removeCount > addCount
        ? "近期撤池次数高于加池，结构在变弱"
        : addCount > 0
          ? "最近仍有加池，流动性没有明显恶化"
          : "当前没有看到明显的流动性事件";

  return [
    {
      label: "Risk Level",
      value: riskLevel,
      interpretation: `Risk Score ${toNumber(risk.risk_score) || "--"}`
    },
    {
      label: "Taxes / Honeypot",
      value: taxAvailable
        ? `Buy ${toNumber(risk.buy_tax)} / Sell ${toNumber(risk.sell_tax)}`
        : "Buy N/A / Sell N/A",
      interpretation:
        honeypotFlag > 0
          ? "存在 honeypot 风险，建议回避"
          : honeypotFlag === 0 || honeypotFlag === -1
            ? "未见 honeypot 标记"
            : "当前没有明确 honeypot 结果"
    },
    {
      label: "Top 10 Holders",
      value: `${top10.toFixed(2)}%`,
      interpretation:
        top10 > 40
          ? "集中度偏高，需要谨慎"
          : "集中度处于可接受区间"
    },
    {
      label: "Liquidity Events",
      value: liquidityValue,
      interpretation: liquidityInterpretation
    },
    {
      label: "Contract Posture",
      value:
        toNumber(risk.can_take_back_ownership) > 0 ||
        toNumber(risk.owner_change_balance) > 0
          ? "权限偏敏感"
          : "权限相对稳定",
      interpretation: "用于识别 owner 权限是否仍然足以改变关键状态"
    },
    {
      label: "Guard Action",
      value:
        candidate.verdict === "回避"
          ? "阻断买入"
          : candidate.verdict === "观望"
            ? "保留观察"
            : "允许试算",
      interpretation: "Risk Guard 输出的不是描述，而是动作层级"
    },
    {
      label: "Decision",
      value: candidate.verdict,
      interpretation: "结合 risk 与 holders 后输出当前判断"
    }
  ];
}

function getSignalActions(signal: Record<string, unknown> | null): Array<Record<string, unknown>> {
  if (!signal) return [];
  return (
    getList(signal.actions).length > 0
      ? getList(signal.actions)
      : getList(signal.action_list).length > 0
        ? getList(signal.action_list)
        : getList(signal.list)
  ).sort(
    (left, right) =>
      toNumber(right.quote_token_volume ?? right.quote_token_amount) -
      toNumber(left.quote_token_volume ?? left.quote_token_amount)
  );
}

function normalizeActionType(value: unknown) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "--";
  if (normalized === "buy") return "BUY";
  if (normalized === "sell") return "SELL";
  return normalized.replace(/_/g, " ").toUpperCase();
}

function buildWalletRows(candidate: Candidate, context: SignalContext): EvidenceRow[] {
  const actions = getSignalActions(context.signal);
  const primaryAction = context.leadAction ?? actions[0] ?? null;
  const signalWalletAddress = getWalletAddress(primaryAction ?? context.signal ?? undefined);
  const signalWalletAlias = String(
    primaryAction?.wallet_alias ?? context.signal?.wallet_alias ?? ""
  ).trim();
  const signalTag = String(context.signal?.tag ?? "").trim();
  const primaryActionType = normalizeActionType(
    primaryAction?.action_type ?? primaryAction?.type ?? context.signal?.action_type
  );
  const actionCount =
    toNumber(context.signal?.action_count ?? context.signal?.actionCount ?? context.signal?.count) ||
    actions.length;
  const signalVolume = formatUsd(
    primaryAction?.quote_token_volume ??
      primaryAction?.quote_token_amount ??
      primaryAction?.volume_usd ??
      primaryAction?.amount_usd ??
      context.signal?.volume_usd
  );
  const walletWinRate = toNumber(context.walletInfo?.total_win_ratio);
  const tokenProfit = toNumber(context.tokenPnl?.profit_realized);
  const latestTx = context.walletTxs[0];
  const latestDirection =
    latestTx && String(latestTx.to_address).toLowerCase() === candidate.address.toLowerCase()
      ? "买入"
      : latestTx && String(latestTx.from_address).toLowerCase() === candidate.address.toLowerCase()
        ? "卖出"
        : "";
  const latestActionValue =
    latestTx
      ? `${normalizeActionType(latestTx.action_type ?? latestTx.type)} / ${String(latestTx.from_symbol ?? "--")} -> ${String(latestTx.to_symbol ?? "--")}`
      : primaryActionType;
  const relatedWallets = Array.from(
    new Set(
      actions
        .map((item) => getWalletAddress(item))
        .filter((value) => isValidWalletAddress(candidate.chain, value))
    )
  );
  const displayWalletAddress = signalWalletAddress || relatedWallets[0] || "";
  const relatedWalletCount = relatedWallets.length > 0 ? relatedWallets.length : displayWalletAddress ? 1 : 0;

  if (!signalWalletAddress && relatedWallets.length === 0) {
    return buildEmptyWalletRows();
  }

  return [
    {
      label: "Signal Wallet",
      value: signalWalletAlias
        ? `${signalWalletAlias} / ${shortAddress(displayWalletAddress)}`
        : shortAddress(displayWalletAddress),
      interpretation: "只展示当前 token 信号里真实出现并实际参与动作的钱包"
    },
    {
      label: "Signal Action",
      value:
        signalTag && actionCount > 0
          ? `${signalTag} / ${actionCount}`
          : primaryActionType !== "--" && actionCount > 0
            ? `${primaryActionType} / ${actionCount}`
            : signalTag || primaryActionType || (actionCount > 0 ? String(actionCount) : "--"),
      interpretation:
        signalVolume !== "--"
          ? `当前主动作金额约 ${signalVolume}`
          : "只统计当前 token 信号里的真实动作次数"
    },
    {
      label: "Wallet Win Rate",
      value: Number.isFinite(walletWinRate) ? `${walletWinRate.toFixed(2)}%` : "--",
      interpretation: "仅在 AVE 返回该真实动作钱包的历史胜率时展示"
    },
    {
      label: "Token PnL",
      value: Number.isFinite(tokenProfit) ? formatUsd(tokenProfit) : "--",
      interpretation: "仅展示该真实动作钱包在当前 token 上的已实现盈亏"
    },
    {
      label: "Latest Wallet Action",
      value: latestActionValue || "--",
      interpretation: latestDirection ? `最近一次确认方向为${latestDirection}` : "当前没有更多可确认的钱包动作细节"
    },
    {
      label: "Backing Strength",
      value: relatedWalletCount > 0 ? String(relatedWalletCount) : "--",
      interpretation: "这里表示当前 token 信号里可确认的真实关联钱包数量"
    }
  ];
}

function findTokenSignal(
  signals: Array<Record<string, unknown>>,
  candidate: Candidate
) {
  return findRawTokenSignal(signals, candidate.address, candidate.symbol);
}

function findRawTokenSignal(
  signals: Array<Record<string, unknown>>,
  address: string,
  symbol: string
) {
  const candidateAddress = address.toLowerCase();
  const matched =
    signals.find((item) => String(item.token ?? "").toLowerCase() === candidateAddress) ??
    signals.find((item) => String(item.token_address ?? "").toLowerCase() === candidateAddress) ??
    signals.find((item) => String(item.tokenAddress ?? "").toLowerCase() === candidateAddress) ??
    signals.find((item) => String(item.contract_address ?? "").toLowerCase() === candidateAddress) ??
    signals.find((item) => String(item.contractAddress ?? "").toLowerCase() === candidateAddress) ??
    signals.find((item) => String(item.mint ?? "").toLowerCase() === candidateAddress) ??
    signals.find((item) => String(item.ca ?? "").toLowerCase() === candidateAddress) ??
    signals.find((item) => String(item.address ?? "").toLowerCase() === candidateAddress) ??
    signals.find((item) => String(item.symbol ?? "").toUpperCase() === symbol.toUpperCase()) ??
    null;

  if (!matched) {
    return { signal: null, leadAction: null };
  }

  const actions = getSignalActions(matched);

  return {
    signal: matched,
    leadAction: actions[0] ?? null
  };
}

async function loadDetailSignals(
  chain: string,
  address: string,
  symbol: string
) {
  const collected: Array<Record<string, unknown>> = [];

  for (let pageNO = 1; pageNO <= DETAIL_SIGNAL_MAX_PAGES; pageNO += 1) {
    const response = await apiGet("/signals/public/list", {
      chain,
      pageSize: DETAIL_SIGNAL_PAGE_SIZE,
      pageNO
    }).catch(() => ({ data: [] }));
    const rows = getList(unwrapData<Array<Record<string, unknown>>>(response));

    if (rows.length === 0) {
      break;
    }

    collected.push(...rows);

    if (findRawTokenSignal(rows, address, symbol).signal) {
      break;
    }

    if (rows.length < DETAIL_SIGNAL_PAGE_SIZE) {
      break;
    }
  }

  return collected;
}

function buildOpportunityRows(
  candidate: Candidate,
  riskRows: EvidenceRow[],
  mode: DataMode,
  trade: TradePreview
): EvidenceRow[] {
  const riskValue = riskRows[0]?.value ?? "UNKNOWN";
  const executionReady = mode === "live" ? "数据已连通" : "等待 AVE key";
  const signalTagText =
    trade.signalTags.length > 0 ? trade.signalTags.slice(0, 3).join(" / ") : "no-signal-tag";

  return [
    {
      label: "Signal",
      value: `${candidate.symbol} -> ${candidate.verdict}`,
      interpretation: "候选排序、风险过滤与钱包视角共同给出信号"
    },
    {
      label: "Signal Tags",
      value: signalTagText,
      interpretation: "信号标签来自交易对动态标签和当前动量结构"
    },
    {
      label: "Risk Gate",
      value: String(riskValue),
      interpretation: "风险门未通过时应直接阻断执行"
    },
    {
      label: "Execution Readiness",
      value: executionReady,
      interpretation: "拿到正式 key 与交易权限后可切到真实试算链路"
    },
    {
      label: "Position Watch",
      value: "15m / 1h / 4h",
      interpretation: "交易层不会脱离监控层，执行后仍要回到监控周期里"
    },
    {
      label: "Dry Run Basis",
      value: `${trade.baseSymbol} route / ${trade.route}`,
      interpretation: "当前试算基于最新价格、流动性和主要路由结构"
    }
  ];
}

function toSignalTags(pair: Record<string, unknown>, candidate: Candidate) {
  const dynamicTag = pair.dynamic_tag;
  const tags: string[] = [];

  if (typeof dynamicTag === "string" && dynamicTag.trim() !== "") {
    const trimmed = dynamicTag.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as string[];
        parsed.forEach((item) => {
          const normalized = item
            .replace(/^signal-/, "")
            .replace(/-green-\d+-\d+$/, "")
            .replace(/-red-\d+-\d+$/, "")
            .replace(/-/g, " ");
          if (normalized) tags.push(normalized);
        });
      } catch {
        tags.push(trimmed);
      }
    } else {
      tags.push(trimmed);
    }
  }

  if (tags.length === 0) {
    tags.push(candidate.verdict === "可做" ? "momentum confirm" : "risk first");
  }

  return tags;
}

function buildTradePreview(
  candidate: Candidate,
  tokenDetail: Record<string, unknown>,
  pair: Record<string, unknown> | null
): TradePreview {
  const token0Address = String(pair?.token0_address ?? "");
  const token1Address = String(pair?.token1_address ?? "");
  const candidateAddress = candidate.address.toLowerCase();
  const candidateIsToken1 =
    token1Address !== "" && token1Address.toLowerCase() === candidateAddress;
  const baseTokenAddress = candidateIsToken1 ? token0Address : token1Address;
  const baseTokenDecimals = toNumber(
    candidateIsToken1 ? pair?.token0_decimal : pair?.token1_decimal
  ) || (candidate.chain === "Solana" ? 9 : 18);
  const baseTokenPriceUsd = toNumber(
    candidateIsToken1 ? pair?.token0_price_usd : pair?.token1_price_usd
  );
  const tokenDecimals = toNumber(
    candidateIsToken1 ? pair?.token1_decimal : pair?.token0_decimal ?? tokenDetail.decimal
  ) || 6;
  const baseSymbol = String(
    (candidateIsToken1 ? pair?.token0_symbol : pair?.token1_symbol) ??
      (candidate.chain === "Solana" ? "SOL" : candidate.chain === "BSC" ? "BNB" : "ETH")
  );
  const priceUsd = toNumber(
    tokenDetail.current_price_usd ??
      (candidateIsToken1 ? pair?.token1_price_usd : pair?.token0_price_usd)
  );
  const liquidityUsd = toNumber(pair?.tvl ?? tokenDetail.main_pair_tvl ?? tokenDetail.tvl);
  const priceChange1h = toNumber(pair?.price_change_1h ?? tokenDetail.price_change_1h ?? tokenDetail.token_price_change_1h);
  const priceChange24h = toNumber(pair?.price_change_24h ?? tokenDetail.price_change_24h ?? tokenDetail.token_price_change_24h);
  const txCount1h = toNumber(pair?.tx_1h_count ?? tokenDetail.token_tx_count_1h);
  const txCount24h = toNumber(pair?.tx_24h_count ?? tokenDetail.tx_count_24h ?? tokenDetail.token_tx_count_24h);

  return {
    priceUsd,
    liquidityUsd,
    priceChange1h,
    priceChange24h,
    txCount1h,
    txCount24h,
    route: String(pair?.amm ?? tokenDetail.issue_platform ?? "main pair"),
    baseSymbol,
    baseTokenAddress,
    baseTokenDecimals,
    baseTokenPriceUsd,
    tokenDecimals,
    signalTags: toSignalTags(pair ?? {}, candidate)
  };
}

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function classifyLookupInput(rawInput: string): "text" | "invalid" | "solana" | "evm" {
  const trimmed = rawInput.trim();
  if (!trimmed) return "text";
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return "evm";
  if (/^0x/i.test(trimmed)) return "invalid";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return "solana";
  if (!/\s/.test(trimmed) && trimmed.length >= 20) return "invalid";
  return "text";
}

function isValidWalletAddress(chain: Candidate["chain"], value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (isEvmChain(chain)) {
    return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
  }

  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
}

function getWalletAddress(payload: Record<string, unknown> | undefined) {
  if (!payload) return "";
  return (
    (payload.address as string | undefined) ??
    (payload.wallet_address as string | undefined) ??
    (payload.wallet as string | undefined) ??
    ""
  );
}

function verdictFromRadarBand(
  chain: Candidate["chain"],
  score: number,
  radarCandidates: Candidate[]
): Candidate["verdict"] {
  const chainCandidates = radarCandidates.filter((candidate) => candidate.chain === chain);
  if (chainCandidates.length === 0) return "观望";

  const actionableFloor = Math.min(
    ...chainCandidates
      .filter((candidate) => candidate.verdict === "可做")
      .map((candidate) => candidate.score)
  );
  const avoidCeiling = Math.max(
    ...chainCandidates
      .filter((candidate) => candidate.verdict === "回避")
      .map((candidate) => candidate.score)
  );

  if (Number.isFinite(actionableFloor) && score >= actionableFloor) return "可做";
  if (Number.isFinite(avoidCeiling) && score <= avoidCeiling) return "回避";
  return "观望";
}

function buildLookupCandidate(
  chain: Candidate["chain"],
  address: string,
  tokenDetail: Record<string, unknown>,
  tokenPairs: Array<Record<string, unknown>>,
  risk: Record<string, unknown>,
  signal: Record<string, unknown> | null,
  leadAction: Record<string, unknown> | null,
  radarCandidates: Candidate[]
): Candidate | null {
  const pairAddress =
    String(tokenDetail.main_pair ?? tokenPairs[0]?.pair ?? tokenPairs[0]?.pair_address ?? "") || undefined;
  const seed = {
    ...tokenDetail,
    token: address,
    address,
    token_address: address,
    main_pair: pairAddress ?? tokenDetail.main_pair,
    symbol: String(tokenDetail.symbol ?? "UNKNOWN")
  };
  const holders = getList(risk.token_holders_rank);
  const ranking = rankRadarCandidate(seed, risk, holders, signal, leadAction);
  const baseCandidate = toCandidate(seed, chain, ranking);
  if (!baseCandidate) return null;
  return {
    ...baseCandidate,
    pairAddress,
    verdict: verdictFromRadarBand(chain, ranking.score, radarCandidates)
  };
}

function matchesChainAddress(
  chain: Candidate["chain"],
  left: string,
  right: string
) {
  if (chain === "Solana") {
    return left.trim() === right.trim();
  }
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

async function lookupCandidateOnChain(
  chain: Candidate["chain"],
  address: string,
  radarCandidates: Candidate[]
): Promise<AddressLookupMatch | null> {
  const existing = radarCandidates.find(
    (candidate) => candidate.chain === chain && matchesChainAddress(chain, candidate.address, address)
  );
  if (existing) {
    return {
      chain,
      candidate: existing,
      existing: true
    };
  }

  if (!hasLiveConfig()) {
    return null;
  }

  try {
    const apiChain = toApiChain(chain);
    const tokenDetailResponse = await apiGet(`/tokens/${address}-${apiChain}`);
    const tokenEnvelope = getRecord(unwrapData<Record<string, unknown>>(tokenDetailResponse));
    const tokenDetail = getRecord(tokenEnvelope.token);
    if (Object.keys(tokenDetail).length === 0) {
      return null;
    }
    const tokenPairs = getList(tokenEnvelope.pairs);
    const symbol = String(tokenDetail.symbol ?? "UNKNOWN");
    const [riskResponse, signals] = await Promise.all([
      apiGet(`/contracts/${address}-${apiChain}`).catch(() => ({ data: null })),
      loadDetailSignals(apiChain, address, symbol).catch(() => [] as Array<Record<string, unknown>>)
    ]);
    const risk = getRecord(unwrapData<Record<string, unknown> | null>(riskResponse));
    const { signal, leadAction } = findRawTokenSignal(signals, address, symbol);
    const candidate = buildLookupCandidate(
      chain,
      address,
      tokenDetail,
      tokenPairs,
      risk,
      signal,
      leadAction,
      radarCandidates
    );

    if (!candidate) return null;
    return {
      chain,
      candidate,
      existing: false
    };
  } catch {
    return null;
  }
}

export async function loadRadarPayload(
  onProgress?: (payload: RadarPayload) => void,
  sourceLimit: number = RADAR_SOURCE_PAGE_SIZE
): Promise<RadarPayload> {
  if (!hasLiveConfig()) {
    return fallbackRadar(
      "mock",
      "AVE API key 未配置，当前使用本地样本数据。"
    );
  }

  try {
    const sourceRows: Array<{
      item: Record<string, unknown>;
      chain: Candidate["chain"];
      signals: Array<Record<string, unknown>>;
    }> = [];
    const progressiveCandidates: Candidate[] = [];

    for (const chain of radarChains) {
      const trendingItems = await loadTrendingItems(chain.api, sourceLimit).catch(() => [] as Array<Record<string, unknown>>);
      const signalResponse = await apiGet("/signals/public/list", {
          chain: chain.api,
          pageSize: RADAR_SIGNAL_PAGE_SIZE,
          pageNO: 1
        }).catch(() => ({ data: [] }));
      const signals = getList(unwrapData<Array<Record<string, unknown>>>(signalResponse));
      const rows = trendingItems.map((item) => ({
        item,
        chain: chain.label,
        signals
      }));
      const chainCandidates = rows
        .map((row) => toCandidate(row.item, row.chain))
        .filter((candidate): candidate is Candidate => Boolean(candidate));

      sourceRows.push(...rows);
      progressiveCandidates.push(...chainCandidates);

      const candidates = selectRadarCandidates(
        progressiveCandidates.sort((left, right) => right.score - left.score),
        sourceLimit
      );

      if (candidates.length > 0) {
        onProgress?.({
          mode: "live",
          note: `已追加 ${chain.label} live 候选，本轮每链最多拉取 ${sourceLimit} 个 AVE trending token，正在继续加载其他链与风险补充。`,
          metrics: buildSummaryMetrics(candidates),
          candidates
        });
      }
    }

    if (sourceRows.length === 0) {
      throw new Error("No trending rows returned");
    }

    const enrichKeys = new Set(
      radarChains.flatMap((chain) =>
        sourceRows
          .filter((row) => row.chain === chain.label)
          .map((row) => {
            const address =
              (row.item.token as string | undefined) ??
              (row.item.address as string | undefined) ??
              (row.item.token_address as string | undefined) ??
              "";
            const candidate = toCandidate(row.item, row.chain);
            return {
              key: `${row.chain}-${address}`,
              score: candidate?.score ?? 0
            };
          })
          .filter((row) => row.key !== `${chain.label}-`)
          .sort((left, right) => right.score - left.score)
          .slice(0, RADAR_RISK_ENRICH_PER_CHAIN)
          .map((row) => row.key)
      )
    );

    const rankedCandidates = (await mapWithConcurrency(sourceRows, RADAR_RISK_CONCURRENCY, async (row) => {
      const address =
        (row.item.token as string | undefined) ??
        (row.item.address as string | undefined) ??
        (row.item.token_address as string | undefined);
      const symbol = String(row.item.symbol ?? "UNKNOWN");

      if (!address) {
        return null;
      }

      if (!enrichKeys.has(`${row.chain}-${address}`)) {
        return toCandidate(row.item, row.chain);
      }

      await sleep(RADAR_RISK_REQUEST_GAP_MS);
      const riskResponse = await apiGet(`/contracts/${address}-${toApiChain(row.chain)}`).catch(
        () => ({ data: null })
      );
      const risk = getRecord(unwrapData<Record<string, unknown> | null>(riskResponse));
      const holders = getList(risk.token_holders_rank);
      const { signal, leadAction } = findRawTokenSignal(row.signals, address, symbol);
      const ranking = rankRadarCandidate(row.item, risk, holders, signal, leadAction);

      return toCandidate(row.item, row.chain, ranking);
    }))
      .filter((candidate): candidate is Candidate => Boolean(candidate))
      .sort((left, right) => right.score - left.score);
    const candidates = selectRadarCandidates(rankedCandidates, sourceLimit);

    if (candidates.length === 0) {
      throw new Error("No candidate rows returned");
    }

    return {
      mode: "live",
      note: `已连接 AVE API，Radar 从 Solana / BSC / Base / Ethereum trending 各取最多 ${sourceLimit} 个，优先补充每链前 ${RADAR_RISK_ENRICH_PER_CHAIN} 个候选的风险与持仓，再用 SENTINEL-8 八维模型（流动性 L、成交 V、动量 M、活跃度 A、集中度 C、风险 R、信号 S、周期 F）打分，并按每链分位数确保三档齐全。`,
      metrics: buildSummaryMetrics(candidates),
      candidates
    };
  } catch (error) {
    return fallbackRadar(
      "fallback",
      `AVE API 请求失败，当前使用备用数据：${(error as Error).message}`
    );
  }
}

export async function lookupTokenByAddress(
  rawInput: string,
  radarCandidates: Candidate[]
): Promise<AddressLookupResult> {
  const normalized = rawInput.trim();
  const inputType = classifyLookupInput(normalized);

  if (inputType === "text" || inputType === "invalid") {
    return {
      status: "invalid",
      note: "请输入有效的 Solana 或 EVM 代币合约地址。"
    };
  }

  if (inputType === "solana") {
    const match = await lookupCandidateOnChain("Solana", normalized, radarCandidates);
    if (!match) {
      return {
        status: "not_found",
        note: "该地址未在支持链上找到可分析代币。"
      };
    }
    return {
      status: "resolved",
      candidate: match.candidate,
      existing: match.existing,
      note: match.existing
        ? "该地址已在当前候选池中，已直接切换到现有标的。"
        : "已按地址加载单币分析，不计入 Radar 候选统计。"
    };
  }

  const evmHits = (
    await Promise.all([
      lookupCandidateOnChain("BSC", normalized, radarCandidates),
      lookupCandidateOnChain("Base", normalized, radarCandidates),
      lookupCandidateOnChain("Ethereum", normalized, radarCandidates)
    ])
  ).filter((match): match is AddressLookupMatch => Boolean(match));

  if (evmHits.length === 0) {
    return {
      status: "not_found",
      note: "该地址未在支持链上找到可分析代币。"
    };
  }

  if (evmHits.length === 1) {
    const match = evmHits[0];
    return {
      status: "resolved",
      candidate: match.candidate,
      existing: match.existing,
      note: match.existing
        ? "该地址已在当前候选池中，已直接切换到现有标的。"
        : "已按地址加载单币分析，不计入 Radar 候选统计。"
    };
  }

  return {
    status: "ambiguous",
    matches: evmHits,
    note: "该地址在多条 EVM 链上均有命中，请选择要查看的链。"
  };
}

export async function loadDetailPayload(
  candidate: Candidate
): Promise<DetailPayload> {
  if (!hasLiveConfig()) {
    return fallbackDetails(
      "mock",
      "未配置 AVE API key，详情模块使用本地样本数据。",
      candidate.address
    );
  }

  try {
    const chain = toApiChain(candidate.chain);
    const [tokenDetailResponse, riskResponse, signals, pairResponse] =
      await Promise.all([
        apiGet(`/tokens/${candidate.address}-${chain}`),
        apiGet(`/contracts/${candidate.address}-${chain}`),
        loadDetailSignals(chain, candidate.address, candidate.symbol),
        candidate.pairAddress
          ? apiGet(`/pairs/${candidate.pairAddress}-${chain}`)
          : Promise.resolve({ data: null })
      ]);

    const tokenEnvelope = getRecord(unwrapData<Record<string, unknown>>(tokenDetailResponse));
    const tokenDetail = getRecord(tokenEnvelope.token);
    const tokenPairs = getList(tokenEnvelope.pairs);
    const risk = getRecord(unwrapData<Record<string, unknown>>(riskResponse));
    const holders = getList(risk.token_holders_rank);
    const rawPair = unwrapData<Record<string, unknown> | null>(pairResponse);
    const pair =
      rawPair && Object.keys(rawPair).length > 0
        ? getRecord(rawPair)
        : tokenPairs[0] ?? null;
    const { signal, leadAction } = findTokenSignal(signals, candidate);
    const signalWalletAddress = getWalletAddress(leadAction ?? signal ?? undefined);
    const liqTxResponse =
      candidate.pairAddress
        ? await apiGet(`/txs/liq/${candidate.pairAddress}-${chain}`, {
            limit: 5,
            sort: "desc",
            type: "all"
          }).catch(() => ({ data: null }))
        : { data: null };
    const liqTxEnvelope = getRecord(unwrapData<Record<string, unknown> | null>(liqTxResponse));
    const liqTxs = getList(liqTxEnvelope.txs);
    const riskRows = buildRiskRows(risk, holders, candidate, liqTxs);
    const trade = buildTradePreview(candidate, tokenDetail, pair);
    const projectProfile = buildProjectProfile(tokenDetail, candidate);
    const marketSnapshot = buildMarketSnapshot(tokenDetail, pair);

    return {
      address: candidate.address,
      walletHintAddress: signalWalletAddress,
      mode: "live",
      note: `已连接 AVE API，当前查看 ${candidate.symbol} 的真实详情。`,
      dossier: buildDossierRows(candidate, tokenDetail, pair),
      wallet: [],
      risk: riskRows,
      opportunity: buildOpportunityRows(candidate, riskRows, "live", trade),
      replay: replayCases,
      trade,
      projectProfile,
      marketSnapshot,
      marketPressure: buildMarketPressure(pair),
      pairStructure: buildPairStructure(pair),
      dexLiquidity: buildDexLiquidity(risk, tokenPairs),
      liquidityEvents: buildLiquidityEvents(liqTxs),
      aiRisk: buildAiRisk(risk),
      holderRisk: buildHolderRisk(risk, holders),
      smartSignal: buildSmartSignal(signal, leadAction),
      scoreModel: buildScoreModel(candidate, tokenDetail, risk, holders, signal, leadAction)
    };
  } catch (error) {
    return fallbackDetails(
      "fallback",
      `详情请求失败，当前使用备用数据：${(error as Error).message}`,
      candidate.address
    );
  }
}

export async function loadExecutionPrepPayload(
  candidate: Candidate,
  trade: TradePreview,
  quote: QuotePayload,
  hints: TradeHintsPayload,
  walletAddress: string
): Promise<ExecutionPrepPayload> {
  const normalizedWallet = walletAddress.trim();

  if (!hasLiveConfig()) {
    return {
      mode: "mock",
      source: "mock",
      note: "未配置 AVE API key，当前不生成官方预构建交易。",
      requestTxId: "",
      creatorAddress: normalizedWallet,
      estimateTokens: 0,
      minReturnTokens: 0,
      appliedSlippage: 0,
      txTarget: "",
      txValue: "",
      gasLimit: "",
      priorityFee: "",
      bundleTip: "",
      recentBlockhash: "",
      amms: [],
      txPreviewSize: 0
    };
  }

  if (!isValidWalletAddress(candidate.chain, normalizedWallet)) {
    return {
      mode: "fallback",
      source: "fallback",
      note: `${candidate.chain} 钱包地址格式不正确，当前不生成预构建交易。`,
      requestTxId: "",
      creatorAddress: normalizedWallet,
      estimateTokens: 0,
      minReturnTokens: 0,
      appliedSlippage: 0,
      txTarget: "",
      txValue: "",
      gasLimit: "",
      priorityFee: "",
      bundleTip: "",
      recentBlockhash: "",
      amms: [],
      txPreviewSize: 0
    };
  }

  if (!Number.isFinite(quote.inputAmount) || quote.inputAmount <= 0) {
    return {
      mode: "fallback",
      source: "fallback",
      note: "需要先拿到有效 quote，才能生成官方预构建交易。",
      requestTxId: "",
      creatorAddress: normalizedWallet,
      estimateTokens: 0,
      minReturnTokens: 0,
      appliedSlippage: 0,
      txTarget: "",
      txValue: "",
      gasLimit: "",
      priorityFee: "",
      bundleTip: "",
      recentBlockhash: "",
      amms: [],
      txPreviewSize: 0
    };
  }

  const slippage = String(hints.slippageBps || 1000);
  const rawInputAmount = toRawUnits(quote.inputAmount, trade.baseTokenDecimals);

  try {
    const response =
      candidate.chain === "Solana"
        ? await tradePost("/v1/thirdParty/chainWallet/createSolanaTx", {
            creatorAddress: normalizedWallet,
            inAmount: rawInputAmount,
            inTokenAddress: resolveQuoteInputToken(candidate, trade),
            outTokenAddress: candidate.address,
            swapType: "buy",
            slippage,
            fee: hints.gasTipAverage !== "--" ? hints.gasTipAverage : "1000000"
          })
        : await tradePost("/v1/thirdParty/chainWallet/createEvmTx", {
            chain: toApiChain(candidate.chain),
            creatorAddress: normalizedWallet,
            inAmount: rawInputAmount,
            inTokenAddress: resolveQuoteInputToken(candidate, trade),
            outTokenAddress: candidate.address,
            swapType: "buy",
            slippage,
            autoSlippage: hints.slippageBps > 0
          });

    const data = getRecord(unwrapData<Record<string, unknown>>(response));
    const txContent = data.txContent;
    const txPreviewSize =
      typeof txContent === "string"
        ? txContent.length
        : Object.keys(getRecord(txContent)).length;

    return {
      mode: "live",
      source: "official",
      note: "已生成官方未签名交易预构建，可用于下一步本地签名或外部签名。",
      requestTxId: String(data.requestTxId ?? ""),
      creatorAddress: normalizedWallet,
      estimateTokens: fromRawUnits(data.estimateOut, trade.tokenDecimals),
      minReturnTokens: fromRawUnits(data.minReturn, trade.tokenDecimals),
      appliedSlippage: toNumber(data.slippage),
      txTarget:
        typeof txContent === "string"
          ? "solana unsigned tx"
          : String(getRecord(txContent).to ?? ""),
      txValue:
        typeof txContent === "string"
          ? String(data.inAmount ?? "")
          : String(getRecord(txContent).value ?? ""),
      gasLimit: String(data.gasLimit ?? ""),
      priorityFee: String(data.priorityFee ?? ""),
      bundleTip: String(data.bundleTip ?? ""),
      recentBlockhash: String(data.recentBlockhash ?? ""),
      amms: getStringList(data.amms),
      txPreviewSize
    };
  } catch (error) {
    return {
      mode: "fallback",
      source: "fallback",
      note: `官方预构建交易请求失败：${(error as Error).message}`,
      requestTxId: "",
      creatorAddress: normalizedWallet,
      estimateTokens: 0,
      minReturnTokens: 0,
      appliedSlippage: 0,
      txTarget: "",
      txValue: "",
      gasLimit: "",
      priorityFee: "",
      bundleTip: "",
      recentBlockhash: "",
      amms: [],
      txPreviewSize: 0
    };
  }
}

function resolveQuoteInputToken(candidate: Candidate, trade: TradePreview) {
  if (candidate.chain === "Solana") {
    if (trade.baseSymbol.toUpperCase() === "SOL" || trade.baseTokenAddress === "So11111111111111111111111111111111111111112") {
      return "sol";
    }
  }

  if (candidate.chain === "BSC" && trade.baseSymbol.toUpperCase().includes("BNB")) {
    return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  }

  if (isEvmChain(candidate.chain) && trade.baseSymbol.toUpperCase().includes("ETH")) {
    return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  }

  return trade.baseTokenAddress;
}

export async function loadQuotePayload(
  candidate: Candidate,
  trade: TradePreview,
  budgetUsd: number
): Promise<QuotePayload> {
  const derivedTokens = trade.priceUsd > 0 ? budgetUsd / trade.priceUsd : 0;

  if (!hasLiveConfig()) {
    return {
      mode: "mock",
      source: "mock",
      note: "未配置 AVE API key，当前仅显示本地试算。",
      estimatedTokens: derivedTokens,
      inputAmount: 0,
      inputSymbol: trade.baseSymbol,
      spender: ""
    };
  }

  if (!Number.isFinite(budgetUsd) || budgetUsd <= 0) {
    return {
      mode: "live",
      source: "derived",
      note: "输入预算后即可请求官方 quote。",
      estimatedTokens: 0,
      inputAmount: 0,
      inputSymbol: trade.baseSymbol,
      spender: ""
    };
  }

  const inputAmount = trade.baseTokenPriceUsd > 0 ? budgetUsd / trade.baseTokenPriceUsd : 0;

  if (inputAmount <= 0) {
    return {
      mode: "fallback",
      source: "derived",
      note: "缺少基础报价，暂时保留本地试算。",
      estimatedTokens: derivedTokens,
      inputAmount: 0,
      inputSymbol: trade.baseSymbol,
      spender: ""
    };
  }

  try {
    const response = await tradePost("/v1/thirdParty/chainWallet/getAmountOut", {
      chain: toApiChain(candidate.chain),
      inAmount: toRawUnits(inputAmount, trade.baseTokenDecimals),
      inTokenAddress: resolveQuoteInputToken(candidate, trade),
      outTokenAddress: candidate.address,
      swapType: "buy"
    });

    const quote = getRecord(unwrapData<Record<string, unknown>>(response));
    if (!quote.estimateOut) {
      throw new Error("quote response missing estimateOut");
    }
    const decimals = toNumber(quote.decimals) || trade.tokenDecimals;
    const estimatedTokens = fromRawUnits(quote.estimateOut, decimals);

    return {
      mode: "live",
      source: "official",
      note: "Dry Run 已切换到 AVE 官方 quote。",
      estimatedTokens,
      inputAmount,
      inputSymbol: trade.baseSymbol,
      spender: String(quote.spender ?? "")
    };
  } catch (error) {
    return {
      mode: "fallback",
      source: "derived",
      note: `官方 quote 请求失败，暂时使用本地试算：${(error as Error).message}`,
      estimatedTokens: derivedTokens,
      inputAmount,
      inputSymbol: trade.baseSymbol,
      spender: ""
    };
  }
}

export async function loadTradeHintsPayload(
  candidate: Candidate
): Promise<TradeHintsPayload> {
  if (!hasLiveConfig()) {
    return {
      mode: "mock",
      note: "未配置 AVE API key，当前不显示官方滑点与费率建议。",
      slippageBps: 0,
      gasTipAverage: "--",
      gasTipHigh: "--"
    };
  }

  try {
    const chain = toApiChain(candidate.chain);
    const [slippageResponse, gasTipResponse] = await Promise.all([
      tradePost("/v1/thirdParty/chainWallet/getAutoSlippage", {
        chain,
        tokenAddress: candidate.address,
        useMev: false
      }),
      tradeGet("/v1/thirdParty/chainWallet/getGasTip")
    ]);

    const slippage = getRecord(unwrapData<Record<string, unknown>>(slippageResponse));
    const gasTips = getList(unwrapData<Array<Record<string, unknown>>>(gasTipResponse));
    const gasTipMatch =
      gasTips.find(
        (item) =>
          String(item.chain) === chain &&
          (chain === "solana" ? Boolean(item.mev) === false : true)
      ) ?? gasTips.find((item) => String(item.chain) === chain) ?? null;

    return {
      mode: "live",
      note: "已连接 AVE 官方推荐滑点与费率。",
      slippageBps: toNumber(slippage.slippage),
      gasTipAverage: gasTipMatch ? String(gasTipMatch.average ?? "--") : "--",
      gasTipHigh: gasTipMatch ? String(gasTipMatch.high ?? "--") : "--"
    };
  } catch (error) {
    return {
      mode: "fallback",
      note: `官方滑点或费率请求失败：${(error as Error).message}`,
      slippageBps: 0,
      gasTipAverage: "--",
      gasTipHigh: "--"
    };
  }
}
