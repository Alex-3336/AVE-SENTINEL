import type { Candidate, DocSection, EvidenceRow, ModuleId, SummaryMetric } from "./data/mock";

export type Language = "zh" | "en";
export type Theme = "dark" | "light";

type Dict = Record<string, string>;

export const LANGUAGE_STORAGE_KEY = "ave-sentinel-lang";
export const THEME_STORAGE_KEY = "ave-sentinel-theme";

const dict: Record<Language, Dict> = {
  zh: {
    "lang.next": "EN",
    "theme.toggle.aria": "切换亮色 / 深色主题",
    "brand.subline": "Multi-chain intel · AVE data",
    "nav.workbench": "Workbench",
    "nav.workbench.caption": "选币",
    "nav.wallet.connect": "连接钱包",
    "nav.wallet.connected": "已连接",
    "nav.overview.title": "Overview",
    "nav.overview.summary": "",
    "nav.overview.tag": "Global",
    "nav.docs.summary": "产品功能、数据来源、风险判断和多入口使用指南。",
    "nav.docs.tag": "Product Guide",
    "nav.access.summary": "展示准入门槛、等级划分和不同用户权益。",
    "nav.access.tag": "Access Program",
    "summary.today": "今日候选标的",
    "summary.risk": "高风险拦截",
    "summary.actionable": "可试算目标",
    "summary.watch": "观望标的",
    "summary.loading": "正在加载",
    "summary.risk.note": "基于 risk / holders / liquidity",
    "summary.actionable.note": "满足流动性、成交量、动量和基础风险门槛",
    "summary.watch.note": "需要详情页继续确认",
    "workbench.noToken": "尚未选择候选标的",
    "workbench.emptyFocus": "请在左侧候选池选择一个代币以查看详情",
    "rail.title": "候选标的流",
    "filter.all": "全部",
    "filter.chain": "Chain",
    "filter.verdict": "Verdict",
    "filter.search": "搜索代币 / 叙事方向 / 链 / 合约地址",
    "stats.actionable": "可做",
    "stats.watch": "观望",
    "stats.avoid": "回避",
    "stats.avg": "均分",
    "empty.filtered": "当前筛选条件无候选标的",
    "empty.table": "当前没有可用的候选标的",
    "empty.data": "当前没有可用数据",
    "empty.summary": "当前没有可汇总的重点证据",
    "button.copy": "复制 CA",
    "button.copied": "已复制",
    "button.close": "关闭",
    "button.expand": "展开",
    "button.collapse": "收起",
    "button.openAve": "在 AVE 打开 ↗",
    "search.lookup": "查地址",
    "search.lookupTag": "地址查询",
    "search.lookupResolved": "这是按合约地址直接进入的单币分析结果，不计入 Radar 候选统计。",
    "search.multichainTitle": "选择要查看的链",
    "radar.title": "候选标的总表 — Radar Board",
    "radar.notes": "操作教程",
    "radar.guide": "Guide",
    "radar.nav.pool": "候选标的总表",
    "radar.nav.pool.summary": "当前 Radar 汇总 Solana、BSC、Base 与 Ethereum 的候选标的。",
    "radar.nav.source": "数据来源",
    "radar.nav.source.summary": "优先使用 AVE live 数据，接口不可用时切换到备用数据。",
    "radar.nav.verdict": "判断含义",
    "radar.nav.verdict.summary": "Score 与 Verdict 用于决定是否进入下一步分析与试算。",
    "radar.tutorial.read": "如何看懂这张表",
    "radar.tutorial.read.summary": "每一行是一个候选标的：Score 综合 8 维特征，Verdict 给出可做 / 观望 / 回避。",
    "radar.tutorial.filter": "筛选",
    "radar.tutorial.filter.summary": "顶部筛选条支持代币、链、判断结果、分数区间，组合使用可快速收敛视图。",
    "radar.tutorial.sort": "排序",
    "radar.tutorial.sort.summary": "默认按 Score 降序。可切换 Score / TVL / Volume / MCAP，并在升序 / 降序间切换。",
    "radar.tutorial.shortcut": "快捷操作",
    "radar.tutorial.shortcut.summary": "点击任意候选行即可进入该币的详情页面，当前筛选会保留到左侧候选流。",
    "radar.tutorial.data": "数据状态",
    "radar.tutorial.data.summary": "优先读取 AVE 实时数据；接口不可用时切换到备用数据，右上角会显示当前状态。",
    "radar.filter.search": "搜索代币 / 叙事方向 / 链 / 合约地址",
    "radar.filter.score": "Score 区间",
    "radar.filter.sort": "排序",
    "radar.sort.score": "Score",
    "radar.sort.tvl": "TVL",
    "radar.sort.volume": "Volume",
    "radar.sort.mcap": "MCAP",
    "radar.sort.desc": "降序",
    "radar.sort.asc": "升序",
    "radar.filter.reset": "重置",
    "table.symbol": "Symbol",
    "table.chain": "Chain",
    "table.narrative": "叙事方向",
    "table.price": "价格",
    "table.volume24h": "24H 成交量",
    "table.liquidity": "流动性",
    "table.score": "评分",
    "table.verdict": "结论",
    "metric.marketCap": "MCAP",
    "metric.fdv": "FDV",
    "metric.volume24hShort": "24H 成交量",
    "metric.tx24h": "24小时成交数",
    "metric.score": "评分",
    "table.signal": "指标",
    "table.value": "数值",
    "table.interpretation": "解读",
    "table.indicator": "指标",
    "table.module": "模块",
    "table.positioning": "定位",
    "table.description": "说明",
    "overview.brand": "产品定位",
    "overview.built": "Built on AVE",
    "overview.kicker": "AVE SENTINEL · MULTI-CHAIN WORKBENCH",
    "overview.platform": "一个多链智能情报与交易平台",
    "overview.statement": "多链新币的发现、风控与交易一站式工作台。",
    "overview.description": "覆盖 Solana、BSC、Base、Ethereum 四条主链。把候选池筛选、合约地址直查、单币证据、风险拦截、官方 Quote 试算与未签名交易预构建串成一条流水线，一个地址看完，一个地址查完。",
    "overview.workflow": "Workflow — 从地址进入到执行准备",
    "overview.complete": "完整工作流",
    "overview.monitoring": "研究模块",
    "overview.monitoring.tag": "Score · Evidence · Risk",
    "overview.trading": "交易模块",
    "overview.trading.tag": "Quote · Prep · Execute",
    "overview.entry": "Multi-Entry Access",
    "overview.focus": "当前判断摘要",
    "dossier.projectProfile": "项目资料",
    "dossier.marketSnapshot": "行情快照",
    "dossier.pairStructure": "交易对结构",
    "dossier.marketPressure": "买卖压力",
    "dossier.dexLiquidity": "DEX 流动性",
    "dossier.liquidityEvents": "流动性事件",
    "dossier.aiRisk": "AVE AI 风险",
    "dossier.holderRisk": "持仓与 LP 风险",
    "dossier.smartSignal": "聪明钱信号",
    "dossier.aveTokenData": "AVE 代币数据",
    "dossier.primaryPool": "主交易池",
    "dossier.buySellFlow": "买卖流向",
    "dossier.topPairs": "前 5 个交易对",
    "dossier.recentLiquidity": "近期加池 / 撤池",
    "dossier.holderConcentration": "持仓集中度",
    "dossier.project": "项目",
    "dossier.narrative": "叙事方向",
    "dossier.issuePlatform": "发行平台",
    "dossier.launch": "上线时间",
    "dossier.holders": "持币地址数",
    "dossier.mainPair": "主交易对",
    "dossier.lpLock": "LP 锁仓",
    "dossier.lpLockPlatform": "锁仓平台",
    "dossier.sniperCount": "抢跑笔数",
    "dossier.atl": "ATL",
    "dossier.period": "周期",
    "dossier.buyTx": "买入笔数",
    "dossier.sellTx": "卖出笔数",
    "dossier.buyVol": "买入量",
    "dossier.sellVol": "卖出量",
    "dossier.buyers": "买方地址",
    "dossier.sellers": "卖方地址",
    "dossier.makers": "做市地址",
    "dossier.pressure": "买压",
    "dossier.type": "类型",
    "dossier.amount": "金额",
    "dossier.time": "时间",
    "dossier.wallet": "钱包",
    "dossier.tx": "交易",
    "dossier.ownerRelated": "是否关联 Owner",
    "dossier.topHolders": "前排持币地址",
    "dossier.pairHolders": "交易对持仓地址",
    "dossier.address": "地址",
    "dossier.mark": "标签",
    "dossier.percent": "占比",
    "dossier.quantity": "数量",
    "dossier.tx24h": "24小时成交数",
    "dossier.signalTag": "信号标签",
    "dossier.actionType": "动作类型",
    "dossier.actionCount": "动作次数",
    "dossier.firstSignalPrice": "首次信号价格",
    "dossier.currentMcap": "当前 MCAP",
    "dossier.maxPriceChange": "最大涨幅",
    "dossier.leadWallet": "领头钱包",
    "dossier.leadVolume": "领头成交量",
    "dossier.name": "名称",
    "dossier.riskLevel": "风险等级",
    "opportunity.title": "交易面板",
    "opportunity.copy": "交易面板把策略信号、仓位输入、Dry Run 和持仓观察放在同一条流程里。",
    "opportunity.trade.copy": "选择手动签名或托管执行。",
    "opportunity.trade.mode.note": "同一套候选判断，分成手动签名与托管执行两种路径。",
    "opportunity.mode.chainWallet": "链上钱包",
    "opportunity.mode.delegateWallet": "托管钱包",
    "opportunity.signal": "策略信号",
    "opportunity.signal.note": "信号来自候选排序、风险门与钱包背书的合并判断。",
    "opportunity.momentum.note": "短时与日内动量共同决定是否进入试算。",
    "opportunity.tags.note": "标签来自主交易对动态信号和当前路由特征。",
    "opportunity.executionState": "Execution State",
    "opportunity.execution.note": "风险门通过前，交易模块只允许停留在 Dry Run。",
    "opportunity.signalTags": "信号标签",
    "opportunity.state.dryRunOnly": "仅试算，不执行",
    "opportunity.state.allowDryRun": "允许试算",
    "opportunity.quote": "Quote / Dry Run",
    "opportunity.quoteSource": "Quote 来源",
    "opportunity.budget": "数量",
    "opportunity.estimatedReceive": "预估收到",
    "opportunity.spendAsset": "支付资产",
    "opportunity.slippage": "预估滑点",
    "opportunity.spender": "授权地址",
    "opportunity.autoSlippage": "自动滑点",
    "opportunity.gasTip": "Gas 档位",
    "opportunity.positionWatch": "Position Watch",
    "opportunity.window": "Window",
    "opportunity.check": "Check",
    "opportunity.action": "Action",
    "opportunity.watch.15m.check": "观察买卖笔数是否继续扩张，确认不是瞬时脉冲。",
    "opportunity.watch.15m.keep": "延续则继续观察",
    "opportunity.watch.15m.drop": "不延续则退出关注",
    "opportunity.watch.1h.check": "检查 1h 动量、主要路由成交量和风险门状态。",
    "opportunity.watch.1h.actionable": "观察 15m / 1h 动量是否延续",
    "opportunity.watch.1h.watch": "继续等待量价确认",
    "opportunity.watch.1h.avoid": "仅保留风险观察",
    "opportunity.watch.4h.check": "复核结构是否恶化，重点看流动性、集中度和钱包撤退迹象。",
    "opportunity.watch.4h.keepRisk": "保留风险案例",
    "opportunity.watch.4h.replay": "决定是否进入 Replay",
    "opportunity.execPrep": "Execution Prep",
    "opportunity.creatorWallet": "Creator Wallet",
    "opportunity.solPlaceholder": "输入 Solana 地址",
    "opportunity.mode": "模式",
    "opportunity.unsignedBuild": "未签名预构建",
    "opportunity.chainBuild": "链上构建",
    "opportunity.buildUnsigned": "BUILD UNSIGNED TX",
    "opportunity.building": "BUILDING...",
    "opportunity.prepSource": "Prep Source",
    "opportunity.requestTxId": "请求 ID",
    "opportunity.minReturn": "Min Return",
    "opportunity.txTarget": "Tx Target",
    "opportunity.gasFee": "Gas / Fee",
    "opportunity.route": "路由",
    "opportunity.txCount1h": "1h Tx Count",
    "opportunity.txCount24h": "24小时成交数",
    "opportunity.evmApproveNote": "EVM 卖出前仍需要 approve-chain，这一步暂未执行。",
    "opportunity.detail": "交易详情",
    "opportunity.side.buy": "买入",
    "opportunity.side.sell": "卖出",
    "opportunity.manual.title": "手动交易",
    "opportunity.manual.wallet.connect": "连接钱包",
    "opportunity.manual.wallet.ready": "钱包已连接",
    "opportunity.manual.wallet.connected": "钱包已连接。",
    "opportunity.manual.wallet": "当前钱包",
    "opportunity.manual.wallet.balance": "可用资产",
    "opportunity.manual.wallet.balance.loading": "正在读取",
    "opportunity.manual.poolPreview": "流动性池",
    "opportunity.manual.poolQualityLabel": "流动性池质量",
    "opportunity.manual.poolLiquidityLabel": "池子大小",
    "opportunity.manual.poolSource.official": "官方预构建",
    "opportunity.manual.poolSource.route": "主路由预估",
    "opportunity.manual.poolLoading": "正在补全官方池子",
    "opportunity.manual.poolQuality.strong": "优质",
    "opportunity.manual.poolQuality.watch": "可用",
    "opportunity.manual.poolQuality.weak": "偏弱",
    "opportunity.manual.poolQuality.unknown": "待确认",
    "opportunity.manual.amount.buy": "数量",
    "opportunity.manual.amount.sell": "卖出数量",
    "opportunity.manual.execute": "签名并发送",
    "opportunity.manual.submitting": "正在发送...",
    "opportunity.manual.approval": "授权状态",
    "opportunity.manual.approval.pending": "正在提交授权交易。",
    "opportunity.manual.approval.required": "需要授权",
    "opportunity.manual.approval.skip": "无需授权",
    "opportunity.manual.txHash": "交易哈希",
    "opportunity.manual.state.connecting": "正在连接钱包。",
    "opportunity.delegate.title": "策略执行",
    "opportunity.delegate.wallet": "托管钱包",
    "opportunity.delegate.wallet.select": "选择托管钱包",
    "opportunity.delegate.wallet.new": "新钱包名称",
    "opportunity.delegate.wallet.create": "创建 Wallet",
    "opportunity.delegate.order.market": "市价单",
    "opportunity.delegate.order.limit": "限价单",
    "opportunity.delegate.limitPrice": "限价",
    "opportunity.delegate.chainAddress": "链上地址",
    "opportunity.delegate.approval": "授权单 ID",
    "opportunity.delegate.orderId": "订单 ID",
    "opportunity.delegate.status": "订单状态",
    "opportunity.delegate.txHash": "成交哈希",
    "opportunity.delegate.output": "输出数量",
    "opportunity.delegate.submitting": "正在提交...",
    "opportunity.delegate.execute": "提交策略订单",
    "opportunity.delegate.refresh": "刷新状态",
    "risk.title": "风险拦截",
    "risk.description": "风险判断输出动作层结论：允许试算 / 保留观察 / 阻断执行",
    "replay.title": "复盘",
    "replay.description": "记录判断依据、交易动作和后续结果",
    "replay.purpose": "复盘记录这枚币从判断到交易动作的完整结果，便于回看当时的依据和最终结果。",
    "replay.focusToken": "当前标的",
    "replay.recordCount": "记录数量",
    "replay.latestState": "最新状态",
    "replay.timeline": "复盘时间线",
    "replay.timeline.note": "判断 / 交易 / 结果",
    "docs.eyebrow": "AVE Sentinel Docs",
    "docs.title": "产品指南",
    "docs.note": "功能指南 · 点击跳转",
    "docs.heroTitle": "AVE Sentinel 产品指南",
    "docs.heroLead": "了解 AVE Sentinel 的功能范围、使用流程、数据来源、风险判断方式，以及 Web、Telegram、CLI 三个入口之间的关系。",
    "docs.badgeBuilt": "基于 AVE Data / Signals / Trade",
    "footer.docs": "AVE Sentinel · Documentation",
    "access.eyebrow": "AVE Sentinel Access",
    "access.title": "用户体系",
    "access.note": "等级规则 · 点击跳转",
    "access.heroTitle": "AVE Sentinel 用户体系介绍",
    "access.heroLead": "未来版本可采用准入门槛与等级制度。优先开放给 AVE 社群成员、大使和高交易量用户，并按 AVE 累计交易量提升等级、额度和新功能优先权。",
    "access.badge.preview": "优先开放机制",
    "access.badge.volume": "AVE Volume Tiers",
    "access.badge.priority": "新功能优先使用",
    "footer.access": "AVE Sentinel · Access Program"
  },
  en: {
    "lang.next": "中",
    "theme.toggle.aria": "Toggle light / dark theme",
    "brand.subline": "Multi-chain intel · AVE data",
    "nav.workbench": "Workbench",
    "nav.workbench.caption": "Token Workbench",
    "nav.wallet.connect": "Connect Wallet",
    "nav.wallet.connected": "Connected",
    "nav.overview.title": "Overview",
    "nav.overview.summary": "",
    "nav.overview.tag": "Global",
    "nav.docs.summary": "Product functions, data sources, risk logic, and multi-entry usage guide.",
    "nav.docs.tag": "Product Guide",
    "nav.access.summary": "Access requirements, tier rules, and user benefits.",
    "nav.access.tag": "Access Program",
    "summary.today": "Candidate Tokens",
    "summary.risk": "Risk Blocks",
    "summary.actionable": "Actionable",
    "summary.watch": "Watch Tokens",
    "summary.loading": "Loading",
    "summary.risk.note": "Based on risk / holders / liquidity",
    "summary.actionable.note": "Passed liquidity, volume, momentum, and base risk gates",
    "summary.watch.note": "Needs deeper confirmation in the dossier",
    "workbench.noToken": "No candidate token selected",
    "workbench.emptyFocus": "Select a token from the candidate stream to inspect details",
    "rail.title": "Candidate Tokens",
    "filter.all": "All",
    "filter.chain": "Chain",
    "filter.verdict": "Verdict",
    "filter.search": "Search token / narrative / chain / contract address",
    "stats.actionable": "Actionable",
    "stats.watch": "Watch",
    "stats.avoid": "Avoid",
    "stats.avg": "Avg",
    "empty.filtered": "No candidate tokens match the current filters",
    "empty.table": "No candidate tokens to display",
    "empty.data": "No data to display",
    "empty.summary": "No focus evidence available",
    "button.copy": "Copy CA",
    "button.copied": "Copied",
    "button.close": "Close",
    "button.expand": "Expand",
    "button.collapse": "Collapse",
    "button.openAve": "Open in AVE ↗",
    "search.lookup": "Lookup",
    "search.lookupTag": "Address lookup",
    "search.lookupResolved": "This token was opened directly from a contract-address lookup. It does not enter Radar statistics.",
    "search.multichainTitle": "Choose the chain to inspect",
    "radar.title": "Candidate Token Board — Radar Board",
    "radar.notes": "How to use Radar",
    "radar.guide": "Guide",
    "radar.nav.pool": "Candidate Tokens",
    "radar.nav.pool.summary": "Radar currently covers candidate tokens from Solana, BSC, Base, and Ethereum.",
    "radar.nav.source": "Data Source",
    "radar.nav.source.summary": "AVE live data first, with backup data when live data is unavailable.",
    "radar.nav.verdict": "Verdict Meaning",
    "radar.nav.verdict.summary": "Score and verdict decide whether a token moves into deeper analysis or dry run.",
    "radar.tutorial.read": "Reading the table",
    "radar.tutorial.read.summary": "Each row is one candidate token: Score aggregates 8 factors, Verdict maps to Actionable / Watch / Avoid.",
    "radar.tutorial.filter": "Filters",
    "radar.tutorial.filter.summary": "The top bar combines symbol / chain / verdict / score range — stack them to narrow the view fast.",
    "radar.tutorial.sort": "Sort",
    "radar.tutorial.sort.summary": "Default sort is Score descending. Swap between Score / TVL / Volume / MCAP and toggle asc / desc.",
    "radar.tutorial.shortcut": "Shortcuts",
    "radar.tutorial.shortcut.summary": "Click any candidate row to open that token's detail page; current filters carry into the side candidate stream.",
    "radar.tutorial.data": "Data status",
    "radar.tutorial.data.summary": "Radar prefers AVE live data and switches to backup data when needed; the status badge shows the current source.",
    "radar.filter.search": "Search token / narrative / chain / contract address",
    "radar.filter.score": "Score range",
    "radar.filter.sort": "Sort",
    "radar.sort.score": "Score",
    "radar.sort.tvl": "TVL",
    "radar.sort.volume": "Volume",
    "radar.sort.mcap": "MCAP",
    "radar.sort.desc": "Desc",
    "radar.sort.asc": "Asc",
    "radar.filter.reset": "Reset",
    "table.symbol": "Symbol",
    "table.chain": "Chain",
    "table.narrative": "Narrative Direction",
    "table.price": "Price",
    "table.volume24h": "24h Volume",
    "table.liquidity": "Liquidity",
    "table.score": "Score",
    "table.verdict": "Verdict",
    "table.signal": "Signal",
    "table.value": "Value",
    "table.interpretation": "Interpretation",
    "table.indicator": "Indicator",
    "table.module": "Module",
    "table.positioning": "Role",
    "table.description": "Description",
    "overview.brand": "Product",
    "overview.built": "Built on AVE",
    "overview.kicker": "AVE SENTINEL · MULTI-CHAIN WORKBENCH",
    "overview.platform": "A multi-chain intelligence and trading platform",
    "overview.statement": "A one-stop workbench for multi-chain new-token discovery, risk gating, and trading.",
    "overview.description": "Covers Solana, BSC, Base, and Ethereum. Candidate screening, direct contract-address lookup, single-token evidence, risk checks, AVE official quotes, and unsigned transaction prep all live on the same address-first pipeline — one address in, every answer out.",
    "overview.workflow": "Workflow — From Address to Execution Readiness",
    "overview.complete": "Complete Workflow",
    "overview.monitoring": "Research Modules",
    "overview.monitoring.tag": "Score · Evidence · Risk",
    "overview.trading": "Trading Modules",
    "overview.trading.tag": "Quote · Prep · Execute",
    "overview.entry": "Multi-Entry Access",
    "overview.focus": "Current Verdict Summary",
    "dossier.projectProfile": "Project Profile",
    "dossier.marketSnapshot": "Market Snapshot",
    "dossier.pairStructure": "Pair Structure",
    "dossier.marketPressure": "Market Pressure",
    "dossier.dexLiquidity": "DEX Liquidity",
    "dossier.liquidityEvents": "Liquidity Events",
    "dossier.aiRisk": "AVE AI Risk",
    "dossier.holderRisk": "Holder & LP Risk",
    "dossier.smartSignal": "Smart Money Signal",
    "dossier.aveTokenData": "AVE token data",
    "dossier.primaryPool": "Primary pool",
    "dossier.buySellFlow": "Buy / sell flow",
    "dossier.topPairs": "Top 5 pairs",
    "dossier.recentLiquidity": "Recent add / remove",
    "dossier.holderConcentration": "Holder concentration",
    "dossier.project": "Project",
    "dossier.narrative": "Narrative Direction",
    "dossier.issuePlatform": "Issue Platform",
    "dossier.launch": "Launch",
    "dossier.holders": "Holders",
    "dossier.mainPair": "Main Pair",
    "dossier.lpLock": "LP Lock",
    "dossier.lpLockPlatform": "LP Lock Platform",
    "dossier.sniperCount": "Sniper Count",
    "dossier.atl": "ATL",
    "dossier.period": "Period",
    "dossier.buyTx": "Buy Tx",
    "dossier.sellTx": "Sell Tx",
    "dossier.buyVol": "Buy Vol",
    "dossier.sellVol": "Sell Vol",
    "dossier.buyers": "Buyers",
    "dossier.sellers": "Sellers",
    "dossier.makers": "Makers",
    "dossier.pressure": "Pressure",
    "dossier.type": "Type",
    "dossier.amount": "Amount",
    "dossier.time": "Time",
    "dossier.wallet": "Wallet",
    "dossier.tx": "Tx",
    "dossier.ownerRelated": "Owner related",
    "dossier.topHolders": "Top Holders",
    "dossier.pairHolders": "Pair Holders",
    "dossier.address": "Address",
    "dossier.mark": "Mark",
    "dossier.percent": "Percent",
    "dossier.quantity": "Quantity",
    "opportunity.title": "Opportunity Desk",
    "opportunity.copy": "The trading panel keeps strategy signal, position input, dry run, execution preparation, and position watch in one flow.",
    "opportunity.trade.copy": "Trading now exposes both Chain Wallet manual execution and Delegate Wallet strategy execution: one is user-signed, the other is organization-managed.",
    "opportunity.trade.mode.note": "The same candidate verdict fans out into manual signing and delegated execution.",
    "opportunity.mode.chainWallet": "Chain Wallet",
    "opportunity.mode.delegateWallet": "Delegate Wallet",
    "opportunity.signal": "Strategy Signal",
    "opportunity.signal.note": "Signal combines candidate ranking, risk gate, and wallet support.",
    "opportunity.momentum.note": "Short-term and daily momentum decide whether this enters dry run.",
    "opportunity.tags.note": "Tags come from main-pair dynamic signals and route features.",
    "opportunity.executionState": "Execution State",
    "opportunity.execution.note": "Before the risk gate passes, the trading module stays in Dry Run only.",
    "opportunity.signalTags": "Signal Tags",
    "opportunity.state.dryRunOnly": "Dry run only",
    "opportunity.state.allowDryRun": "Allow dry run",
    "opportunity.quote": "Quote / Dry Run",
    "opportunity.quoteSource": "Quote Source",
    "opportunity.budget": "Amount",
    "opportunity.estimatedReceive": "Estimated Receive",
    "opportunity.spendAsset": "Spend Asset",
    "opportunity.slippage": "Estimated Slippage",
    "opportunity.spender": "Approval Spender",
    "opportunity.autoSlippage": "Auto Slippage",
    "opportunity.gasTip": "Gas Tip",
    "opportunity.positionWatch": "Position Watch",
    "opportunity.window": "Window",
    "opportunity.check": "Check",
    "opportunity.action": "Action",
    "opportunity.watch.15m.check": "Check whether buy/sell counts continue expanding and confirm this is not a short pulse.",
    "opportunity.watch.15m.keep": "Continue watching if momentum holds",
    "opportunity.watch.15m.drop": "Drop if momentum fades",
    "opportunity.watch.1h.check": "Check 1h momentum, main route volume, and risk gate status.",
    "opportunity.watch.1h.actionable": "Watch whether 15m / 1h momentum continues",
    "opportunity.watch.1h.watch": "Wait for volume and price confirmation",
    "opportunity.watch.1h.avoid": "Keep as risk-only observation",
    "opportunity.watch.4h.check": "Recheck whether structure worsens, especially liquidity, concentration, and wallet exits.",
    "opportunity.watch.4h.keepRisk": "Keep as risk case",
    "opportunity.watch.4h.replay": "Decide whether to move into Replay",
    "opportunity.execPrep": "Execution Prep",
    "opportunity.creatorWallet": "Creator Wallet",
    "opportunity.solPlaceholder": "Enter Solana address",
    "opportunity.mode": "Mode",
    "opportunity.unsignedBuild": "Unsigned Build",
    "opportunity.chainBuild": "chain build",
    "opportunity.buildUnsigned": "BUILD UNSIGNED TX",
    "opportunity.building": "BUILDING...",
    "opportunity.prepSource": "Prep Source",
    "opportunity.requestTxId": "Request Tx ID",
    "opportunity.minReturn": "Min Return",
    "opportunity.txTarget": "Tx Target",
    "opportunity.gasFee": "Gas / Fee",
    "opportunity.route": "Route",
    "opportunity.txCount1h": "1h Tx Count",
    "opportunity.txCount24h": "24h Tx Count",
    "opportunity.evmApproveNote": "EVM sell flow still requires approve-chain; this step is not executed here.",
    "opportunity.detail": "Opportunity Detail",
    "opportunity.side.buy": "Buy",
    "opportunity.side.sell": "Sell",
    "opportunity.manual.title": "Manual Trade",
    "opportunity.manual.wallet.connect": "Connect Wallet",
    "opportunity.manual.wallet.ready": "Wallet Ready",
    "opportunity.manual.wallet.connected": "Wallet connected.",
    "opportunity.manual.wallet": "Connected Wallet",
    "opportunity.manual.wallet.balance": "Available Balance",
    "opportunity.manual.wallet.balance.loading": "Loading",
    "opportunity.manual.poolPreview": "Liquidity Pool",
    "opportunity.manual.poolQualityLabel": "Pool Quality",
    "opportunity.manual.poolLiquidityLabel": "Pool Size",
    "opportunity.manual.poolSource.official": "Official Build",
    "opportunity.manual.poolSource.route": "Route Estimate",
    "opportunity.manual.poolLoading": "Loading official pools",
    "opportunity.manual.poolQuality.strong": "Strong",
    "opportunity.manual.poolQuality.watch": "Tradable",
    "opportunity.manual.poolQuality.weak": "Weak",
    "opportunity.manual.poolQuality.unknown": "Pending",
    "opportunity.manual.amount.buy": "Amount",
    "opportunity.manual.amount.sell": "Sell Amount",
    "opportunity.manual.execute": "Sign and Send",
    "opportunity.manual.submitting": "Submitting...",
    "opportunity.manual.approval": "Approval",
    "opportunity.manual.approval.pending": "Submitting approval transaction.",
    "opportunity.manual.approval.required": "Approval required",
    "opportunity.manual.approval.skip": "No approval",
    "opportunity.manual.txHash": "Tx Hash",
    "opportunity.manual.state.connecting": "Connecting wallet.",
    "opportunity.delegate.title": "Strategy Trade",
    "opportunity.delegate.wallet": "Delegate Wallet",
    "opportunity.delegate.wallet.select": "Select Delegate Wallet",
    "opportunity.delegate.wallet.new": "New Wallet Name",
    "opportunity.delegate.wallet.create": "Create Wallet",
    "opportunity.delegate.order.market": "Market",
    "opportunity.delegate.order.limit": "Limit",
    "opportunity.delegate.limitPrice": "Limit Price",
    "opportunity.delegate.chainAddress": "Chain Address",
    "opportunity.delegate.approval": "Approval Order ID",
    "opportunity.delegate.orderId": "Order ID",
    "opportunity.delegate.status": "Order Status",
    "opportunity.delegate.txHash": "Fill Hash",
    "opportunity.delegate.output": "Output Amount",
    "opportunity.delegate.submitting": "Submitting...",
    "opportunity.delegate.execute": "Submit Strategy Order",
    "opportunity.delegate.refresh": "Refresh Status",
    "risk.title": "Risk Guard",
    "risk.description": "Risk output as action: allow dry run / keep watching / block execution",
    "replay.title": "Replay",
    "replay.description": "Evidence and outcomes for a replayable decision record",
    "replay.purpose": "Replay keeps the token verdict, trade actions, and final outcome together so the decision can be reviewed later.",
    "replay.focusToken": "Focus Token",
    "replay.recordCount": "Record Count",
    "replay.latestState": "Latest State",
    "replay.timeline": "Replay Timeline",
    "replay.timeline.note": "Verdict / trade / outcome",
    "docs.eyebrow": "AVE Sentinel Docs",
    "docs.title": "Product Guide",
    "docs.note": "Web guide · click to jump",
    "docs.heroTitle": "AVE Sentinel Product Guide",
    "docs.heroLead": "Learn how Sentinel works, where its data comes from, how risk is judged, and how Web, Telegram, and CLI map onto the same product.",
    "docs.badgeBuilt": "Built on AVE Data / Signals / Trade",
    "footer.docs": "AVE Sentinel · Documentation",
    "access.eyebrow": "AVE Sentinel Access",
    "access.title": "Access",
    "access.note": "Tier rules · click to jump",
    "access.heroTitle": "AVE Sentinel Access Program",
    "access.heroLead": "Future releases can use an access gate plus user tiers. Early rollout can prioritize AVE community members, ambassadors, and high-volume users, with higher AVE trading volume unlocking higher tiers, larger quotas, and earlier access to new features.",
    "access.badge.preview": "Preview Policy",
    "access.badge.volume": "AVE Volume Tiers",
    "access.badge.priority": "Priority Feature Access",
    "footer.access": "AVE Sentinel · Access Program"
  }
};

