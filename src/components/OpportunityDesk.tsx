import { useEffect, useRef, useState } from "react";
import type { Candidate, TradePreview } from "../data/mock";
import type {
  DelegateOrderStatusPayload,
  DelegateOrderType,
  DelegateWalletRecord,
  ManualBuildPayload,
  ManualQuotePayload,
  ManualSendPayload,
  ManualTradeHintsPayload,
  TradeSide
} from "../lib/trade";
import {
  buildManualTransaction,
  createDelegateWallet,
  getManualInputContext,
  loadDelegateWallets,
  loadManualQuote,
  loadManualTradeHints,
  manualTradeNeedsApproval,
  queryDelegateApproval,
  queryDelegateOrderStatus,
  sendSignedEvmTransaction,
  sendSignedSolanaTransaction,
  submitDelegateApproval,
  submitDelegateOrder
} from "../lib/trade";
import {
  connectSolanaWallet,
  getCurrentConnectedWalletAddress,
  getManualWalletTokenBalance,
  sendRawSolanaTransaction,
  sendEvmApproval,
  signAndExecuteEvmTransaction,
  signSolanaTransaction
} from "../lib/wallet";
import { PlatformValue } from "./PlatformLogo";
import {
  t,
  translateNote,
  type Language
} from "../i18n";

type LoadingState<T> = T & { loading: boolean };

type ApprovalState = {
  loading: boolean;
  note: string;
  hash: string;
};

type ManualSellBalanceState = {
  loading: boolean;
  amount: number;
  symbol: string;
};

type PoolQuality = "strong" | "watch" | "weak" | "unknown";

type PoolPreviewState = {
  loading: boolean;
  source: "official" | "route";
  pools: string[];
  quality: PoolQuality;
  liquidityUsd: number;
};

const initialHints: LoadingState<ManualTradeHintsPayload> = {
  loading: false,
  mode: "mock",
  note: "正在准备交易提示。",
  slippageBps: 0,
  gasTipLow: "--",
  gasTipAverage: "--",
  gasTipHigh: "--",
  gasLimit: "--"
};

const initialQuote = (candidate: Candidate | null, trade: TradePreview, side: TradeSide): LoadingState<ManualQuotePayload> => {
  const context = candidate ? getManualInputContext(candidate, trade, side) : null;
  return {
    loading: false,
    mode: "mock",
    source: "mock",
    note: side === "buy" ? "输入数量后即可请求官方 quote。" : "输入卖出数量后即可请求官方 quote。",
    side,
    inputAmount: 0,
    inputSymbol: context?.inputSymbol ?? trade.baseSymbol,
    inputTokenAddress: context?.inputTokenAddress ?? trade.baseTokenAddress,
    outputSymbol: context?.outputSymbol ?? candidate?.symbol ?? "--",
    outputTokenAddress: context?.outputTokenAddress ?? candidate?.address ?? "",
    estimatedAmount: 0,
    spender: "",
    requiresApproval: false
  };
};

const initialBuild: LoadingState<ManualBuildPayload> = {
  loading: false,
  mode: "mock",
  source: "mock",
  note: "等待生成交易预构建。",
  side: "buy",
  requestTxId: "",
  creatorAddress: "",
  estimateAmount: 0,
  minReturnAmount: 0,
  appliedSlippage: 0,
  txTarget: "",
  txValue: "",
  gasLimit: "",
  priorityFee: "",
  bundleTip: "",
  recentBlockhash: "",
  amms: [],
  txPreviewSize: 0,
  txContent: null
};

const initialSend: LoadingState<ManualSendPayload> = {
  loading: false,
  mode: "fallback",
  source: "fallback",
  note: "等待签名发送。",
  hash: "",
  err: "",
  bundleId: ""
};

const initialOrderStatus: LoadingState<DelegateOrderStatusPayload> = {
  loading: false,
  mode: "mock",
  note: "等待提交策略订单。",
  orderType: "market",
  orderId: "",
  status: "",
  chain: "",
  swapType: "",
  txHash: "",
  errorMessage: "",
  txPriceUsd: "",
  inAmount: "",
  outAmount: "",
  limitPrice: "",
  createPrice: "",
  expireAt: "",
  trailingPriceChange: ""
};

function formatAmount(value: number, symbol = "") {
  if (!Number.isFinite(value) || value <= 0) return "--";
  const digits = value >= 1 ? 4 : 6;
  return `${value.toFixed(digits)}${symbol ? ` ${symbol}` : ""}`;
}

function formatInputAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return String(Number(value.toFixed(value >= 1 ? 6 : 8)));
}

function isSameQuickAmount(current: string, target: string) {
  const currentNumber = Number(current);
  const targetNumber = Number(target);

  if (Number.isFinite(currentNumber) && Number.isFinite(targetNumber)) {
    return Math.abs(currentNumber - targetNumber) < 1e-9;
  }

  return current === target;
}

