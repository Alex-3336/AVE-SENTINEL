import { Buffer } from "buffer";
import { ethers } from "ethers";
import { Connection, LAMPORTS_PER_SOL, Message, PublicKey, Transaction, VersionedMessage, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";
import type { Candidate } from "../data/mock";

type EvmChain = Extract<Candidate["chain"], "BSC" | "Base" | "Ethereum">;

type EvmProvider = {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
};

type SolanaProvider = {
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey?: { toString(): string } } | void>;
  publicKey?: { toString(): string };
  isPhantom?: boolean;
  isOkxWallet?: boolean;
  signTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<Transaction | VersionedTransaction>;
};

type PrivySolanaWallet = {
  address: string;
  walletClientType?: string;
  signTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<Transaction | VersionedTransaction>;
};

declare global {
  interface Window {
    ethereum?: any;
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
    okxwallet?: { solana?: SolanaProvider };
    Buffer?: typeof Buffer;
  }
}

type ConnectedWallet = {
  address: string;
  note: string;
};

type SolanaTransactionSigner = {
  signTransaction(
    transaction: Transaction | VersionedTransaction
  ): Promise<Transaction | VersionedTransaction>;
};

type EvmExecutionResult =
  | { source: "official"; signedTx: string; hash: string }
  | { source: "wallet"; signedTx: ""; hash: string };

const erc20Interface = new ethers.Interface([
  "function approve(address spender, uint256 amount)",
  "function balanceOf(address account) view returns (uint256)"
]);

const aveApiKey = import.meta.env.VITE_AVE_API_KEY?.trim();
const aveBaseUrl =
  import.meta.env.VITE_AVE_BASE_URL?.trim() || "/api/ave/v2";
const solanaProxyRpcUrl = (() => {
  const explicit = import.meta.env.VITE_SOLANA_PROXY_URL?.trim();
  if (explicit) {
    return explicit;
  }

  if (aveBaseUrl.startsWith("http://") || aveBaseUrl.startsWith("https://")) {
    return aveBaseUrl.replace(/\/api\/ave\/v2\/?$/, "/api/solana/rpc");
  }

  return "http://127.0.0.1:8787/api/solana/rpc";
})();
const solanaRpcUrl =
  import.meta.env.VITE_SOLANA_RPC_URL?.trim() || clusterApiUrl("mainnet-beta");
const solanaBalanceRpcUrls = Array.from(
  new Set([
    solanaProxyRpcUrl,
    solanaRpcUrl,
    clusterApiUrl("mainnet-beta"),
    "https://api.mainnet-beta.solana.com",
    "https://rpc.ankr.com/solana"
  ].filter(Boolean))
);

let connectedPrivySolanaWallet: PrivySolanaWallet | null = null;

export function setPrivySolanaWallet(wallet: PrivySolanaWallet | null) {
  connectedPrivySolanaWallet = wallet;
}

export async function getCurrentConnectedWalletAddress(chain: Candidate["chain"]) {
  if (chain === "Solana") {
    if (connectedPrivySolanaWallet?.address) {
      return connectedPrivySolanaWallet.address;
    }
    if (typeof window === "undefined") {
      return "";
    }
    return (
      window.okxwallet?.solana?.publicKey?.toString()
      ?? window.phantom?.solana?.publicKey?.toString()
      ?? window.solana?.publicKey?.toString()
      ?? ""
    );
  }

  if (typeof window === "undefined" || !window.ethereum) {
    return "";
  }

  const accounts = await window.ethereum.request({
    method: "eth_accounts"
  }).catch(() => []) as unknown;

  if (!Array.isArray(accounts)) {
    return "";
  }

  return typeof accounts[0] === "string" ? accounts[0] : "";
}

function getEvmChainId(chain: EvmChain) {
  if (chain === "BSC") return "0x38";
  if (chain === "Base") return "0x2105";
  return "0x1";
}

function getEvmProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("未检测到 EVM 钱包。");
  }
  return window.ethereum;
}