export function normalizeLanguage(value: unknown): Language {
  return value === "en" ? "en" : "zh";
}

export function normalizeTheme(value: unknown): Theme {
  return value === "light" ? "light" : "dark";
}

export function t(lang: Language, key: string): string {
  return dict[lang][key] ?? dict.zh[key] ?? key;
}

export function tv(lang: Language, verdict: Candidate["verdict"]): string {
  if (lang === "zh") return verdict;
  if (verdict === "可做") return "Actionable";
  if (verdict === "回避") return "Avoid";
  return "Watch";
}

export function formatNarrative(lang: Language, narrative: string): string {
  const normalized = narrative.trim().toLowerCase();
  const names: Record<string, { zh: string; en: string }> = {
    "launchpad / meme": { zh: "发射平台 Meme", en: "Launchpad Meme" },
    "early trend / meme": { zh: "早期趋势 Meme", en: "Early Trend Meme" },
    "hot meme / social burst": { zh: "社交热度 Meme", en: "Social Heat Meme" },
    "social breakout / meme": { zh: "社交突破 Meme", en: "Social Breakout Meme" },
    "momentum / meme": { zh: "动量增强 Meme", en: "Momentum Meme" },
    "early strength": { zh: "早期强度信号", en: "Early Strength Signal" },
    "hot candidate": { zh: "热度状态上升", en: "Rising Heat Status" },
    "发射平台 meme": { zh: "发射平台 Meme", en: "Launchpad Meme" },
    "早期趋势 meme": { zh: "早期趋势 Meme", en: "Early Trend Meme" },
    "社交热度 meme": { zh: "社交热度 Meme", en: "Social Heat Meme" },
    "社交突破 meme": { zh: "社交突破 Meme", en: "Social Breakout Meme" },
    "动量增强 meme": { zh: "动量增强 Meme", en: "Momentum Meme" },
    "早期强度信号": { zh: "早期强度信号", en: "Early Strength Signal" },
    "热度状态上升": { zh: "热度状态上升", en: "Rising Heat Status" }
  };
  const match = names[normalized];
  return match ? match[lang] : narrative;
}

