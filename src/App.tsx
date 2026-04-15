import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import brandMark from "./assets/block-cipher-ave-mark.svg";
import aveOfficialIcon from "./assets/ave-official-icon.png";
import chainBaseIcon from "./assets/chain-base.png";
import chainBscIcon from "./assets/chain-bsc.png";
import chainEthIcon from "./assets/chain-eth.png";
import chainSolanaIcon from "./assets/chain-solana.png";
import {
  radarCandidates,
  type Candidate,
  type DocSection,
  type EvidenceRow,
  type ModuleId,
  type TradePreview,
  tradePreviewMock
} from "./data/mock";
import {
  classifyLookupInput,
  loadDetailPayload,
  loadRadarPayload,
  lookupTokenByAddress,
  type AddressLookupMatch,
  type AddressLookupStatus,
  type DataMode,
  type DetailPayload,
  type ScoreModelPayload,
  type ScoreModelFactorKey,
  type ScoreModelGateKey,
  type ProjectProfilePayload,
  type AiRiskPayload,
  type DexLiquidityRow,
  type HolderRiskPayload,
  type LiquidityEventPayload,
  type MarketPressureRow,
  type MarketSnapshotPayload,
  type PairStructurePayload,
  type SmartSignalPayload
} from "./lib/ave";
import { OpportunityDesk } from "./components/OpportunityDesk";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { PlatformLogo, PlatformValue } from "./components/PlatformLogo";
import { setPrivySolanaWallet } from "./lib/wallet";
import {
  LANGUAGE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  buildDisplayMetrics,
  formatAiRiskSummaryLabel,
  formatAiRiskSummaryValue,
  formatLiquidityAction,
  formatNarrative,
  getLocalizedAccessContent,
  getLocalizedDocs,
  getLocalizedModules,
  getOverviewContent,
  localizeEvidenceRows,
  normalizeLanguage,
  normalizeTheme,
  t,
  translateNote,
  translateStatus,
  translateValue,
  tv,
  type Language,
  type Theme
} from "./i18n";

type ChainFilter = "全部" | Candidate["chain"];
type VerdictFilter = "全部" | Candidate["verdict"];

type DetailState = DetailPayload;

