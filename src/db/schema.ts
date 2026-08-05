import { pgTable, text, timestamp, numeric, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  role: text("role").default("trader"),
  traderType: text("trader_type").default("day_trader"),
  balance: numeric("balance", { precision: 14, scale: 2 }).default("50000.00").notNull(),
  initialBalance: numeric("initial_balance", { precision: 14, scale: 2 }).default("50000.00").notNull(),
  liveBalance: numeric("live_balance", { precision: 14, scale: 2 }).default("0.00").notNull(),
  currency: text("currency").default("USD").notNull(),
  riskMode: text("risk_mode").default("moderate").notNull(),
  maxDailyLoss: numeric("max_daily_loss", { precision: 10, scale: 2 }).default("1500.00"),
  maxLeverage: integer("max_leverage").default(10),
  autoTradingEnabled: boolean("auto_trading_enabled").default(true),
  soundEffects: boolean("sound_effects").default(true),
  theme: text("theme").default("dark"),
  apiKeySimulation: boolean("api_key_simulation").default(true),
  tradingMode: text("trading_mode").default("paper").notNull(), // paper | live
  isLiveVerified: boolean("is_live_verified").default(false),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  dailyPnl: numeric("daily_pnl", { precision: 12, scale: 2 }).default("0.00"),
  dailyPnlResetAt: timestamp("daily_pnl_reset_at", { withTimezone: true }),
  totalRealizedPnl: numeric("total_realized_pnl", { precision: 14, scale: 2 }).default("0.00"),
  scanIntervalSeconds: integer("scan_interval_seconds").default(45),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const strategies = pgTable("strategies", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  traderTypeMatch: text("trader_type_match").default("all"),
  timeframes: jsonb("timeframes").$type<string[]>().notNull(),
  indicators: jsonb("indicators").$type<Record<string, any>>().notNull(),
  targetAssets: jsonb("target_assets").$type<string[]>().notNull(),
  weight: integer("weight").default(30).notNull(),
  minConfidence: integer("min_confidence").default(75).notNull(),
  stopLossPercent: numeric("stop_loss_percent", { precision: 5, scale: 2 }).default("2.00").notNull(),
  takeProfitPercent: numeric("take_profit_percent", { precision: 5, scale: 2 }).default("5.50").notNull(),
  trailingStop: boolean("trailing_stop").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  winRate: numeric("win_rate", { precision: 5, scale: 2 }).default("68.50"),
  totalTradesCount: integer("total_trades_count").default(0),
  profitFactor: numeric("profit_factor", { precision: 5, scale: 2 }).default("2.35"),
  isCustom: boolean("is_custom").default(false),
  aiPromptOrigin: text("ai_prompt_origin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const botConfigs = pgTable("bot_configs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  selectedStrategyIds: jsonb("selected_strategy_ids").$type<Array<{ strategyId: string; weight: number }>>().notNull(),
  confluenceThreshold: integer("confluence_threshold").default(75).notNull(),
  tradeAllocationType: text("trade_allocation_type").default("percent").notNull(),
  tradeAllocationValue: numeric("trade_allocation_value", { precision: 10, scale: 2 }).default("5.00").notNull(),
  maxOpenTrades: integer("max_open_trades").default(4).notNull(),
  allowedMarkets: jsonb("allowed_markets").$type<string[]>().notNull(),
  executionMode: text("execution_mode").default("autonomous").notNull(),
  defaultLeverage: integer("default_leverage").default(5).notNull(),
  lastScanAt: timestamp("last_scan_at", { withTimezone: true }).defaultNow(),
  totalBotTrades: integer("total_bot_trades").default(0),
  botPnl: numeric("bot_pnl", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const trades = pgTable("trades", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  botConfigId: text("bot_config_id"),
  symbol: text("symbol").notNull(),
  market: text("market").notNull(),
  type: text("type").notNull(),
  status: text("status").default("OPEN").notNull(),
  entryPrice: numeric("entry_price", { precision: 14, scale: 4 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 14, scale: 4 }),
  currentPrice: numeric("current_price", { precision: 14, scale: 4 }).notNull(),
  quantity: numeric("quantity", { precision: 14, scale: 6 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  leverage: integer("leverage").default(1).notNull(),
  stopLoss: numeric("stop_loss", { precision: 14, scale: 4 }),
  takeProfit: numeric("take_profit", { precision: 14, scale: 4 }),
  trailingStop: boolean("trailing_stop").default(false).notNull(),
  trailingDistance: numeric("trailing_distance", { precision: 5, scale: 2 }),
  pnl: numeric("pnl", { precision: 12, scale: 2 }).default("0.00").notNull(),
  pnlPercent: numeric("pnl_percent", { precision: 8, scale: 2 }).default("0.00").notNull(),
  strategyUsed: text("strategy_used").notNull(),
  strategyConfluence: jsonb("strategy_confluence").$type<Array<{ name: string; weight: number; signal: string; score: number }>>(),
  aiConfidence: integer("ai_confidence").default(85).notNull(),
  aiReasoning: text("ai_reasoning").notNull(),
  executionType: text("execution_type").default("ai_autonomous").notNull(),
  tradingMode: text("trading_mode").default("paper").notNull(), // paper | live
  exchangeOrderId: text("exchange_order_id"),
  entryTime: timestamp("entry_time", { withTimezone: true }).defaultNow().notNull(),
  exitTime: timestamp("exit_time", { withTimezone: true }),
  closeReason: text("close_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const watchlists = pgTable("watchlists", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  market: text("market").notNull(),
  alertHigh: numeric("alert_high", { precision: 14, scale: 4 }),
  alertLow: numeric("alert_low", { precision: 14, scale: 4 }),
  aiSentiment: text("ai_sentiment").default("BULLISH"),
  aiScore: integer("ai_score").default(80),
  favorite: boolean("favorite").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const backtests = pgTable("backtests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  dateRange: text("date_range").notNull(),
  strategyIds: jsonb("strategy_ids").$type<string[]>().notNull(),
  initialCapital: numeric("initial_capital", { precision: 12, scale: 2 }).default("10000.00").notNull(),
  finalCapital: numeric("final_capital", { precision: 12, scale: 2 }).notNull(),
  totalReturnPercent: numeric("total_return_percent", { precision: 8, scale: 2 }).notNull(),
  winRate: numeric("win_rate", { precision: 5, scale: 2 }).notNull(),
  profitFactor: numeric("profit_factor", { precision: 5, scale: 2 }).notNull(),
  maxDrawdown: numeric("max_drawdown", { precision: 5, scale: 2 }).notNull(),
  sharpeRatio: numeric("sharpe_ratio", { precision: 5, scale: 2 }).notNull(),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  equityCurve: jsonb("equity_curve").$type<Array<{ date: string; equity: number; benchmark: number }>>().notNull(),
  tradeLogs: jsonb("trade_logs").$type<Array<{
    id: string;
    type: string;
    entryDate: string;
    exitDate: string;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
    reason: string;
  }>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  messages: jsonb("messages").$type<Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    suggestedStrategy?: any;
    tradeIdea?: any;
    timestamp: string;
  }>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ===== NEW TABLES FOR LIVE ACCOUNT, PRICE SCAN, EXCHANGE KEYS, ALERTS =====

export const exchangeKeys = pgTable("exchange_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  exchangeName: text("exchange_name").notNull(), // binance, bybit, alpaca, interactive_brokers, coinbase, kraken, okx
  label: text("label").notNull(), // e.g. "My Binance Futures"
  apiKey: text("api_key").notNull(), // stored encrypted-at-rest in prod
  apiSecret: text("api_secret").notNull(),
  passphrase: text("passphrase"), // for exchanges that need a passphrase (Coinbase, OKX)
  subAccount: text("sub_account"), // optional sub-account
  permissions: jsonb("permissions").$type<string[]>().default(["read", "trade"]),
  isTestnet: boolean("is_testnet").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  connectionStatus: text("connection_status").default("disconnected").notNull(), // connected, disconnected, error, rate_limited
  lastPingMs: integer("last_ping_ms"),
  lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
  lastError: text("last_error"),
  ipWhitelist: text("ip_whitelist"),
  totalTradesViaKey: integer("total_trades_via_key").default(0),
  totalVolume: numeric("total_volume", { precision: 14, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const priceAlerts = pgTable("price_alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  market: text("market").notNull(),
  alertType: text("alert_type").notNull(), // price_above, price_below, pct_change_up, pct_change_down, rsi_overbought, rsi_oversold, confluence_trigger
  targetValue: numeric("target_value", { precision: 14, scale: 4 }).notNull(),
  currentValue: numeric("current_value", { precision: 14, scale: 4 }),
  condition: text("condition").default(">=").notNull(), // >=, <=, ==, crosses_above, crosses_below
  isActive: boolean("is_active").default(true).notNull(),
  isTriggered: boolean("is_triggered").default(false).notNull(),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }),
  repeatAfterMinutes: integer("repeat_after_minutes"), // null = one-shot, number = repeat cooldown
  lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
  notificationChannels: jsonb("notification_channels").$type<string[]>().default(["in_app", "sound"]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scanSchedules = pgTable("scan_schedules", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  intervalSeconds: integer("interval_seconds").default(30).notNull(), // 10, 15, 30, 60, 120, 300
  targetMarkets: jsonb("target_markets").$type<string[]>().notNull(), // ['crypto', 'stocks', 'forex']
  targetSymbols: jsonb("target_symbols").$type<string[]>(), // null = all in markets, or specific list
  scanType: text("scan_type").default("confluence").notNull(), // confluence, breakout_only, volume_spike, rsi_extreme, macd_cross, custom
  minConfluenceScore: integer("min_confluence_score").default(75),
  autoExecute: boolean("auto_execute").default(false).notNull(), // if true, AI auto-takes the trade
  strategyIds: jsonb("strategy_ids").$type<string[]>(), // strategies to evaluate
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunDurationMs: integer("last_run_duration_ms"),
  totalScansRun: integer("total_scans_run").default(0),
  totalSignalsFound: integer("total_signals_found").default(0),
  totalAutoTrades: integer("total_auto_trades").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const priceFeedSnapshots = pgTable("price_feed_snapshots", {
  id: text("id").primaryKey(),
  symbol: text("symbol").notNull(),
  market: text("market").notNull(),
  price: numeric("price", { precision: 14, scale: 4 }).notNull(),
  bid: numeric("bid", { precision: 14, scale: 4 }),
  ask: numeric("ask", { precision: 14, scale: 4 }),
  volume24h: numeric("volume_24h", { precision: 16, scale: 2 }),
  change24h: numeric("change_24h", { precision: 8, scale: 4 }),
  high24h: numeric("high_24h", { precision: 14, scale: 4 }),
  low24h: numeric("low_24h", { precision: 14, scale: 4 }),
  source: text("source").default("internal").notNull(), // internal, binance, bybit, polygon, etc
  rsi14: numeric("rsi_14", { precision: 5, scale: 2 }),
  emaShort: numeric("ema_short", { precision: 14, scale: 4 }),
  emaLong: numeric("ema_long", { precision: 14, scale: 4 }),
  macdSignal: text("macd_signal"),
  confluenceScore: integer("confluence_score"),
  trendStatus: text("trend_status"),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type BotConfig = typeof botConfigs.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Watchlist = typeof watchlists.$inferSelect;
export type Backtest = typeof backtests.$inferSelect;
export type AiConversation = typeof aiConversations.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ExchangeKey = typeof exchangeKeys.$inferSelect;
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type ScanSchedule = typeof scanSchedules.$inferSelect;
export type PriceFeedSnapshot = typeof priceFeedSnapshots.$inferSelect;
