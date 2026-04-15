import type { PrivyProviderProps, WalletListEntry } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import type { Candidate } from "../data/mock";

export const PRIVY_APP_ID =
  import.meta.env.VITE_PRIVY_APP_ID || "cmny9d9nr00550cjy36p2hjc4";

export const PRIVY_CLIENT_ID =
  import.meta.env.VITE_PRIVY_CLIENT_ID ||
  "client-WY6XqQ9sQhUbvDFjk7zJR75xQ1g4TyA1PbHT5jg9Lpidv";

const EVM_WALLET_LIST: WalletListEntry[] = [
  "metamask",
  "okx_wallet",
  "coinbase_wallet",
  "rainbow",
  "detected_ethereum_wallets"
];

const SOLANA_WALLET_LIST: WalletListEntry[] = [
  "phantom",
  "solflare",
  "backpack",
  "okx_wallet",
  "detected_solana_wallets"
];

const MULTI_WALLET_LIST: WalletListEntry[] = [
  "phantom",
  "solflare",
  "backpack",
  "metamask",
  "okx_wallet",
  "coinbase_wallet",
  "rainbow",
  "detected_solana_wallets",
  "detected_ethereum_wallets"
];

export function buildPrivyConfig(): PrivyProviderProps["config"] {
  return {
    loginMethods: ["wallet"],
    appearance: {
      theme: "light" as const,
      accentColor: "#2563eb" as const,
      landingHeader: "Connect your wallet",
      loginMessage: "Connect an external wallet to trade in AVE Sentinel.",
      showWalletLoginFirst: true,
      walletChainType: "ethereum-and-solana" as const,
      walletList: MULTI_WALLET_LIST
    },
    externalWallets: {
      solana: {
        connectors: toSolanaWalletConnectors()
      }
    }
  };
}

export function getPrivyWalletOptions(chain?: Candidate["chain"]) {
  if (chain === "Solana") {
    return {
      walletChainType: "solana-only" as const,
      walletList: SOLANA_WALLET_LIST
    };
  }

  if (chain === "BSC" || chain === "Base" || chain === "Ethereum") {
    return {
      walletChainType: "ethereum-only" as const,
      walletList: EVM_WALLET_LIST
    };
  }

  return {
    walletChainType: "ethereum-and-solana" as const,
    walletList: MULTI_WALLET_LIST
  };
}