const emptyProjectProfile: ProjectProfilePayload = {
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

const emptyMarketSnapshot: MarketSnapshotPayload = {
  price: "--",
  marketCap: "--",
  fdv: "--",
  liquidity: "--",
  volume24h: "--",
  tx24h: "--"
};

const emptyPairStructure: PairStructurePayload = {
  amm: "--",
  pair: "--",
  lpLockPercent: "--",
  lpLockPlatform: "--",
  sniperTxCount: "--",
  ath: "--",
  low: "--"
};

const emptyAiRisk: AiRiskPayload = {
  mechanism: "--",
  summary: [],
  risks: []
};

const emptyHolderRisk: HolderRiskPayload = {
  lpLockPercent: "--",
  top10Pct: "--",
  topHolders: [],
  pairHolders: []
};

const emptySmartSignal: SmartSignalPayload = {
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

const emptyScoreModel: ScoreModelPayload = {
  modelLabel: "SENTINEL-8",
  factors: [
    { key: "L", normalizedValue: null, weight: 0.18, contribution: null },
    { key: "V", normalizedValue: null, weight: 0.14, contribution: null },
    { key: "M", normalizedValue: null, weight: 0.10, contribution: null },
    { key: "A", normalizedValue: null, weight: 0.08, contribution: null },
    { key: "C", normalizedValue: null, weight: 0.14, contribution: null },
    { key: "R", normalizedValue: null, weight: 0.20, contribution: null },
    { key: "S", normalizedValue: null, weight: 0.08, contribution: null },
    { key: "F", normalizedValue: null, weight: 0.08, contribution: null }
  ],
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

const initialDetailState: DetailState = {
  address: "",
  walletHintAddress: "",
  mode: "mock",
  note: "正在准备详情数据。",
  dossier: [],
  wallet: [],
  risk: [],
  opportunity: [],
  replay: [],
  trade: tradePreviewMock,
  projectProfile: emptyProjectProfile,
  marketSnapshot: emptyMarketSnapshot,
  marketPressure: [],
  pairStructure: emptyPairStructure,
  dexLiquidity: [],
  liquidityEvents: [],
  aiRisk: emptyAiRisk,
  holderRisk: emptyHolderRisk,
  smartSignal: emptySmartSignal,
  scoreModel: emptyScoreModel
};

function ProjectLinkLabel({ label, language }: { label: string; language: Language }) {
  const normalized = label.trim().toLowerCase();
  const localizedLabel =
    language === "zh"
      ? normalized === "website"
        ? "网站"
        : normalized === "twitter" || normalized === "x"
          ? "推特"
          : normalized === "telegram"
            ? "电报"
            : normalized === "discord"
              ? "社群"
              : label
      : label;

  if (normalized === "website") {
    return (
      <>
        <span className="link-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Zm5.96 8h-2.02a13.3 13.3 0 0 0-1.09-4.02A7.04 7.04 0 0 1 17.96 11ZM12 5.02c.8.97 1.67 2.92 1.92 5.98h-3.84c.25-3.06 1.12-5.01 1.92-5.98ZM9.15 6.98A13.3 13.3 0 0 0 8.06 11H6.04a7.04 7.04 0 0 1 3.11-4.02ZM5.52 13h2.54c.11 1.48.47 2.87 1.09 4.02A7.04 7.04 0 0 1 5.52 13Zm4.56 0h3.84c-.25 3.06-1.12 5.01-1.92 5.98c-.8-.97-1.67-2.92-1.92-5.98Zm4.77 4.02c.62-1.15.98-2.54 1.09-4.02h2.54a7.04 7.04 0 0 1-3.63 4.02Z" fill="currentColor" />
          </svg>
        </span>
        <span>{localizedLabel}</span>
      </>
    );
  }

  if (normalized === "twitter" || normalized === "x") {
    return (
      <>
        <span className="link-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M18.244 2H21.5l-7.11 8.127L22 22h-5.956l-4.664-6.848L5.39 22H2.132l7.605-8.692L2.5 2h6.108l4.216 6.282L18.244 2Z" fill="currentColor" />
          </svg>
        </span>
        <span>{localizedLabel}</span>
      </>
    );
  }

  if (normalized === "telegram") {
    return (
      <>
        <span className="link-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M19.777 4.43 3.84 10.576c-1.087.437-1.08 1.042-.198 1.313l4.09 1.276 1.58 4.93c.192.531.097.742.654.742.43 0 .62-.196.86-.427l1.983-1.927 4.125 3.046c.76.419 1.307.204 1.496-.704L21.144 5.7c.277-1.113-.425-1.617-1.367-1.27ZM8.38 12.87l9.333-5.89c.466-.283.893-.13.544.18l-7.994 7.218-.312 3.333-1.57-4.84Z" fill="currentColor" />
          </svg>
        </span>
        <span>{localizedLabel}</span>
      </>
    );
  }

  return <span>{localizedLabel}</span>;
}

const globalModuleIds = ["overview", "radar", "docs", "access"] as const satisfies readonly ModuleId[];
const workbenchModuleIds = ["score", "dossier", "risk"] as const satisfies readonly ModuleId[];
const primaryNavIds = ["radar", "docs", "access"] as const satisfies readonly ModuleId[];
type GlobalModuleId = typeof globalModuleIds[number];

const chainFilterOptions = ["全部", "Solana", "BSC", "Base", "Ethereum"] as const satisfies readonly ChainFilter[];

function getRadarNav(language: Language) {
  return [
    { title: t(language, "radar.tutorial.read"), summary: t(language, "radar.tutorial.read.summary") },
    { title: t(language, "radar.tutorial.filter"), summary: t(language, "radar.tutorial.filter.summary") },
    { title: t(language, "radar.tutorial.sort"), summary: t(language, "radar.tutorial.sort.summary") },
    { title: t(language, "radar.tutorial.shortcut"), summary: t(language, "radar.tutorial.shortcut.summary") },
    { title: t(language, "radar.tutorial.data"), summary: t(language, "radar.tutorial.data.summary") }
  ];
}

function getGlobalPageMeta(language: Language): Record<GlobalModuleId, { title: string; summary: string; tag: string }> {
  return {
    overview: {
      title: t(language, "nav.overview.title"),
      summary: t(language, "nav.overview.summary"),
      tag: ""
    },
    docs: {
      title: "Docs",
      summary: t(language, "nav.docs.summary"),
      tag: t(language, "nav.docs.tag")
    },
    access: {
      title: "Access",
      summary: t(language, "nav.access.summary"),
      tag: t(language, "nav.access.tag")
    },
    radar: {
      title: "Radar",
      summary: "",
      tag: ""
    }
  };
}

function getProjectIntro(profile: ProjectProfilePayload, language: Language) {
  if (language === "en" && profile.introEn && profile.introEn !== "--") return profile.introEn;
  if (language === "zh" && profile.introCn && profile.introCn !== "--") return profile.introCn;
  return profile.intro;
}

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "zh";
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  });
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  });
  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [candidates, setCandidates] = useState<Candidate[]>(radarCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(radarCandidates[0] ?? null);
  const [chainFilter, setChainFilter] = useState<ChainFilter>("全部");
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("全部");
  const [query, setQuery] = useState("");
  const [lookupCandidate, setLookupCandidate] = useState<Candidate | null>(null);
  const [lookupTarget, setLookupTarget] = useState<Pick<Candidate, "address" | "chain"> | null>(null);
  const [lookupStatus, setLookupStatus] = useState<AddressLookupStatus>("idle");
  const [lookupNote, setLookupNote] = useState("");
  const [lookupMatches, setLookupMatches] = useState<AddressLookupMatch[]>([]);
  const lookupRequestIdRef = useRef(0);
  const [radarMode, setRadarMode] = useState<DataMode>("mock");
  const [radarNote, setRadarNote] = useState("正在准备候选池数据。");
  const [detailState, setDetailState] = useState<DetailState>(initialDetailState);
  const [radarLoading, setRadarLoading] = useState(true);
  const [radarLimit, setRadarLimit] = useState(100);
  const [radarLimitDraft, setRadarLimitDraft] = useState(100);
  const [radarRefreshKey, setRadarRefreshKey] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState("");
  const [connectedWallets, setConnectedWallets] = useState<Partial<Record<Candidate["chain"], string>>>({});
  useEffect(() => {
    let active = true;
    async function loadRadar() {
      setRadarLoading(true);
      const applyPayload = (payload: Awaited<ReturnType<typeof loadRadarPayload>>) => {
        if (!active) return;
        setCandidates(payload.candidates);
        setRadarMode(payload.mode);
        setRadarNote(payload.note);
        setSelectedCandidate((current) => {
          if (
            current &&
            (
              payload.candidates.some((item) => item.address === current.address && item.chain === current.chain) ||
              (lookupCandidate && current.address === lookupCandidate.address && current.chain === lookupCandidate.chain)
            )
          ) {
            return current;
          }
          return payload.candidates[0] ?? current ?? null;
        });
      };
      const payload = await loadRadarPayload(applyPayload, radarLimit);
      if (!active) return;
      applyPayload(payload);
      setRadarLoading(false);
    }
    void loadRadar();
    return () => { active = false; };
  }, [lookupCandidate, radarRefreshKey]);

  useEffect(() => {
    let active = true;
    if (!selectedCandidate) return () => { active = false; };
    if (radarLoading && radarMode === "mock") return () => { active = false; };
    const candidate = selectedCandidate;
    async function loadDetails() {
      setDetailLoading(true);
      setDetailState({
        ...initialDetailState,
        address: candidate.address,
        note: "正在加载 AVE 单币详情。"
      });
      const payload = await loadDetailPayload(candidate);
      if (!active) return;
      setDetailState(payload);
      setDetailLoading(false);
    }
    void loadDetails();
    return () => { active = false; };
  }, [selectedCandidate, radarLoading, radarMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!copiedAddress) return;
    const timer = window.setTimeout(() => {
      setCopiedAddress("");
    }, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copiedAddress]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const solanaAddress =
      window.okxwallet?.solana?.publicKey?.toString()
      ?? window.phantom?.solana?.publicKey?.toString()
      ?? window.solana?.publicKey?.toString()
      ?? "";
    if (!solanaAddress) return;
    setConnectedWallets((current) => ({ ...current, Solana: solanaAddress }));
  }, []);

  const focusNarrative =
    selectedCandidate
      ? (getProjectIntro(detailState.projectProfile, language) !== "--"
          ? getProjectIntro(detailState.projectProfile, language)
          : formatNarrative(language, selectedCandidate.narrative))
      : "--";

  const selectedWalletAddress =
    selectedCandidate ? connectedWallets[selectedCandidate.chain] ?? "" : "";
  const selectedIsLookupCandidate =
    Boolean(
      selectedCandidate &&
      lookupTarget &&
      selectedCandidate.address === lookupTarget.address &&
      selectedCandidate.chain === lookupTarget.chain
    );
  const lookupInputType = classifyLookupInput(query);
  const lookupActionEnabled = lookupInputType !== "text" && query.trim() !== "";

  const normalizedQuery = query.trim().toLowerCase();
  const candidateMatchesBaseFilter = (c: Candidate) => {
    const matchChain = chainFilter === "全部" || c.chain === chainFilter;
    const narrative = formatNarrative(language, c.narrative).toLowerCase();
    const matchQuery =
      normalizedQuery === "" ||
      c.symbol.toLowerCase().includes(normalizedQuery) ||
      c.address.toLowerCase().includes(normalizedQuery) ||
      (c.pairAddress ?? "").toLowerCase().includes(normalizedQuery) ||
      c.narrative.toLowerCase().includes(normalizedQuery) ||
      narrative.includes(normalizedQuery) ||
      c.chain.toLowerCase().includes(normalizedQuery);
    return matchChain && matchQuery;
  };
  const statsCandidates = candidates.filter(candidateMatchesBaseFilter);
  const filteredCandidates = statsCandidates.filter((c) =>
    verdictFilter === "全部" || c.verdict === verdictFilter
  );
  const filteredLookupCandidate =
    lookupCandidate && candidateMatchesBaseFilter(lookupCandidate) &&
    (verdictFilter === "全部" || lookupCandidate.verdict === verdictFilter)
      ? lookupCandidate
      : null;
  const railCandidates = filteredLookupCandidate
    ? [
        filteredLookupCandidate,
        ...filteredCandidates.filter(
          (candidate) =>
            !(candidate.address === filteredLookupCandidate.address && candidate.chain === filteredLookupCandidate.chain)
        )
      ]
    : filteredCandidates;

  const canDoCount = statsCandidates.filter((c) => c.verdict === "可做").length;
  const watchCount = statsCandidates.filter((c) => c.verdict === "观望").length;
  const avoidCount = statsCandidates.filter((c) => c.verdict === "回避").length;
  const avgScore =
    statsCandidates.length > 0
      ? Math.round(statsCandidates.reduce((s, c) => s + c.score, 0) / statsCandidates.length)
      : 0;
  const isGlobalView = (globalModuleIds as readonly ModuleId[]).includes(activeModule);
  const isWorkbenchView = (workbenchModuleIds as readonly ModuleId[]).includes(activeModule);
  const activeWorkbenchModule = activeModule === "opportunity" ? "dossier" : activeModule;
  const localizedModules = getLocalizedModules(language);
  const primaryNavModules = primaryNavIds
    .map((id) => localizedModules.find((m) => m.id === id))
    .filter((m): m is (typeof localizedModules)[number] => !!m);
  const workbenchModules = workbenchModuleIds
    .map((id) => localizedModules.find((m) => m.id === id))
    .filter((m): m is (typeof localizedModules)[number] => !!m);

  function handleEnterWorkbench() {
    if (!(workbenchModuleIds as readonly ModuleId[]).includes(activeModule)) {
      setActiveModule("score");
    }
  }

  async function handleCopyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
    } catch {
      setCopiedAddress("");
    }
  }

  function handleQueryChange(nextValue: string) {
    setQuery(nextValue);
    lookupRequestIdRef.current += 1;
    if (lookupStatus !== "idle") {
      setLookupStatus("idle");
      setLookupNote("");
      setLookupMatches([]);
    }
  }

  function applyLookupCandidate(candidate: Candidate, existing: boolean, note: string) {
    setLookupCandidate(existing ? null : candidate);
    setLookupTarget({ address: candidate.address, chain: candidate.chain });
    setSelectedCandidate(candidate);
    setActiveModule("score");
    setLookupStatus("resolved");
    setLookupNote(note);
    setLookupMatches([]);
  }

  async function handleLookupSubmit() {
    const trimmed = query.trim();
    const inputKind = classifyLookupInput(trimmed);
    if (inputKind === "text") return;
    const requestId = lookupRequestIdRef.current + 1;
    lookupRequestIdRef.current = requestId;

    setLookupStatus("resolving");
    setLookupNote(
      language === "zh"
        ? "正在按合约地址查询支持链上的代币详情。"
        : "Resolving the token across supported chains."
    );
    setLookupMatches([]);

    const result = await lookupTokenByAddress(trimmed, candidates);
    if (lookupRequestIdRef.current !== requestId) return;

    if (result.status === "resolved") {
      applyLookupCandidate(
        result.candidate,
        result.existing,
        result.existing
          ? language === "zh"
            ? "该地址已在当前候选池中，已直接切换到现有标的。"
            : "This address is already in the current Radar pool. The existing token has been opened directly."
          : language === "zh"
            ? "已按地址加载单币分析，不计入 Radar 候选统计。"
            : "Loaded as an address lookup result. It does not enter Radar statistics."
      );
      return;
    }

    if (result.status === "ambiguous") {
      setLookupStatus("ambiguous");
      setLookupMatches(result.matches);
      setLookupNote(
        language === "zh"
          ? "该地址在多条 EVM 链上均有命中，请选择要查看的链。"
          : "This address was found on multiple EVM chains. Choose the chain to inspect."
      );
      return;
    }

    setLookupStatus(result.status);
    setLookupNote(
      result.status === "invalid"
        ? language === "zh"
          ? "请输入有效的 Solana 或 EVM 代币合约地址。"
          : "Enter a valid Solana or EVM token contract address."
        : language === "zh"
          ? "该地址未在支持链上找到可分析代币。"
          : "No analyzable token was found for this address on the supported chains."
    );
  }

  function handleLookupKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    if (classifyLookupInput(query.trim()) === "text") return;
    event.preventDefault();
    void handleLookupSubmit();
  }

  function handleLookupMatchSelect(match: AddressLookupMatch) {
    lookupRequestIdRef.current += 1;
    applyLookupCandidate(
      match.candidate,
      match.existing,
      match.existing
        ? language === "zh"
          ? `已切换到 ${match.chain} 上的现有候选。`
          : `Switched to the existing candidate on ${match.chain}.`
        : language === "zh"
          ? `已按地址加载 ${match.chain} 上的单币分析，不计入 Radar 候选统计。`
          : `Loaded the ${match.chain} token as an address lookup result. It does not enter Radar statistics.`
    );
  }

  const sourceLabel =
    radarMode === "live" ? "LIVE" : radarMode === "fallback" ? "FALLBACK" : "MOCK";
  const displayMetrics = buildDisplayMetrics(language, candidates);
  const localizedPageMeta = getGlobalPageMeta(language);
  async function requireConnectedWallet() {
    if (selectedWalletAddress) {
      return selectedWalletAddress;
    }
    if (selectedCandidate && Object.values(connectedWallets).some(Boolean)) {
      throw new Error(
        language === "zh"
          ? `当前连接的钱包不支持 ${selectedCandidate.chain}，请在右上角切换对应链的钱包。`
          : `The connected wallet does not support ${selectedCandidate.chain}. Switch to a wallet for this chain from the top-right button.`
      );
    }
    throw new Error(
      language === "zh"
        ? "请先在右上角连接钱包。"
        : "Connect a wallet from the top-right button first."
    );
  }

  function toggleLanguage() {
    setLanguage((current) => {
      const next = current === "zh" ? "en" : "zh";
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      return next;
    });
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <div className="t-shell">
      {/* ── Primary unified nav ── */}
      <header className="t-nav">
        <button
          type="button"
          className={`t-nav-brand${activeModule === "overview" ? " active" : ""}`}
          onClick={() => setActiveModule("overview")}
          aria-label={localizedPageMeta.overview.title}
          title={`${localizedPageMeta.overview.title} · ${localizedPageMeta.overview.summary}`}
        >
          <BrandLockup compact language={language} />
        </button>
        <nav className="t-nav-tabs" aria-label="Primary">
          <button
            key="workbench"
            className={`t-nav-tab${isWorkbenchView ? " active" : ""}`}
            onClick={handleEnterWorkbench}
            type="button"
          >
            <span className="t-nav-tab-label">{t(language, "nav.workbench")}</span>
            <span className="t-nav-tab-caption">{t(language, "nav.workbench.caption")}</span>
          </button>
          {primaryNavModules.map((m) => (
            <button
              key={m.id}
              className={`t-nav-tab${activeModule === m.id ? " active" : ""}`}
              onClick={() => setActiveModule(m.id)}
              type="button"
            >
              <span className="t-nav-tab-label">{m.label}</span>
              <span className="t-nav-tab-caption">{m.caption}</span>
            </button>
          ))}
        </nav>
        <div className="t-nav-status">
          <WalletConnectButton
            chain={selectedCandidate?.chain}
            language={language}
            currentAddress={selectedWalletAddress}
            disabled={!selectedCandidate}
            onConnected={(wallet) => {
              setConnectedWallets((current) => {
                if (wallet.type === "solana") {
                  const solanaWallet = wallet.wallet as {
                    walletClientType?: string;
                    signTransaction: (tx: any) => Promise<any>;
                  };
                  setPrivySolanaWallet({
                    address: wallet.address,
                    walletClientType: solanaWallet.walletClientType,
                    signTransaction: (tx: any) => solanaWallet.signTransaction(tx)
                  });
                  return { ...current, Solana: wallet.address };
                }
                return {
                  ...current,
                  BSC: wallet.address,
                  Base: wallet.address,
                  Ethereum: wallet.address
                };
              });
            }}
            onDisconnected={() => {
              setPrivySolanaWallet(null);
              setConnectedWallets({});
            }}
          />
          <button
            className={`theme-toggle theme-toggle-${theme}`}
            onClick={toggleTheme}
            type="button"
            aria-label={t(language, "theme.toggle.aria")}
            title={t(language, "theme.toggle.aria")}
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === "dark" ? "☀" : "☾"}
            </span>
          </button>
          <button className="language-toggle" onClick={toggleLanguage} type="button">
            {t(language, "lang.next")}
          </button>
          <StatusBadge label={sourceLabel} />
        </div>
      </header>

      {/* ── Workbench-only strips: summary metrics + token sub-nav ── */}
      {!isGlobalView ? (
        <>
          <div className="t-summary-bar">
            {(candidates.length > 0 ? displayMetrics : [
              { label: t(language, "summary.today"), value: "--", note: t(language, "summary.loading"), tone: "neutral" as const },
              { label: t(language, "summary.risk"), value: "--", note: t(language, "summary.loading"), tone: "negative" as const },
              { label: t(language, "summary.actionable"), value: "--", note: t(language, "summary.loading"), tone: "positive" as const },
              { label: t(language, "summary.watch"), value: "--", note: t(language, "summary.loading"), tone: "neutral" as const }
            ]).map((m) => (
              <div key={m.label} className={`t-summary-cell ${m.tone ?? ""}`}>
                <span className="t-summary-label">{m.label}</span>
                <span className="t-summary-value">{m.value}</span>
                <span className="t-summary-note">{m.note}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* ── Global pages ── */}
      {isGlobalView ? (
        activeModule === "docs" || activeModule === "access" ? (
          <main className="t-global-stage t-global-stage-docs">
            {activeModule === "docs" ? (
              <DocumentationModule language={language} />
            ) : (
              <AccessProgramModule language={language} />
            )}
          </main>
        ) : (
          <main className="t-global-stage">
            <div className="t-global-content">
              <GlobalPageShell
                title={localizedPageMeta[activeModule as GlobalModuleId].title}
                summary={localizedPageMeta[activeModule as GlobalModuleId].summary}
                tag={localizedPageMeta[activeModule as GlobalModuleId].tag}
                sidebar={renderGlobalSidebar(activeModule, language)}
                showHeader={activeModule !== "radar"}
                showHeroBrand={activeModule === "overview"}
                language={language}
              >
                {activeModule === "overview" && (
                  <OverviewModule
                    language={language}
                  />
                )}
                {activeModule === "radar" && (
                  <RadarModule
                    candidates={filteredCandidates}
                    allCandidates={candidates}
                    loading={radarLoading}
                    language={language}
                    query={query}
                    setQuery={handleQueryChange}
                    chainFilter={chainFilter}
                    setChainFilter={setChainFilter}
                    verdictFilter={verdictFilter}
                    setVerdictFilter={setVerdictFilter}
                    lookupStatus={lookupStatus}
                    lookupNote={lookupNote}
                    lookupActionEnabled={lookupActionEnabled}
                    onLookupSubmit={() => void handleLookupSubmit()}
                    onLookupKeyDown={handleLookupKeyDown}
                    onSelectCandidate={(c) => {
                      setLookupTarget(null);
                      setSelectedCandidate(c);
                      setActiveModule("score");
                    }}
                  />
                )}
              </GlobalPageShell>
            </div>
          </main>
        )
      ) : null}

      {/* ── Token workbench ── */}
      {!isGlobalView ? (
      <div className="t-body">
        {/* ── Left rail ── */}
        <aside className="t-rail">
          <div className="t-rail-head">
            <span className="t-rail-title">{t(language, "rail.title")}</span>
            <div className="t-rail-limit">
              <span className="t-rail-limit-label">{language === "zh" ? "数量" : "Limit"}</span>
              <input
                className="t-rail-limit-input"
                type="number"
                min={10}
                max={500}
                step={10}
                value={radarLimitDraft}
                onChange={(e) => setRadarLimitDraft(Number(e.target.value) || 100)}
                onBlur={() => setRadarLimitDraft(Math.max(10, Math.min(500, radarLimitDraft)))}
              />
              <button
                className="t-rail-refresh"
                type="button"
                disabled={radarLoading}
                onClick={() => {
                  const v = Math.max(10, Math.min(500, radarLimitDraft));
                  setRadarLimitDraft(v);
                  setRadarLimit(v);
                  setRadarRefreshKey((k) => k + 1);
                }}
                title={language === "zh" ? "拉取并刷新" : "Fetch & refresh"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
              </button>
              <span className="t-rail-count">
                {radarLoading ? "···" : `${filteredCandidates.length} / ${candidates.length}`}
              </span>
            </div>
          </div>

          <div className="t-rail-controls">
            <label className="t-search">
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleLookupKeyDown}
                placeholder={t(language, "filter.search")}
                type="text"
              />
              <button
                type="button"
                className={`t-search-action${lookupActionEnabled ? " active" : ""}`}
                onClick={() => void handleLookupSubmit()}
                disabled={!lookupActionEnabled || lookupStatus === "resolving"}
              >
                {t(language, "search.lookup")}
              </button>
            </label>
            {lookupStatus !== "idle" && lookupNote ? (
              <div className={`t-search-status t-search-status-${lookupStatus}`}>{lookupNote}</div>
            ) : null}
            <div className="t-filter-row">
              <span className="t-filter-label">{t(language, "filter.chain")}</span>
              <FilterPills
                options={chainFilterOptions}
                value={chainFilter}
                onChange={(value) => {
                  setChainFilter(value);
                  setVerdictFilter("全部");
                }}
                renderLabel={(opt) => (opt === "全部" ? t(language, "filter.all") : <ChainLabel chain={opt} />)}
              />
            </div>
            <div className="t-filter-row">
              <span className="t-filter-label">{t(language, "filter.verdict")}</span>
              <FilterPills
                options={["全部", "可做", "观望", "回避"] as const}
                value={verdictFilter}
                onChange={setVerdictFilter}
                renderLabel={(opt) => (opt === "全部" ? t(language, "filter.all") : tv(language, opt))}
              />
            </div>
          </div>

          <div className="t-mini-stats">
            <div className="t-mini-stat">
              <span className="ms-label">{t(language, "stats.actionable")}</span>
              <span className="ms-value">{canDoCount}</span>
            </div>
            <div className="t-mini-stat">
              <span className="ms-label">{t(language, "stats.watch")}</span>
              <span className="ms-value">{watchCount}</span>
            </div>
            <div className="t-mini-stat">
              <span className="ms-label">{t(language, "stats.avoid")}</span>
              <span className="ms-value">{avoidCount}</span>
            </div>
            <div className="t-mini-stat">
              <span className="ms-label">{t(language, "stats.avg")}</span>
              <span className="ms-value">{avgScore || "--"}</span>
            </div>
          </div>

          <div className="t-candidate-list">
            {railCandidates.length === 0 ? (
              <div className="t-empty-rail">{t(language, "empty.filtered")}</div>
            ) : null}
            {railCandidates.map((c) => {
              const isLookupRow =
                Boolean(
                  lookupCandidate &&
                  c.address === lookupCandidate.address &&
                  c.chain === lookupCandidate.chain
                );
              return (
              <button
                key={`${c.chain}-${c.address}`}
                className={`t-candidate-row${selectedCandidate?.address === c.address ? " active" : ""}`}
                onClick={() => {
                  const isLookupRow =
                    Boolean(
                      lookupTarget &&
                      c.address === lookupTarget.address &&
                      c.chain === lookupTarget.chain
                    );
                  setLookupTarget(isLookupRow ? lookupTarget : null);
                  setSelectedCandidate(c);
                }}
                type="button"
              >
                <TokenIcon candidate={c} size="md" />
                <div className="t-cand-left">
                  <div className="t-cand-top">
                    <span className="t-cand-symbol">{c.symbol}</span>
                    <span className="t-cand-chain"><ChainLabel chain={c.chain} /></span>
                    {isLookupRow ? (
                      <span className="t-cand-lookup-tag">{t(language, "search.lookupTag")}</span>
                    ) : null}
                  </div>
                  <span className="t-cand-narrative">{formatNarrative(language, c.narrative)}</span>
                </div>
                <div className="t-cand-right">
                  <span className={`t-cand-score ${scoreClass(c.score)}`}>{c.score}</span>
                  <span className={`verdict-chip verdict-${c.verdict}`}>{tv(language, c.verdict)}</span>
                </div>
              </button>
              );
            })}
          </div>
        </aside>

        {/* ── Workbench ── */}
        <section className={`t-workbench${detailLoading ? " detail-loading" : ""}`}>
          {/* Focus header — consolidated token summary */}
          {selectedCandidate ? (
            <div className="t-focus">
              <div className="t-focus-main">
                <div className="t-focus-title">
                  <TokenIcon candidate={selectedCandidate} size="lg" />
                  <span className="t-focus-symbol">{selectedCandidate.symbol}</span>
                  <span className="t-focus-chain"><ChainLabel chain={selectedCandidate.chain} /></span>
                  <span className={`verdict-chip verdict-${selectedCandidate.verdict}`}>
                    {tv(language, selectedCandidate.verdict)}
                  </span>
                </div>
                <div className="t-focus-narrative-row">
                  <span className="report-inline-tag t-focus-narrative-tag">{t(language, "dossier.narrative")}</span>
                  <div className="t-focus-narrative-block">
                    <p className="t-focus-narrative">{focusNarrative}</p>
                  </div>
                </div>
                <div className="t-focus-meta">
                  <code className="t-focus-addr">
                    <AddressValue chain={selectedCandidate.chain} value={selectedCandidate.address} />
                  </code>
                  <button
                    className={`t-focus-btn${copiedAddress === selectedCandidate.address ? " success" : ""}`}
                    onClick={() => void handleCopyAddress(selectedCandidate.address)}
                    type="button"
                  >
                    {copiedAddress === selectedCandidate.address ? t(language, "button.copied") : t(language, "button.copy")}
                  </button>
                  <a
                    className="t-focus-btn link"
                    href={getAveTokenUrl(selectedCandidate)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="link-icon ave-link-icon" aria-hidden="true">
                      <img alt="" src={aveOfficialIcon} />
                    </span>
                    <span>{t(language, "button.openAve")}</span>
                  </a>
                  {detailState.projectProfile.links.map((link) => (
                    <a
                      className="t-focus-btn link"
                      href={link.url}
                      key={link.label}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ProjectLinkLabel label={link.label} language={language} />
                    </a>
                  ))}
                </div>
                {selectedIsLookupCandidate ? (
                  <div className="t-focus-query-note">{t(language, "search.lookupResolved")}</div>
                ) : null}
                <div className="t-focus-tabs">
                  {workbenchModules.map((m) => (
                    <button
                      key={m.id}
                      className={`t-focus-tab${activeWorkbenchModule === m.id ? " active" : ""}`}
                      onClick={() => setActiveModule(m.id)}
                      type="button"
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="t-focus-stats">
                <div className="t-focus-stat">
                  <span className="fs-label">{t(language, "table.price")}</span>
                  <span className="fs-value">{detailState.marketSnapshot.price !== "--" ? detailState.marketSnapshot.price : selectedCandidate.price}</span>
                </div>
                <div className="t-focus-stat">
                  <span className="fs-label">{t(language, "metric.fdv")}</span>
                  <span className="fs-value">{detailState.marketSnapshot.fdv}</span>
                </div>
                <div className="t-focus-stat">
                  <span className="fs-label">{t(language, "metric.volume24hShort")}</span>
                  <span className="fs-value">{detailState.marketSnapshot.volume24h !== "--" ? detailState.marketSnapshot.volume24h : selectedCandidate.volume24h}</span>
                </div>
                <div className="t-focus-stat">
                  <span className="fs-label">{t(language, "table.liquidity")}</span>
                  <span className="fs-value">{detailState.marketSnapshot.liquidity !== "--" ? detailState.marketSnapshot.liquidity : selectedCandidate.liquidity}</span>
                </div>
                <div className="t-focus-stat">
                  <span className="fs-label">{t(language, "metric.tx24h")}</span>
                  <span className="fs-value">{detailState.marketSnapshot.tx24h}</span>
                </div>
                <div className="t-focus-stat t-focus-stat-score">
                  <span className="fs-label">SENTINEL-8 Score</span>
                  <span className={`fs-value ${scoreClass(selectedCandidate.score)}`}>
                    {detailState.scoreModel.finalScore ?? selectedCandidate.score}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="t-focus-empty">{t(language, "workbench.emptyFocus")}</div>
          )}

          {/* Content */}
          <div className="t-workbench-grid">
            <div className="t-content">
              {selectedCandidate && activeWorkbenchModule === "dossier" && (
                <TokenDossierReport
                  chain={selectedCandidate.chain}
                  detail={detailState}
                  loading={detailLoading}
                  language={language}
                />
              )}
              {selectedCandidate && activeWorkbenchModule === "score" && (
                <ScoreModelReport
                  detail={detailState}
                  language={language}
                />
              )}
              {selectedCandidate && activeWorkbenchModule === "risk" && (
                <RiskGuardReport
                  detail={detailState}
                  language={language}
                />
              )}
            </div>
            <aside className="t-trade-sidebar">
              <OpportunityDesk
                candidate={selectedCandidate}
                trade={detailState.trade}
                loading={detailLoading}
                note={translateNote(language, detailState.note)}
                language={language}
                manualWallet={selectedWalletAddress}
                onConnectManualWallet={requireConnectedWallet}
              />
            </aside>
          </div>
        </section>
      </div>
      ) : null}

      {lookupMatches.length > 0 ? (
        <div className="t-lookup-modal-backdrop" role="presentation">
          <div className="t-lookup-modal" role="dialog" aria-modal="true" aria-labelledby="lookup-modal-title">
            <div className="t-lookup-modal-head">
              <div>
                <strong id="lookup-modal-title" className="t-lookup-modal-title">
                  {t(language, "search.multichainTitle")}
                </strong>
                <p className="t-lookup-modal-copy">{lookupNote}</p>
              </div>
              <button
                type="button"
                className="t-lookup-modal-close"
                onClick={() => {
                  setLookupMatches([]);
                  setLookupStatus("idle");
                  setLookupNote("");
                }}
              >
                {t(language, "button.close")}
              </button>
            </div>
            <div className="t-lookup-modal-list">
              {lookupMatches.map((match) => (
                <button
                  key={`${match.chain}-${match.candidate.address}`}
                  type="button"
                  className="t-lookup-option"
                  onClick={() => handleLookupMatchSelect(match)}
                >
                  <span className="t-lookup-option-main">
                    <TokenIcon candidate={match.candidate} size="sm" />
                    <span className="t-lookup-option-meta">
                      <span className="t-lookup-option-top">
                        <span className="t-lookup-option-symbol">{match.candidate.symbol}</span>
                        <span className="t-lookup-option-chain"><ChainLabel chain={match.chain} /></span>
                      </span>
                      <span className="t-lookup-option-address td-mono">{shortInlineAddress(match.candidate.address)}</span>
                    </span>
                  </span>
                  <span className="t-lookup-option-side">
                    <span className={`verdict-chip verdict-${match.candidate.verdict}`}>{tv(language, match.candidate.verdict)}</span>
                    <span className={`t-lookup-option-score ${scoreClass(match.candidate.score)}`}>{match.candidate.score}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Overview ──────────────────────────────────────────────────────── */

function OverviewModule({
  language
}: {
  language: Language;
}) {
  const overview = getOverviewContent(language);

  return (
    <>
      <div className="ov2-pipeline" id="overview-workflow">
        <div className="ov2-section-head">
          <span className="ov2-section-title">{t(language, "overview.workflow")}</span>
          <span className="ov2-tag">{t(language, "overview.complete")}</span>
        </div>
        <div className="ov2-pipeline-track">
          {overview.workflow.map((step, i) => (
            <div key={step} className="ov2-pipeline-node">
              <span className="ov2-pipeline-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="ov2-pipeline-label">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ov2-caps-grid">
        <div className="ov2-cap-card ov2-cap-research">
          <div className="ov2-cap-head">
            <svg className="ov2-cap-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m16 16 4.5 4.5"/><path d="M8 11h6M11 8v6"/></svg>
            <div>
              <span className="ov2-cap-title">{t(language, "overview.monitoring")}</span>
              <span className="ov2-cap-subtitle">{t(language, "overview.monitoring.tag")}</span>
            </div>
          </div>
          <ul className="ov2-cap-list">
            {overview.monitoring.map((item) => <li key={item}><span className="ov2-bullet" />{item}</li>)}
          </ul>
        </div>
        <div className="ov2-cap-card ov2-cap-trading">
          <div className="ov2-cap-head">
            <svg className="ov2-cap-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-4 4 4 6-8 4 4"/><rect x="2" y="3" width="20" height="18" rx="2"/></svg>
            <div>
              <span className="ov2-cap-title">{t(language, "overview.trading")}</span>
              <span className="ov2-cap-subtitle">{t(language, "overview.trading.tag")}</span>
            </div>
          </div>
          <ul className="ov2-cap-list">
            {overview.trading.map((item) => <li key={item}><span className="ov2-bullet" />{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="ov2-terminal" id="overview-entry">
        <div className="ov2-terminal-chrome">
          <span className="ov2-terminal-dots"><i /><i /><i /></span>
          <span className="ov2-terminal-title">{t(language, "overview.entry")}</span>
          <span className="ov2-tag">Web + TG + CLI</span>
        </div>
        <div className="ov2-terminal-body">
          {overview.entries.map(([label, value, note, command]) => (
            <div className="ov2-terminal-entry" key={label}>
              <span className="ov2-terminal-badge">{label}</span>
              <strong className="ov2-terminal-value">{value}</strong>
              <p className="ov2-terminal-note">{note}</p>
              <code className="ov2-terminal-cmd">{command}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="ov2-roadmap" id="overview-story">
        {overview.stories.map(([title, body], i) => (
          <div key={title} className={`ov2-roadmap-card${i === 0 ? " current" : " next"}`}>
            <div className="ov2-roadmap-head">
              <span className="ov2-roadmap-dot" />
              <span className="ov2-roadmap-title">{title}</span>
            </div>
            <p className="ov2-roadmap-body">{body}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Radar ─────────────────────────────────────────────────────────── */

type RadarSortKey = "score" | "tvl" | "volume" | "mcap";
type RadarSortDir = "desc" | "asc";

function parseRadarNumeric(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,\s]/g, "");
  const match = cleaned.match(/(-?[\d.]+)\s*([KMBT])?/i);
  if (!match) return 0;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return 0;
  const suffix = (match[2] || "").toUpperCase();
  const mult = suffix === "K" ? 1e3 : suffix === "M" ? 1e6 : suffix === "B" ? 1e9 : suffix === "T" ? 1e12 : 1;
  return n * mult;
}

function RadarModule({
  candidates,
  allCandidates,
  loading,
  language,
  query,
  setQuery,
  chainFilter,
  setChainFilter,
  verdictFilter,
  setVerdictFilter,
  lookupStatus,
  lookupNote,
  lookupActionEnabled,
  onLookupSubmit,
  onLookupKeyDown,
  onSelectCandidate
}: {
  candidates: Candidate[];
  allCandidates: Candidate[];
  loading: boolean;
  language: Language;
  query: string;
  setQuery: (v: string) => void;
  chainFilter: ChainFilter;
  setChainFilter: (v: ChainFilter) => void;
  verdictFilter: VerdictFilter;
  setVerdictFilter: (v: VerdictFilter) => void;
  lookupStatus: AddressLookupStatus;
  lookupNote: string;
  lookupActionEnabled: boolean;
  onLookupSubmit: () => void;
  onLookupKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSelectCandidate: (c: Candidate) => void;
}) {
  const [scoreMin, setScoreMin] = useState<number>(0);
  const [scoreMax, setScoreMax] = useState<number>(100);
  const [sortKey, setSortKey] = useState<RadarSortKey>("score");
  const [sortDir, setSortDir] = useState<RadarSortDir>("desc");

  const displayed = useMemo(() => {
    const withinScore = candidates.filter((c) => c.score >= scoreMin && c.score <= scoreMax);
    const sorted = [...withinScore].sort((a, b) => {
      let va = 0;
      let vb = 0;
      if (sortKey === "score") {
        va = a.score;
        vb = b.score;
      } else if (sortKey === "tvl") {
        va = parseRadarNumeric(a.liquidity);
        vb = parseRadarNumeric(b.liquidity);
      } else if (sortKey === "volume") {
        va = parseRadarNumeric(a.volume24h);
        vb = parseRadarNumeric(b.volume24h);
      } else {
        va = parseRadarNumeric(a.marketCap);
        vb = parseRadarNumeric(b.marketCap);
      }
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return sorted;
  }, [candidates, scoreMin, scoreMax, sortKey, sortDir]);

  const sortOptions: Array<{ key: RadarSortKey; label: string }> = [
    { key: "score", label: t(language, "radar.sort.score") },
    { key: "tvl", label: t(language, "radar.sort.tvl") },
    { key: "volume", label: t(language, "radar.sort.volume") },
    { key: "mcap", label: t(language, "radar.sort.mcap") }
  ];

  const resetFilters = () => {
    setQuery("");
    setChainFilter("全部");
    setVerdictFilter("全部");
    setScoreMin(0);
    setScoreMax(100);
    setSortKey("score");
    setSortDir("desc");
  };

  return (
    <div className="t-panel">
      <div className="t-panel-head">
        <span className="t-panel-title">{t(language, "radar.title")}</span>
        {loading
          ? <StatusBadge label={translateStatus(language, "LOADING")} />
          : <span className="t-panel-tag count">{displayed.length} / {allCandidates.length}</span>
        }
      </div>

      <div className="t-radar-filters">
        <label className="t-radar-search">
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onLookupKeyDown}
            placeholder={t(language, "radar.filter.search")}
            type="text"
          />
          <button
            type="button"
            className={`t-search-action${lookupActionEnabled ? " active" : ""}`}
            onClick={onLookupSubmit}
            disabled={!lookupActionEnabled || lookupStatus === "resolving"}
          >
            {t(language, "search.lookup")}
          </button>
        </label>
        {lookupStatus !== "idle" && lookupNote ? (
          <div className={`t-search-status t-search-status-${lookupStatus}`}>{lookupNote}</div>
        ) : null}

        <div className="t-radar-filter-row">
          <span className="t-filter-label">{t(language, "filter.chain")}</span>
          <FilterPills
            options={chainFilterOptions}
            value={chainFilter}
            onChange={(value) => {
              setChainFilter(value);
              setVerdictFilter("全部");
            }}
            renderLabel={(opt) => (opt === "全部" ? t(language, "filter.all") : <ChainLabel chain={opt} />)}
          />
        </div>

        <div className="t-radar-filter-row">
          <span className="t-filter-label">{t(language, "filter.verdict")}</span>
          <FilterPills
            options={["全部", "可做", "观望", "回避"] as const}
            value={verdictFilter}
            onChange={setVerdictFilter}
            renderLabel={(opt) => (opt === "全部" ? t(language, "filter.all") : tv(language, opt))}
          />
        </div>

        <div className="t-radar-filter-row">
          <span className="t-filter-label">{t(language, "radar.filter.score")}</span>
          <div className="t-radar-score-range">
            <input
              type="number"
              className="t-radar-score-input"
              value={scoreMin}
              min={0}
              max={100}
              onChange={(e) => {
                const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                setScoreMin(Math.min(v, scoreMax));
              }}
            />
            <span className="t-radar-score-sep">—</span>
            <input
              type="number"
              className="t-radar-score-input"
              value={scoreMax}
              min={0}
              max={100}
              onChange={(e) => {
                const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                setScoreMax(Math.max(v, scoreMin));
              }}
            />
          </div>
        </div>

        <div className="t-radar-filter-row">
          <span className="t-filter-label">{t(language, "radar.filter.sort")}</span>
          <div className="t-filter-pills">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                className={`t-filter-pill${sortKey === opt.key ? " active" : ""}`}
                onClick={() => setSortKey(opt.key)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="t-radar-sort-dir"
            onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
            title={sortDir === "desc" ? t(language, "radar.sort.desc") : t(language, "radar.sort.asc")}
          >
            {sortDir === "desc" ? `↓ ${t(language, "radar.sort.desc")}` : `↑ ${t(language, "radar.sort.asc")}`}
          </button>
          <button type="button" className="t-radar-reset" onClick={resetFilters}>
            {t(language, "radar.filter.reset")}
          </button>
        </div>
      </div>

      <div className="t-table-wrap">
        <table className="t-table t-radar-table">
          <thead>
            <tr>
              <th>{t(language, "table.symbol")}</th>
              <th>{t(language, "table.chain")}</th>
              <th>{t(language, "table.narrative")}</th>
              <th>{t(language, "table.price")}</th>
              <th>MCAP</th>
              <th>{t(language, "table.volume24h")}</th>
              <th>{t(language, "table.liquidity")}</th>
              <th>{t(language, "table.score")}</th>
              <th>{t(language, "table.verdict")}</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={9} className="td-empty">{t(language, "empty.table")}</td>
              </tr>
            ) : null}
            {displayed.map((c) => (
              <tr
                key={`${c.chain}-${c.address}`}
                className="t-radar-row"
                onClick={() => onSelectCandidate(c)}
              >
                <td className="td-sym">
                  <span className="td-token">
                    <TokenIcon candidate={c} size="sm" />
                    <span>{c.symbol}</span>
                  </span>
                </td>
                <td>
                  <span className="t-radar-chain">
                    <ChainLabel chain={c.chain} />
                  </span>
                </td>
                <td>{formatNarrative(language, c.narrative)}</td>
                <td className="td-mono">{c.price}</td>
                <td className="td-mono">{c.marketCap ?? "--"}</td>
                <td className="td-mono">{c.volume24h}</td>
                <td className="td-mono">{c.liquidity}</td>
                <td className="td-mono">{c.score}</td>
                <td>
                  <span className={`verdict-chip verdict-${c.verdict}`}>{tv(language, c.verdict)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentationModule({ language }: { language: Language }) {
  const docsSections = useMemo(() => getLocalizedDocs(language), [language]);
  const sectionIds = useMemo(() => docsSections.map((s) => s.id), []);
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] ?? "");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Suppress scroll-spy updates while a click-initiated smooth scroll is in progress,
  // otherwise the IntersectionObserver fires for every section the animation passes
  // through and the highlight bounces around before settling.
  const suppressSpyRef = useRef<number>(0);
  const suppressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const elements = sectionIds
      .map((id) => root.querySelector<HTMLElement>(`#${id}`))
      .filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < suppressSpyRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root,
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.1, 0.5, 1]
      }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    return () => {
      if (suppressTimerRef.current !== null) {
        window.clearTimeout(suppressTimerRef.current);
      }
    };
  }, []);

  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const root = scrollRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    const top = target.offsetTop - 12;
    // Lock the active section to the clicked one and ignore observer updates
    // until the smooth scroll has had time to settle.
    suppressSpyRef.current = Date.now() + 900;
    setActiveSection(id);
    if (suppressTimerRef.current !== null) {
      window.clearTimeout(suppressTimerRef.current);
    }
    suppressTimerRef.current = window.setTimeout(() => {
      suppressTimerRef.current = null;
      // After the animation settles, let the observer re-sync to whatever
      // section is actually at the top of the viewport.
      const settledRoot = scrollRef.current;
      if (!settledRoot) return;
      const rootRect = settledRoot.getBoundingClientRect();
      let best = id;
      let bestDelta = Number.POSITIVE_INFINITY;
      sectionIds.forEach((sid) => {
        const el = settledRoot.querySelector<HTMLElement>(`#${sid}`);
        if (!el) return;
        const delta = Math.abs(el.getBoundingClientRect().top - rootRect.top - 12);
        if (delta < bestDelta) {
          bestDelta = delta;
          best = sid;
        }
      });
      setActiveSection(best);
    }, 950);
    root.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <div className="t-docs">
      <aside className="t-docs-aside">
        <div className="t-docs-aside-head">
          <span className="t-docs-aside-eyebrow">{t(language, "docs.eyebrow")}</span>
          <span className="t-docs-aside-title">{t(language, "docs.title")}</span>
          <span className="t-docs-aside-note">{t(language, "docs.note")}</span>
        </div>
        <nav className="t-docs-nav" aria-label="Docs sections">
          {docsSections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`t-docs-nav-item${activeSection === section.id ? " active" : ""}`}
              onClick={(event) => handleNavClick(event, section.id)}
            >
              <span className="t-docs-nav-num">{String(index + 1).padStart(2, "0")}</span>
              <span className="t-docs-nav-text">
                <span className="t-docs-nav-title">{section.title}</span>
                <span className="t-docs-nav-summary">{section.summary}</span>
              </span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="t-docs-scroll" ref={scrollRef}>
        <article className="t-docs-article">
          <header className="t-docs-hero">
            <div className="t-docs-hero-grid" aria-hidden="true" />
            <a
              className="t-docs-paper-link"
              href="/paper/main.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="t-docs-paper-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              {language === "zh" ? "查看我们的论文" : "Read Our Paper"}
            </a>
            <span className="t-docs-hero-eyebrow">Built on AVE · Documentation</span>
            <h1 className="t-docs-hero-title">{t(language, "docs.heroTitle")}</h1>
            <p className="t-docs-hero-lead">
              {t(language, "docs.heroLead")}
            </p>
            <div className="t-docs-hero-badges">
              <span className="t-docs-hero-badge t-docs-hero-badge-chains">
                {(["Solana", "BSC", "Base", "Ethereum"] as const).map((chain, index) => (
                  <Fragment key={chain}>
                    {index > 0 ? <span className="t-docs-hero-chain-separator">/</span> : null}
                    <span className="t-docs-hero-chain-item">
                      <ChainIcon chain={chain} />
                      <span>{chain}</span>
                    </span>
                  </Fragment>
                ))}
              </span>
              <span className="t-docs-hero-badge">Monitor + Trade</span>
              <span className="t-docs-hero-badge accent">{t(language, "docs.badgeBuilt")}</span>
            </div>
          </header>

          {docsSections.map((section, index) => (
            <DocSectionBlock key={section.id} section={section} index={index + 1} language={language} />
          ))}

          <footer className="t-docs-footer">
            <span>{t(language, "footer.docs")}</span>
            <span>© Built on AVE</span>
          </footer>
        </article>
      </div>
    </div>
  );
}

function AccessProgramModule({ language }: { language: Language }) {
  const accessContent = useMemo(() => getLocalizedAccessContent(language), [language]);
  const sectionIds = useMemo(() => accessContent.sections.map((section) => section.id), [accessContent.sections]);
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] ?? "");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const suppressSpyRef = useRef<number>(0);
  const suppressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const elements = sectionIds
      .map((id) => root.querySelector<HTMLElement>(`#${id}`))
      .filter((element): element is HTMLElement => !!element);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < suppressSpyRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root,
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.1, 0.5, 1]
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    return () => {
      if (suppressTimerRef.current !== null) {
        window.clearTimeout(suppressTimerRef.current);
      }
    };
  }, []);

  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const root = scrollRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    suppressSpyRef.current = Date.now() + 900;
    setActiveSection(id);
    if (suppressTimerRef.current !== null) {
      window.clearTimeout(suppressTimerRef.current);
    }
    suppressTimerRef.current = window.setTimeout(() => {
      suppressTimerRef.current = null;
      const settledRoot = scrollRef.current;
      if (!settledRoot) return;
      const rootRect = settledRoot.getBoundingClientRect();
      let best = id;
      let bestDelta = Number.POSITIVE_INFINITY;
      sectionIds.forEach((sectionId) => {
        const element = settledRoot.querySelector<HTMLElement>(`#${sectionId}`);
        if (!element) return;
        const delta = Math.abs(element.getBoundingClientRect().top - rootRect.top - 12);
        if (delta < bestDelta) {
          bestDelta = delta;
          best = sectionId;
        }
      });
      setActiveSection(best);
    }, 950);
    root.scrollTo({ top: target.offsetTop - 12, behavior: "smooth" });
  }

  return (
    <div className="t-docs">
      <aside className="t-docs-aside">
        <div className="t-docs-aside-head">
          <span className="t-docs-aside-eyebrow">{t(language, "access.eyebrow")}</span>
          <span className="t-docs-aside-title">{t(language, "access.title")}</span>
          <span className="t-docs-aside-note">{t(language, "access.note")}</span>
        </div>
        <nav className="t-docs-nav" aria-label="Access sections">
          {accessContent.sections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`t-docs-nav-item${activeSection === section.id ? " active" : ""}`}
              onClick={(event) => handleNavClick(event, section.id)}
            >
              <span className="t-docs-nav-num">{String(index + 1).padStart(2, "0")}</span>
              <span className="t-docs-nav-text">
                <span className="t-docs-nav-title">{section.title}</span>
                <span className="t-docs-nav-summary">{section.summary}</span>
              </span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="t-docs-scroll" ref={scrollRef}>
        <article className="t-docs-article">
          <header className="t-docs-hero">
            <div className="t-docs-hero-grid" aria-hidden="true" />
            <span className="t-docs-hero-eyebrow">Built on AVE · Access Program</span>
            <h1 className="t-docs-hero-title">{t(language, "access.heroTitle")}</h1>
            <p className="t-docs-hero-lead">{t(language, "access.heroLead")}</p>
            <div className="t-docs-hero-badges">
              <span className="t-docs-hero-badge accent">{t(language, "access.badge.preview")}</span>
              <span className="t-docs-hero-badge">{t(language, "access.badge.volume")}</span>
              <span className="t-docs-hero-badge">{t(language, "access.badge.priority")}</span>
            </div>
          </header>

          <section className="t-doc-section" id="access-gate">
            <header className="t-doc-section-head">
              <span className="t-doc-section-num">01</span>
              <h2 className="t-doc-section-title">{accessContent.sections[0]?.title}</h2>
            </header>
            <div className="t-doc-section-body">
              <p className="t-doc-section-summary">{accessContent.sections[0]?.summary}</p>
              <div className="t-docs-card-grid">
                {accessContent.gateCards.map((card) => (
                  <article className="t-docs-card" key={card.title}>
                    <span className="t-docs-card-eyebrow">{card.eyebrow}</span>
                    <h3 className="t-docs-card-title">{card.title}</h3>
                    <p className="t-docs-card-copy">{card.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="t-doc-section" id="access-tiers">
            <header className="t-doc-section-head">
              <span className="t-doc-section-num">02</span>
              <h2 className="t-doc-section-title">{accessContent.sections[1]?.title}</h2>
            </header>
            <div className="t-doc-section-body">
              <p className="t-doc-section-summary">{accessContent.sections[1]?.summary}</p>
              <div className="t-table-wrap">
                <table className="t-table evidence">
                  <thead>
                    <tr>
                      <th>{language === "zh" ? "等级" : "Tier"}</th>
                      <th>{language === "zh" ? "AVE 累计交易量" : "AVE Volume"}</th>
                      <th>{language === "zh" ? "开放范围" : "Access Scope"}</th>
                      <th>{language === "zh" ? "额度" : "Quota"}</th>
                      <th>{language === "zh" ? "权益重点" : "Key Benefit"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessContent.tierRows.map((row) => (
                      <tr key={row.level}>
                        <td>{row.level}</td>
                        <td className="td-mono">{row.threshold}</td>
                        <td>{row.access}</td>
                        <td>{row.quota}</td>
                        <td>{row.benefit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="t-doc-section" id="access-benefits">
            <header className="t-doc-section-head">
              <span className="t-doc-section-num">03</span>
              <h2 className="t-doc-section-title">{accessContent.sections[2]?.title}</h2>
            </header>
            <div className="t-doc-section-body">
              <p className="t-doc-section-summary">{accessContent.sections[2]?.summary}</p>
              <div className="t-table-wrap">
                <table className="t-table evidence t-table-center-cols">
                  <thead>
                    <tr>
                      {accessContent.benefitHeaders.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accessContent.benefitRows.map((row) => (
                      <tr key={row.feature}>
                        <td>{row.feature}</td>
                        {row.values.map((value, index) => (
                          <td key={`${row.feature}-${index}`}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <footer className="t-docs-footer">
            <span>{t(language, "footer.access")}</span>
            <span>© Built on AVE</span>
          </footer>
        </article>
      </div>
    </div>
  );
}

function GlobalPageShell({
  title,
  summary,
  tag,
  sidebar,
  children,
  showHeader = true,
  showHeroBrand = false,
  language
}: {
  title: string;
  summary: string;
  tag: string;
  sidebar: ReactNode;
  children: ReactNode;
  showHeader?: boolean;
  showHeroBrand?: boolean;
  language: Language;
}) {
  const hasSidebar = sidebar !== null && sidebar !== undefined && sidebar !== false;
  return (
    <div className={`t-global-shell${hasSidebar ? "" : " no-sidebar"}`}>
      {hasSidebar ? (
        <aside className="t-global-sidebar">
          {sidebar}
        </aside>
      ) : null}
      <div className="t-global-main">
        {showHeader ? (
          <div className="t-panel t-global-page-header">
            <div className="t-panel-head">
              <span className="t-panel-title">{title}</span>
              {tag ? <span className="t-panel-tag">{tag}</span> : null}
            </div>
            <div className="t-panel-body">
              {showHeroBrand ? (
                <div className="t-global-hero-brand" aria-label="AVE Sentinel overview identity">
                  <img alt="AVE Sentinel product mark" className="t-global-hero-mark" src={brandMark} />
                  <div className="t-global-hero-word">
                    <span className="t-global-hero-name">AVE SENTINEL</span>
                    <span className="t-global-hero-platform">{t(language, "overview.platform")}</span>
                  </div>
                </div>
              ) : null}
              {summary ? (
                <p className="t-global-page-summary">{summary}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function renderGlobalSidebar(activeModule: ModuleId, language: Language) {
  if (activeModule !== "radar") {
    return null;
  }

  const rows = getRadarNav(language);

  return (
    <div className="ov2-guide">
      <div className="ov2-guide-head">
        <span className="ov2-guide-title">{t(language, "radar.notes")}</span>
        <span className="ov2-tag">{t(language, "radar.guide")}</span>
      </div>
      <div className="ov2-guide-list">
        {rows.map((row, index) => (
          <div className="ov2-guide-item" key={row.title}>
            <span className="ov2-guide-num">{String(index + 1).padStart(2, "0")}</span>
            <div className="ov2-guide-text">
              <span className="ov2-guide-item-title">{row.title}</span>
              <span className="ov2-guide-item-summary">{row.summary}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocSectionBlock({ section, index, language }: { section: DocSection; index?: number; language: Language }) {
  return (
    <section className="t-doc-section" id={section.id}>
      <header className="t-doc-section-head">
        {typeof index === "number" ? (
          <span className="t-doc-section-num">{String(index).padStart(2, "0")}</span>
        ) : null}
        <h2 className="t-doc-section-title">{section.title}</h2>
      </header>
      <div className="t-doc-section-body">
        <p className="t-doc-section-summary">{section.summary}</p>

        {section.paragraphs?.map((paragraph) => (
          <p className="t-doc-paragraph" key={paragraph}>
            {paragraph}
          </p>
        ))}

        {section.bullets && section.bullets.length > 0 ? (
          <ul className="t-doc-list">
            {section.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}

        {section.rows && section.rows.length > 0 ? (
          <div className="t-table-wrap">
            <table className="t-table evidence">
              <thead>
                <tr>
                  <th>{t(language, "table.module")}</th>
                  <th>{t(language, "table.positioning")}</th>
                  <th>{t(language, "table.description")}</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.value}</td>
                    <td>{row.note ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {section.commands && section.commands.length > 0 ? (
          <div className="t-doc-terminal">
            <div className="t-doc-terminal-chrome"><i /><i /><i /></div>
            <div className="t-doc-code-block">
              {section.commands.map((command) => (
                <code className="t-doc-code-line" key={command}>
                  {command}
                </code>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ─── Token Dossier ──────────────────────────────────────────────────── */

const scoreFactorMeta: Record<
  ScoreModelFactorKey,
  {
    label: { zh: string; en: string };
    description: { zh: string; en: string };
    short: { zh: string; en: string };
  }
> = {
  L: {
    label: { zh: "L 流动性深度", en: "L Liquidity Depth" },
    description: { zh: "主池深度与承接能力", en: "Pool depth and order absorption" },
    short: { zh: "流动性", en: "Liquidity" }
  },
  V: {
    label: { zh: "V 成交质量", en: "V Volume Quality" },
    description: { zh: "成交量与成交笔数质量", en: "Volume quality and transaction depth" },
    short: { zh: "成交量", en: "Volume" }
  },
  M: {
    label: { zh: "M 动量合成", en: "M Momentum Composite" },
    description: { zh: "1h 与 24h 动量强弱", en: "1h and 24h momentum blend" },
    short: { zh: "动量", en: "Momentum" }
  },
  A: {
    label: { zh: "A 活跃度加速", en: "A Activity Acceleration" },
    description: { zh: "当前活跃度相对均值加速", en: "Activity acceleration versus baseline" },
    short: { zh: "活跃度", en: "Activity" }
  },
  C: {
    label: { zh: "C 持仓集中度", en: "C Holder Concentration" },
    description: { zh: "Top 持仓与地址分散度", en: "Top-holder concentration and breadth" },
    short: { zh: "集中度", en: "Holders" }
  },
  R: {
    label: { zh: "R 风险门面", en: "R Risk Posture" },
    description: { zh: "AVE 风险分与风险标志位", en: "AVE risk score and flags" },
    short: { zh: "风险", en: "Risk" }
  },
  S: {
    label: { zh: "S 聪明钱信号", en: "S Smart Money Signal" },
    description: { zh: "Signal 动作与领跑资金", en: "Signal actions and lead capital" },
    short: { zh: "聪明钱", en: "Smart $" }
  },
  F: {
    label: { zh: "F 周期适配", en: "F Freshness Curve" },
    description: { zh: "代币年龄与周期适配", en: "Token age and freshness fit" },
    short: { zh: "周期", en: "Freshness" }
  }
};

const scoreGateMeta: Record<ScoreModelGateKey, { zh: string; en: string }> = {
  honeypot: { zh: "Honeypot", en: "Honeypot" },
  blacklist: { zh: "黑名单", en: "Blacklist" },
  mintable: { zh: "增发权限", en: "Mintable" },
  extremeTax: { zh: "极端税率", en: "Extreme Tax" },
  heavyTax: { zh: "重税", en: "Heavy Tax" },
  ownerPermission: { zh: "Owner 权限", en: "Owner Powers" }
};

function scoreText(language: Language, zh: string, en: string) {
  return language === "zh" ? zh : en;
}

function formatScorePercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${Math.round(value * 100)}%`;
}

function formatScoreWeight(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${Math.round(value * 100)}%`;
}

function formatScoreContribution(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return value.toFixed(1);
}

function formatScoreFlowValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "--";
  return value.toFixed(1);
}

function localizedVerdict(language: Language, verdict: ScoreModelPayload["verdict"]) {
  if (verdict === "--") return "--";
  return tv(language, verdict);
}

function scoreToneClass(score: number | null) {
  if (score === null || !Number.isFinite(score)) return "";
  return scoreClass(score);
}

function ScoreRadar({
  factors,
  language
}: {
  factors: ScoreModelPayload["factors"];
  language: Language;
}) {
  const width = 280;
  const height = 260;
  const cx = width / 2;
  const cy = height / 2;
  const r = 68;
  const labelR = r + 28;
  const gridLevels = [0.33, 0.67, 1];

  const vertices = factors.map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / factors.length;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });

  const toPoint = (v: { x: number; y: number }, scale: number) =>
    `${(cx + v.x * r * scale).toFixed(2)},${(cy + v.y * r * scale).toFixed(2)}`;

  const coveragePoints = factors
    .map((f, i) => toPoint(vertices[i], Math.max(0, Math.min(1, f.normalizedValue ?? 0))))
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="score-radar" role="img" aria-label="capability radar">
      {gridLevels.map((level, idx) => (
        <polygon
          key={level}
          points={vertices.map((v) => toPoint(v, level)).join(" ")}
          className={`score-radar-grid${idx === gridLevels.length - 1 ? " outer" : ""}`}
        />
      ))}
      {vertices.map((v, idx) => (
        <line
          key={idx}
          x1={cx}
          y1={cy}
          x2={cx + v.x * r}
          y2={cy + v.y * r}
          className="score-radar-axis"
        />
      ))}
      <polygon points={coveragePoints} className="score-radar-coverage" />
      {factors.map((f, i) => {
        const v = vertices[i];
        const value = Math.max(0, Math.min(1, f.normalizedValue ?? 0));
        return (
          <circle
            key={f.key}
            cx={cx + v.x * r * value}
            cy={cy + v.y * r * value}
            r={2.4}
            className="score-radar-node"
          />
        );
      })}
      {factors.map((f, i) => {
        const v = vertices[i];
        const anchor: "start" | "middle" | "end" =
          Math.abs(v.x) < 0.3 ? "middle" : v.x > 0 ? "start" : "end";
        return (
          <text
            key={f.key}
            x={cx + v.x * labelR}
            y={cy + v.y * labelR}
            textAnchor={anchor}
            dominantBaseline="central"
            className="score-radar-label"
          >
            {scoreFactorMeta[f.key].short[language]}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreModelPanel({
  model,
  language
}: {
  model: ScoreModelPayload;
  language: Language;
}) {
  const triggeredGates = model.gates.filter((gate) => gate.triggered);

  return (
    <section className="report-panel report-panel-wide score-model-panel">
      <div className="report-panel-head compact">
        <span className="report-eyebrow">SENTINEL-8 Score Model</span>
      </div>

      <div className="score-model-body">
        <div className="score-factor-grid">
          {model.factors.map((factor) => {
            const meta = scoreFactorMeta[factor.key];
            const normalized = factor.normalizedValue ?? 0;
            return (
              <div className="score-factor-card" key={factor.key}>
                <div className="score-factor-head">
                  <div className="score-factor-title-group">
                    <span className="score-factor-title">{meta.label[language]}</span>
                    <span className="score-factor-desc">{meta.description[language]}</span>
                  </div>
                  <strong className="score-factor-value">{formatScorePercent(factor.normalizedValue)}</strong>
                </div>
                <span className="score-factor-bar">
                  <span className="score-factor-fill" style={{ width: `${Math.max(0, Math.min(100, normalized * 100))}%` }} />
                </span>
                <div className="score-factor-meta">
                  <span>{scoreText(language, "权重", "Weight")} {formatScoreWeight(factor.weight)}</span>
                  <span>{scoreText(language, "贡献", "Contribution")} {formatScoreContribution(factor.contribution)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="score-summary-sidebar">
          <div className="score-summary-card score-summary-card-final">
            <span className="score-summary-label">{scoreText(language, "最终得分", "Final Score")}</span>
            <strong className={`score-summary-value-xl ${scoreToneClass(model.finalScore)}`}>
              {model.finalScore ?? "--"}
            </strong>
            <div className="score-summary-verdict">
              <span className={`verdict-chip ${model.verdict !== "--" ? `verdict-${model.verdict}` : ""}`}>
                {localizedVerdict(language, model.verdict)}
              </span>
            </div>
          </div>
          <div className="score-summary-card score-summary-card-radar">
            <span className="score-summary-label">{scoreText(language, "多维分析矩阵", "Multi-Dimensional Matrix")}</span>
            <ScoreRadar factors={model.factors} language={language} />
          </div>
        </aside>
      </div>

      <div className="score-gates-bar">
        <span className="score-gates-label">{scoreText(language, "风险门控", "Risk Gates")}</span>
        <div className="score-gate-list">
          {model.gates.map((gate) => (
            <div className={`score-gate-chip${gate.triggered ? " active" : ""}`} key={gate.key}>
              <span>{scoreGateMeta[gate.key][language]}</span>
              <strong>{gate.triggered ? `×${gate.multiplier}` : scoreText(language, "未触发", "Bypassed")}</strong>
            </div>
          ))}
        </div>
        <span className="score-gates-note">
          {triggeredGates.length > 0
            ? scoreText(language, "命中项按倍率下调总分", "Triggered gates reduce the score multiplicatively")
            : scoreText(language, "当前无额外风险倍率", "No extra risk multiplier active")}
        </span>
      </div>
    </section>
  );
}

function ScoreModelReport({
  detail,
  language
}: {
  detail: DetailState;
  language: Language;
}) {
  return (
    <div className="dossier-report">
      <ScoreModelPanel model={detail.scoreModel} language={language} />
    </div>
  );
}

function TokenDossierReport({
  chain,
  detail,
  loading,
  language
}: {
  chain: Candidate["chain"];
  detail: DetailState;
  loading?: boolean;
  language: Language;
}) {
  const profile = detail.projectProfile;
  const pair = detail.pairStructure;
  const holderRisk = detail.holderRisk;

  const pairMetaRows = [
    ["AMM", pair.amm],
    [t(language, "dossier.lpLock"), pair.lpLockPercent],
    [t(language, "dossier.lpLockPlatform"), pair.lpLockPlatform],
    [t(language, "dossier.sniperCount"), pair.sniperTxCount],
    ["ATH", pair.ath],
    [t(language, "dossier.atl"), pair.low]
  ] as const;

  const holderRows = [
    [t(language, "dossier.topHolders"), holderRisk.top10Pct],
    [t(language, "dossier.lpLock"), holderRisk.lpLockPercent]
  ] as const;
  const profileMetaRows = [
    [t(language, "dossier.issuePlatform"), <PlatformValue value={profile.issuePlatform} />],
    [t(language, "dossier.launch"), profile.launchAt],
    [t(language, "dossier.holders"), profile.holders],
    [t(language, "dossier.mainPair"), <AddressValue chain={chain} value={profile.mainPair} />]
  ] as const;

  return (
    <div className="dossier-report">
      <section className="report-panel report-panel-wide">
        <div className="report-meta-inline">
          {profileMetaRows.map(([label, value]) => (
            <div className="report-meta-inline-item" key={label}>
              <span>{label}</span>
              <strong>{value || "--"}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="report-panel report-panel-wide">
        <div className="report-panel-head compact">
          <span className="report-eyebrow">{t(language, "dossier.pairStructure")}</span>
          <span className="report-panel-note">{t(language, "dossier.primaryPool")}</span>
        </div>
        <div className="report-meta-inline report-meta-inline-six">
          {pairMetaRows.map(([label, value]) => (
            <div className="report-meta-inline-item" key={label}>
              <span>{label}</span>
              <strong>{value || "--"}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="report-panel report-panel-wide">
        <div className="report-panel-head compact">
          <span className="report-eyebrow">{t(language, "dossier.marketPressure")}</span>
          <span className="report-panel-note">{t(language, "dossier.buySellFlow")}</span>
        </div>
        <MarketPressureTable rows={detail.marketPressure} language={language} />
      </section>

      <section className="report-panel report-panel-wide report-panel-tight">
        <div className="report-panel-head compact">
          <span className="report-eyebrow">{t(language, "dossier.dexLiquidity")}</span>
          <span className="report-panel-note">{t(language, "dossier.topPairs")}</span>
        </div>
        <DexLiquidityTable rows={detail.dexLiquidity} language={language} chain={chain} />
      </section>

      <section className="report-panel report-panel-wide report-panel-tight">
        <div className="report-panel-head compact">
          <span className="report-eyebrow">{t(language, "dossier.liquidityEvents")}</span>
          <span className="report-panel-note">{t(language, "dossier.recentLiquidity")}</span>
        </div>
        <LiquidityEventsTable rows={detail.liquidityEvents} language={language} chain={chain} />
      </section>

      <section className="report-panel report-panel-wide">
        <div className="report-panel-head compact">
          <span className="report-eyebrow">{t(language, "dossier.holderRisk")}</span>
          <span className="report-panel-note">{t(language, "dossier.holderConcentration")}</span>
        </div>
        <ReportKeyValueGrid rows={holderRows} dense />
        <div className="holder-risk-grid">
          <HolderTable title={t(language, "dossier.topHolders")} rows={holderRisk.topHolders} language={language} chain={chain} />
          <HolderTable title={t(language, "dossier.pairHolders")} rows={holderRisk.pairHolders} language={language} chain={chain} />
        </div>
      </section>
    </div>
  );
}

function RiskGuardReport({
  detail,
  language
}: {
  detail: DetailState;
  language: Language;
}) {
  const aiRisk = detail.aiRisk;

  return (
    <div className="dossier-report">
      <section className="report-panel report-panel-wide">
        <div className="report-panel-head compact">
          <span className="report-eyebrow">{t(language, "risk.title")}</span>
        </div>
        <EvidenceRows rows={localizeEvidenceRows(language, detail.risk)} language={language} />
      </section>
      <section className="report-panel report-panel-wide">
        <div className="report-panel-head compact">
          <span className="report-eyebrow">{t(language, "dossier.aiRisk")}</span>
          <span className="report-panel-note">{aiRisk.mechanism}</span>
        </div>
        <div className="risk-summary-grid">
          {aiRisk.summary.length > 0 ? (
            aiRisk.summary.map((row) => (
              <ReportMetric
                key={row.label}
                label={formatAiRiskSummaryLabel(language, row.label)}
                value={formatAiRiskSummaryValue(language, row.label, row.value)}
              />
            ))
          ) : (
            <div className="report-empty">--</div>
          )}
        </div>
        <AiRiskList risk={aiRisk} language={language} />
      </section>
    </div>
  );
}

function EvidenceRows({ rows, language }: { rows: EvidenceRow[]; language: Language }) {
  return (
    <div className="t-table-wrap">
      <table className="t-table evidence">
        <thead>
          <tr>
            <th>{t(language, "table.indicator")}</th>
            <th>{t(language, "table.value")}</th>
            <th>{t(language, "table.interpretation")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="td-empty">{t(language, "empty.data")}</td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{translateValue(language, row.value)}</td>
              <td>{row.interpretation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-metric">
      <span className="report-metric-label">{label}</span>
      <strong className="report-metric-value">{value || "--"}</strong>
    </div>
  );
}

function ReportKeyValueGrid({
  rows,
  dense
}: {
  rows: readonly (readonly [string, ReactNode])[];
  dense?: boolean;
}) {
  return (
    <div className={`report-kv-grid${dense ? " dense" : ""}`}>
      {rows.map(([label, value]) => (
        <div className="report-kv" key={label}>
          <span>{label}</span>
          <strong>{value || "--"}</strong>
        </div>
      ))}
    </div>
  );
}

function MarketPressureTable({ rows, language }: { rows: MarketPressureRow[]; language: Language }) {
  return (
    <div className="t-table-wrap">
      <table className="t-table report-table report-table-compact">
        <thead>
          <tr>
            <th>{t(language, "dossier.period")}</th>
            <th>{t(language, "dossier.buyTx")}</th>
            <th>{t(language, "dossier.sellTx")}</th>
            <th>{t(language, "dossier.buyVol")}</th>
            <th>{t(language, "dossier.sellVol")}</th>
            <th>{t(language, "dossier.buyers")}</th>
            <th>{t(language, "dossier.sellers")}</th>
            <th>{t(language, "dossier.makers")}</th>
            <th>{t(language, "dossier.pressure")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="td-empty">--</td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr key={row.period}>
              <td className="td-mono">{row.period}</td>
              <td className="td-mono">{row.buyTx}</td>
              <td className="td-mono">{row.sellTx}</td>
              <td className="td-mono">{row.buyVolume}</td>
              <td className="td-mono">{row.sellVolume}</td>
              <td className="td-mono">{row.buyers}</td>
              <td className="td-mono">{row.sellers}</td>
              <td className="td-mono">{row.makers}</td>
              <td>
                <div className="pressure-cell">
                  <span className="pressure-track">
                    <span className="pressure-buy" style={{ width: `${row.buyRatio}%` }} />
                  </span>
                  <span className="pressure-text">{Math.round(row.buyRatio)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DexLiquidityTable({
  rows,
  language,
  chain
}: {
  rows: DexLiquidityRow[];
  language: Language;
  chain: Candidate["chain"];
}) {
  return (
    <div className="t-table-wrap">
      <table className="t-table report-table report-table-compact">
        <thead>
          <tr>
            <th>AMM</th>
            <th>{t(language, "dossier.mainPair")}</th>
            <th>{t(language, "dossier.name")}</th>
            <th>{t(language, "table.liquidity")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="td-empty">--</td>
            </tr>
          ) : null}
          {rows.map((row, index) => (
            <tr key={`${row.pair}-${index}`}>
              <td><PlatformValue value={row.amm} /></td>
              <td><AddressValue chain={chain} value={row.pair} /></td>
              <td>{row.name}</td>
              <td className="td-mono">{row.liquidity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiquidityEventsTable({
  rows,
  language,
  chain
}: {
  rows: LiquidityEventPayload[];
  language: Language;
  chain: Candidate["chain"];
}) {
  return (
    <div className="t-table-wrap">
      <table className="t-table report-table">
        <thead>
          <tr>
            <th>{t(language, "dossier.type")}</th>
            <th>{t(language, "dossier.amount")}</th>
            <th>{t(language, "dossier.time")}</th>
            <th>{t(language, "dossier.wallet")}</th>
            <th>{t(language, "dossier.tx")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="td-empty">--</td>
            </tr>
          ) : null}
          {rows.map((row, index) => (
            <tr key={`${row.tx}-${index}`}>
              <td><LiquidityActionBadge type={row.type} language={language} /></td>
              <td className="td-mono">{row.amountUsd}</td>
              <td className="td-mono">{row.time}</td>
              <td><AddressValue chain={chain} value={row.wallet} /></td>
              <td><AddressValue chain={chain} value={row.tx} kind="tx" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LiquidityActionBadge({
  type,
  language
}: {
  type: string;
  language: Language;
}) {
  const normalized = type.trim().replace(/[\s_-]+/g, "").toLowerCase();
  const variant = /^(addliquidity|addlp|mint)$/.test(normalized)
    ? "add"
    : /^(removeliquidity|removelp|burn)$/.test(normalized)
      ? "remove"
      : "neutral";
  const label =
    variant === "add"
      ? language === "zh"
        ? "加池子"
        : "Add LP"
      : variant === "remove"
        ? language === "zh"
          ? "撤池子"
          : "Remove LP"
        : formatLiquidityAction(language, type);

  return <span className={`liq-action-badge ${variant}`}>{label}</span>;
}

function AiRiskList({ risk, language }: { risk: AiRiskPayload; language: Language }) {
  if (risk.risks.length === 0) {
    return <div className="report-empty">--</div>;
  }

  return (
        <div className="ai-risk-list">
      {risk.risks.map((item, index) => (
        <div className="ai-risk-item" key={`${item.name}-${index}`}>
          <div className="ai-risk-head">
            <strong>{item.name}</strong>
            <span>{t(language, "dossier.riskLevel")} {item.level}</span>
          </div>
          <p>{item.description}</p>
          <small>{t(language, "dossier.ownerRelated")}: {item.ownerRelated}</small>
        </div>
      ))}
    </div>
  );
}

function HolderTable({
  title,
  rows,
  language,
  chain
}: {
  title: string;
  rows: HolderRiskPayload["topHolders"];
  language: Language;
  chain: Candidate["chain"];
}) {
  return (
    <div className="holder-table-block">
      <span className="holder-table-title">{title}</span>
      <div className="t-table-wrap">
        <table className="t-table report-table">
          <thead>
            <tr>
              <th>{t(language, "dossier.address")}</th>
              <th>{t(language, "dossier.mark")}</th>
              <th>{t(language, "dossier.percent")}</th>
              <th>{t(language, "dossier.quantity")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="td-empty">--</td>
              </tr>
            ) : null}
            {rows.map((row, index) => (
              <tr key={`${row.address}-${index}`}>
                <td><AddressValue chain={chain} value={row.address} /></td>
                <td>{row.mark}</td>
                <td className="td-mono">{row.percent}</td>
                <td className="td-mono">{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Evidence ───────────────────────────────────────────────────────── */

function EvidenceModule({
  title,
  description,
  rows,
  loading,
  note,
  language
}: {
  title: string;
  description: string;
  rows: EvidenceRow[];
  loading?: boolean;
  note?: string;
  language: Language;
}) {
  const tiles = rows.slice(0, 4);

  return (
    <>
      <div className="t-panel">
        <div className="t-panel-head">
          <span className="t-panel-title">{title}</span>
          <StatusBadge label={translateStatus(language, loading ? "LOADING" : "READY")} />
        </div>
        <p className="t-panel-copy">{description}</p>
        {note ? (
          <div className="t-panel-body" style={{ borderTop: "1px solid #1E293B", paddingTop: 8, paddingBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#4B6A9B" }}>{note}</span>
          </div>
        ) : null}
        {tiles.length > 0 ? (
          <div className="t-evidence-tiles">
            {tiles.map((row) => (
              <div key={row.label} className="t-evidence-tile">
                <span className="et-label">{row.label}</span>
                <span className="et-value">{row.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="t-panel" style={{ marginTop: 10 }}>
        <div className="t-panel-head">
          <span className="t-panel-title">{title} — Detail</span>
          <span className="t-panel-tag count">{rows.length} rows</span>
        </div>
        {rows.length > 0 ? (
          <div className="t-table-wrap">
            <table className="t-table evidence">
              <thead>
                <tr>
                  <th>{t(language, "table.indicator")}</th>
                  <th>{t(language, "table.value")}</th>
                  <th>{t(language, "table.interpretation")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isHighRisk =
                    row.label === "Risk Level" &&
                    row.value.toUpperCase().includes("HIGH");
                  return (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={isHighRisk ? "td-risk-high" : undefined}>
                        {row.value}
                      </td>
                      <td>{row.interpretation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="t-empty">{t(language, "empty.data")}</div>
        )}
      </div>
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function FilterPills<T extends string>({
  options,
  value,
  onChange,
  renderLabel
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (opt: T) => ReactNode;
}) {
  return (
    <div className="t-filter-pills">
      {options.map((opt) => (
        <button
          key={opt}
          className={`t-filter-pill${value === opt ? " active" : ""}`}
          onClick={() => onChange(opt)}
          type="button"
        >
          {renderLabel ? renderLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}

function TokenIcon({
  candidate,
  size = "md"
}: {
  candidate: Candidate;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const symbol = candidate.symbol.slice(0, 2).toUpperCase();

  useEffect(() => {
    setFailed(false);
  }, [candidate.logoUrl]);

  if (!candidate.logoUrl || failed) {
    return (
      <span className={`token-icon token-icon-${size} fallback`}>
        {symbol}
      </span>
    );
  }

  return (
    <img
      alt={`${candidate.symbol} icon`}
      className={`token-icon token-icon-${size}`}
      src={candidate.logoUrl}
      onError={() => setFailed(true)}
    />
  );
}

function ChainIcon({ chain }: { chain: string }) {
  const src =
    chain === "Solana"
      ? chainSolanaIcon
      : chain === "BSC" || chain === "BNB"
        ? chainBscIcon
        : chain === "Base"
          ? chainBaseIcon
          : chain === "Ethereum" || chain === "ETH"
            ? chainEthIcon
            : "";
  const variant =
    chain === "Solana"
      ? "sol"
      : chain === "BSC" || chain === "BNB"
        ? "bnb"
        : chain === "Base"
          ? "base"
          : chain === "Ethereum" || chain === "ETH"
            ? "eth"
            : "";

  if (src) {
    return <img alt="" aria-hidden="true" className={`chain-icon ${variant}`} src={src} />;
  }
  return null;
}

function ChainLabel({ chain }: { chain: string }) {
  return (
    <>
      <ChainIcon chain={chain} />
      {chain}
    </>
  );
}

function SearchIcon() {
  return (
    <span className="t-search-prefix" aria-hidden="true">
      <svg className="t-search-icon" viewBox="0 0 24 24" focusable="false">
        <path d="M10.8 5a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6Zm0 1.8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm4.6 8.1 3.7 3.7-1.3 1.3-3.7-3.7 1.3-1.3Z" />
      </svg>
    </span>
  );
}

/** Returns CSS class for score tier coloring */
function scoreClass(score: number): string {
  if (score >= 80) return "score-high";
  if (score >= 60) return "score-mid";
  return "score-low";
}

type BadgeStatus = "ready" | "loading" | "error" | "mock" | "live";

function statusVariant(text: string): BadgeStatus {
  const t = text.toUpperCase();
  if (t === "LIVE") return "live";
  if (t === "READY") return "ready";
  if (t === "LOADING") return "loading";
  if (t === "FALLBACK" || t === "ERROR") return "error";
  return "mock";
}

/** READY / LOADING / ERROR / MOCK badge with animated dot */
function StatusBadge({ label }: { label: string }) {
  const variant = statusVariant(label);
  return (
    <span className={`status-badge s-${variant}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}

function BrandLockup({ compact = false, language }: { compact?: boolean; language: Language }) {
  return (
    <div className={`t-brand-lockup${compact ? " compact" : ""}`}>
      <img alt="AVE Sentinel product mark" className="t-brand-mark" src={brandMark} />
      <div className="t-brand-word">
        <span className="t-brand-name">AVE Sentinel</span>
        <span className="t-brand-subline">{t(language, "brand.subline")}</span>
      </div>
    </div>
  );
}

function getAveTokenUrl(candidate: Candidate) {
  const chain =
    candidate.chain === "Solana"
      ? "solana"
      : candidate.chain === "BSC"
        ? "bsc"
        : candidate.chain === "Base"
          ? "base"
          : "eth";
  return `https://ave.ai/token/${candidate.address}-${chain}`;
}

function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isSolanaBase58(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,88}$/.test(value);
}

function getExplorerUrl(chain: Candidate["chain"], value: string, kind: "address" | "tx" = "address") {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "--") return "";

  if (chain === "Solana") {
    if (!isSolanaBase58(trimmed)) return "";
    return kind === "tx"
      ? `https://solscan.io/tx/${trimmed}`
      : `https://solscan.io/account/${trimmed}`;
  }

  if (!isEvmAddress(trimmed)) return "";
  const base =
    chain === "BSC"
      ? "https://bscscan.com"
      : chain === "Base"
        ? "https://basescan.org"
        : "https://etherscan.io";
  return `${base}/${kind === "tx" ? "tx" : "address"}/${trimmed}`;
}

function ExplorerButton({
  chain,
  value,
  kind = "address"
}: {
  chain: Candidate["chain"];
  value: string;
  kind?: "address" | "tx";
}) {
  const href = getExplorerUrl(chain, value, kind);
  if (!href) return null;

  return (
    <a
      className="explorer-icon-btn"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={kind === "tx" ? "Open transaction in explorer" : "Open address in explorer"}
      title={kind === "tx" ? "Open transaction in explorer" : "Open address in explorer"}
    >
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M14 5h5v5h-2V8.41l-6.29 6.3-1.42-1.42 6.3-6.29H14V5Zm-7 2h4v2H7v8h8v-4h2v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" fill="currentColor" />
      </svg>
    </a>
  );
}

function AddressValue({
  chain,
  value,
  kind = "address",
  short = true
}: {
  chain: Candidate["chain"];
  value: string;
  kind?: "address" | "tx";
  short?: boolean;
}) {
  if (!value || value === "--") return <>--</>;

  return (
    <span className="address-inline">
      <ExplorerButton chain={chain} value={value} kind={kind} />
      <span className="address-inline-text td-mono">{short ? shortAddress(value) : value}</span>
    </span>
  );
}

function shortAddress(address: string) {
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

function shortInlineAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatCompactUsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "--";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatTokenAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "--";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(6);
}

export default App;