export function formatLiquidityAction(lang: Language, action: string): string {
  const normalized = action.trim().replace(/[\s_-]+/g, "").toLowerCase();
  const names: Record<string, { zh: string; en: string }> = {
    addliquidity: { zh: "添加流动性", en: "Add Liquidity" },
    addlp: { zh: "添加流动性", en: "Add Liquidity" },
    mint: { zh: "添加流动性", en: "Add Liquidity" },
    removeliquidity: { zh: "移除流动性", en: "Remove Liquidity" },
    removelp: { zh: "移除流动性", en: "Remove Liquidity" },
    burn: { zh: "移除流动性", en: "Remove Liquidity" },
    swap: { zh: "兑换", en: "Swap" },
    deposit: { zh: "存入", en: "Deposit" },
    withdraw: { zh: "提取", en: "Withdraw" },
    stake: { zh: "质押", en: "Stake" },
    unstake: { zh: "解除质押", en: "Unstake" },
    transfer: { zh: "转账", en: "Transfer" }
  };
  const match = names[normalized];
  if (match) return match[lang];
  return action || "--";
}

function formatLiquidityEventValue(lang: Language, value: string): string {
  const [action, ...rest] = value.split("/").map((part) => part.trim());
  if (!action || action === "--" || rest.length === 0) return value;
  return [formatLiquidityAction(lang, action), ...rest].join(" / ");
}

