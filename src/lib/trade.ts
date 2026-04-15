import type { Candidate, TradePreview } from "../data/mock";
import type { DataMode } from "./ave";
import {
  buildQuery,
  fromRawUnits,
  getList,
  getRecord,
  isEvmChain,
  isRecord,
  isNativeTradeToken,
  loadDelegateWalletsCore,
  nativeEvmToken,
  normalizeDelegateWallet,
  queryDelegateApprovalCore,
  queryDelegateOrderStatusCore,
  requestAmountOut,
  toApiChain,
  toNumber,
  toRawUnits,
  unwrapData
} from "./trade_shared.mjs";

export type TradeSide = "buy" | "sell";
export type DelegateOrderType = "market" | "limit";
export type GasTier = "low" | "average" | "high";

export type ManualQuotePayload = {
  mode: DataMode;
  source: "official" | "derived" | "mock";
  note: string;
  side: TradeSide;
  inputAmount: number;
  inputSymbol: string;
  inputTokenAddress: string;
  outputSymbol: string;
  outputTokenAddress: string;
  estimatedAmount: number;
  spender: string;
  requiresApproval: boolean;
};

export type ManualTradeHintsPayload = {
  mode: DataMode;
  note: string;
  slippageBps: number;
  gasTipLow: string;
  gasTipAverage: string;
  gasTipHigh: string;
  gasLimit: string;
};

export type ManualBuildPayload = {
  mode: DataMode;
  source: "official" | "mock" | "fallback";
  note: string;
  side: TradeSide;
  requestTxId: string;
  creatorAddress: string;
  estimateAmount: number;
  minReturnAmount: number;
  appliedSlippage: number;
  txTarget: string;
  txValue: string;
  gasLimit: string;
  priorityFee: string;
  bundleTip: string;
  recentBlockhash: string;
  amms: string[];
  txPreviewSize: number;
  txContent: string | Record<string, unknown> | null;
};

export type ManualSendPayload = {
  mode: DataMode;
  source: "official" | "wallet" | "fallback";
  note: string;
  hash: string;
  err: string;
  bundleId: string;
};

export type DelegateWalletRecord = {
  assetsId: string;
  assetsName: string;
  type: string;
  status: string;
  addresses: Partial<Record<"Solana" | "BSC" | "Base" | "Ethereum", string>>;
};

export type DelegateWalletsPayload = {
  mode: DataMode;
  note: string;
  wallets: DelegateWalletRecord[];
};

export type DelegateApprovePayload = {
  mode: DataMode;
  note: string;
  orderId: string;
  spender: string;
  amm: string;
  status: string;
  txHash: string;
  errorMessage: string;
};

export type DelegateOrderSubmitPayload = {
  mode: DataMode;
  note: string;
  orderType: DelegateOrderType;
  orderId: string;
};

export type DelegateOrderStatusPayload = {
  mode: DataMode;
  note: string;
  orderType: DelegateOrderType;
  orderId: string;
  status: string;
  chain: string;
  swapType: TradeSide | "";
  txHash: string;
  errorMessage: string;
  txPriceUsd: string;
  inAmount: string;
  outAmount: string;
  limitPrice: string;
  createPrice: string;
  expireAt: string;
  trailingPriceChange: string;
};

const apiKey = import.meta.env.VITE_AVE_API_KEY?.trim();
const baseUrl =
  import.meta.env.VITE_AVE_BASE_URL?.trim() || "/api/ave/v2";
const tradeBaseUrl =
  import.meta.env.VITE_AVE_TRADE_BASE_URL?.trim() ||
  (baseUrl.includes("/api/ave/v2")
    ? baseUrl.replace("/api/ave/v2", "/api/ave/trade")
    : "/api/ave/trade");
const delegateBaseUrl =
  import.meta.env.VITE_AVE_DELEGATE_BASE_URL?.trim() ||
  (baseUrl.includes("/api/ave/v2")
    ? baseUrl.replace("/api/ave/v2", "/api/ave/delegate")
    : "/api/ave/delegate");

