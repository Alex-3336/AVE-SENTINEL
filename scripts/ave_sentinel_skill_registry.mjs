const chainEnum = ["solana", "bsc", "base", "eth"];
const verdictEnum = ["可做", "观望", "回避"];
const tradeSideEnum = ["buy", "sell"];
const gasTierEnum = ["low", "average", "high"];
const delegateOrderTypeEnum = ["market", "limit"];

function bilingual(zh, en) {
  return { zh, en };
}

function stringField(description, options = {}) {
  return {
    type: "string",
    description,
    ...options
  };
}

function numberField(description, options = {}) {
  return {
    type: "number",
    description,
    ...options
  };
}

function integerField(description, options = {}) {
  return {
    type: "integer",
    description,
    ...options
  };
}

function booleanField(description, options = {}) {
  return {
    type: "boolean",
    description,
    ...options
  };
}

function enumField(values, description, options = {}) {
  return {
    type: "string",
    enum: values,
    description,
    ...options
  };
}

function arrayField(items, description, options = {}) {
  return {
    type: "array",
    items,
    description,
    ...options
  };
}

function objectField(properties, required = [], description = "", options = {}) {
  return {
    type: "object",
    description,
    properties,
    required,
    ...options
  };
}

const messageSchema = objectField(
  {
    zh: stringField("Chinese message"),
    en: stringField("English message")
  },
  ["zh", "en"],
  "Bilingual human-readable summary"
);

const errorSchema = objectField(
  {
    code: stringField("Stable error code"),
    message: messageSchema,
    detail: stringField("Raw detail string when available")
  },
  ["code", "message"],
  "Structured error object"
);

const responseEnvelopeBase = {
  ok: booleanField("Whether the call completed successfully"),
  skill: stringField("Skill operation name"),
  group: enumField(["data", "chain_wallet", "delegate_wallet"], "Skill group"),
  mode: enumField(["live", "mock", "fallback"], "Execution mode"),
  source: stringField("Primary backend source"),
  message: messageSchema,
  input: objectField({}, [], "Normalized input echoed back"),
  data: objectField({}, [], "Skill-specific response payload"),
  error: {
    anyOf: [{ type: "null" }, errorSchema],
    description: "Null on success, structured error on failure"
  },
  meta: objectField(
    {
      generatedAt: stringField("ISO timestamp"),
      schemaVersion: stringField("Skill schema version")
    },
    ["generatedAt", "schemaVersion"],
    "Response metadata"
  )
};

function buildResponseSchema(dataSchema) {
  return objectField(
    {
      ...responseEnvelopeBase,
      data: dataSchema
    },
    ["ok", "skill", "group", "mode", "source", "message", "input", "data", "error", "meta"],
    "Standard AVE Sentinel skill response"
  );
}

const candidateSchema = objectField(
  {
    address: stringField("Token address"),
    pairAddress: stringField("Primary pair address"),
    symbol: stringField("Token symbol"),
    chain: enumField(chainEnum, "Chain identifier"),
    chainLabel: stringField("Human-readable chain label"),
    narrative: stringField("Narrative tag"),
    priceText: stringField("Formatted spot price"),
    volume24hText: stringField("Formatted 24h volume"),
    liquidityText: stringField("Formatted liquidity"),
    score: integerField("Radar score", { minimum: 0, maximum: 100 }),
    verdict: enumField(verdictEnum, "Radar verdict")
  },
  ["address", "symbol", "chain", "score", "verdict"]
);

const tradeContextSchema = objectField(
  {
    route: stringField("Primary route or AMM"),
    baseSymbol: stringField("Base or quote token symbol"),
    baseTokenAddress: stringField("Base or quote token address"),
    baseTokenDecimals: integerField("Base or quote token decimals"),
    baseTokenPriceUsd: numberField("Base or quote token spot price in USD"),
    tokenDecimals: integerField("Token decimals")
  },
  ["route", "baseSymbol", "baseTokenAddress", "baseTokenDecimals", "tokenDecimals"]
);

