export type ModuleId =
  | "overview"
  | "docs"
  | "access"
  | "radar"
  | "score"
  | "dossier"
  | "risk"
  | "opportunity";

export type SummaryMetric = {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "positive" | "negative";
};

export type Candidate = {
  address: string;
  pairAddress?: string;
  logoUrl?: string;
  symbol: string;
  chain: "Solana" | "BSC" | "Base" | "Ethereum";
  narrative: string;
  price: string;
  marketCap?: string;
  volume24h: string;
  liquidity: string;
  score: number;
  verdict: "可做" | "观望" | "回避";
};

export type EvidenceRow = {
  label: string;
  value: string;
  interpretation: string;
};

export type TradePreview = {
  priceUsd: number;
  liquidityUsd: number;
  priceChange1h: number;
  priceChange24h: number;
  txCount1h: number;
  txCount24h: number;
  route: string;
  baseSymbol: string;
  baseTokenAddress: string;
  baseTokenDecimals: number;
  baseTokenPriceUsd: number;
  tokenDecimals: number;
  signalTags: string[];
};

export type DocSection = {
  id: string;
  title: string;
  summary: string;
  paragraphs?: string[];
  bullets?: string[];
  commands?: string[];
  rows?: Array<{ label: string; value: string; note?: string }>;
};

export const summaryMetrics: SummaryMetric[] = [
  {
    label: "今日候选标的",
    value: "24",
    note: "Solana 14 / BSC 10"
  },
  {
    label: "高风险拦截",
    value: "8",
    note: "holders 与 liquidity 异常",
    tone: "negative"
  },
  {
    label: "可试算目标",
    value: "6",
    note: "已通过第一层风险过滤",
    tone: "positive"
  },
  {
    label: "观望标的",
    value: "10",
    note: "需要详情页继续确认"
  }
];

export const modules = [
  { id: "overview", label: "Overview", caption: "今天该看什么" },
  { id: "docs", label: "Docs", caption: "产品指南" },
  { id: "access", label: "Access", caption: "用户体系" },
  { id: "radar", label: "Radar", caption: "候选标的" },
  { id: "score", label: "评分计算", caption: "SENTINEL-8" },
  { id: "dossier", label: "Token Dossier", caption: "单币证据页" },
  { id: "risk", label: "Risk Guard", caption: "风险拦截" },
  { id: "opportunity", label: "Opportunity Desk", caption: "交易工作流" }
] as const;

