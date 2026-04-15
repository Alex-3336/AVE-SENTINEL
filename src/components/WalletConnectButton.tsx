import { useState, type ComponentType } from "react";
import type { Candidate } from "../data/mock";
import { t, type Language } from "../i18n";

type ConnectedWalletPayload = {
  type: "ethereum" | "solana";
  address: string;
  wallet: unknown;
};

type WalletConnectButtonProps = {
  chain?: Candidate["chain"];
  language: Language;
  currentAddress: string;
  disabled?: boolean;
  onConnected: (wallet: ConnectedWalletPayload) => void;
  onDisconnected: () => void;
};

type LoadedPrivyButton = ComponentType<
  WalletConnectButtonProps & { autoOpenNonce?: number }
>;

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WalletGlyph() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path
        d="M4 7.25A2.25 2.25 0 0 1 6.25 5h10.5A2.25 2.25 0 0 1 19 7.25V8h-1.5v-.75a.75.75 0 0 0-.75-.75H6.25a.75.75 0 0 0 0 1.5H19a1 1 0 0 1 1 1v7.25A2.75 2.75 0 0 1 17.25 19h-11.5A2.75 2.75 0 0 1 3 16.25v-9Zm15 2.25h-4.5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1H19v-4Zm-3 2a.75.75 0 1 1 0 1.5a.75.75 0 0 1 0-1.5Z"
        fill="currentColor"
      />
      <path d="M7 4.5h7.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function WalletConnectButton({
  chain,
  language,
  currentAddress,
  disabled,
  onConnected,
  onDisconnected
}: WalletConnectButtonProps) {
  const [LoadedButton, setLoadedButton] = useState<LoadedPrivyButton | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoOpenNonce, setAutoOpenNonce] = useState(0);

  async function handleClick() {
    if (disabled || loading) return;
    if (LoadedButton) {
      setAutoOpenNonce((value) => value + 1);
      return;
    }

    setLoading(true);
    try {
      const module = await import("./PrivyWalletConnect");
      setLoadedButton(() => module.PrivyWalletConnect);
      setAutoOpenNonce((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }

  if (LoadedButton) {
    return (
      <LoadedButton
        chain={chain}
        language={language}
        currentAddress={currentAddress}
        disabled={disabled}
        autoOpenNonce={autoOpenNonce}
        onConnected={onConnected}
        onDisconnected={onDisconnected}
      />
    );
  }

  const displayAddress = currentAddress || "";

  return (
    <button
      className={`t-wallet-connect${displayAddress ? " connected" : ""}`}
      onClick={handleClick}
      type="button"
      disabled={disabled || loading}
    >
      <span className="t-wallet-connect-icon" aria-hidden="true">
        <WalletGlyph />
      </span>
      <span className="t-wallet-connect-text">
        {displayAddress
          ? shortAddress(displayAddress)
          : loading
            ? "--"
            : t(language, "nav.wallet.connect")}
      </span>
      <span className="t-wallet-connect-caret" aria-hidden="true">▾</span>
    </button>
  );
}