const walletSchema = objectField(
  {
    assetsId: stringField("Delegate wallet assetsId"),
    assetsName: stringField("Delegate wallet display name"),
    type: stringField("Wallet type"),
    status: stringField("Wallet status"),
    addresses: objectField(
      {
        Solana: stringField("Solana wallet address"),
        BSC: stringField("BSC wallet address"),
        Base: stringField("Base wallet address"),
        Ethereum: stringField("Ethereum wallet address")
      },
      [],
      "Per-chain wallet addresses"
    )
  },
  ["assetsId", "assetsName", "type", "status", "addresses"]
);

export const skillRegistry = {
  package: {
    name: "ave-sentinel-skill",
    version: "0.1.0",
    schemaVersion: "2026-04-14",
    description: bilingual(
      "AVE SENTINEL agent-callable skills for data lookup, chain wallet trading, and delegate wallet execution.",
      "AVE SENTINEL agent-callable skills for data lookup, chain wallet trading, and delegate wallet execution."
    )
  },
  skills: {
    radar_scan: {
      group: "data",
      summary: bilingual("扫描多链 Radar 候选池。", "Scan multi-chain radar candidates."),
      inputSchema: objectField(
        {
          chains: arrayField(enumField(chainEnum, "Chain"), "Chains to include", {
            default: [...chainEnum]
          }),
          limit: integerField("Maximum number of candidates to return", {
            minimum: 1,
            maximum: 100,
            default: 40
          }),
          minScore: integerField("Minimum score filter", {
            minimum: 0,
            maximum: 100,
            default: 0
          }),
          verdicts: arrayField(enumField(verdictEnum, "Verdict"), "Verdict allowlist", {
            default: [...verdictEnum]
          })
        },
        [],
        "Radar scan request"
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            summary: objectField(
              {
                total: integerField("Returned candidate count"),
                byChain: objectField({}, [], "Counts by chain"),
                byVerdict: objectField({}, [], "Counts by verdict")
              },
              ["total", "byChain", "byVerdict"]
            ),
            candidates: arrayField(candidateSchema, "Radar candidates")
          },
          ["summary", "candidates"]
        )
      )
    },
    token_dossier: {
      group: "data",
      summary: bilingual("获取单币完整证据摘要。", "Get a structured token dossier."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Token chain"),
          tokenAddress: stringField("Token address")
        },
        ["chain", "tokenAddress"],
        "Token dossier request"
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            token: objectField(
              {
                address: stringField("Token address"),
                symbol: stringField("Token symbol"),
                chain: enumField(chainEnum, "Chain"),
                chainLabel: stringField("Chain label"),
                narrative: stringField("Narrative tag"),
                pairAddress: stringField("Primary pair address")
              },
              ["address", "symbol", "chain", "chainLabel"]
            ),
            market: objectField(
              {
                priceUsd: numberField("Spot price in USD"),
                priceText: stringField("Formatted spot price"),
                marketCapText: stringField("Formatted market cap"),
                fdvText: stringField("Formatted FDV"),
                liquidityText: stringField("Formatted liquidity"),
                volume24hText: stringField("Formatted 24h volume"),
                priceChange24hText: stringField("Formatted 24h price change"),
                txCount24hText: stringField("Formatted 24h transaction count")
              },
              ["priceUsd", "priceText", "liquidityText", "volume24hText"]
            ),
            risk: objectField(
              {
                verdict: enumField(verdictEnum, "Action verdict"),
                riskLevel: stringField("Risk level label"),
                riskScore: numberField("Risk score"),
                top10Pct: numberField("Top 10 holder concentration percentage"),
                honeypot: booleanField("Whether honeypot flag is set"),
                buyTax: numberField("Buy tax percentage"),
                sellTax: numberField("Sell tax percentage"),
                contractPosture: stringField("Contract posture summary"),
                liquidityEventText: stringField("Latest liquidity event summary")
              },
              ["verdict", "riskLevel", "riskScore", "top10Pct", "honeypot"]
            ),
            wallet: objectField(
              {
                signalTag: stringField("Primary signal tag"),
                signalCount: integerField("Signal action count"),
                signalWalletAddress: stringField("Lead wallet address"),
                signalWalletAlias: stringField("Lead wallet alias"),
                walletWinRate: numberField("Lead wallet win rate"),
                tokenProfitText: stringField("Lead wallet token PnL summary"),
                latestWalletAction: stringField("Latest lead wallet action summary")
              },
              ["signalTag", "signalCount", "signalWalletAddress", "walletWinRate"]
            ),
            tradeContext: tradeContextSchema,
            reasons: arrayField(stringField("Reason item"), "Decision reasons")
          },
          ["token", "market", "risk", "wallet", "tradeContext", "reasons"]
        )
      )
    },
    risk_guard: {
      group: "data",
      summary: bilingual("提取风险拦截结果。", "Get structured risk guard output."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Token chain"),
          tokenAddress: stringField("Token address")
        },
        ["chain", "tokenAddress"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            verdict: enumField(verdictEnum, "Action verdict"),
            riskLevel: stringField("Risk level label"),
            riskScore: numberField("Risk score"),
            honeypot: booleanField("Whether honeypot flag is set"),
            buyTax: numberField("Buy tax percentage"),
            sellTax: numberField("Sell tax percentage"),
            top10Pct: numberField("Top 10 holder concentration percentage"),
            contractPosture: stringField("Contract posture summary"),
            liquidityEventText: stringField("Latest liquidity event summary"),
            topHolders: arrayField(
              objectField(
                {
                  address: stringField("Holder address"),
                  percent: numberField("Holder percentage"),
                  quantity: stringField("Holder quantity"),
                  tag: stringField("Holder tag")
                },
                ["address", "percent"]
              ),
              "Top holder rows"
            ),
            blockers: arrayField(stringField("Blocker reason"), "Risk blocker list")
          },
          ["verdict", "riskLevel", "riskScore", "honeypot", "top10Pct", "topHolders", "blockers"]
        )
      )
    },
    wallet_intel: {
      group: "data",
      summary: bilingual("提取聪明钱包情报。", "Get structured smart wallet intelligence."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Token chain"),
          tokenAddress: stringField("Token address")
        },
        ["chain", "tokenAddress"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            signalTag: stringField("Primary signal tag"),
            signalCount: integerField("Signal action count"),
            leadWallet: objectField(
              {
                address: stringField("Lead wallet address"),
                alias: stringField("Lead wallet alias"),
                winRate: numberField("Lead wallet win rate"),
                tokenProfitText: stringField("Lead wallet token PnL summary"),
                latestAction: stringField("Lead wallet latest action summary")
              },
              ["address", "alias", "winRate", "latestAction"]
            ),
            recentTransactions: arrayField(objectField({}, [], "Recent wallet transaction row"), "Recent matched wallet transactions")
          },
          ["signalTag", "signalCount", "leadWallet", "recentTransactions"]
        )
      )
    },
    smart_signal_lookup: {
      group: "data",
      summary: bilingual("按 token 查询公开 smart signal。", "Lookup public smart signals for a token."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Token chain"),
          tokenAddress: stringField("Token address"),
          pageSize: integerField("Source page size", {
            minimum: 1,
            maximum: 100,
            default: 50
          }),
          pageNo: integerField("Source page number", {
            minimum: 1,
            default: 1
          }),
          maxMatches: integerField("Maximum matches to return", {
            minimum: 1,
            maximum: 50,
            default: 10
          })
        },
        ["chain", "tokenAddress"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            tokenAddress: stringField("Token address"),
            symbol: stringField("Resolved token symbol"),
            totalMatches: integerField("Matched public signals count"),
            matches: arrayField(objectField({}, [], "Matched signal row"), "Matched public signals"),
            leadAction: objectField({}, [], "Lead action from the strongest matched signal")
          },
          ["tokenAddress", "symbol", "totalMatches", "matches", "leadAction"]
        )
      )
    },
    trade_quote: {
      group: "chain_wallet",
      summary: bilingual("获取 Chain Wallet quote。", "Get a chain-wallet quote."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Token chain"),
          tokenAddress: stringField("Target token address"),
          side: enumField(tradeSideEnum, "buy or sell", { default: "buy" }),
          amount: numberField("Human-readable input amount", { minimum: 0 }),
          useMev: booleanField("Whether to request MEV-aware hints", { default: false })
        },
        ["chain", "tokenAddress", "side", "amount"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            quote: objectField(
              {
                side: enumField(tradeSideEnum, "Swap side"),
                inputSymbol: stringField("Input token symbol"),
                inputTokenAddress: stringField("Input token address"),
                inputAmount: numberField("Input amount in human units"),
                outputSymbol: stringField("Output token symbol"),
                outputTokenAddress: stringField("Output token address"),
                estimatedAmount: numberField("Estimated output amount in human units"),
                spender: stringField("Approval spender address"),
                requiresApproval: booleanField("Whether approval is needed before execution")
              },
              ["side", "inputSymbol", "inputTokenAddress", "inputAmount", "outputSymbol", "outputTokenAddress", "estimatedAmount", "requiresApproval"]
            ),
            hints: objectField(
              {
                slippageBps: integerField("Suggested slippage in bps"),
                gasTipLow: stringField("Low gas tip"),
                gasTipAverage: stringField("Average gas tip"),
                gasTipHigh: stringField("High gas tip"),
                gasLimit: stringField("Gas limit estimate")
              },
              ["slippageBps", "gasTipLow", "gasTipAverage", "gasTipHigh", "gasLimit"]
            ),
            tradeContext: tradeContextSchema
          },
          ["quote", "hints", "tradeContext"]
        )
      )
    },
    trade_build_unsigned: {
      group: "chain_wallet",
      summary: bilingual("生成 Chain Wallet 未签名交易。", "Build an unsigned chain-wallet transaction."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Token chain"),
          tokenAddress: stringField("Target token address"),
          side: enumField(tradeSideEnum, "buy or sell", { default: "buy" }),
          amount: numberField("Human-readable input amount", { minimum: 0 }),
          walletAddress: stringField("Creator wallet address"),
          slippageBps: integerField("Manual slippage override in bps", {
            minimum: 1,
            maximum: 10000
          }),
          useMev: booleanField("Whether to request MEV-aware build", { default: false }),
          gasTier: enumField(gasTierEnum, "Preferred gas tier", { default: "average" })
        },
        ["chain", "tokenAddress", "side", "amount", "walletAddress"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            preflight: objectField(
              {
                approvalRequired: booleanField("Whether token approval is required"),
                spender: stringField("Approval spender address"),
                quote: objectField({}, [], "Quote snapshot used for build"),
                hints: objectField({}, [], "Hint snapshot used for build")
              },
              ["approvalRequired", "spender", "quote", "hints"]
            ),
            build: objectField(
              {
                side: enumField(tradeSideEnum, "Swap side"),
                requestTxId: stringField("Unsigned transaction request ID"),
                creatorAddress: stringField("Creator wallet address"),
                estimateAmount: numberField("Estimated output amount"),
                minReturnAmount: numberField("Minimum output amount"),
                appliedSlippage: numberField("Applied slippage in bps"),
                txTarget: stringField("Transaction target or label"),
                txValue: stringField("Transaction value"),
                gasLimit: stringField("Gas limit"),
                priorityFee: stringField("Priority fee"),
                bundleTip: stringField("Bundle tip"),
                recentBlockhash: stringField("Recent blockhash for Solana"),
                amms: arrayField(stringField("AMM name"), "AMM route list"),
                txPreviewSize: integerField("Preview payload size"),
                txContent: {
                  anyOf: [{ type: "null" }, { type: "string" }, { type: "object" }],
                  description: "Unsigned transaction payload"
                },
                txFormat: enumField(["solana_base64", "evm_object", "unknown"], "Unsigned payload format")
              },
              ["side", "requestTxId", "creatorAddress", "estimateAmount", "minReturnAmount", "appliedSlippage", "txPreviewSize", "txContent", "txFormat"]
            ),
            tradeContext: tradeContextSchema
          },
          ["preflight", "build", "tradeContext"]
        )
      )
    },
    trade_send_signed: {
      group: "chain_wallet",
      summary: bilingual("发送已签名 Chain Wallet 交易。", "Send a pre-signed chain-wallet transaction."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Execution chain"),
          requestTxId: stringField("Unsigned requestTxId"),
          signedTx: stringField("Signed transaction payload"),
          useMev: booleanField("Whether MEV mode is enabled", { default: false })
        },
        ["chain", "requestTxId", "signedTx"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            requestTxId: stringField("Echoed requestTxId"),
            txHash: stringField("Submitted transaction hash"),
            bundleId: stringField("Jito bundle ID for Solana MEV mode"),
            errorMessage: stringField("Chain-level error message"),
            useMev: booleanField("Whether MEV mode was enabled")
          },
          ["requestTxId", "txHash", "bundleId", "errorMessage", "useMev"]
        )
      )
    },
    trade_status: {
      group: "chain_wallet",
      summary: bilingual("按 txHash 查询 Chain Wallet 状态。", "Lookup chain-wallet status by tx hash."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Execution chain"),
          txHash: stringField("Transaction hash"),
          accountAddress: stringField("Wallet address used for tx detail lookup"),
          requestTxId: stringField("Optional requestTxId for state handoff")
        },
        ["chain", "txHash", "accountAddress"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            requestTxId: stringField("Echoed requestTxId when provided"),
            txHash: stringField("Transaction hash"),
            accountAddress: stringField("Wallet address used for lookup"),
            lookupType: enumField(["tx_hash_detail"], "Lookup mechanism"),
            status: enumField(["unknown", "observed", "confirmed", "error"], "Derived status"),
            confirmed: booleanField("Whether the tx appears confirmed"),
            detail: objectField({}, [], "Raw tx detail payload")
          },
          ["requestTxId", "txHash", "accountAddress", "lookupType", "status", "confirmed", "detail"]
        )
      )
    },
    delegate_wallet_list: {
      group: "delegate_wallet",
      summary: bilingual("列出 Delegate Wallet。", "List delegate wallets."),
      inputSchema: objectField(
        {
          assetsIds: arrayField(stringField("assetsId"), "Optional assetsId filter")
        },
        []
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            wallets: arrayField(walletSchema, "Delegate wallet list")
          },
          ["wallets"]
        )
      )
    },
    delegate_wallet_create: {
      group: "delegate_wallet",
      summary: bilingual("创建 Delegate Wallet。", "Create a delegate wallet."),
      inputSchema: objectField(
        {
          walletName: stringField("Delegate wallet display name")
        },
        ["walletName"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            wallet: {
              anyOf: [walletSchema, { type: "null" }],
              description: "Created delegate wallet"
            }
          },
          ["wallet"]
        )
      )
    },
    delegate_market_order: {
      group: "delegate_wallet",
      summary: bilingual("提交 Delegate Market Order。", "Submit a delegate market order."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Execution chain"),
          assetsId: stringField("Delegate wallet assetsId"),
          tokenAddress: stringField("Target token address"),
          side: enumField(tradeSideEnum, "buy or sell", { default: "buy" }),
          amount: numberField("Human-readable input amount", { minimum: 0 }),
          slippageBps: integerField("Manual slippage override in bps", {
            minimum: 1,
            maximum: 10000
          }),
          autoSlippage: booleanField("Whether to use auto slippage", { default: true }),
          autoGas: enumField(gasTierEnum, "Automatic gas tier", { default: "average" }),
          useMev: booleanField("Whether to enable MEV mode", { default: false })
        },
        ["chain", "assetsId", "tokenAddress", "side", "amount"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            orderType: enumField(delegateOrderTypeEnum, "Order type"),
            orderId: stringField("Delegate order ID"),
            approvalRequired: booleanField("Whether approval is likely required before sell"),
            tradeContext: tradeContextSchema
          },
          ["orderType", "orderId", "approvalRequired", "tradeContext"]
        )
      )
    },
    delegate_limit_order: {
      group: "delegate_wallet",
      summary: bilingual("提交 Delegate Limit Order。", "Submit a delegate limit order."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Execution chain"),
          assetsId: stringField("Delegate wallet assetsId"),
          tokenAddress: stringField("Target token address"),
          side: enumField(tradeSideEnum, "buy or sell", { default: "buy" }),
          amount: numberField("Human-readable input amount", { minimum: 0 }),
          limitPrice: numberField("Target USD trigger price", { minimum: 0 }),
          expireTime: integerField("Expiry in seconds", {
            minimum: 60,
            default: 604800
          }),
          slippageBps: integerField("Manual slippage override in bps", {
            minimum: 1,
            maximum: 10000
          }),
          autoSlippage: booleanField("Whether to use auto slippage", { default: true }),
          autoGas: enumField(gasTierEnum, "Automatic gas tier", { default: "average" }),
          useMev: booleanField("Whether to enable MEV mode", { default: false })
        },
        ["chain", "assetsId", "tokenAddress", "side", "amount", "limitPrice"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            orderType: enumField(delegateOrderTypeEnum, "Order type"),
            orderId: stringField("Delegate order ID"),
            limitPrice: numberField("Limit price in USD"),
            expireTime: integerField("Expiry in seconds"),
            approvalRequired: booleanField("Whether approval is likely required before sell"),
            tradeContext: tradeContextSchema
          },
          ["orderType", "orderId", "limitPrice", "expireTime", "approvalRequired", "tradeContext"]
        )
      )
    },
    delegate_order_status: {
      group: "delegate_wallet",
      summary: bilingual("查询 Delegate Order 状态。", "Lookup delegate order status."),
      inputSchema: objectField(
        {
          chain: enumField(chainEnum, "Execution chain"),
          assetsId: stringField("Delegate wallet assetsId"),
          orderId: stringField("Delegate order ID"),
          orderType: enumField(delegateOrderTypeEnum, "Order type")
        },
        ["chain", "assetsId", "orderId", "orderType"]
      ),
      responseSchema: buildResponseSchema(
        objectField(
          {
            orderType: enumField(delegateOrderTypeEnum, "Order type"),
            orderId: stringField("Delegate order ID"),
            status: stringField("Order status"),
            chain: enumField(chainEnum, "Execution chain"),
            swapType: enumField(["", ...tradeSideEnum], "Swap side"),
            txHash: stringField("Execution tx hash"),
            errorMessage: stringField("Error message"),
            txPriceUsd: stringField("Execution price in USD"),
            inAmount: stringField("Raw input amount"),
            outAmount: stringField("Raw output amount"),
            limitPrice: stringField("Limit price in USD"),
            createPrice: stringField("Creation price in USD"),
            expireAt: stringField("Expiry timestamp"),
            trailingPriceChange: stringField("Trailing change in bps")
          },
          ["orderType", "orderId", "status", "chain", "swapType", "txHash", "errorMessage"]
        )
      )
    }
  }
};

export function getSkillDefinition(name) {
  return skillRegistry.skills[name] ?? null;
}

export function listSkillDefinitions() {
  return Object.entries(skillRegistry.skills).map(([name, definition]) => ({
    name,
    group: definition.group,
    summary: definition.summary
  }));
}