export const docsSections: DocSection[] = [
  {
    id: "docs-overview",
    title: "产品概述",
    summary: "AVE Sentinel 是一个面向 Solana 与 BSC 早期链上资产的完整决策系统。",
    paragraphs: [
      "它不是单纯的新币看板，也不是只会下单的 bot。它的核心目标，是把发现、验证、判断、试算、交易预备、观察与复盘压进同一条连续工作流。",
      "这个系统优先解决的不是信息不足，而是信息碎片化、判断过慢、风险判断太晚、执行动作断裂和结果无法复盘。"
    ],
    bullets: [
      "服务对象：新币、热度状态上升的 meme、早期强度信号交易者",
      "目标链：Solana 与 BSC",
      "核心输出：可做 / 观望 / 回避",
      "底座能力：AVE Data + Signals + Trade"
    ]
  },
  {
    id: "docs-workflow",
    title: "完整工作流",
    summary: "AVE Sentinel 的完整应用场景是一个从候选发现到结果复盘的闭环。",
    bullets: [
      "发现候选标的：从 Radar 候选池里找到值得继续看的对象",
      "验证证据：检查 token、pair、成交、流动性和结构",
      "评分计算：查看 SENTINEL-8 的八维因子、权重与风险门控",
      "风险拦截：在动作之前判断 honeypot、税率、集中度、撤池风险",
      "试算与交易预备：使用官方 quote、auto-slippage、gas-tip、未签名交易预构建",
      "观察与复盘：把判断时刻和结果时刻连接起来"
    ]
  },
  {
    id: "docs-entrypoints",
    title: "三个使用入口",
    summary: "AVE Sentinel 不是三个分散产品，而是一个共享核心的多入口系统。",
    rows: [
      { label: "Web", value: "完整工作台", note: "用于完整分析、试算、预构建交易与复盘" },
      { label: "Telegram", value: "快速查询", note: "适合查币、查风险、查 quote、接 brief" },
      { label: "CLI", value: "高效率终端", note: "适合极客用户和后续自动化脚本调用" }
    ],
    paragraphs: [
      "三个入口共享同一套候选发现、风险判断和决策输出，保证不同入口返回一致结果。"
    ]
  },
  {
    id: "docs-web",
    title: "Web 工作台",
    summary: "Web 端提供完整的研究、风控、交易试算和复盘流程。",
    bullets: [
      "Overview：今日候选、品牌定位、完整工作流、重点摘要",
      "评分计算：SENTINEL-8 八维模型与风险门控",
      "Radar：候选池总表、筛选、搜索、优先级",
      "Token Dossier：单币证据页",
      "Risk Guard：风险解释与动作层结论",
      "Opportunity Desk：策略信号、quote、执行预备",
      "Replay：复盘与案例留存",
      "Docs：产品指南"
    ]
  },
  {
    id: "docs-telegram",
    title: "Telegram 查询",
    summary: "Telegram 是轻量查询入口，适合在移动端快速查看单币判断。",
    commands: [
      "/radar",
      "/brief",
      "/token <address> <solana|bsc>",
      "/risk <address> <solana|bsc>",
      "/quote <address> <solana|bsc> <usd>"
    ],
    paragraphs: [
      "Telegram 返回当前 token 的判断摘要、风险结论和 Quote 信息。",
      "同一地址在 Web 和 Telegram 中会使用同一套数据与判断逻辑。"
    ]
  },
  {
    id: "docs-cli",
    title: "CLI Skill",
    summary: "CLI Skill 是同一套能力的智能体入口，适合接入大模型 agent 和自动化流程。",
    commands: [
      "npm run cli -- radar",
      "npm run cli -- brief",
      "npm run cli -- token <address> --chain solana",
      "npm run cli -- risk <address> --chain bsc",
      "npm run cli -- quote <address> --chain solana --usd 500"
    ],
    paragraphs: [
      "CLI Skill 返回可直接使用的候选、风险、Quote 和单币摘要。",
      "它可以作为 agent、脚本和自动化工作流的调用入口。"
    ]
  },
  {
    id: "docs-env",
    title: "环境与运行",
    summary: "本地开发时，Web、CLI 和 Telegram 命令入口都复用同一个 AVE key。",
    commands: [
      "npm install",
      "npm run proxy",
      "npm run dev",
      "npm run cli -- help",
      "npm run tg -- \"/radar\""
    ],
    bullets: [
      "需要配置 AVE_API_KEY 或 VITE_AVE_API_KEY",
      "Web 前端建议通过本地代理绕过浏览器跨域限制",
      "CLI 和 Telegram 命令入口直接走同一套共享核心"
    ]
  },
  {
    id: "docs-workflow-path",
    title: "典型使用路径",
    summary: "围绕一个 token 完成发现、验证、风险判断、试算和复盘。",
    bullets: [
      "先在 Radar 里锁定一个目标",
      "打开评分计算看 SENTINEL-8 建模过程",
      "打开 Token Dossier 看结构",
      "打开 Risk Guard 看动作层结论",
      "在 Opportunity Desk 做官方 quote 和预构建交易",
      "用 Telegram 或 CLI Skill 查询同一地址",
      "最后回到 Replay 查看结果和复盘记录"
    ]
  }
];