export function formatAiRiskSummaryLabel(lang: Language, label: string): string {
  const names: Record<string, { zh: string; en: string }> = {
    "Risk Level": { zh: "风险等级", en: "Risk Level" },
    "Owner Renounced": { zh: "Owner 是否放弃", en: "Owner Renounced" },
    Blacklist: { zh: "黑名单风险", en: "Blacklist" },
    "External Dependency": { zh: "外部依赖", en: "External Dependency" }
  };
  return names[label]?.[lang] ?? label;
}

export function formatAiRiskSummaryValue(lang: Language, label: string, value: string): string {
  const normalized = value.trim().toLowerCase();
  if (value === "--") return value;

  if (label === "Risk Level") {
    if (normalized === "2" || normalized === "high") return lang === "zh" ? "高" : "High";
    if (normalized === "1" || normalized === "medium") return lang === "zh" ? "中" : "Medium";
    if (normalized === "0" || normalized === "low") return lang === "zh" ? "低" : "Low";
    return value;
  }

  if (["true", "yes"].includes(normalized)) return lang === "zh" ? "是" : "Yes";
  if (["false", "no"].includes(normalized)) return lang === "zh" ? "否" : "No";
  if (normalized === "1") return lang === "zh" ? "是" : "Yes";
  if (normalized === "0") return lang === "zh" ? "否" : "No";
  return value;
}

export function translateStatus(lang: Language, label: string): string {
  if (lang === "zh") return label;
  if (label === "READY") return "READY";
  if (label === "LOADING") return "LOADING";
  return label;
}

export function translateValue(lang: Language, value: string): string {
  if (lang === "zh") return value;
  const replacements = [
    ["可做", "Actionable"],
    ["观望", "Watch"],
    ["回避", "Avoid"],
    ["买入", "Buy"],
    ["卖出", "Sell"],
    ["阻断执行", "Block execution"],
    ["仅试算，不执行", "Dry run only"],
    ["允许试算", "Allow dry run"],
    ["保留观察", "Keep watching"],
    ["暂无近期事件", "No recent events"],
    ["24小时兑换", "24h swaps"],
    ["流动性偏薄", "Thin liquidity"],
    ["流动性可承接", "Sufficient liquidity"],
    ["权限偏敏感", "Sensitive permissions"],
    ["权限相对稳定", "Relatively stable permissions"],
    ["背书偏强", "Strong support"],
    ["背书中等", "Moderate support"],
    ["高质量", "High quality"],
    ["中等质量", "Medium quality"],
    ["待观察", "Watch"],
    ["继续跟踪", "Keep tracking"]
  ] as const;

  return replacements.reduce(
    (text, [from, to]) => text.split(from).join(to),
    value
  );
}

export function translateNote(lang: Language, note?: string): string | undefined {
  if (!note || lang === "zh") return note;
  if (note.includes("已连接 AVE API")) return "Connected to AVE live data. Missing fields are shown as --.";
  if (note.includes("请求失败") || note.includes("回退")) return "AVE request failed. Showing fallback data where needed.";
  if (note.includes("未配置")) return "AVE API key is not configured. Local or derived data is shown.";
  if (note.includes("输入预算") || note.includes("输入数量")) return "Enter an amount to request an official quote.";
  if (note.includes("Dry Run 已切换")) return "Dry Run is using the official AVE quote.";
  if (note.includes("已生成官方未签名交易")) return "Official unsigned transaction build is ready for external signing.";
  if (note.includes("正在")) return "Loading AVE data.";
  return translateValue(lang, note);
}

const evidenceLabels: Record<string, string> = {
  Token: "Token",
  "Signal Stack": "Signal Stack",
  "Pair Structure": "Pair Structure",
  "Volume 24h": "24h Volume",
  "Market Cap": "Market Cap",
  "Liquidity Bias": "Liquidity Bias",
  Address: "Address",
  "Risk Level": "Risk Level",
  "Taxes / Honeypot": "Taxes / Honeypot",
  "Top 10 Holders": "Top 10 Holders",
  "Liquidity Events": "Liquidity Events",
  "Contract Posture": "Contract Posture",
  "Guard Action": "Guard Action",
  Decision: "Decision",
  "Signal Wallet": "Signal Wallet",
  "Signal Action": "Signal Action",
  "Wallet Win Rate": "Wallet Win Rate",
  "Token PnL": "Token PnL",
  "Latest Wallet Action": "Latest Wallet Action",
  "Backing Strength": "Backing Strength",
  "Smart Wallet Pool": "Smart Wallet Pool",
  "Top Wallet": "Top Wallet",
  "Wallet Quality": "Wallet Quality",
  Conviction: "Conviction",
  "Monitoring Use": "Monitoring Use",
  Signal: "Signal",
  "Signal Tags": "Signal Tags",
  "Risk Gate": "Risk Gate",
  "Execution Readiness": "Execution Readiness",
  "Position Watch": "Position Watch",
  "Dry Run Basis": "Dry Run Basis"
};