function getSolanaProvider() {
  if (typeof window === "undefined") {
    throw new Error("未检测到 Solana 钱包。");
  }
  const provider = window.okxwallet?.solana ?? window.phantom?.solana ?? window.solana;
  if (!provider) {
    throw new Error("未检测到 Solana 钱包。");
  }
  return provider;
}

function toAveWalletChain(chain: Candidate["chain"]) {
  if (chain === "Solana") return "solana";
  if (chain === "BSC") return "bsc";
  if (chain === "Base") return "base";
  return "eth";
}

function resolveWalletInfoTokenAddress(chain: Candidate["chain"], tokenAddress: string) {
  if (chain === "Solana" && tokenAddress.toLowerCase() === "sol") {
    return "So11111111111111111111111111111111111111112";
  }
  return tokenAddress;
}

async function getAveWalletTokenBalance(params: {
  chain: Candidate["chain"];
  walletAddress: string;
  tokenAddress: string;
}) {
  const targetToken = resolveWalletInfoTokenAddress(params.chain, params.tokenAddress).toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const query = new URLSearchParams({
      wallet_address: params.walletAddress,
      chain: toAveWalletChain(params.chain),
      sort: "balance_usd",
      sort_dir: "desc",
      hide_sold: "0",
      hide_small: "0",
      pageSize: "100",
      pageNO: String(page)
    });

    const response = await fetch(`${aveBaseUrl}/address/walletinfo/tokens?${query.toString()}`, {
      headers: {
        ...(aveApiKey ? { "X-API-KEY": aveApiKey } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`AVE walletinfo API ${response.status}`);
    }

    const payload = await response.json() as {
      status?: number | string;
      msg?: string;
      message?: string;
      data?: Array<Record<string, unknown>>;
    };
    const normalizedStatus =
      typeof payload.status === "number" || typeof payload.status === "string"
        ? String(payload.status)
        : "";

    if (normalizedStatus && normalizedStatus !== "1" && normalizedStatus !== "200") {
      throw new Error(String(payload.msg ?? payload.message ?? "AVE walletinfo API failed"));
    }

    const records = Array.isArray(payload.data) ? payload.data : [];
    const matched = records.find((item) => String(item.token ?? "").toLowerCase() === targetToken);
    if (matched) {
      const balanceAmount = Number(matched.balance_amount ?? 0);
      return Number.isFinite(balanceAmount) ? balanceAmount : 0;
    }

    if (records.length < 100) {
      break;
    }
  }

  return null;
}

async function solanaRpcRequest<T>(rpcUrl: string, method: string, params: unknown[], timeoutMs: number) {
  const response = await withTimeout(
    fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params
      })
    }),
    timeoutMs,
    `Solana RPC timeout: ${rpcUrl}`
  );

  if (!response.ok) {
    throw new Error(`Solana RPC ${response.status}: ${rpcUrl}`);
  }

  const payload = await response.json() as {
    result?: T;
    error?: { message?: string };
  };

  if (payload.error) {
    throw new Error(payload.error.message || `Solana RPC error: ${rpcUrl}`);
  }

  if (payload.result === undefined) {
    throw new Error(`Solana RPC missing result: ${rpcUrl}`);
  }

  return payload.result;
}

async function signWithProvider(
  provider: SolanaProvider,
  txContent: string,
  expectedAddress?: string
) {
  const currentAddress = provider.publicKey?.toString() ?? "";

  if (!currentAddress || (expectedAddress && currentAddress !== expectedAddress)) {
    const response = await provider.connect();
    const connectedAddress = response?.publicKey?.toString() ?? provider.publicKey?.toString() ?? "";
    if (expectedAddress && connectedAddress && connectedAddress !== expectedAddress) {
      throw new Error("当前 OKX 钱包地址与已连接地址不一致，请切换到同一地址后重试。");
    }
  }

  return signSerializedSolanaPayload(provider, txContent);
}