export const radarCandidates: Candidate[] = [
  {
    address: "moonx111111111111111111111111111111111111111",
    pairAddress: "moonxpair11111111111111111111111111111111111",
    symbol: "MOONX",
    chain: "Solana",
    narrative: "发射平台 Meme",
    price: "$0.000412",
    volume24h: "$4.8M",
    liquidity: "$820K",
    score: 84,
    verdict: "可做"
  },
  {
    address: "0xbanana000000000000000000000000000000000001",
    pairAddress: "0xbananapair00000000000000000000000000000001",
    symbol: "BANANA0",
    chain: "BSC",
    narrative: "早期趋势 Meme",
    price: "$0.00291",
    volume24h: "$2.1M",
    liquidity: "$690K",
    score: 78,
    verdict: "观望"
  },
  {
    address: "frogz111111111111111111111111111111111111111",
    pairAddress: "frogzpair11111111111111111111111111111111111",
    symbol: "FROGZ",
    chain: "Solana",
    narrative: "社交热度 Meme",
    price: "$0.000083",
    volume24h: "$8.6M",
    liquidity: "$140K",
    score: 43,
    verdict: "回避"
  },
  {
    address: "0xnova80000000000000000000000000000000000001",
    pairAddress: "0xnovapair0000000000000000000000000000000001",
    symbol: "NOVA8",
    chain: "BSC",
    narrative: "早期强度信号",
    price: "$0.0135",
    volume24h: "$1.7M",
    liquidity: "$1.2M",
    score: 81,
    verdict: "可做"
  },
  {
    address: "bonkq111111111111111111111111111111111111111",
    pairAddress: "bonkqpair11111111111111111111111111111111111",
    symbol: "BONKQ",
    chain: "Solana",
    narrative: "社交突破 Meme",
    price: "$0.000166",
    volume24h: "$6.2M",
    liquidity: "$930K",
    score: 88,
    verdict: "可做"
  },
  {
    address: "0xpearl0000000000000000000000000000000000001",
    pairAddress: "0xpearlpair000000000000000000000000000000001",
    symbol: "PEARL",
    chain: "BSC",
    narrative: "热度状态上升",
    price: "$0.00472",
    volume24h: "$980K",
    liquidity: "$210K",
    score: 61,
    verdict: "观望"
  },
  {
    address: "catfi111111111111111111111111111111111111111",
    pairAddress: "catfipair11111111111111111111111111111111111",
    symbol: "CATFI",
    chain: "Solana",
    narrative: "发射平台 Meme",
    price: "$0.000039",
    volume24h: "$3.4M",
    liquidity: "$92K",
    score: 39,
    verdict: "回避"
  }
];

export const dossierEvidence: EvidenceRow[] = [
  {
    label: "Token",
    value: "MOONX / Solana",
    interpretation: "当前价格 $0.000412，24h 变化 +28.4%，属于新币候选中的强势样本"
  },
  {
    label: "Signal Stack",
    value: "signals 3 / wallet support 3",
    interpretation: "公开信号和聪明钱包参与方向一致，说明不是单一噪声脉冲"
  },
  {
    label: "Pair Structure",
    value: "主交易对 TVL $820K",
    interpretation: "足够支撑试算，不属于极薄流动性，当前仍以主 pair 为主要成交来源"
  },
  {
    label: "Risk Report",
    value: "Risk LOW / Score 78",
    interpretation: "未见 honeypot，税率正常"
  },
  {
    label: "Top Holders",
    value: "Top 10 = 21.4%",
    interpretation: "集中度可接受"
  },
  {
    label: "Liquidity Flow",
    value: "最近 6h 以加池为主",
    interpretation: "未见明显撤池"
  },
  {
    label: "Trade Activity",
    value: "24小时兑换 12.4K",
    interpretation: "交易活跃，说明不是只有少量资金在拉高价格"
  },
  {
    label: "Smart Wallet",
    value: "3 个高质量钱包有参与",
    interpretation: "钱包历史胜率较强，具备背书"
  },
  {
    label: "Monitoring Bias",
    value: "偏多，但需控仓",
    interpretation: "可以进入试算池，但不建议把它当成无脑追高标的"
  }
];

