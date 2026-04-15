export type TradeSide = "buy" | "sell";
export type DelegateOrderType = "market" | "limit";
export type DelegateWalletRecord = {
  assetsId: string;
  assetsName: string;
  type: string;
  status: string;
  addresses: Partial<Record<"Solana" | "BSC" | "Base" | "Ethereum", string>>;
};

export type RequestJson = (
  url: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
) => Promise<unknown>;

export const nativeEvmToken: string;
export function isRecord(value: unknown): value is Record<string, unknown>;
export function getRecord(value: unknown): Record<string, unknown>;
export function getList(value: unknown): Array<Record<string, unknown>>;
export function unwrapData<T = unknown>(payload: unknown): T;
export function toNumber(value: unknown): number;
export function toApiChain(chain: string): "solana" | "bsc" | "base" | "eth";
export function toChainLabel(chain: string): "Solana" | "BSC" | "Base" | "Ethereum";
export function isEvmChain(chain: string): boolean;
export function isNativeTradeToken(chain: string, tokenAddress: string): boolean;
export function buildQuery(
  path: string,
  params: Record<string, string | number | undefined>
): string;
export function toRawUnits(amount: number, decimals: number): string;
export function fromRawUnits(value: unknown, decimals: number): number;
export function normalizeDelegateWallet(item: Record<string, unknown>): DelegateWalletRecord;
export function requestAmountOut(
  requestJson: RequestJson,
  input: {
    baseUrl: string;
    chain: string;
    inAmount: string;
    inTokenAddress: string;
    outTokenAddress: string;
    swapType: TradeSide;
    outputDecimals: number;
  }
): Promise<{
  raw: Record<string, unknown>;
  estimatedAmount: number;
  spender: string;
  decimals: number;
}>;
export function loadDelegateWalletsCore(
  requestJson: RequestJson,
  delegateBaseUrl: string,
  assetsIds?: string
): Promise<DelegateWalletRecord[]>;
export function queryDelegateApprovalCore(
  requestJson: RequestJson,
  delegateBaseUrl: string,
  input: {
    chain: string;
    orderId: string;
  }
): Promise<{
  orderId: string;
  spender: string;
  status: string;
  txHash: string;
  errorMessage: string;
}>;
export function queryDelegateOrderStatusCore(
  requestJson: RequestJson,
  delegateBaseUrl: string,
  input: {
    chain: string;
    assetsId?: string;
    orderId: string;
    orderType: DelegateOrderType;
  }
): Promise<{
  orderId: string;
  status: string;
  chain: string;
  swapType: "" | TradeSide;
  txHash: string;
  errorMessage: string;
  txPriceUsd: string;
  inAmount: string;
  outAmount: string;
  limitPrice: string;
  createPrice: string;
  expireAt: string;
  trailingPriceChange: string;
}>;