async function signSerializedSolanaPayload(
  signer: SolanaTransactionSigner,
  txContent: string
) {
  const buffer = Buffer.from(txContent, "base64");

  try {
    const tx = VersionedTransaction.deserialize(buffer);
    const signed = await signer.signTransaction(tx);
    return Buffer.from(signed.serialize()).toString("base64");
  } catch {}

  try {
    const tx = Transaction.from(buffer);
    const signed = await signer.signTransaction(tx);
    return Buffer.from(signed.serialize({ requireAllSignatures: false })).toString("base64");
  } catch {}

  try {
    const message = VersionedMessage.deserialize(buffer);
    if (message instanceof Message) {
      const tx = Transaction.populate(message);
      const signed = await signer.signTransaction(tx);
      return Buffer.from(signed.serialize({ requireAllSignatures: false })).toString("base64");
    }

    const tx = new VersionedTransaction(message);
    const signed = await signer.signTransaction(tx);
    return Buffer.from(signed.serialize()).toString("base64");
  } catch {}

  try {
    const tx = Transaction.populate(Message.from(buffer));
    const signed = await signer.signTransaction(tx);
    return Buffer.from(signed.serialize({ requireAllSignatures: false })).toString("base64");
  } catch {}

  throw new Error("Solana 预构建交易格式无法识别，请重新生成后再试。");
}

async function switchEvmChain(chain: EvmChain) {
  const provider = getEvmProvider();
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: getEvmChainId(chain) }]
  });
}

function normalizeEvmTx(txContent: Record<string, unknown>) {
  const tx = { ...txContent } as Record<string, unknown>;
  if (tx.gas && !tx.gasLimit) {
    tx.gasLimit = tx.gas;
  }
  return tx;
}

export async function connectEvmWallet(chain: EvmChain): Promise<ConnectedWallet> {
  const provider = getEvmProvider();
  await provider.request({ method: "eth_requestAccounts" });
  await switchEvmChain(chain);
  const browserProvider = new ethers.BrowserProvider(provider as ethers.Eip1193Provider);
  const signer = await browserProvider.getSigner();
  const address = await signer.getAddress();
  return {
    address,
    note: "已连接 EVM 钱包。"
  };
}

export async function connectSolanaWallet(): Promise<ConnectedWallet> {
  if (connectedPrivySolanaWallet?.address) {
    return {
      address: connectedPrivySolanaWallet.address,
      note: "已连接 Solana 钱包。"
    };
  }

  const provider = getSolanaProvider();
  const response = await provider.connect();
  const address = response?.publicKey?.toString() ?? provider.publicKey?.toString() ?? "";
  if (!address) {
    throw new Error("Solana 钱包未返回地址。");
  }
  return {
    address,
    note: "已连接 Solana 钱包。"
  };
}

export async function sendEvmApproval(
  chain: EvmChain,
  tokenAddress: string,
  spender: string
) {
  const provider = getEvmProvider();
  await switchEvmChain(chain);
  const browserProvider = new ethers.BrowserProvider(provider as ethers.Eip1193Provider);
  const signer = await browserProvider.getSigner();
  const txResponse = await signer.sendTransaction({
    to: tokenAddress,
    data: erc20Interface.encodeFunctionData("approve", [spender, ethers.MaxUint256]),
    value: 0n
  });
  return {
    hash: txResponse.hash,
    note: "已提交钱包授权交易。"
  };
}

export async function signAndExecuteEvmTransaction(
  chain: EvmChain,
  txContent: Record<string, unknown>
): Promise<EvmExecutionResult> {
  const provider = getEvmProvider();
  await switchEvmChain(chain);
  const browserProvider = new ethers.BrowserProvider(provider as ethers.Eip1193Provider);
  const signer = await browserProvider.getSigner();
  const normalizedTx = normalizeEvmTx(txContent);

  try {
    const signedTx = await signer.signTransaction(normalizedTx);
    const hash = ethers.keccak256(signedTx);
    return {
      source: "official",
      signedTx,
      hash
    };
  } catch {
    const txResponse = await signer.sendTransaction(normalizedTx);
    return {
      source: "wallet",
      signedTx: "",
      hash: txResponse.hash
    };
  }
}

