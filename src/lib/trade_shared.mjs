export const nativeEvmToken = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getRecord(value) {
  return isRecord(value) ? value : {};
}

export function getList(value) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function unwrapData(payload) {
  return payload?.data ?? payload;
}

export function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

export function toApiChain(chain) {
  const normalized = String(chain ?? "").trim().toLowerCase();
  if (normalized === "solana" || normalized === "sol") return "solana";
  if (normalized === "bsc" || normalized === "bnb") return "bsc";
  if (normalized === "base") return "base";
  if (normalized === "eth" || normalized === "ethereum") return "eth";
  return "solana";
}

export function toChainLabel(chain) {
  const normalized = toApiChain(chain);
  if (normalized === "bsc") return "BSC";
  if (normalized === "base") return "Base";
  if (normalized === "eth") return "Ethereum";
  return "Solana";
}

export function isEvmChain(chain) {
  return toApiChain(chain) !== "solana";
}

export function isNativeTradeToken(chain, tokenAddress) {
  if (toApiChain(chain) === "solana") {
    return tokenAddress === "sol";
  }
  return String(tokenAddress ?? "").toLowerCase() === nativeEvmToken;
}

export function buildQuery(path, params) {
  const url = new URL(path, "http://localhost");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return `${url.pathname}${url.search}`;
}

export function toRawUnits(amount, decimals) {
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  const safeDecimals = Math.min(decimals, 8);
  const fixed = amount.toFixed(safeDecimals);
  const [whole, fraction = ""] = fixed.split(".");
  const raw =
    whole + fraction.padEnd(safeDecimals, "0") + "0".repeat(Math.max(decimals - safeDecimals, 0));
  return raw.replace(/^0+(?=\d)/, "") || "0";
}

export function fromRawUnits(value, decimals) {
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

export function normalizeDelegateWallet(item) {
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

export async function requestAmountOut(requestJson, input) {
  const response = await requestJson(
    `${input.baseUrl}/v1/thirdParty/chainWallet/getAmountOut`,
    "POST",
    {
      chain: toApiChain(input.chain),
      inAmount: input.inAmount,
      inTokenAddress: input.inTokenAddress,
      outTokenAddress: input.outTokenAddress,
      swapType: input.swapType
    }
  );
  const quote = getRecord(unwrapData(response));
  const decimals = toNumber(quote.decimals) || input.outputDecimals;
  return {
    raw: quote,
    estimatedAmount: fromRawUnits(quote.estimateOut, decimals),
    spender: String(quote.spender ?? ""),
    decimals
  };
}

export async function loadDelegateWalletsCore(requestJson, delegateBaseUrl, assetsIds = "") {
  const query = buildQuery("/v1/thirdParty/user/getUserByAssetsId", { assetsIds });
  const response = await requestJson(`${delegateBaseUrl}${query}`, "GET");
  return getList(unwrapData(response)).map(normalizeDelegateWallet);
}

export async function queryDelegateApprovalCore(requestJson, delegateBaseUrl, input) {
  const query = buildQuery("/v1/thirdParty/tx/getApprove", {
    chain: toApiChain(input.chain),
    ids: input.orderId
  });
  const response = await requestJson(`${delegateBaseUrl}${query}`, "GET");
  const data = getList(unwrapData(response))[0] ?? {};
  return {
    orderId: String(data.id ?? input.orderId),
    spender: String(data.spender ?? ""),
    status: String(data.status ?? ""),
    txHash: String(data.txHash ?? ""),
    errorMessage: String(data.errorMessage ?? "")
  };
}

export async function queryDelegateOrderStatusCore(requestJson, delegateBaseUrl, input) {
  const query =
    input.orderType === "market"
      ? buildQuery("/v1/thirdParty/tx/getSwapOrder", {
          chain: toApiChain(input.chain),
          ids: input.orderId
        })
      : buildQuery("/v1/thirdParty/tx/getLimitOrder", {
          chain: toApiChain(input.chain),
          assetsId: input.assetsId ?? "",
          pageSize: 20,
          pageNo: 0
        });
  const response = await requestJson(`${delegateBaseUrl}${query}`, "GET");
  const records = getList(unwrapData(response));
  const data =
    input.orderType === "market"
      ? records[0] ?? {}
      : records.find((item) => String(item.id ?? "") === input.orderId) ?? records[0] ?? {};
  const swapType = String(data.swapType ?? "");
  return {
    orderId: String(data.id ?? input.orderId),
    status: String(data.status ?? ""),
    chain: String(data.chain ?? toApiChain(input.chain)),
    swapType: swapType === "buy" || swapType === "sell" ? swapType : "",
    txHash: String(data.txHash ?? ""),
    errorMessage: String(data.errorMessage ?? ""),
    txPriceUsd: String(data.txPriceUsd ?? ""),
    inAmount: String(data.inAmount ?? ""),
    outAmount: String(data.outAmount ?? ""),
    limitPrice: String(data.limitPrice ?? ""),
    createPrice: String(data.createPrice ?? ""),
    expireAt: String(data.expireAt ?? ""),
    trailingPriceChange: String(data.trailingPriceChange ?? "")
  };
}