export const walletSnapshot: EvidenceRow[] = [
  {
    label: "Smart Wallets",
    value: "12",
    interpretation: "筛到 12 个 Solana / BSC 观察钱包"
  },
  {
    label: "Active On Target",
    value: "3",
    interpretation: "3 个钱包已买入 MOONX"
  },
  {
    label: "Median Token PnL",
    value: "+41.8%",
    interpretation: "样本质量较高，不是噪声钱包"
  },
  {
    label: "Best Wallet",
    value: "9vWm...K2Qa",
    interpretation: "该钱包近 30 天在同类新币上的胜率较高，可作为重点观察样本"
  },
  {
    label: "Holdings Bias",
    value: "中等仓位试探",
    interpretation: "钱包并未重仓单压，说明更像观察性建仓，而不是高度确信"
  },
  {
    label: "Recent Wallet Action",
    value: "最近 2h 净买入",
    interpretation: "行为方向仍偏正面，暂未出现集中撤退"
  }
];

export const riskSnapshot: EvidenceRow[] = [
  {
    label: "Trigger",
    value: "FROGZ",
    interpretation: "热点高，但 pair 浅，Top 10 过度集中"
  },
  {
    label: "Risk Level",
    value: "HIGH",
    interpretation: "不建议追高，优先回避"
  },
  {
    label: "Top 10 Holders",
    value: "58.7%",
    interpretation: "头部持仓过于集中，单点抛压风险明显偏高"
  },
  {
    label: "Liquidity Flow",
    value: "近 4h 连续撤池",
    interpretation: "热度还在，但流动性结构已经在变差"
  },
  {
    label: "Trade Pattern",
    value: "放量上冲后快速回落",
    interpretation: "更像情绪驱动的短时脉冲，而不是稳态趋势"
  },
  {
    label: "Exit Plan",
    value: "如已持有，先做卖出试算",
    interpretation: "避免盲目市价砸盘"
  },
  {
    label: "Guard Verdict",
    value: "阻断执行",
    interpretation: "Risk Guard 当前给出的动作不是观望，而是直接阻断买入"
  }
];

export const opportunityFlow: EvidenceRow[] = [
  {
    label: "Signal",
    value: "MOONX -> 可试算",
    interpretation: "public signal + wallet support + risk pass"
  },
  {
    label: "Quote",
    value: "0.2 SOL -> estimated 480.2 MOONX",
    interpretation: "滑点处于可接受区间"
  },
  {
    label: "Execution Mode",
    value: "chain-wallet / proxy-wallet",
    interpretation: "支持链上钱包与托管钱包两种交易路径"
  },
  {
    label: "Position Watch",
    value: "买入后 15m / 1h / 4h 追踪",
    interpretation: "交易完成后继续进入持仓观察流程"
  }
];

export const tradePreviewMock: TradePreview = {
  priceUsd: 0.000412,
  liquidityUsd: 820000,
  priceChange1h: 8.4,
  priceChange24h: 28.4,
  txCount1h: 1920,
  txCount24h: 12400,
  route: "pumpfunamm / raydium",
  baseSymbol: "SOL",
  baseTokenAddress: "So11111111111111111111111111111111111111112",
  baseTokenDecimals: 9,
  baseTokenPriceUsd: 84.1,
  tokenDecimals: 6,
  signalTags: ["smart-money", "dev-buy", "volume-expansion"]
};

export const replayCases: EvidenceRow[] = [
  {
    label: "Case A",
    value: "机会发现",
    interpretation: "MOONX 从 Radar 进入试算，待后续验证结果"
  },
  {
    label: "Case B",
    value: "风险拦截",
    interpretation: "FROGZ 热度高但结构差，系统给出回避"
  },
  {
    label: "Replay Focus",
    value: "判断依据可回看",
    interpretation: "复盘页会把当时的 signals、risk、wallet 证据一起保留下来"
  }
];