function shortValue(value: string) {
  if (!value) return "--";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function shortWalletValue(value: string) {
  if (!value) return "--";
  if (value.length <= 10) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function formatCompactUsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "--";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function normalizePoolName(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\bam[mn]\b/gi, (match) => match.toUpperCase())
    .trim();
}

function extractRoutePools(route: string, fallbackRoute = "--") {
  const source = route.trim() || fallbackRoute;
  const pools = source
    .split(/\/|>|,|\|/g)
    .map((item) => normalizePoolName(item))
    .filter(Boolean);
  return Array.from(new Set(pools));
}

function computePoolQuality(
  liquidityUsd: number,
  poolCount: number,
  source: "official" | "route"
): PoolQuality {
  let score = 0;

  if (liquidityUsd >= 500_000) score += 2;
  else if (liquidityUsd >= 150_000) score += 1;
  else if (liquidityUsd > 0) score -= 1;

  if (poolCount === 1) score += 1;
  else if (poolCount >= 3) score -= 1;

  if (source === "official") score += 1;

  if (score >= 3) return "strong";
  if (score >= 1) return "watch";
  if (score <= -1) return "weak";
  return "unknown";
}

function buildRoutePoolPreview(trade: TradePreview): PoolPreviewState {
  const pools = extractRoutePools(trade.route, "main pair");
  return {
    loading: false,
    source: "route",
    pools: pools.length > 0 ? pools : ["main pair"],
    quality: computePoolQuality(trade.liquidityUsd, pools.length, "route"),
    liquidityUsd: trade.liquidityUsd
  };
}

function buildOfficialPoolPreview(
  trade: TradePreview,
  build: ManualBuildPayload
): PoolPreviewState {
  const officialPools =
    build.amms.length > 0 ? build.amms.map((item) => normalizePoolName(item)).filter(Boolean) : [];
  const pools = officialPools.length > 0 ? Array.from(new Set(officialPools)) : buildRoutePoolPreview(trade).pools;
  return {
    loading: false,
    source: "official",
    pools,
    quality: computePoolQuality(trade.liquidityUsd, pools.length, "official"),
    liquidityUsd: trade.liquidityUsd
  };
}

function normalizeDelegateStatus(
  payload: DelegateOrderStatusPayload
): LoadingState<DelegateOrderStatusPayload> {
  return {
    ...payload,
    swapType: payload.swapType === "buy" || payload.swapType === "sell" ? payload.swapType : "",
    loading: false
  };
}

export function OpportunityDesk({
  candidate,
  trade,
  loading,
  note,
  language,
  manualWallet,
  onConnectManualWallet
}: {
  candidate: Candidate | null;
  trade: TradePreview;
  loading?: boolean;
  note?: string;
  language: Language;
  manualWallet: string;
  onConnectManualWallet: () => Promise<string>;
}) {
  const manualQuoteCacheRef = useRef<Record<string, ManualQuotePayload>>({});
  const manualBuildCacheRef = useRef<Record<string, ManualBuildPayload>>({});
  const [tradeMode, setTradeMode] = useState<"manual" | "delegate">("manual");
  const [manualSide, setManualSide] = useState<TradeSide>("buy");
  const [manualAmount, setManualAmount] = useState("1");
  const [resolvedManualWallet, setResolvedManualWallet] = useState(manualWallet);
  const [manualWalletNote, setManualWalletNote] = useState("");
  const [manualSellBalance, setManualSellBalance] = useState<ManualSellBalanceState>({
    loading: false,
    amount: 0,
    symbol: ""
  });
  const [manualQuote, setManualQuote] = useState<LoadingState<ManualQuotePayload>>(
    initialQuote(candidate, trade, "buy")
  );
  const [manualHints, setManualHints] = useState<LoadingState<ManualTradeHintsPayload>>(initialHints);
  const [manualBuild, setManualBuild] = useState<LoadingState<ManualBuildPayload>>(initialBuild);
  const [manualSend, setManualSend] = useState<LoadingState<ManualSendPayload>>(initialSend);
  const [manualApproval, setManualApproval] = useState<ApprovalState>({
    loading: false,
    note: "",
    hash: ""
  });
  const [manualPoolPreview, setManualPoolPreview] = useState<PoolPreviewState>(
    buildRoutePoolPreview(trade)
  );
  const [delegateWallets, setDelegateWallets] = useState<DelegateWalletRecord[]>([]);
  const [delegateWalletsLoading, setDelegateWalletsLoading] = useState(false);
  const [delegateWalletsNote, setDelegateWalletsNote] = useState("");
  const [delegateWalletName, setDelegateWalletName] = useState("");
  const [selectedAssetsId, setSelectedAssetsId] = useState("");
  const [delegateOrderType, setDelegateOrderType] = useState<DelegateOrderType>("market");
  const [delegateSide, setDelegateSide] = useState<TradeSide>("buy");
  const [delegateAmount, setDelegateAmount] = useState("1");
  const [delegateLimitPrice, setDelegateLimitPrice] = useState("");
  const [delegateUseMev, setDelegateUseMev] = useState(false);
  const [delegateSubmitting, setDelegateSubmitting] = useState(false);
  const [delegateApprovalNote, setDelegateApprovalNote] = useState("");
  const [delegateApprovalOrderId, setDelegateApprovalOrderId] = useState("");
  const [delegateStatus, setDelegateStatus] = useState<LoadingState<DelegateOrderStatusPayload>>(initialOrderStatus);

  const manualContext = candidate ? getManualInputContext(candidate, trade, manualSide) : null;
  const effectiveManualWallet = resolvedManualWallet || manualWallet;

  const selectedWallet = delegateWallets.find((wallet) => wallet.assetsId === selectedAssetsId) ?? null;
  const selectedWalletAddress =
    candidate && selectedWallet ? selectedWallet.addresses[candidate.chain] ?? "" : "";
  const manualAmountNumber = Number(manualAmount);
  const delegateAmountNumber = Number(delegateAmount);
  const manualQuickOptions =
    manualSide === "buy"
      ? [
          { label: "0.01", value: "0.01" },
          { label: "0.1", value: "0.1" },
          { label: "0.5", value: "0.5" },
          { label: "1", value: "1" }
        ]
      : [
          { label: "10%", value: formatInputAmount(manualSellBalance.amount * 0.1) },
          { label: "25%", value: formatInputAmount(manualSellBalance.amount * 0.25) },
          { label: "50%", value: formatInputAmount(manualSellBalance.amount * 0.5) },
          { label: "100%", value: formatInputAmount(manualSellBalance.amount) }
        ];
  const needsManualApproval =
    candidate && manualQuote.spender
      ? manualTradeNeedsApproval(candidate.chain, manualQuote.inputTokenAddress, manualQuote.spender)
      : false;

  function getManualQuoteCacheKey(side: TradeSide, amount: number) {
    if (!candidate) return "";
    return [
      candidate.chain,
      candidate.address,
      trade.baseTokenAddress,
      side,
      Number(amount).toString()
    ].join(":");
  }

  function readManualQuoteCache(side: TradeSide, amount: number) {
    const key = getManualQuoteCacheKey(side, amount);
    return key ? manualQuoteCacheRef.current[key] ?? null : null;
  }

  function writeManualQuoteCache(side: TradeSide, amount: number, payload: ManualQuotePayload) {
    const key = getManualQuoteCacheKey(side, amount);
    if (!key) return;
    manualQuoteCacheRef.current[key] = payload;
  }

  function getManualBuildCacheKey(side: TradeSide, amount: number, walletAddress: string) {
    if (!candidate) return "";
    return [
      candidate.chain,
      candidate.address,
      trade.baseTokenAddress,
      side,
      Number(amount).toString(),
      walletAddress.trim().toLowerCase(),
      String(manualHints.slippageBps || 0)
    ].join(":");
  }

  function readManualBuildCache(side: TradeSide, amount: number, walletAddress: string) {
    const key = getManualBuildCacheKey(side, amount, walletAddress);
    return key ? manualBuildCacheRef.current[key] ?? null : null;
  }

  function writeManualBuildCache(
    side: TradeSide,
    amount: number,
    walletAddress: string,
    payload: ManualBuildPayload
  ) {
    const key = getManualBuildCacheKey(side, amount, walletAddress);
    if (!key) return;
    manualBuildCacheRef.current[key] = payload;
  }

  useEffect(() => {
    setResolvedManualWallet(manualWallet);
  }, [manualWallet]);

  useEffect(() => {
    let active = true;

    if (!candidate || effectiveManualWallet) {
      return () => {
        active = false;
      };
    }
    const activeCandidate = candidate;

    async function syncWalletAddress() {
      const address = await getCurrentConnectedWalletAddress(activeCandidate.chain);
      if (!active || !address) return;
      setResolvedManualWallet(address);
    }

    void syncWalletAddress();
    return () => {
      active = false;
    };
  }, [candidate, effectiveManualWallet]);

  useEffect(() => {
    manualQuoteCacheRef.current = {};
    manualBuildCacheRef.current = {};
    setManualSide("buy");
    setManualAmount("1");
    setManualWalletNote("");
    setManualSellBalance({ loading: false, amount: 0, symbol: "" });
    setManualApproval({ loading: false, note: "", hash: "" });
    setManualHints(initialHints);
    setManualBuild(initialBuild);
    setManualSend(initialSend);
    setManualQuote(initialQuote(candidate, trade, "buy"));
    setManualPoolPreview(buildRoutePoolPreview(trade));
    setDelegateOrderType("market");
    setDelegateSide("buy");
    setDelegateAmount("1");
    setDelegateLimitPrice("");
    setDelegateUseMev(false);
    setDelegateApprovalNote("");
    setDelegateApprovalOrderId("");
    setDelegateStatus(initialOrderStatus);
  }, [candidate?.address, candidate?.chain]);

  useEffect(() => {
    setManualAmount(manualSide === "buy" ? "1" : "0");
    setManualQuote(initialQuote(candidate, trade, manualSide));
    setManualBuild(initialBuild);
    setManualSend(initialSend);
    setManualApproval({ loading: false, note: "", hash: "" });
    manualQuoteCacheRef.current = {};
    manualBuildCacheRef.current = {};
    setManualPoolPreview(buildRoutePoolPreview(trade));
  }, [candidate?.address, candidate?.chain, manualSide]);

  useEffect(() => {
    setManualBuild(initialBuild);
    setManualSend(initialSend);
    setManualApproval({ loading: false, note: "", hash: "" });
  }, [manualAmount, effectiveManualWallet]);

  useEffect(() => {
    let active = true;
    const activeContext = candidate ? getManualInputContext(candidate, trade, manualSide) : null;

    if (!candidate || !activeContext || !effectiveManualWallet) {
      setManualSellBalance({
        loading: false,
        amount: 0,
        symbol: activeContext?.inputSymbol ?? candidate?.symbol ?? trade.baseSymbol
      });
      return () => {
        active = false;
      };
    }
    const resolvedContext = activeContext;

    async function loadAvailableBalance() {
      const activeCandidate = candidate!;
      setManualSellBalance({
        loading: true,
        amount: 0,
        symbol: resolvedContext.inputSymbol
      });

      try {
        const amount = await getManualWalletTokenBalance({
          chain: activeCandidate.chain,
          walletAddress: effectiveManualWallet,
          tokenAddress: resolvedContext.inputTokenAddress,
          tokenDecimals: resolvedContext.inputDecimals
        });

        if (!active) return;
        setManualSellBalance({
          loading: false,
          amount: Number.isFinite(amount) ? amount : 0,
          symbol: resolvedContext.inputSymbol
        });
      } catch {
        if (!active) return;
        setManualSellBalance({
          loading: false,
          amount: 0,
          symbol: resolvedContext.inputSymbol
        });
      }
    }

    void loadAvailableBalance();
    return () => {
      active = false;
    };
  }, [
    candidate?.address,
    candidate?.chain,
    manualSide,
    effectiveManualWallet,
    trade.baseSymbol,
    trade.baseTokenAddress,
    trade.baseTokenDecimals,
    trade.tokenDecimals
  ]);

  useEffect(() => {
    let active = true;
    if (!candidate) return () => { active = false; };
    const activeCandidate = candidate;

    async function loadHints() {
      setManualHints((current) => ({ ...current, loading: true }));
      const payload = await loadManualTradeHints(activeCandidate);
      if (!active) return;
      setManualHints({
        ...payload,
        loading: false
      });
    }

    void loadHints();
    return () => { active = false; };
  }, [candidate]);

  useEffect(() => {
    let active = true;
    if (!candidate) return () => { active = false; };

    if (manualSide === "buy") {
      const quickBuyAmounts = [0.01, 0.1, 0.5, 1];

      void Promise.all(
        quickBuyAmounts.map(async (amount) => {
          if (readManualQuoteCache("buy", amount)) {
            return;
          }
          const payload = await loadManualQuote(candidate, trade, "buy", amount);
          if (!active) return;
          writeManualQuoteCache("buy", amount, payload);
        })
      );
    }

    const timer = window.setTimeout(async () => {
      const cachedQuote = readManualQuoteCache(manualSide, Number(manualAmount));
      if (cachedQuote) {
        setManualQuote({
          ...cachedQuote,
          loading: false
        });
        return;
      }

      setManualQuote((current) => ({ ...current, loading: true }));
      const payload = await loadManualQuote(candidate, trade, manualSide, Number(manualAmount));
      if (!active) return;
      writeManualQuoteCache(manualSide, Number(manualAmount), payload);
      setManualQuote({
        ...payload,
        loading: false
      });
    }, 500);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [candidate, trade, manualSide, manualAmount]);

  useEffect(() => {
    let active = true;
    const fallbackPreview = buildRoutePoolPreview(trade);

    if (manualSide !== "buy") {
      setManualPoolPreview(fallbackPreview);
      return () => {
        active = false;
      };
    }

    if (
      !candidate ||
      !effectiveManualWallet ||
      manualQuote.loading ||
      manualHints.loading ||
      manualQuote.source !== "official" ||
      !Number.isFinite(manualAmountNumber) ||
      manualAmountNumber <= 0
    ) {
      setManualPoolPreview(fallbackPreview);
      return () => {
        active = false;
      };
    }

    const cachedBuild = readManualBuildCache("buy", manualAmountNumber, effectiveManualWallet);
    if (cachedBuild?.txContent) {
      setManualBuild({
        ...cachedBuild,
        loading: false
      });
      setManualPoolPreview(buildOfficialPoolPreview(trade, cachedBuild));
      return () => {
        active = false;
      };
    }

    setManualPoolPreview({
      ...fallbackPreview,
      loading: true
    });

    const timer = window.setTimeout(async () => {
      const payload = await buildManualTransaction(
        candidate,
        trade,
        manualQuote,
        manualHints,
        effectiveManualWallet
      );

      if (!active) return;

      if (payload.source === "official" && payload.txContent) {
        writeManualBuildCache("buy", manualAmountNumber, effectiveManualWallet, payload);
        setManualBuild({
          ...payload,
          loading: false
        });
        setManualPoolPreview(buildOfficialPoolPreview(trade, payload));
        return;
      }

      setManualPoolPreview({
        ...fallbackPreview,
        loading: false
      });
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    candidate,
    trade,
    manualSide,
    effectiveManualWallet,
    manualAmountNumber,
    manualQuote,
    manualHints
  ]);

  function handleManualQuickAmount(value: string) {
    const amount = Number(value);
    const cachedQuote = readManualQuoteCache(manualSide, amount);
    setManualAmount(value);

    if (!cachedQuote) {
      return;
    }

    setManualQuote({
      ...cachedQuote,
      loading: false
    });
  }

  useEffect(() => {
    let active = true;
    if (!candidate) return () => { active = false; };

    async function refreshWallets() {
      setDelegateWalletsLoading(true);
      const payload = await loadDelegateWallets();
      if (!active) return;
      setDelegateWallets(payload.wallets);
      setDelegateWalletsNote(payload.note);
      setSelectedAssetsId((current) => {
        if (current && payload.wallets.some((wallet) => wallet.assetsId === current)) {
          return current;
        }
        return payload.wallets[0]?.assetsId ?? "";
      });
      setDelegateWalletsLoading(false);
    }

    void refreshWallets();
    return () => { active = false; };
  }, [candidate]);

  async function ensureManualWallet() {
    if (!candidate) {
      throw new Error("当前没有选中 token。");
    }
    if (candidate.chain === "Solana") {
      const wallet = await connectSolanaWallet();
      setResolvedManualWallet(wallet.address);
      if (effectiveManualWallet && wallet.address !== effectiveManualWallet) {
        setManualWalletNote("已同步当前 Solana 签名钱包地址。");
      }
      return wallet.address;
    }
    if (effectiveManualWallet) {
      return effectiveManualWallet;
    }
    const address = await onConnectManualWallet();
    setResolvedManualWallet(address);
    setManualWalletNote(address ? t(language, "opportunity.manual.wallet.connected") : "");
    return address;
  }

  async function handleManualTrade() {
    if (!candidate || !manualContext) return;

    try {
      setManualWalletNote("");
      setManualSend((current) => ({ ...current, loading: true, note: t(language, "opportunity.manual.state.connecting") }));
      const walletAddress = await ensureManualWallet();
      const cachedBuild = readManualBuildCache(manualQuote.side, manualQuote.inputAmount, walletAddress);
      const readyBuild: ManualBuildPayload | null =
        cachedBuild?.source === "official" &&
        cachedBuild.side === manualQuote.side &&
        cachedBuild.creatorAddress === walletAddress &&
        Boolean(cachedBuild.txContent)
          ? { ...cachedBuild }
          : manualBuild.source === "official" &&
              manualBuild.side === manualQuote.side &&
              manualBuild.creatorAddress === walletAddress &&
              Boolean(manualBuild.txContent)
            ? (({ loading: _loading, ...payload }) => payload)(manualBuild)
          : null;

      if (needsManualApproval && candidate.chain !== "Solana" && manualQuote.spender) {
        setManualApproval({
          loading: true,
          note: t(language, "opportunity.manual.approval.pending"),
          hash: ""
        });
        const approval = await sendEvmApproval(candidate.chain, manualQuote.inputTokenAddress, manualQuote.spender);
        setManualApproval({
          loading: false,
          note: approval.note,
          hash: approval.hash
        });
      }

      let build: ManualBuildPayload;

      if (readyBuild) {
        build = readyBuild;
      } else {
        setManualBuild((current) => ({ ...current, loading: true }));
        build = await buildManualTransaction(candidate, trade, manualQuote, manualHints, walletAddress);
        if (build.source === "official" && build.txContent) {
          writeManualBuildCache(manualQuote.side, manualQuote.inputAmount, walletAddress, build);
        }
        setManualBuild({
          ...build,
          loading: false
        });
      }

      if (!build.txContent) {
        setManualSend({
          ...initialSend,
          loading: false,
          mode: build.mode,
          source: "fallback",
          note: build.note,
          err: build.note
        });
        return;
      }

      if (candidate.chain === "Solana") {
        const signedTx = await signSolanaTransaction(String(build.txContent));
        const payload = build.requestTxId
          ? await sendSignedSolanaTransaction(build.requestTxId, signedTx, delegateUseMev)
          : {
              ...(await sendRawSolanaTransaction(signedTx)),
              loading: false,
              mode: "live" as const,
              source: "wallet" as const,
              err: "",
              bundleId: ""
            };
        setManualSend({
          ...payload,
          loading: false
        });
        return;
      }

      const evmResult = await signAndExecuteEvmTransaction(candidate.chain, build.txContent as Record<string, unknown>);
      const payload =
        evmResult.source === "official"
          ? await sendSignedEvmTransaction(candidate.chain, build.requestTxId, evmResult.signedTx, delegateUseMev)
          : {
              mode: "live" as const,
              source: "wallet" as const,
              note: "钱包已直接广播 EVM 交易。",
              hash: evmResult.hash,
              err: "",
              bundleId: ""
            };

      setManualSend({
        ...payload,
        loading: false
      });
    } catch (error) {
      setManualSend({
        loading: false,
        mode: "fallback",
        source: "fallback",
        note: (error as Error).message,
        hash: "",
        err: (error as Error).message,
        bundleId: ""
      });
    }
  }

  async function handleCreateDelegateWallet() {
    const walletName = delegateWalletName.trim() || `sentinel-${Date.now().toString().slice(-6)}`;
    setDelegateWalletsLoading(true);
    const payload = await createDelegateWallet(walletName);
    setDelegateWalletsLoading(false);
    setDelegateWalletsNote(payload.note);
    if (!payload.wallet) return;
    setDelegateWallets((current) => [payload.wallet!, ...current]);
    setSelectedAssetsId(payload.wallet.assetsId);
    setDelegateWalletName("");
  }

  async function refreshDelegateStatus(orderId?: string, orderType?: DelegateOrderType) {
    if (!candidate || !selectedAssetsId) return;
    const targetOrderId = orderId ?? delegateStatus.orderId;
    const targetType = orderType ?? delegateStatus.orderType;
    if (!targetOrderId || !targetType) return;
    setDelegateStatus((current) => ({ ...current, loading: true }));
    const payload = await queryDelegateOrderStatus({
      chain: candidate.chain,
      assetsId: selectedAssetsId,
      orderId: targetOrderId,
      orderType: targetType
    });
    setDelegateStatus(normalizeDelegateStatus(payload));
  }

  async function handleSubmitDelegateOrder() {
    if (!candidate || !selectedAssetsId) return;

    try {
      setDelegateSubmitting(true);
      setDelegateStatus((current) => ({
        ...current,
        loading: true,
        note: t(language, "opportunity.delegate.submitting")
      }));

      if (
        candidate.chain !== "Solana" &&
        delegateSide === "sell" &&
        candidate.address &&
        selectedAssetsId
      ) {
        const approval = await submitDelegateApproval(candidate.chain, selectedAssetsId, candidate.address);
        setDelegateApprovalNote(approval.note);
        setDelegateApprovalOrderId(approval.orderId);
        if (approval.orderId) {
          const approvalStatus = await queryDelegateApproval(candidate.chain, approval.orderId);
          setDelegateApprovalNote(approvalStatus.note || approval.note);
        }
      }

      const submitPayload = await submitDelegateOrder({
        chain: candidate.chain,
        assetsId: selectedAssetsId,
        trade,
        candidate,
        side: delegateSide,
        orderType: delegateOrderType,
        amount: delegateAmountNumber,
        limitPrice: delegateLimitPrice || undefined,
        useMev: delegateUseMev,
        autoSlippage: true,
        autoGas: "average"
      });

      const statusPayload = await queryDelegateOrderStatus({
        chain: candidate.chain,
        assetsId: selectedAssetsId,
        orderId: submitPayload.orderId,
        orderType: delegateOrderType
      });

      setDelegateStatus(normalizeDelegateStatus(statusPayload));
    } catch (error) {
      setDelegateStatus({
        ...initialOrderStatus,
        loading: false,
        mode: "fallback",
        note: (error as Error).message,
        errorMessage: (error as Error).message
      });
    } finally {
      setDelegateSubmitting(false);
    }
  }

  return (
    <div className="t-trade-stack">
      {tradeMode === "manual" ? (
        <section className={`t-panel t-trade-panel t-trade-panel-${manualSide}`}>
          <div className="t-trade-panel-head">
            <div
              className="t-trade-mode-switch t-trade-mode-switch-primary manual"
              role="tablist"
              aria-label={t(language, "opportunity.title")}
            >
              <span className="t-trade-mode-thumb" aria-hidden="true" />
              <button
                type="button"
                className="t-trade-mode-btn active"
                onClick={() => setTradeMode("manual")}
                role="tab"
                aria-selected={true}
              >
                {t(language, "opportunity.mode.chainWallet")}
              </button>
              <button
                type="button"
                className="t-trade-mode-btn"
                onClick={() => setTradeMode("delegate")}
                role="tab"
                aria-selected={false}
              >
                {t(language, "opportunity.mode.delegateWallet")}
              </button>
            </div>
          </div>

          <div className="t-trade-control-row">
            <div
              className={`t-trade-mode-switch t-trade-side-switch ${manualSide === "sell" ? "right sell-active" : "left buy-active"}`}
              role="tablist"
              aria-label={t(language, manualSide === "buy" ? "opportunity.side.buy" : "opportunity.side.sell")}
            >
              <span className="t-trade-mode-thumb" aria-hidden="true" />
              {(["buy", "sell"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  className={`t-trade-mode-btn t-trade-side-mode-btn ${side}${manualSide === side ? " active" : ""}`}
                  onClick={() => setManualSide(side)}
                  role="tab"
                  aria-selected={manualSide === side}
                >
                  {t(language, side === "buy" ? "opportunity.side.buy" : "opportunity.side.sell")}
                </button>
              ))}
            </div>
          </div>

          <div className="t-trade-wallet-row t-trade-wallet-row-tri">
            <div className="t-trade-wallet-meta">
              <span>{t(language, "opportunity.manual.wallet")}</span>
              <strong className="t-trade-wallet-value-address">
                {effectiveManualWallet ? shortWalletValue(effectiveManualWallet) : t(language, "nav.wallet.connect")}
              </strong>
            </div>
            <div className="t-trade-wallet-meta">
              <span>{t(language, "opportunity.manual.wallet.balance")}</span>
              <strong className="t-trade-wallet-value-balance">
                {manualSellBalance.loading
                  ? t(language, "opportunity.manual.wallet.balance.loading")
                  : formatAmount(manualSellBalance.amount, manualSellBalance.symbol)}
              </strong>
            </div>
            <div className="t-trade-wallet-meta t-trade-wallet-meta-route">
              <span>{t(language, "opportunity.route")}</span>
              <strong className="t-trade-wallet-value-route"><PlatformValue value={trade.route || "--"} /></strong>
            </div>
          </div>

          <div className="t-trade-wallet-row t-trade-wallet-row-secondary">
            <div className="t-trade-wallet-meta">
              <span>{t(language, "opportunity.manual.poolQualityLabel")}</span>
              <strong className="t-trade-wallet-value-pool-quality">
                <span className={`t-trade-pool-quality ${manualPoolPreview.quality}`}>
                  {t(language, `opportunity.manual.poolQuality.${manualPoolPreview.quality}`)}
                </span>
              </strong>
            </div>
            <div className="t-trade-wallet-meta t-trade-wallet-meta-route">
              <span>{t(language, "opportunity.manual.poolLiquidityLabel")}</span>
              <strong className="t-trade-wallet-value-pool-size">
                {formatCompactUsd(manualPoolPreview.liquidityUsd)}
              </strong>
            </div>
          </div>

          <div className="t-trade-amount-shell">
            <div className="t-trade-amount-input">
              <span>{manualSide === "buy" ? t(language, "opportunity.manual.amount.buy") : t(language, "opportunity.manual.amount.sell")}</span>
              <input
                type="text"
                value={manualAmount}
                onChange={(event) => setManualAmount(event.target.value)}
                inputMode="decimal"
                placeholder={manualSide === "buy" ? "0.1" : "0"}
              />
              <strong>{manualContext?.inputSymbol ?? "--"}</strong>
            </div>
            <div className="t-trade-quick-grid">
              {manualQuickOptions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`t-trade-quick-btn${isSameQuickAmount(manualAmount, item.value) ? " active" : ""}`}
                  onClick={() => handleManualQuickAmount(item.value)}
                  aria-pressed={isSameQuickAmount(manualAmount, item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="t-trade-stats">
            <div className="t-dryrun-row t-dryrun-row-inline">
              <div className="t-dryrun-inline-item">
                <span>{t(language, "opportunity.spendAsset")}</span>
                <strong>{formatAmount(manualQuote.inputAmount, manualQuote.inputSymbol)}</strong>
              </div>
              <div className="t-dryrun-inline-item">
                <span>{t(language, "opportunity.estimatedReceive")}</span>
                <strong>{formatAmount(manualQuote.estimatedAmount, manualQuote.outputSymbol)}</strong>
              </div>
            </div>
            <div className="t-dryrun-row">
              <span>{t(language, "opportunity.quoteSource")}</span>
              <strong>{manualQuote.loading ? "LOADING" : manualQuote.source === "official" ? "AVE OFFICIAL" : "DERIVED"}</strong>
            </div>
            <div className="t-dryrun-row">
              <span>{t(language, "opportunity.autoSlippage")}</span>
              <strong>{manualHints.loading ? "LOADING" : manualHints.slippageBps > 0 ? `${manualHints.slippageBps} bps` : "--"}</strong>
            </div>
          </div>

          <div className="t-trade-actions">
            <button
              type="button"
              className={`t-exec-button t-exec-button-manual t-exec-button-${manualSide}`}
              onClick={handleManualTrade}
              disabled={loading || manualQuote.loading || manualBuild.loading || manualSend.loading || !candidate || !Number.isFinite(manualAmountNumber) || manualAmountNumber <= 0}
            >
              {manualSend.loading
                ? t(language, "opportunity.manual.submitting")
                : t(language, manualSide === "buy" ? "opportunity.side.buy" : "opportunity.side.sell")}
            </button>
          </div>

          <div className={`t-panel-body t-trade-note t-trade-note-${manualSide}`}>
            <span>{translateNote(language, manualApproval.note || manualSend.note || manualBuild.note || manualQuote.note || manualHints.note || manualWalletNote)}</span>
          </div>
        </section>
      ) : (
        <section className={`t-panel t-trade-panel t-trade-panel-${delegateSide}`}>
          <div className="t-trade-panel-head">
            <div
              className="t-trade-mode-switch t-trade-mode-switch-primary delegate"
              role="tablist"
              aria-label={t(language, "opportunity.title")}
            >
              <span className="t-trade-mode-thumb" aria-hidden="true" />
              <button
                type="button"
                className="t-trade-mode-btn"
                onClick={() => setTradeMode("manual")}
                role="tab"
                aria-selected={false}
              >
                {t(language, "opportunity.mode.chainWallet")}
              </button>
              <button
                type="button"
                className="t-trade-mode-btn active"
                onClick={() => setTradeMode("delegate")}
                role="tab"
                aria-selected={true}
              >
                {t(language, "opportunity.mode.delegateWallet")}
              </button>
            </div>
          </div>

          <div className="t-trade-field-grid">
            <label className="t-trade-field">
              <span>{t(language, "opportunity.delegate.wallet")}</span>
              <select
                value={selectedAssetsId}
                onChange={(event) => setSelectedAssetsId(event.target.value)}
                disabled={delegateWalletsLoading || delegateWallets.length === 0}
              >
                <option value="">{t(language, "opportunity.delegate.wallet.select")}</option>
                {delegateWallets.map((wallet) => (
                  <option key={wallet.assetsId} value={wallet.assetsId}>
                    {wallet.assetsName} · {wallet.assetsId}
                  </option>
                ))}
              </select>
            </label>
            <label className="t-trade-field">
              <span>{t(language, "opportunity.delegate.wallet.new")}</span>
              <input
                type="text"
                value={delegateWalletName}
                onChange={(event) => setDelegateWalletName(event.target.value)}
                placeholder="sentinel-wallet"
              />
            </label>
          </div>

          <div className="t-trade-control-row">
            <div className="t-trade-segment">
              {(["market", "limit"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`t-trade-segment-btn${delegateOrderType === type ? " active" : ""}`}
                  onClick={() => setDelegateOrderType(type)}
                >
                  {t(language, type === "market" ? "opportunity.delegate.order.market" : "opportunity.delegate.order.limit")}
                </button>
              ))}
            </div>
            <button type="button" className="t-exec-button ghost" onClick={handleCreateDelegateWallet} disabled={delegateWalletsLoading}>
              {t(language, "opportunity.delegate.wallet.create")}
            </button>
          </div>

          <div className="t-trade-control-row">
            <div
              className={`t-trade-mode-switch t-trade-side-switch ${delegateSide === "sell" ? "right sell-active" : "left buy-active"}`}
              role="tablist"
              aria-label={t(language, delegateSide === "buy" ? "opportunity.side.buy" : "opportunity.side.sell")}
            >
              <span className="t-trade-mode-thumb" aria-hidden="true" />
              {(["buy", "sell"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  className={`t-trade-mode-btn t-trade-side-mode-btn ${side}${delegateSide === side ? " active" : ""}`}
                  onClick={() => setDelegateSide(side)}
                  role="tab"
                  aria-selected={delegateSide === side}
                >
                  {t(language, side === "buy" ? "opportunity.side.buy" : "opportunity.side.sell")}
                </button>
              ))}
            </div>
            <label className="t-trade-checkbox">
              <input
                type="checkbox"
                checked={delegateUseMev}
                onChange={(event) => setDelegateUseMev(event.target.checked)}
              />
              <span>MEV</span>
            </label>
          </div>

          <div className="t-trade-field-grid">
            <div className="t-trade-overview t-trade-overview-embedded t-trade-overview-wide">
              <div className="t-trade-overview-item">
                <span>{t(language, "opportunity.route")}</span>
                <strong><PlatformValue value={trade.route || "--"} /></strong>
              </div>
            </div>
            <label className="t-trade-field">
              <span className={`t-trade-side-label ${delegateSide}`}>{delegateSide === "buy" ? t(language, "opportunity.manual.amount.buy") : t(language, "opportunity.manual.amount.sell")}</span>
              <input
                type="text"
                value={delegateAmount}
                onChange={(event) => setDelegateAmount(event.target.value)}
                inputMode="decimal"
                placeholder={delegateSide === "buy" ? "500" : "1000"}
              />
            </label>
            <label className="t-trade-field">
              <span>{t(language, "opportunity.delegate.limitPrice")}</span>
              <input
                type="text"
                value={delegateLimitPrice}
                onChange={(event) => setDelegateLimitPrice(event.target.value)}
                inputMode="decimal"
                placeholder={delegateOrderType === "limit" ? "0.0025" : "--"}
                disabled={delegateOrderType !== "limit"}
              />
            </label>
          </div>

          <div className="t-trade-stats">
            <div className="t-dryrun-row">
              <span>{t(language, "opportunity.delegate.chainAddress")}</span>
              <strong>{selectedWalletAddress ? shortValue(selectedWalletAddress) : "--"}</strong>
            </div>
            <div className="t-dryrun-row">
              <span>{t(language, "opportunity.delegate.approval")}</span>
              <strong>{delegateApprovalOrderId ? shortValue(delegateApprovalOrderId) : "--"}</strong>
            </div>
            <div className="t-dryrun-row">
              <span>{t(language, "opportunity.delegate.orderId")}</span>
              <strong>{delegateStatus.orderId ? shortValue(delegateStatus.orderId) : "--"}</strong>
            </div>
            <div className="t-dryrun-row">
              <span>{t(language, "opportunity.delegate.status")}</span>
              <strong>{delegateStatus.status || "--"}</strong>
            </div>
            <div className="t-dryrun-row">
              <span>{t(language, "opportunity.delegate.txHash")}</span>
              <strong>{delegateStatus.txHash ? shortValue(delegateStatus.txHash) : "--"}</strong>
            </div>
          </div>

          <div className="t-trade-actions">
            <button
              type="button"
              className={`t-exec-button t-exec-button-${delegateSide}`}
              onClick={handleSubmitDelegateOrder}
              disabled={!selectedAssetsId || delegateSubmitting || !Number.isFinite(delegateAmountNumber) || delegateAmountNumber <= 0}
            >
              {delegateSubmitting ? t(language, "opportunity.delegate.submitting") : t(language, "opportunity.delegate.execute")}
            </button>
            <button
              type="button"
              className="t-exec-button ghost"
              onClick={() => void refreshDelegateStatus()}
              disabled={!delegateStatus.orderId || delegateStatus.loading}
            >
              {t(language, "opportunity.delegate.refresh")}
            </button>
          </div>

          <div className={`t-panel-body t-trade-note t-trade-note-${delegateSide}`}>
            <span>{translateNote(language, delegateStatus.note || delegateApprovalNote || delegateWalletsNote)}</span>
          </div>
        </section>
      )}
    </div>
  );
}