const evidenceInterpretations: Record<string, string> = {
  Token: "Current token price, chain, and short-term move.",
  "Signal Stack": "Combines price movement and trading activity to check whether the signal has real flow.",
  "Pair Structure": "Main pair and liquidity structure are loaded for thin-liquidity checks.",
  "Volume 24h": "24h trading activity and transaction count.",
  "Market Cap": "Market cap with FDV as a secondary reference.",
  "Liquidity Bias": "First-layer liquidity judgement before deeper analysis.",
  Address: "Current selected token contract address.",
  "Risk Level": "AVE risk level and risk score.",
  "Taxes / Honeypot": "Tax and honeypot checks before any execution.",
  "Top 10 Holders": "Holder concentration risk.",
  "Liquidity Events": "Recent add/remove liquidity behavior.",
  "Contract Posture": "Owner permissions and sensitive contract controls.",
  "Guard Action": "Risk Guard turns evidence into an action-level decision.",
  Decision: "Current verdict after combining market and risk signals.",
  "Signal Wallet": "Token-specific wallet from public signal actions.",
  "Signal Action": "Actual signal action count and main action amount for this token.",
  "Wallet Win Rate": "Historical win rate of the real action wallet, only when AVE provides it.",
  "Token PnL": "Realized profit and loss of the real action wallet on this token.",
  "Latest Wallet Action": "Most recent confirmed token-level action from the real action wallet.",
  "Backing Strength": "Count of real wallets that actually appear in the current token signal.",
  Signal: "Candidate verdict from ranking, risk gate, and wallet support.",
  "Signal Tags": "Dynamic signal tags from route and pair behavior.",
  "Risk Gate": "Execution is blocked if the risk gate fails.",
  "Execution Readiness": "Whether official AVE execution data is connected.",
  "Position Watch": "Monitoring windows after a dry run or execution.",
  "Dry Run Basis": "Dry run basis from price, liquidity, and main route."
};

export function localizeEvidenceRows(lang: Language, rows: EvidenceRow[]): EvidenceRow[] {
  const normalizedRows = rows.map((row) =>
    row.label === "Liquidity Events"
      ? { ...row, value: formatLiquidityEventValue(lang, row.value) }
      : row
  );
  if (lang === "zh") return normalizedRows;
  return normalizedRows.map((row) => ({
    label: evidenceLabels[row.label] ?? row.label,
    value: translateValue(lang, row.value),
    interpretation: evidenceInterpretations[row.label] ?? translateValue(lang, row.interpretation)
  }));
}

export function buildDisplayMetrics(lang: Language, candidates: Candidate[]): SummaryMetric[] {
  const riskCount = candidates.filter((candidate) => candidate.verdict === "回避").length;
  const canDoCount = candidates.filter((candidate) => candidate.verdict === "可做").length;
  const watchCount = candidates.filter((candidate) => candidate.verdict === "观望").length;
  const chainCounts = ["Solana", "BSC", "Base", "Ethereum"]
    .map((chain) => `${chain} ${candidates.filter((candidate) => candidate.chain === chain).length}`)
    .join(" / ");

  return [
    { label: t(lang, "summary.today"), value: String(candidates.length), note: chainCounts },
    { label: t(lang, "summary.risk"), value: String(riskCount), note: t(lang, "summary.risk.note"), tone: "negative" },
    { label: t(lang, "summary.actionable"), value: String(canDoCount), note: t(lang, "summary.actionable.note"), tone: "positive" },
    { label: t(lang, "summary.watch"), value: String(watchCount), note: t(lang, "summary.watch.note") }
  ];
}

export function getLocalizedModules(lang: Language): Array<{ id: ModuleId; label: string; caption: string }> {
  return [
    { id: "overview", label: "Overview", caption: lang === "zh" ? "今天该看什么" : "What matters now" },
    { id: "docs", label: "Docs", caption: lang === "zh" ? "产品指南" : "Product guide" },
    { id: "access", label: "Access", caption: lang === "zh" ? "用户体系" : "User tiers" },
    { id: "radar", label: "Radar", caption: lang === "zh" ? "候选标的" : "Candidate tokens" },
    { id: "score", label: lang === "zh" ? "评分计算" : "Score Model", caption: "SENTINEL-8" },
    { id: "dossier", label: lang === "zh" ? "币种档案" : "Token Dossier", caption: lang === "zh" ? "单币证据页" : "Token report" },
    { id: "risk", label: lang === "zh" ? "风险拦截" : "Risk Guard", caption: lang === "zh" ? "风险拦截" : "Risk gate" },
    { id: "opportunity", label: "Opportunity Desk", caption: lang === "zh" ? "交易工作流" : "Trade workflow" }
  ];
}

export function getLocalizedAccessContent(lang: Language) {
  if (lang === "zh") {
    return {
      stats: [
        { value: "4", label: "等级层级" },
        { value: "3", label: "优先准入身份" },
        { value: "∞", label: "高级能力扩展空间" }
      ],
      sections: [
        { id: "access-gate", title: "准入机制", summary: "先决定谁优先开放，再决定每个等级能用到哪里。" },
        { id: "access-tiers", title: "等级划分", summary: "等级随 AVE 累计交易量增长，并映射到不同额度与开放范围。" },
        { id: "access-benefits", title: "权益差异", summary: "把研究、交易、额度和新功能优先权放进同一张权益表。" }
      ],
      gateCards: [
        {
          eyebrow: "Priority Group 01",
          title: "AVE 社群成员",
          description: "完成基础社区身份识别后，可优先开放基础研究功能、候选池刷新与单币详情查看权限。"
        },
        {
          eyebrow: "Priority Group 02",
          title: "AVE 大使",
          description: "具备社区贡献身份的用户，可更早获得新模块试用资格，并享受更高日额度和更快支持。"
        },
        {
          eyebrow: "Priority Group 03",
          title: "高交易量用户",
          description: "AVE 累计交易量达到阈值后自动进入更高等级，解锁更高频率、更高额度和更完整的交易能力。"
        }
      ],
      tierRows: [
        { level: "L1 Explorer", threshold: "< $10K", access: "Radar / Token Dossier / 风险查看", quota: "基础额度", benefit: "可进入完整研究流程" },
        { level: "L2 Operator", threshold: "$10K+", access: "增加 Quote 与交易预构建", quota: "提升日调用与试算额度", benefit: "更快候选刷新与交易准备" },
        { level: "L3 Pro", threshold: "$50K+", access: "增加 Delegate Wallet 等待名单与高级策略模块", quota: "更高 API 与工作流额度", benefit: "优先试用新功能与更高上限" },
        { level: "L4 Elite", threshold: "$250K+", access: "优先开放高级研究、团队功能与定向新模块", quota: "定制额度", benefit: "最高优先级、定向支持与专属资格" }
      ],
      benefitHeaders: ["功能 / 权益", "L1 Explorer", "L2 Operator", "L3 Pro", "L4 Elite"],
      benefitRows: [
        { feature: "Radar + 单币研究", values: ["开放", "开放", "开放", "开放"] },
        { feature: "风险拦截 + 复盘", values: ["开放", "开放", "开放", "开放"] },
        { feature: "官方 Quote 试算", values: ["--", "开放", "开放", "开放"] },
        { feature: "未签名交易预构建", values: ["--", "开放", "开放", "开放"] },
        { feature: "Delegate Wallet", values: ["--", "--", "优先开放", "优先开放"] },
        { feature: "新功能抢先使用", values: ["--", "排队开放", "优先", "最高优先"] },
        { feature: "日额度 / 调用上限", values: ["基础", "提升", "高", "定制"] }
      ]
    };
  }

  return {
    stats: [
      { value: "4", label: "Tier Levels" },
      { value: "3", label: "Priority Cohorts" },
      { value: "∞", label: "Expansion Headroom" }
    ],
    sections: [
      { id: "access-gate", title: "Access Gate", summary: "Define who gets early access first, then define what each tier unlocks." },
      { id: "access-tiers", title: "Tier Ladder", summary: "Tiers grow with cumulative AVE volume and map directly to quota plus feature scope." },
      { id: "access-benefits", title: "Benefit Matrix", summary: "Research, trading, quota, and early-feature access in one visible system." }
    ],
    gateCards: [
      {
        eyebrow: "Priority Group 01",
        title: "AVE Community Members",
        description: "Users with verified community identity can be opened first for core research workflows, candidate refresh, and single-token inspection."
      },
      {
        eyebrow: "Priority Group 02",
        title: "AVE Ambassadors",
        description: "Ambassadors can receive earlier access to new modules, larger daily quotas, and faster support coverage."
      },
      {
        eyebrow: "Priority Group 03",
        title: "High-Volume Users",
        description: "As cumulative AVE trading volume crosses each threshold, users move into higher tiers with larger limits and broader trading capability."
      }
    ],
    tierRows: [
      { level: "L1 Explorer", threshold: "< $10K", access: "Radar / Token Dossier / risk review", quota: "Base quota", benefit: "Full research workflow" },
      { level: "L2 Operator", threshold: "$10K+", access: "Adds Quote and transaction prep", quota: "Higher daily query and dry-run quota", benefit: "Faster candidate refresh plus trading prep" },
      { level: "L3 Pro", threshold: "$50K+", access: "Adds Delegate Wallet waitlist and advanced strategy modules", quota: "Higher API and workflow quota", benefit: "Priority access to new features" },
      { level: "L4 Elite", threshold: "$250K+", access: "Priority access to advanced research, team features, and directed new modules", quota: "Custom quota", benefit: "Highest priority, directed support, exclusive access" }
    ],
    benefitHeaders: ["Feature / Benefit", "L1 Explorer", "L2 Operator", "L3 Pro", "L4 Elite"],
    benefitRows: [
      { feature: "Radar + token research", values: ["Open", "Open", "Open", "Open"] },
      { feature: "Risk Guard + Replay", values: ["Open", "Open", "Open", "Open"] },
      { feature: "Official Quote", values: ["--", "Open", "Open", "Open"] },
      { feature: "Unsigned transaction prep", values: ["--", "Open", "Open", "Open"] },
      { feature: "Delegate Wallet", values: ["--", "--", "Priority", "Priority"] },
      { feature: "Early feature access", values: ["--", "Queued", "Priority", "Highest priority"] },
      { feature: "Daily quota / limit", values: ["Base", "Higher", "High", "Custom"] }
    ]
  };
}