function resolveBaseTokenAddress(candidate: Candidate, trade: TradePreview) {
  if (candidate.chain === "Solana") {
    if (
      trade.baseSymbol.toUpperCase() === "SOL" ||
      trade.baseTokenAddress === "So11111111111111111111111111111111111111112"
    ) {
      return "sol";
    }
    return trade.baseTokenAddress;
  }

  if (
    (candidate.chain === "BSC" && trade.baseSymbol.toUpperCase().includes("BNB")) ||
    (candidate.chain !== "BSC" && trade.baseSymbol.toUpperCase().includes("ETH"))
  ) {
    return nativeEvmToken;
  }

  return trade.baseTokenAddress;
}

function buildTradeContext(candidate: Candidate, trade: TradePreview, side: TradeSide) {
  const baseTokenAddress = resolveBaseTokenAddress(candidate, trade);
  if (side === "buy") {
    return {
      inputSymbol: trade.baseSymbol,
      inputTokenAddress: baseTokenAddress,
      inputDecimals: trade.baseTokenDecimals,
      outputSymbol: candidate.symbol,
      outputTokenAddress: candidate.address,
      outputDecimals: trade.tokenDecimals
    };
  }
  return {
    inputSymbol: candidate.symbol,
    inputTokenAddress: candidate.address,
    inputDecimals: trade.tokenDecimals,
    outputSymbol: trade.baseSymbol,
    outputTokenAddress: baseTokenAddress,
    outputDecimals: trade.baseTokenDecimals
  };
}

async function jsonRequest<T>(
  url: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      ...(apiKey ? { "X-API-KEY": apiKey } : {})
    },
    body: method === "POST" && body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`AVE trade API ${response.status}`);
  }

  const payload = await response.json() as Record<string, unknown>;
  const status = payload.status;
  const normalizedStatus =
    typeof status === "number" || typeof status === "string"
      ? String(status)
      : "";

  if (normalizedStatus && normalizedStatus !== "1" && normalizedStatus !== "200") {
    throw new Error(String(payload.msg ?? payload.message ?? `AVE trade API business status ${normalizedStatus}`));
  }

  return payload as T;
}

