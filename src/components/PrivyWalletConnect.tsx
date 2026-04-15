import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  PrivyProvider,
  useConnectWallet,
  useLogout,
  useWallets
} from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import type { Candidate } from "../data/mock";
import { t, type Language } from "../i18n";
import {
  PRIVY_APP_ID,
  PRIVY_CLIENT_ID,
  buildPrivyConfig,
  getPrivyWalletOptions
} from "../lib/privy";

type ConnectedWalletPayload = {
  type: "ethereum" | "solana";
  address: string;
  wallet: unknown;
};

export type PrivyWalletConnectProps = {
  chain?: Candidate["chain"];
  language: Language;
  currentAddress: string;
  disabled?: boolean;
  autoOpenNonce?: number;
  onConnected: (wallet: ConnectedWalletPayload) => void;
  onDisconnected: () => void;
};

class PrivyBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

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

function PrivyWalletConnectInner({
  chain,
  language,
  currentAddress,
  disabled,
  autoOpenNonce,
  onConnected,
  onDisconnected
}: PrivyWalletConnectProps) {
  const { wallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();
  const { logout } = useLogout();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const { connectWallet } = useConnectWallet({
    onSuccess: ({ wallet }) => {
      onConnected({
        type: wallet.type,
        address: wallet.address,
        wallet
      });
    }
  });

  const activeWallet =
    chain === "Solana"
      ? solanaWallets[0] ?? null
      : wallets.find((wallet) => wallet.type === "ethereum") ?? wallets[0];

  const displayAddress = currentAddress || activeWallet?.address || "";
  const modalOptions = getPrivyWalletOptions(chain);
  const switchLabel = language === "zh" ? "切换钱包" : "Switch Wallet";
  const disconnectLabel = language === "zh" ? "断开钱包" : "Disconnect Wallet";

  const openWalletPicker = () => {
    setMenuOpen(false);
    connectWallet(modalOptions);
  };

  async function handleDisconnect() {
    if (disconnecting) return;
    setDisconnecting(true);
    setMenuOpen(false);

    try {
      wallets.forEach((wallet) => wallet.disconnect());
      solanaWallets.forEach((wallet) => wallet.disconnect());
      await logout();
    } finally {
      onDisconnected();
      setDisconnecting(false);
    }
  }

  useEffect(() => {
    if (!autoOpenNonce || disabled) return;
    if (displayAddress) {
      setMenuOpen(true);
      return;
    }
    openWalletPicker();
  }, [autoOpenNonce, disabled, displayAddress]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!displayAddress) {
      setMenuOpen(false);
    }
  }, [displayAddress]);

  useEffect(() => {
    if (currentAddress || !activeWallet?.address) return;
    onConnected({
      type: activeWallet.type,
      address: activeWallet.address,
      wallet: activeWallet
    });
  }, [currentAddress, activeWallet, onConnected]);

  function handleButtonClick() {
    if (disabled) return;
    if (displayAddress) {
      setMenuOpen((value) => !value);
      return;
    }
    openWalletPicker();
  }

  return (
    <div className="t-wallet-connect-shell" ref={shellRef}>
      <button
        className={`t-wallet-connect${displayAddress ? " connected" : ""}${menuOpen ? " open" : ""}`}
        onClick={handleButtonClick}
        type="button"
        disabled={disabled || disconnecting}
        aria-haspopup={displayAddress ? "menu" : undefined}
        aria-expanded={displayAddress ? menuOpen : undefined}
      >
        <span className="t-wallet-connect-icon" aria-hidden="true">
          <WalletGlyph />
        </span>
        <span className="t-wallet-connect-text">
          {displayAddress ? shortAddress(displayAddress) : t(language, "nav.wallet.connect")}
        </span>
        <span className="t-wallet-connect-caret" aria-hidden="true">▾</span>
      </button>
      {displayAddress && menuOpen ? (
        <div className="t-wallet-connect-menu" role="menu">
          <button
            className="t-wallet-connect-menu-item"
            type="button"
            role="menuitem"
            onClick={openWalletPicker}
          >
            {switchLabel}
          </button>
          <button
            className="t-wallet-connect-menu-item danger"
            type="button"
            role="menuitem"
            onClick={() => void handleDisconnect()}
            disabled={disconnecting}
          >
            {disconnectLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PrivyWalletConnect({
  chain,
  language,
  currentAddress,
  disabled,
  autoOpenNonce,
  onConnected,
  onDisconnected
}: PrivyWalletConnectProps) {
  const config = useMemo(() => buildPrivyConfig(), []);
  const fallback = (
    <button className="t-wallet-connect" type="button" disabled>
      <span className="t-wallet-connect-icon" aria-hidden="true">
        <WalletGlyph />
      </span>
      <span className="t-wallet-connect-text">{t(language, "nav.wallet.connect")}</span>
      <span className="t-wallet-connect-caret" aria-hidden="true">▾</span>
    </button>
  );

  return (
    <PrivyBoundary fallback={fallback}>
      <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID} config={config}>
        <PrivyWalletConnectInner
          chain={chain}
          language={language}
          currentAddress={currentAddress}
          disabled={disabled}
          autoOpenNonce={autoOpenNonce}
          onConnected={onConnected}
          onDisconnected={onDisconnected}
        />
      </PrivyProvider>
    </PrivyBoundary>
  );
}