export function getLocalizedDocs(lang: Language): DocSection[] {
  if (lang === "zh") {
    return [
      {
        id: "docs-overview",
        title: "产品概述",
        summary: "AVE Sentinel 是一个面向多链早期链上资产的完整决策系统。",
        paragraphs: [
          "它不是单纯的新币看板，也不是只会下单的 bot。它的核心目标，是把发现、验证、判断、试算、交易预备、观察与复盘压进同一条连续工作流。",
          "AVE Sentinel 与 AVE 是互补关系：AVE 已经提供 K 线、持有人、交易记录、pair 和风险报告等基础浏览能力，Sentinel 不重复做一个更重的数据面板，而是把这些字段整理进 SENTINEL-8 建模、评分和风险门控。",
          "这个系统优先解决的不是信息不足，而是信息碎片化、判断过慢、风险判断太晚、执行动作断裂和结果无法复盘。"
        ],
        bullets: [
          "服务对象：新币、热度状态上升的 meme、早期强度信号交易者",
          "目标链：Solana、BSC、Base 与 Ethereum",
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
        paragraphs: ["三个入口共享同一套候选发现、风险判断和决策输出，保证不同入口返回一致结果。"]
      },
      {
        id: "docs-web",
        title: "Web 工作台",
        summary: "Web 端提供完整的研究、风控、交易试算和复盘流程。",
        bullets: [
          "Overview：今日候选、产品定位、完整工作流、重点摘要",
          "SENTINEL-8：八维评分模型与风险门控过程",
          "Radar：候选池总表、筛选、搜索、合约地址直查、优先级",
          "Score Model：单币评分计算页",
          "Token Dossier：单币证据页",
          "Risk Guard：风险解释与动作层结论",
          "Opportunity Desk：策略信号、Quote、执行预备",
          "Docs：产品指南"
        ],
        paragraphs: [
          "常用流程是先从左侧候选池选择代币，或直接输入支持链上的代币合约地址，再在单币模块之间切换查看评分计算、证据、风险和交易信息。",
          "右上角提供语言切换（中 / EN）和主题切换（亮色 / 深色）。数据源状态显示在右上角，LIVE 表示已连接 AVE 官方数据，MOCK / FALLBACK 表示正在使用备用数据。"
        ]
      },
      {
        id: "docs-radar-guide",
        title: "Radar 使用指南",
        summary: "Radar 汇总多链候选标的，帮助用户确定下一步深看的对象。",
        bullets: [
          "顶部四格指标：总候选、被风险拦截数量、可试算数量、观望数量",
          "左侧候选池支持代币、叙事方向、链搜索，也支持直接输入合约地址进入单币分析",
          "单条候选显示链、叙事方向、Score 与当前 Verdict",
          "Verdict 三档：可做 · 观望 · 回避，由 SENTINEL-8 八维模型合成",
          "点击候选卡即可进入 Workbench，并把后续模块切换到该 token"
        ],
        paragraphs: [
          "Radar 默认按 Score 从高到低排列。Score 由 SENTINEL-8 综合打分给出；Verdict 会对同一条链的候选按分位数切分为可做、观望和回避。"
        ]
      },
      {
        id: "docs-scoring-model",
        title: "SENTINEL-8 打分模型",
        summary: "每个候选只用 AVE 接口里的字段，从八个维度各取一个 0-1 分数，再加权合成。",
        rows: [
          { label: "L 流动性深度", value: "main_pair_tvl / tvl", note: "log 归一化，越厚越稳，直接决定能否承接 Desk 的试算金额" },
          { label: "V 成交质量", value: "tx_volume_u_24h × tx_count_24h", note: "log 成交量叠加交易笔数系数，用来识别 ghost volume" },
          { label: "M 动量合成", value: "price_change_1h + price_change_24h", note: "1h 与 24h 动量按 4:6 混合，对 >200% 的过热行情做惩罚" },
          { label: "A 活跃度加速", value: "token_tx_count_1h vs 24h 均值", note: "当前小时 tx 数 / 24h 平均，用于捕捉正在升温的交易活跃度" },
          { label: "C 持仓集中度", value: "Top10 holders + 全局 holders", note: "反向集中度 + holders 数量加成，分散度更高分数更高" },
          { label: "R 风险门面", value: "risk_score / risk_level + 风险标志位", note: "优先使用 AVE 官方风险分，缺失时按 honeypot / blacklist / mint 等降档" },
          { label: "S 聪明钱信号", value: "signal actions + lead action 金额", note: "信号次数 + 领先动作金额 + max_price_change 形成信念分" },
          { label: "F 周期适配", value: "launch_at / created_at", note: "代币年龄的钟形曲线：太新惩罚、6h–7d 最佳、30d 外逐步折旧" }
        ],
        paragraphs: [
          "最终得分 = 100 × (0.18·L + 0.14·V + 0.10·M + 0.08·A + 0.14·C + 0.20·R + 0.08·S + 0.08·F)，再依次乘上硬性风险倍率：honeypot → ×0.28，blacklist → ×0.55，mint → ×0.88，极端税（>15%）→ ×0.70，一般重税 → ×0.90，owner 权限未放弃 → ×0.90，最后 clamp 到 1-99 的整数分。",
          "Verdict 三档不使用固定阈值，而是对每条链上的候选按分位数切档：前约 30% 进可做，后约 30% 进回避，中间进观望。这样便于在 Solana / BSC / Base / Ethereum 之间进行横向对比。",
          "这个模型层是 AVE Sentinel 的重点。K 线、持有人列表和 TX 明细在 AVE 内部已经可以直接查看，Sentinel 只保留足够支撑判断的证据字段，把主要空间留给评分解释、权重贡献和风险门控过程。",
          "非风险数据也尽量只用 AVE：freshness 走 launch_at，activity 走 token_tx_count_1h / tx_count_24h，smart-money 走 signals 与 lead action，不引入外部钱包胜率数据。",
          "网页里的 SENTINEL-8 Score Model、Radar 排序与产品说明书共用同一套八维权重和风险门控逻辑。"
        ]
      },
      {
        id: "docs-dossier",
        title: "Token Dossier 字段",
        summary: "Token Dossier 是单币证据页，只保留支撑模型和风险判断的关键字段，不替代 AVE 的完整 K 线、持有人和交易明细页面。",
        rows: [
          { label: "Project Profile", value: "项目资料", note: "名称、发行平台、launch 时间、holders、主交易对、官方链接" },
          { label: "Market Snapshot", value: "行情快照", note: "价格、MCAP、FDV、流动性、24h Volume、24h Tx" },
          { label: "Pair Structure", value: "交易对结构", note: "AMM、LP 锁仓、锁仓平台、抢跑数量、ATH、ATL" },
          { label: "Market Pressure", value: "买卖力量", note: "按周期统计买卖笔数、买卖量、买卖钱包数、造市数与合成 pressure" },
          { label: "DEX Liquidity", value: "多 DEX 流动性", note: "Top 5 交易对的 TVL、Volume、价格、tax、池内持仓集中度" },
          { label: "Liquidity Events", value: "流动性事件", note: "近期添加流动性 / 移除流动性的类型、金额、时间、钱包" },
          { label: "AVE AI Risk", value: "AVE 风控", note: "机制识别 + 条目级风险描述" },
          { label: "Holder & LP Risk", value: "持仓与 LP", note: "Top10 集中度、LP 锁仓比例、主钱包、pair 内大额" },
          { label: "Smart Money Signal", value: "聪明钱信号", note: "signal tag、动作次数、首次信号价、最高涨幅、leader 钱包与金额" }
        ]
      },
      {
        id: "docs-risk-rules",
        title: "Risk Guard 判断规则",
        summary: "Risk Guard 把多条风险信号合成一个动作层结论：允许试算 / 保留观察 / 阻断执行。",
        bullets: [
          "Honeypot：任何 honeypot 命中都会直接阻断执行",
          "税率：buy / sell tax 超过阈值会降档到保留观察",
          "持仓集中度：Top10 > 60% 或 Top1 > 20% 进入保留观察",
          "LP 锁仓：未锁仓或锁仓比例过低会降档",
          "流动性事件：近期大额 remove LP 会触发保留观察",
          "合约权限：owner 仍可修改关键参数时，直接降到阻断执行"
        ],
        paragraphs: [
          "Risk Guard 的结论会同步渲染到 Overview、Opportunity Desk 与 Focus 区。如果状态是阻断执行，Opportunity Desk 的 Dry Run / 未签名构建按钮会自动置灰。"
        ]
      },
      {
        id: "docs-opportunity-flow",
        title: "Opportunity Desk 试算流程",
        summary: "试算不是下单，是把执行前的全部变量跑一遍，确认参数再签名。",
        bullets: [
          "Budget：输入 USD 预算，Desk 自动请求 AVE 官方 Quote",
          "Estimated Receive / Slippage：返回数量、预期滑点、路由来源",
          "Approval Spender / Auto Slippage / Gas Tip：EVM 链会额外返回合约授权与滑点保护建议",
          "Execution Prep：填入钱包地址，选择未签名预构建或链上构建",
          "返回 Request Tx ID、Min Return、Tx Target、Gas/Fee、Route、1h/24h tx count 等原始字段",
          "Position Watch：15m / 1h / 4h 三个窗口给出继续跟进的检查项"
        ],
        paragraphs: [
          "Desk 不会主动广播交易。EVM 未签名交易需要外部钱包 approve-chain 后再签名；Solana 未签名交易可以直接 base64 注入钱包签名广播。"
        ]
      },
      {
        id: "docs-telegram",
        title: "Telegram 查询",
        summary: "Telegram 是轻量查询入口，适合在移动端快速查看单币判断。",
        commands: ["/radar", "/brief", "/token <address> <solana|bsc>", "/risk <address> <solana|bsc>", "/quote <address> <solana|bsc> <usd>"],
        paragraphs: [
          "Telegram 返回当前 token 的判断摘要、风险结论和 Quote 信息。",
          "同一地址在 Web 和 Telegram 中会使用同一套数据与判断逻辑。"
        ]
      },
      {
        id: "docs-cli",
        title: "CLI Skill",
        summary: "CLI Skill 是同一套能力的智能体入口，适合接入大模型 agent 和自动化流程。",
        commands: ["sentinel radar", "sentinel token <address> --chain solana", "sentinel risk <address> --chain bsc", "sentinel quote <address> --usd 500"],
        paragraphs: [
          "CLI Skill 返回可直接使用的候选、风险、Quote 和单币摘要。",
          "它可以作为 agent、脚本和自动化工作流的调用入口。"
        ]
      },
      {
        id: "docs-data-sources",
        title: "数据来源与一致性",
        summary: "同一个 token 在 Web / Telegram / CLI 三端拿到的结论必须一致。",
        bullets: [
          "底层全部使用 AVE Data + Signals + Trade 接口，不混用第三方聚合器",
          "AVE Sentinel 与 AVE 互补：AVE 负责完整数据浏览，Sentinel 负责把关键字段转成评分、风险门控和执行准备",
          "Radar 候选池在 Live 模式下直连 AVE，候选字段不做二次加工",
          "备用数据模式仅在接口不可用时启用，用于本地样本和缺失字段补齐",
          "所有价格、流动性、成交量单位沿用 AVE 返回值，避免单位折算引入误差",
          "风险结论由 AVE AI Risk + 本地合成规则组成，本地规则在 risk-rules 一节列出"
        ],
        paragraphs: [
          "接口状态会显示在右上角徽标：LIVE 表示直连 AVE，FALLBACK 表示部分字段使用备用数据，MOCK 表示使用本地样本数据。"
        ]
      },
      {
        id: "docs-runtime",
        title: "环境与运行",
        summary: "本地开发时，Web、CLI 和 Telegram 命令入口都复用同一个 AVE key。",
        bullets: [
          "配置 AVE_API_KEY 或 VITE_AVE_API_KEY",
          "Web 默认端口 http://127.0.0.1:3210，打包后可以部署到任意静态托管",
          "Web 前端建议通过本地代理绕过浏览器跨域限制",
          "CLI 和 Telegram 命令入口直接走同一套共享核心",
          "npm run dev 启动 Web；Telegram / CLI 入口独立进程"
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
          "在 Opportunity Desk 做官方 Quote 和预构建交易",
          "用 Telegram 或 CLI Skill 查询同一地址",
          "最后回到 Replay 查看结果和复盘记录"
        ]
      },
      {
        id: "docs-faq",
        title: "常见问题",
        summary: "集中解答用户在使用前最常关心的问题。",
        rows: [
          { label: "Q1", value: "是否自动下单？", note: "不。Sentinel 不做自动签名，所有交易都经由外部钱包签名广播。" },
          { label: "Q2", value: "LIVE / FALLBACK / MOCK 的区别？", note: "LIVE 直连 AVE；FALLBACK 在部分字段缺失时用本地样本补齐；MOCK 为本地样本模式。" },
          { label: "Q3", value: "支持哪些链？", note: "当前版本支持 Solana、BSC、Base、Ethereum 四条主链，后续计划加入 Arbitrum / Tron。" },
          { label: "Q4", value: "Telegram / CLI 与 Web 的数据是否一致？", note: "一致。三个入口共用同一份候选排序、风险判断和 Quote 结果。" },
          { label: "Q5", value: "是否需要自行签名接管私钥？", note: "不需要。Desk 仅提供未签名交易，私钥始终在用户钱包内。" },
          { label: "Q6", value: "数据刷新频率？", note: "Radar 批量拉取，单币详情在切换 token 时按需刷新，Quote 在修改 Budget 后去抖请求。" }
        ]
      }
    ];
  }

  return [
    {
      id: "docs-overview",
      title: "Product Overview",
      summary: "AVE Sentinel is a complete decision system for early multi-chain on-chain assets.",
      paragraphs: [
        "It is not just a token board or a simple trading bot. Its core goal is to connect discovery, verification, judgement, dry run, execution preparation, monitoring, and replay into one continuous workflow.",
        "AVE Sentinel is complementary to AVE. AVE already provides the raw browsing layer for k-lines, holders, transactions, pairs, and risk reports; Sentinel does not duplicate that surface. It turns selected AVE fields into SENTINEL-8 scoring, risk gates, and execution readiness.",
        "The system addresses fragmented information, slow judgement, late risk checks, broken execution flow, and decisions that cannot be reviewed."
      ],
      bullets: [
        "Audience: early-token, rising-heat meme, and momentum traders",
        "Target chains: Solana, BSC, Base, and Ethereum",
        "Core output: Actionable / Watch / Avoid",
        "Foundation: AVE Data + Signals + Trade"
      ]
    },
    {
      id: "docs-workflow",
      title: "Complete Workflow",
      summary: "AVE Sentinel connects candidate-token discovery, verification, risk checks, dry runs, and replay in one workflow.",
      bullets: [
        "Discover candidate tokens from the Radar pool",
        "Verify token, pair, volume, liquidity, and structure",
        "Inspect SENTINEL-8 factors, weights, and risk gates",
        "Gate risk before action: honeypot, tax, concentration, and liquidity withdrawal",
        "Dry run and prepare trades with quote, auto slippage, gas tip, and unsigned transaction build",
        "Connect each decision with later outcomes for replay"
      ]
    },
      {
        id: "docs-entrypoints",
        title: "Three Entry Points",
      summary: "AVE Sentinel is one shared core exposed through multiple entry points.",
      rows: [
        { label: "Web", value: "Full workspace", note: "Use it for analysis, dry runs, transaction preparation, and replay" },
        { label: "Telegram", value: "Fast query", note: "Best for checking token, risk, quote, and brief summaries" },
        { label: "CLI", value: "Terminal workflow", note: "Best for power users and future automation scripts" }
      ],
      paragraphs: ["All entry points share the same candidate discovery, risk logic, and decision output so results stay consistent."]
    },
    {
      id: "docs-web",
      title: "Web Workspace",
      summary: "The Web UI provides the complete research, risk, trading dry-run, and replay workflow.",
      bullets: [
        "Overview: candidate tokens, product positioning, workflow, and focus summary",
        "SENTINEL-8: eight-factor score model and risk-gate flow",
        "Radar: candidate board, filters, search, direct contract lookup, and priority",
        "Score Model: per-token scoring workspace",
        "Token Dossier: single-token evidence report",
        "Risk Guard: risk explanation and action-level conclusion",
        "Opportunity Desk: strategy signal, Quote, and execution prep",
        "Docs: product guide"
      ],
      paragraphs: [
        "The common flow is to select a token from the candidate pool, or enter a supported contract address directly, then switch between score modeling, evidence, risk, and trading.",
        "The top right holds language (中 / EN) and theme (light / dark) toggles. The data badge shows the active source: LIVE means AVE is connected, while MOCK / FALLBACK means backup data is in use."
      ]
    },
    {
      id: "docs-radar-guide",
      title: "Radar Guide",
      summary: "Radar brings multi-chain candidate tokens together so users can decide what to inspect next.",
      bullets: [
        "Top metrics: total candidate tokens, risk-blocked count, actionable count, watch count",
        "The left rail supports token / narrative / chain search and direct contract-address lookup, plus Chain and Verdict filters",
        "Each row shows chain, narrative direction, Score, and current Verdict",
        "Verdict has three tiers — Actionable / Watch / Avoid — produced by the SENTINEL-8 composite model",
        "Click a row to enter the Workbench and switch the following modules to that token"
      ],
      paragraphs: [
        "Rows are sorted by SENTINEL-8 Score descending. The Verdict split is calculated per chain, grouping candidates into Actionable, Watch, and Avoid."
      ]
    },
    {
      id: "docs-scoring-model",
      title: "SENTINEL-8 Scoring Model",
      summary: "Each candidate token is scored across eight AVE-only dimensions, normalized to 0-1 and combined.",
      rows: [
        { label: "L Liquidity Depth", value: "main_pair_tvl / tvl", note: "log-normalized pool depth; decides whether the pool can absorb a Desk-sized order" },
        { label: "V Volume Quality", value: "tx_volume_u_24h × tx_count_24h", note: "log volume scaled by transaction count to filter ghost volume" },
        { label: "M Momentum Composite", value: "price_change_1h + price_change_24h", note: "1h and 24h momentum blended 4:6 with penalties for >200% overheated runs" },
        { label: "A Activity Acceleration", value: "token_tx_count_1h vs 24h mean", note: "current-hour tx count vs 24h average — captures ramping activity" },
        { label: "C Holder Concentration", value: "Top10 holders + holders count", note: "inverse concentration plus breadth bonus; dispersed ownership scores higher" },
        { label: "R Risk Posture", value: "risk_score / risk_level + risk flags", note: "prefers AVE's native risk_score, falls back to per-flag penalties (honeypot, blacklist, mint, ...)" },
        { label: "S Smart Money Signal", value: "signal actions + lead action volume", note: "signal action count + leader action volume + max_price_change form the conviction score" },
        { label: "F Freshness Curve", value: "launch_at / created_at", note: "bell-shaped age curve: too new is penalized, 6h–7d peaks, 30d+ decays gradually" }
      ],
      paragraphs: [
        "Final score = 100 × (0.18·L + 0.14·V + 0.10·M + 0.08·A + 0.14·C + 0.20·R + 0.08·S + 0.08·F), then multiplicative gates are applied: honeypot × 0.28, blacklist × 0.55, mint × 0.88, extreme tax (>15%) × 0.70, heavy tax × 0.90, unsafe owner powers × 0.90. Result is clamped to an integer in [1, 99].",
        "Verdict is not hard-thresholded. Candidates on each chain are bucketed by score quantile: top ~30% become Actionable, bottom ~30% become Avoid, and the middle stays in Watch. This keeps cross-chain comparison consistent across Solana, BSC, Base, and Ethereum.",
        "This model layer is the main product focus. K-lines, holder lists, and TX-level browsing already exist inside AVE, so Sentinel keeps only the evidence needed for judgment and gives more space to score explanation, factor contribution, and risk-gate flow.",
        "Only AVE-native fields feed the model: freshness uses launch_at, activity uses token_tx_count_1h / tx_count_24h, smart-money uses public signals and the lead action. No external wallet win-rate datasets are required.",
        "The Web score module, Radar ranking, and Docs explanation all use the same SENTINEL-8 weights and risk-gate logic."
      ]
    },
    {
      id: "docs-dossier",
      title: "Token Dossier Fields",
      summary: "Token Dossier is a focused evidence page. It keeps the fields needed for modeling and risk judgment, not a replacement for AVE's full k-line, holder, and transaction views.",
      rows: [
        { label: "Project Profile", value: "Project", note: "Name, issue platform, launch, holders, main pair, official links" },
        { label: "Market Snapshot", value: "Market", note: "Price, MCAP, FDV, liquidity, 24h volume, 24h tx count" },
        { label: "Pair Structure", value: "Pair", note: "AMM, LP lock, lock platform, sniper count, ATH, ATL" },
        { label: "Market Pressure", value: "Flow", note: "Buy / sell tx, volume, wallets, makers, and combined pressure per window" },
        { label: "DEX Liquidity", value: "Liquidity", note: "Top 5 pairs with TVL, volume, price, tax, and holder concentration" },
        { label: "Liquidity Events", value: "Events", note: "Recent add / remove LP events with amount, timestamp, and wallet" },
        { label: "AVE AI Risk", value: "Risk", note: "Mechanism detection plus item-level risk notes" },
        { label: "Holder & LP Risk", value: "Holders", note: "Top 10 concentration, LP lock ratio, key holders, big pair-level wallets" },
        { label: "Smart Money Signal", value: "Signal", note: "Signal tag, action count, first-signal price, max move, leader wallet and volume" }
      ]
    },
    {
      id: "docs-risk-rules",
      title: "Risk Guard Rules",
      summary: "Risk Guard folds multiple risk signals into one action-level verdict: dry run / keep watching / block.",
      bullets: [
        "Honeypot hit → execution is blocked outright",
        "Buy / sell tax above threshold → drops to keep watching",
        "Holder concentration: Top 10 > 60% or Top 1 > 20% → keep watching",
        "LP lock: absent or low ratio → downgrade",
        "Liquidity events: recent large remove-LP → keep watching",
        "Contract posture: owner still holds critical powers → drop to block"
      ],
      paragraphs: [
        "The verdict propagates to Overview, Opportunity Desk, and the Focus strip. When the state is block, Dry Run and unsigned-build buttons on the Opportunity Desk are disabled."
      ]
    },
    {
      id: "docs-opportunity-flow",
      title: "Opportunity Desk Flow",
      summary: "A dry run is not an order — it runs every pre-execution variable once so parameters are confirmed before signing.",
      bullets: [
        "Budget: enter USD, the Desk pulls an official AVE Quote",
        "Estimated Receive / Slippage: returns token amount, slippage estimate, and route source",
        "Approval Spender / Auto Slippage / Gas Tip: EVM chains add approval and slippage protection",
        "Execution Prep: fill in a wallet, pick unsigned pre-build or on-chain build",
        "Returns Request Tx ID, Min Return, Tx Target, Gas / Fee, Route, 1h / 24h tx counts",
        "Position Watch: 15m / 1h / 4h check items after the dry run"
      ],
      paragraphs: [
        "The Desk never broadcasts a transaction. EVM unsigned transactions still need approve-chain from an external wallet; Solana unsigned transactions can be injected as base64 and signed externally."
      ]
    },
    {
      id: "docs-telegram",
      title: "Telegram Queries",
      summary: "Telegram is the lightweight query entry for quick mobile token checks.",
      commands: ["/radar", "/brief", "/token <address> <solana|bsc>", "/risk <address> <solana|bsc>", "/quote <address> <solana|bsc> <usd>"],
      paragraphs: [
        "Telegram returns token verdicts, risk conclusions, and Quote information in a compact format.",
        "The same address uses the same data and decision logic across Web and Telegram."
      ]
    },
    {
      id: "docs-cli",
      title: "CLI Skill",
      summary: "CLI Skill exposes the same capabilities for agents, scripts, and automated workflows.",
      commands: ["sentinel radar", "sentinel token <address> --chain solana", "sentinel risk <address> --chain bsc", "sentinel quote <address> --usd 500"],
      paragraphs: [
        "CLI Skill returns candidate lists, risk checks, Quotes, and token summaries in a format agents can use directly.",
        "It can act as an entry point for agent workflows, scripts, and automation."
      ]
    },
    {
      id: "docs-data-sources",
      title: "Data Sources",
      summary: "The same token must return the same verdict across Web, Telegram, and CLI.",
      bullets: [
        "All interfaces use AVE Data + Signals + Trade — no third-party aggregators are mixed in",
        "AVE Sentinel complements AVE: AVE remains the full data-browsing layer, while Sentinel turns selected fields into scoring, risk gates, and execution readiness",
        "Radar pulls candidate tokens straight from AVE in Live mode with no post-processing",
        "Backup data is used only when AVE is unreachable, using local samples or field-level fallback values",
        "Prices, liquidity, and volume units keep AVE's native values to avoid conversion drift",
        "Risk conclusions combine AVE AI Risk with the local rules spelled out in the Risk Guard Rules section"
      ],
      paragraphs: [
        "The data source badge in the top right shows LIVE for direct AVE data, FALLBACK when some fields use backup data, and MOCK when local sample data is active."
      ]
    },
    {
      id: "docs-runtime",
      title: "Runtime",
      summary: "During local development, Web, CLI, and Telegram share the same AVE key.",
      bullets: [
        "Configure AVE_API_KEY or VITE_AVE_API_KEY",
        "Web defaults to http://127.0.0.1:3210; the build can ship on any static host",
        "Use the local Web proxy to avoid browser CORS limits",
        "CLI and Telegram commands should reuse the same shared core",
        "npm run dev starts the Web; Telegram / CLI run as separate processes"
      ]
    },
    {
      id: "docs-workflow-path",
      title: "Typical Workflow",
      summary: "Follow one token through discovery, verification, risk checks, dry run, and replay.",
      bullets: [
        "Pick a target in Radar",
        "Open Score Model for the SENTINEL-8 breakdown",
        "Open Token Dossier for structure",
        "Open Risk Guard for action-level conclusion",
        "Use Opportunity Desk for official quote and transaction preparation",
        "Query the same address through Telegram or CLI Skill",
        "Return to Replay for outcome review"
      ]
    },
    {
      id: "docs-faq",
      title: "FAQ",
      summary: "Common questions before using AVE Sentinel.",
      rows: [
        { label: "Q1", value: "Does it auto-trade?", note: "No. Sentinel never signs on its own — every transaction is signed and broadcast by an external wallet." },
        { label: "Q2", value: "LIVE vs FALLBACK vs MOCK?", note: "LIVE is a direct AVE connection. FALLBACK fills missing fields with local samples. MOCK uses local sample data." },
        { label: "Q3", value: "Which chains are supported?", note: "Solana, BSC, Base, and Ethereum today; Arbitrum and Tron are on the roadmap." },
        { label: "Q4", value: "Do Telegram / CLI and Web agree?", note: "Yes. All three share the candidate engine, risk logic, and Quote results." },
        { label: "Q5", value: "Do I need to hand over private keys?", note: "No. The Desk only builds unsigned transactions; keys stay inside the user's wallet." },
        { label: "Q6", value: "How often does data refresh?", note: "Radar pulls in batches; dossier fetches on token switch; Quote is debounced while you edit Budget." }
      ]
    }
  ];
}

export function getOverviewContent(lang: Language) {
  return {
    advantages: lang === "zh"
      ? [
          ["多链覆盖", "Solana · BSC · Base · ETH", "一个账号看完四条主链的候选池和单币细节，切换无缝。"],
          ["风险前置", "先查再做", "honeypot、税率、持仓集中度、LP 锁仓、撤池事件，动作之前就过滤掉。"],
          ["官方试算", "AVE Quote + 预构建", "直接对接 AVE 报价与未签名交易构建，金额、滑点、Gas、路由一次给齐。"],
          ["三端同步", "Web · Telegram · CLI", "同一套候选、同一套结论，网页看全图、手机查单币、终端跑脚本。"]
        ]
      : [
          ["Multi-Chain", "Solana · BSC · Base · ETH", "Browse candidates and inspect tokens across four chains from one account."],
          ["Risk-First", "Check before you click", "Honeypot, tax, top-holder concentration, LP lock, and liquidity removal are filtered ahead of any action."],
          ["Official Quote", "AVE Quote + Prep", "Pull AVE quote and unsigned transaction builds directly — amount, slippage, gas, and route returned in one step."],
          ["Three Entry Points", "Web · Telegram · CLI", "One candidate engine, one conclusion — the desktop board, mobile Telegram lookup, and terminal all agree."]
        ],
    stories: lang === "zh"
      ? [
          ["当前版本", "支持 Solana、BSC、Base、Ethereum 四条主链；SENTINEL-8 八维评分模型、Radar 候选池、Token Dossier、Risk Guard、Opportunity Desk 模块全部上线；同步提供 Web、Telegram、CLI 三个入口。"],
          ["后续规划", "扩展钱包样本池、加入更多主链、开放策略模板与仓位观察、做团队协作空间和公开接口。"]
        ]
      : [
          ["Current Release", "Covers Solana, BSC, Base, and Ethereum; SENTINEL-8, the Radar board, Token Dossier, Risk Guard, and Opportunity Desk are all live; Web, Telegram, and CLI entry points are available."],
          ["Next Up", "Expand the wallet sample pool, add more chains, open strategy templates and position watch, and build team workspaces plus public APIs."]
        ],
    entries: lang === "zh"
      ? [
          ["Web", "完整工作台", "完整分析、试算与交易预备", "Overview / Radar / Dossier / Opportunity"],
          ["Telegram", "快速查询", "适合查币、查风险、查 quote、接 brief", "/radar · /token · /risk · /quote"],
          ["CLI", "高效率终端", "适合极客用户和后续自动化调用", "sentinel radar · token · risk · quote"]
        ]
      : [
          ["Web", "Full workspace", "Analysis, dry run, and execution preparation", "Overview / Radar / Dossier / Opportunity"],
          ["Telegram", "Fast query", "Token, risk, quote, and brief checks", "/radar · /token · /risk · /quote"],
          ["CLI", "Terminal workflow", "Power users and future automation", "sentinel radar · token · risk · quote"]
        ],
    workflow: lang === "zh"
      ? ["输入地址", "评分计算", "验证证据", "风险拦截", "执行准备"]
      : ["Enter Address", "Score Model", "Verify Evidence", "Risk Gate", "Execution Prep"],
    monitoring: lang === "zh"
      ? [
          "SENTINEL-8：八维评分与风险门控",
          "Token Dossier：单币结构、流动性与市场证据",
          "Risk Guard：把高风险因素前置拦截",
          "支持按合约地址直接进入完整分析"
        ]
      : [
          "SENTINEL-8: eight-factor score and risk gates",
          "Token Dossier: structure, liquidity, and market evidence",
          "Risk Guard: block high-risk tokens before action",
          "Direct contract-address entry into full token analysis"
        ],
    trading: lang === "zh"
      ? [
          "官方 Quote：直接获取可执行价格与路由",
          "执行准备：金额、滑点、Gas 与未签名交易一屏确认",
          "Chain Wallet / Delegate Wallet：同一策略结论直连两种执行模式",
          "研究、风控与执行保持同一地址口径"
        ]
      : [
          "Official Quote with executable route and pricing",
          "Execution prep with amount, slippage, gas, and unsigned transaction",
          "Chain Wallet / Delegate Wallet from the same strategy conclusion",
          "Research, risk, and execution stay aligned on the same address"
        ]
  };
}