export async function loadManualTradeHints(
  candidate: Candidate
): Promise<ManualTradeHintsPayload> {
  try {
    const chain = toApiChain(candidate.chain);
    const [slippageResponse, gasTipResponse] = await Promise.all([
      jsonRequest<{ data?: unknown }>(`${tradeBaseUrl}/v1/thirdParty/chainWallet/getAutoSlippage`, "POST", {
        chain,
        tokenAddress: candidate.address,
        useMev: false
      }),
      jsonRequest<{ data?: unknown }>(`${tradeBaseUrl}/v1/thirdParty/chainWallet/getGasTip`, "GET")
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
      note: "已加载官方滑点与 gas 档位建议。",
      slippageBps: toNumber(slippage.slippage),
      gasTipLow: String(gasTipMatch?.low ?? "--"),
      gasTipAverage: String(gasTipMatch?.average ?? "--"),
      gasTipHigh: String(gasTipMatch?.high ?? "--"),
      gasLimit: String(gasTipMatch?.gasLimit ?? "--")
    };
  } catch (error) {
    return {
      mode: "fallback",
      note: `官方滑点或 gas 建议请求失败：${(error as Error).message}`,
      slippageBps: 0,
      gasTipLow: "--",
      gasTipAverage: "--",
      gasTipHigh: "--",
      gasLimit: "--"
    };
  }
}

export async function loadManualQuote(
  candidate: Candidate,
  trade: TradePreview,
  side: TradeSide,
  amountInput: number
): Promise<ManualQuotePayload> {
  const context = buildTradeContext(candidate, trade, side);
  const inputAmount =
    amountInput;

  if (!Number.isFinite(amountInput) || amountInput <= 0) {
    return {
      mode: "live",
      source: "derived",
      note: side === "buy" ? "输入数量后即可请求官方 quote。" : "输入卖出数量后即可请求官方 quote。",
      side,
      inputAmount: 0,
      inputSymbol: context.inputSymbol,
      inputTokenAddress: context.inputTokenAddress,
      outputSymbol: context.outputSymbol,
      outputTokenAddress: context.outputTokenAddress,
      estimatedAmount: 0,
      spender: "",
      requiresApproval: !isNativeTradeToken(candidate.chain, context.inputTokenAddress)
    };
  }

  if (inputAmount <= 0) {
    return {
      mode: "fallback",
      source: "derived",
      note: side === "buy" ? "买入数量无效。" : "卖出数量无效。",
      side,
      inputAmount: 0,
      inputSymbol: context.inputSymbol,
      inputTokenAddress: context.inputTokenAddress,
      outputSymbol: context.outputSymbol,
      outputTokenAddress: context.outputTokenAddress,
      estimatedAmount: 0,
      spender: "",
      requiresApproval: !isNativeTradeToken(candidate.chain, context.inputTokenAddress)
    };
  }

  try {
    const quote = await requestAmountOut(jsonRequest, {
      baseUrl: tradeBaseUrl,
      chain: candidate.chain,
      inAmount: toRawUnits(inputAmount, context.inputDecimals),
      inTokenAddress: context.inputTokenAddress,
      outTokenAddress: context.outputTokenAddress,
      swapType: side,
      outputDecimals: context.outputDecimals
    });
    const spender = quote.spender;

    return {
      mode: "live",
      source: "official",
      note: "已切换到 AVE 官方 quote。",
      side,
      inputAmount,
      inputSymbol: context.inputSymbol,
      inputTokenAddress: context.inputTokenAddress,
      outputSymbol: context.outputSymbol,
      outputTokenAddress: context.outputTokenAddress,
      estimatedAmount: quote.estimatedAmount,
      spender,
      requiresApproval:
        isEvmChain(candidate.chain) &&
        !isNativeTradeToken(candidate.chain, context.inputTokenAddress) &&
        spender !== ""
    };
  } catch (error) {
    const derivedAmount =
      side === "buy"
        ? trade.priceUsd > 0
          ? amountInput * Math.max(trade.baseTokenPriceUsd, 0) / trade.priceUsd
          : 0
        : trade.priceUsd > 0
          ? amountInput * trade.priceUsd / Math.max(trade.baseTokenPriceUsd, 1e-9)
          : 0;

    return {
      mode: "fallback",
      source: "derived",
      note: `官方 quote 请求失败，暂时使用本地估算：${(error as Error).message}`,
      side,
      inputAmount,
      inputSymbol: context.inputSymbol,
      inputTokenAddress: context.inputTokenAddress,
      outputSymbol: context.outputSymbol,
      outputTokenAddress: context.outputTokenAddress,
      estimatedAmount: derivedAmount,
      spender: "",
      requiresApproval: !isNativeTradeToken(candidate.chain, context.inputTokenAddress)
    };
  }
}

export async function buildManualTransaction(
  candidate: Candidate,
  trade: TradePreview,
  quote: ManualQuotePayload,
  hints: ManualTradeHintsPayload,
  walletAddress: string
): Promise<ManualBuildPayload> {
  const normalizedWallet = walletAddress.trim();

  if (!normalizedWallet) {
    return {
      mode: "fallback",
      source: "fallback",
      note: "请先连接钱包，再生成交易预构建。",
      side: quote.side,
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
  }

  if (!Number.isFinite(quote.inputAmount) || quote.inputAmount <= 0) {
    return {
      mode: "fallback",
      source: "fallback",
      note: "需要先拿到有效 quote，才能生成交易预构建。",
      side: quote.side,
      requestTxId: "",
      creatorAddress: normalizedWallet,
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
  }

  try {
    const slippage = String(hints.slippageBps || 1000);
    const rawInputAmount = toRawUnits(
      quote.inputAmount,
      buildTradeContext(candidate, trade, quote.side).inputDecimals
    );
    const response =
      candidate.chain === "Solana"
        ? await jsonRequest<{ data?: unknown }>(
            `${tradeBaseUrl}/v1/thirdParty/chainWallet/createSolanaTx`,
            "POST",
            {
              creatorAddress: normalizedWallet,
              inAmount: rawInputAmount,
              inTokenAddress: quote.inputTokenAddress,
              outTokenAddress: quote.outputTokenAddress,
              swapType: quote.side,
              slippage,
              fee: hints.gasTipAverage !== "--" ? hints.gasTipAverage : "1000000",
              autoSlippage: hints.slippageBps > 0
            }
          )
        : await jsonRequest<{ data?: unknown }>(
            `${tradeBaseUrl}/v1/thirdParty/chainWallet/createEvmTx`,
            "POST",
            {
              chain: toApiChain(candidate.chain),
              creatorAddress: normalizedWallet,
              inAmount: rawInputAmount,
              inTokenAddress: quote.inputTokenAddress,
              outTokenAddress: quote.outputTokenAddress,
              swapType: quote.side,
              slippage,
              autoSlippage: hints.slippageBps > 0
            }
          );

    const data = getRecord(unwrapData<Record<string, unknown>>(response));
    const requestTxId = String(
      data.requestTxId ?? data.requestId ?? data.txId ?? data.id ?? ""
    );
    const txContent = data.txContent ?? data.txContext ?? null;

    if (!isRecord(txContent) && typeof txContent !== "string") {
      throw new Error("官方交易预构建返回不完整，缺少 txContent");
    }

    const txPreviewSize =
      typeof txContent === "string"
        ? txContent.length
        : Object.keys(getRecord(txContent)).length;

    return {
      mode: "live",
      source: "official",
      note: requestTxId
        ? "已生成官方交易预构建，可进入签名发送。"
        : "已生成官方交易预构建，但官方未返回 requestTxId，将改用本地直发。",
      side: quote.side,
      requestTxId,
      creatorAddress: normalizedWallet,
      estimateAmount: fromRawUnits(
        data.estimateOut,
        buildTradeContext(candidate, trade, quote.side).outputDecimals
      ),
      minReturnAmount: fromRawUnits(
        data.minReturn,
        buildTradeContext(candidate, trade, quote.side).outputDecimals
      ),
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
      amms: Array.isArray(data.amms) ? data.amms.map((item) => String(item)) : [],
      txPreviewSize,
      txContent: typeof txContent === "string" || isRecord(txContent) ? txContent : null
    };
  } catch (error) {
    return {
      mode: "fallback",
      source: "fallback",
      note: `官方交易预构建失败：${(error as Error).message}`,
      side: quote.side,
      requestTxId: "",
      creatorAddress: normalizedWallet,
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
  }
}

export async function sendSignedSolanaTransaction(
  requestTxId: string,
  signedTx: string,
  useMev = false
): Promise<ManualSendPayload> {
  try {
    const response = await jsonRequest<{ data?: unknown }>(
      `${tradeBaseUrl}/v1/thirdParty/chainWallet/sendSignedSolanaTx`,
      "POST",
      { requestTxId, signedTx, useMev }
    );
    const data = getRecord(unwrapData<Record<string, unknown>>(response));
    return {
      mode: "live",
      source: "official",
      note: "已发送 Solana 签名交易。",
      hash: String(data.hash ?? ""),
      err: String(data.err ?? ""),
      bundleId: String(data.bundleId ?? "")
    };
  } catch (error) {
    return {
      mode: "fallback",
      source: "fallback",
      note: `发送 Solana 签名交易失败：${(error as Error).message}`,
      hash: "",
      err: (error as Error).message,
      bundleId: ""
    };
  }
}

export async function sendSignedEvmTransaction(
  chain: Candidate["chain"],
  requestTxId: string,
  signedTx: string,
  useMev = false
): Promise<ManualSendPayload> {
  try {
    const response = await jsonRequest<{ data?: unknown }>(
      `${tradeBaseUrl}/v1/thirdParty/chainWallet/sendSignedEvmTx`,
      "POST",
      { chain: toApiChain(chain), requestTxId, signedTx, useMev }
    );
    const data = getRecord(unwrapData<Record<string, unknown>>(response));
    return {
      mode: "live",
      source: "official",
      note: "已发送 EVM 签名交易。",
      hash: String(data.hash ?? ""),
      err: String(data.err ?? ""),
      bundleId: ""
    };
  } catch (error) {
    return {
      mode: "fallback",
      source: "fallback",
      note: `发送 EVM 签名交易失败：${(error as Error).message}`,
      hash: "",
      err: (error as Error).message,
      bundleId: ""
    };
  }
}

export async function loadDelegateWallets(
  assetsIds = ""
): Promise<DelegateWalletsPayload> {
  try {
    const wallets = await loadDelegateWalletsCore(jsonRequest, delegateBaseUrl, assetsIds);
    return {
      mode: "live",
      note: wallets.length > 0 ? "已加载 Delegate Wallet 列表。" : "当前组织下还没有 Delegate Wallet。",
      wallets
    };
  } catch (error) {
    return {
      mode: "fallback",
      note: `Delegate Wallet 列表请求失败：${(error as Error).message}`,
      wallets: []
    };
  }
}

export async function createDelegateWallet(
  assetsName: string
): Promise<{ mode: DataMode; note: string; wallet: DelegateWalletRecord | null }> {
  try {
    const response = await jsonRequest<{ data?: unknown }>(
      `${delegateBaseUrl}/v1/thirdParty/user/generateWallet`,
      "POST",
      { assetsName: assetsName.trim(), returnMnemonic: false }
    );
    const data = getList(unwrapData<Array<Record<string, unknown>>>(response));
    const wallet = data[0] ? normalizeDelegateWallet(data[0]) : null;
    return {
      mode: wallet ? "live" : "fallback",
      note: wallet ? "已创建新的 Delegate Wallet。" : "未返回新的 Delegate Wallet。",
      wallet
    };
  } catch (error) {
    return {
      mode: "fallback",
      note: `创建 Delegate Wallet 失败：${(error as Error).message}`,
      wallet: null
    };
  }
}

export async function submitDelegateApproval(
  chain: Candidate["chain"],
  assetsId: string,
  tokenAddress: string
): Promise<DelegateApprovePayload> {
  try {
    const response = await jsonRequest<{ data?: unknown }>(
      `${delegateBaseUrl}/v1/thirdParty/tx/approve`,
      "POST",
      { chain: toApiChain(chain), assetsId, tokenAddress }
    );
    const records = getList(unwrapData<Array<Record<string, unknown>>>(response));
    const data = records[0] ?? getRecord(unwrapData<Record<string, unknown>>(response));
    return {
      mode: "live",
      note: "已提交 Delegate Wallet 授权请求。",
      orderId: String(data.id ?? ""),
      spender: String(data.spender ?? ""),
      amm: String(data.amm ?? ""),
      status: "generated",
      txHash: "",
      errorMessage: ""
    };
  } catch (error) {
    return {
      mode: "fallback",
      note: `Delegate Wallet 授权失败：${(error as Error).message}`,
      orderId: "",
      spender: "",
      amm: "",
      status: "",
      txHash: "",
      errorMessage: (error as Error).message
    };
  }
}

export async function queryDelegateApproval(
  chain: Candidate["chain"],
  orderId: string
): Promise<DelegateApprovePayload> {
  try {
    const data = await queryDelegateApprovalCore(jsonRequest, delegateBaseUrl, {
      chain,
      orderId
    });
    return {
      mode: "live",
      note: "已刷新授权状态。",
      orderId: data.orderId,
      spender: data.spender,
      amm: "",
      status: data.status,
      txHash: data.txHash,
      errorMessage: data.errorMessage
    };
  } catch (error) {
    return {
      mode: "fallback",
      note: `查询授权状态失败：${(error as Error).message}`,
      orderId,
      spender: "",
      amm: "",
      status: "",
      txHash: "",
      errorMessage: (error as Error).message
    };
  }
}

export async function submitDelegateOrder(input: {
  chain: Candidate["chain"];
  assetsId: string;
  trade: TradePreview;
  candidate: Candidate;
  side: TradeSide;
  orderType: DelegateOrderType;
  amount: number;
  limitPrice?: string;
  useMev: boolean;
  autoSlippage: boolean;
  autoGas: GasTier;
}) {
  const context = buildTradeContext(input.candidate, input.trade, input.side);
  const rawInputAmount = toRawUnits(input.amount, context.inputDecimals);
  const payload: Record<string, unknown> = {
    chain: toApiChain(input.chain),
    assetsId: input.assetsId,
    inTokenAddress: context.inputTokenAddress,
    outTokenAddress: context.outputTokenAddress,
    inAmount: rawInputAmount,
    swapType: input.side,
    slippage: "500",
    useMev: input.useMev,
    autoSlippage: input.autoSlippage,
    autoGas: input.autoGas
  };

  if (input.chain === "Solana") {
    payload.gas = "1000000";
  } else {
    payload.extraGas = "0";
  }

  if (input.orderType === "limit") {
    payload.limitPrice = input.limitPrice || "";
    payload.expireTime = "604800";
  }

  try {
    const response = await jsonRequest<{ data?: unknown }>(
      `${delegateBaseUrl}/v1/thirdParty/tx/${input.orderType === "market" ? "sendSwapOrder" : "sendLimitOrder"}`,
      "POST",
      payload
    );
    const data = getRecord(unwrapData<Record<string, unknown>>(response));
    return {
      mode: "live" as const,
      note: input.orderType === "market" ? "已提交 Market Order。" : "已提交 Limit Order。",
      orderType: input.orderType,
      orderId: String(data.id ?? "")
    };
  } catch (error) {
    return {
      mode: "fallback" as const,
      note: `${input.orderType === "market" ? "提交 Market Order" : "提交 Limit Order"} 失败：${(error as Error).message}`,
      orderType: input.orderType,
      orderId: ""
    };
  }
}

export async function queryDelegateOrderStatus(input: {
  chain: Candidate["chain"];
  assetsId: string;
  orderId: string;
  orderType: DelegateOrderType;
}): Promise<DelegateOrderStatusPayload> {
  try {
    const data = await queryDelegateOrderStatusCore(jsonRequest, delegateBaseUrl, input);

    return {
      mode: "live" as const,
      note: "已刷新 Delegate Order 状态。",
      orderType: input.orderType,
      orderId: data.orderId,
      status: data.status,
      chain: data.chain,
      swapType: data.swapType,
      txHash: data.txHash,
      errorMessage: data.errorMessage,
      txPriceUsd: data.txPriceUsd,
      inAmount: data.inAmount,
      outAmount: data.outAmount,
      limitPrice: data.limitPrice,
      createPrice: data.createPrice,
      expireAt: data.expireAt,
      trailingPriceChange: data.trailingPriceChange
    };
  } catch (error) {
    return {
      mode: "fallback" as const,
      note: `查询 Delegate Order 状态失败：${(error as Error).message}`,
      orderType: input.orderType,
      orderId: input.orderId,
      status: "",
      chain: toApiChain(input.chain),
      swapType: "",
      txHash: "",
      errorMessage: (error as Error).message,
      txPriceUsd: "",
      inAmount: "",
      outAmount: "",
      limitPrice: "",
      createPrice: "",
      expireAt: "",
      trailingPriceChange: ""
    };
  }
}

export function getManualInputContext(
  candidate: Candidate,
  trade: TradePreview,
  side: TradeSide
) {
  return buildTradeContext(candidate, trade, side);
}

export function manualTradeNeedsApproval(
  chain: Candidate["chain"],
  tokenAddress: string,
  spender: string
) {
  return isEvmChain(chain) && !isNativeTradeToken(chain, tokenAddress) && spender !== "";
}