export async function signSolanaTransaction(txContent: string) {
  const okxProvider =
    typeof window !== "undefined"
      ? window.okxwallet?.solana
      : undefined;

  if (connectedPrivySolanaWallet?.walletClientType === "okx_wallet" && okxProvider) {
    return signWithProvider(okxProvider, txContent, connectedPrivySolanaWallet.address);
  }

  if (connectedPrivySolanaWallet) {
    try {
      return signSerializedSolanaPayload(connectedPrivySolanaWallet, txContent);
    } catch {
      if (okxProvider) {
        return signWithProvider(okxProvider, txContent, connectedPrivySolanaWallet.address);
      }
      throw new Error("Solana 钱包签名未成功，请重新连接钱包后重试。");
    }
  }

  const provider = getSolanaProvider();
  return signWithProvider(provider, txContent);
}

export async function sendRawSolanaTransaction(signedTx: string) {
  const connection = new Connection(solanaRpcUrl, "confirmed");
  const signature = await connection.sendRawTransaction(Buffer.from(signedTx, "base64"), {
    preflightCommitment: "confirmed",
    maxRetries: 3
  });

  return {
    hash: signature,
    note: "已通过链上 RPC 直接发送 Solana 交易。"
  };
}

export async function getManualWalletTokenBalance(params: {
  chain: Candidate["chain"];
  walletAddress: string;
  tokenAddress: string;
  tokenDecimals: number;
}) {
  const { chain, walletAddress, tokenAddress, tokenDecimals } = params;

  if (!walletAddress || !tokenAddress) {
    return 0;
  }

  const isSolanaNativeBalance =
    chain === "Solana" &&
    (tokenAddress.toLowerCase() === "sol" ||
      tokenAddress === "So11111111111111111111111111111111111111112");

  if (!isSolanaNativeBalance) {
    try {
      const aveBalance = await getAveWalletTokenBalance({
        chain,
        walletAddress,
        tokenAddress
      });
      if (aveBalance !== null) {
        return aveBalance;
      }
    } catch {}
  }

  if (chain === "Solana") {
    const owner = new PublicKey(walletAddress);
    const mint = isSolanaNativeBalance ? null : new PublicKey(tokenAddress);
    let lastError: Error | null = null;

    for (const rpcUrl of solanaBalanceRpcUrls) {
      try {
        if (isSolanaNativeBalance) {
          const payload = await solanaRpcRequest<{ value?: number }>(
            rpcUrl,
            "getBalance",
            [owner.toBase58(), { commitment: "confirmed" }],
            4000
          );
          const balance = Number(payload.value ?? 0);
          return Number.isFinite(balance) ? balance / LAMPORTS_PER_SOL : 0;
        }

        const payload = await solanaRpcRequest<{
          value?: Array<{
            account?: {
              data?: {
                parsed?: {
                  info?: {
                    tokenAmount?: {
                      uiAmountString?: string;
                      uiAmount?: number;
                    };
                  };
                };
              };
            };
          }>;
        }>(
          rpcUrl,
          "getTokenAccountsByOwner",
          [
            owner.toBase58(),
            { mint: mint!.toBase58() },
            { encoding: "jsonParsed", commitment: "confirmed" }
          ],
          5000
        );
        return (payload.value ?? []).reduce((sum, account) => {
          const tokenAmount = account.account?.data?.parsed?.info?.tokenAmount;
          const amount = Number(tokenAmount?.uiAmountString ?? tokenAmount?.uiAmount ?? 0);
          return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0);
      } catch (error) {
        lastError = error as Error;
      }
    }

    if (lastError) {
      throw lastError;
    }
    return 0;
  }

  const provider = getEvmProvider();
  await switchEvmChain(chain);
  const browserProvider = new ethers.BrowserProvider(provider as ethers.Eip1193Provider);

  if (tokenAddress === nativeEvmTokenAddress(chain)) {
    const balance = await browserProvider.getBalance(walletAddress);
    return Number(ethers.formatUnits(balance, tokenDecimals));
  }

  const contract = new ethers.Contract(tokenAddress, erc20Interface, browserProvider);
  const balance = await contract.balanceOf(walletAddress);
  return Number(ethers.formatUnits(balance, tokenDecimals));
}

function nativeEvmTokenAddress(chain: EvmChain) {
  if (chain === "BSC") return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}
