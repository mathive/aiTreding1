import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  role: text("role").default("trader"),
  traderType: text("trader_type").default("day_trader"),
  balance: text("balance").default("50000.00").notNull(),
  initialBalance: text("initial_balance").default("50000.00").notNull(),
  liveBalance: text("live_balance").default("0.00").notNull(),
  currency: text("currency").default("USD").notNull(),
  riskMode: text("risk_mode").default("moderate").notNull(),
  maxDailyLoss: text("max_daily_loss").default("1500.00"),
  maxLeverage: integer("max_leverage").default(10),
  autoTradingEnabled: integer("auto_trading_enabled", { mode: "boolean" }).default(true),
  soundEffects: integer("sound_effects", { mode: "boolean" }).default(true),
  theme: text("theme").default("dark"),
  apiKeySimulation: integer("api_key_simulation", { mode: "boolean" }).default(true),
  tradingMode: text("trading_mode").default("paper").notNull(),
  isLiveVerified: integer("is_live_verified", { mode: "boolean" }).default(false),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(false),
  dailyPnl: text("daily_pnl").default("0.00"),
  dailyPnlResetAt: text("daily_pnl_reset_at"),
  totalRealizedPnl: text("total_realized_pnl").default("0.00"),
  scanIntervalSeconds: integer("scan_interval_seconds").default(45),
  createdAt: text("created_at").default("").notNull(),
  updatedAt: text("updated_at").default("").notNull(),
});

export const strategies = sqliteTable("strategies", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  name: text("name").notNull(), description: text("description").notNull(),
  category: text("category").notNull(), traderTypeMatch: text("trader_type_match").default("all"),
  timeframes: text("timeframes", { mode: "json" }).$type<string[]>().notNull(),
  indicators: text("indicators", { mode: "json" }).$type<Record<string, any>>().notNull(),
  targetAssets: text("target_assets", { mode: "json" }).$type<string[]>().notNull(),
  weight: integer("weight").default(30).notNull(),
  minConfidence: integer("min_confidence").default(75).notNull(),
  stopLossPercent: text("stop_loss_percent").default("2.00").notNull(),
  takeProfitPercent: text("take_profit_percent").default("5.50").notNull(),
  trailingStop: integer("trailing_stop", { mode: "boolean" }).default(true).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  winRate: text("win_rate").default("68.50"),
  totalTradesCount: integer("total_trades_count").default(0),
  profitFactor: text("profit_factor").default("2.35"),
  isCustom: integer("is_custom", { mode: "boolean" }).default(false),
  aiPromptOrigin: text("ai_prompt_origin"),
  createdAt: text("created_at").default("").notNull(),
  updatedAt: text("updated_at").default("").notNull(),
});

export const botConfigs = sqliteTable("bot_configs", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  selectedStrategyIds: text("selected_strategy_ids", { mode: "json" }).$type<Array<{ strategyId: string; weight: number }>>().notNull(),
  confluenceThreshold: integer("confluence_threshold").default(75).notNull(),
  tradeAllocationType: text("trade_allocation_type").default("percent").notNull(),
  tradeAllocationValue: text("trade_allocation_value").default("5.00").notNull(),
  maxOpenTrades: integer("max_open_trades").default(4).notNull(),
  allowedMarkets: text("allowed_markets", { mode: "json" }).$type<string[]>().notNull(),
  executionMode: text("execution_mode").default("autonomous").notNull(),
  defaultLeverage: integer("default_leverage").default(5).notNull(),
  lastScanAt: text("last_scan_at"),
  totalBotTrades: integer("total_bot_trades").default(0),
  botPnl: text("bot_pnl").default("0.00"),
  createdAt: text("created_at").default("").notNull(),
  updatedAt: text("updated_at").default("").notNull(),
});

export const trades = sqliteTable("trades", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  botConfigId: text("bot_config_id"), symbol: text("symbol").notNull(),
  market: text("market").notNull(), type: text("type").notNull(),
  status: text("status").default("OPEN").notNull(),
  entryPrice: text("entry_price").notNull(), exitPrice: text("exit_price"),
  currentPrice: text("current_price").notNull(), quantity: text("quantity").notNull(),
  amount: text("amount").notNull(), leverage: integer("leverage").default(1).notNull(),
  stopLoss: text("stop_loss"), takeProfit: text("take_profit"),
  trailingStop: integer("trailing_stop", { mode: "boolean" }).default(false).notNull(),
  trailingDistance: text("trailing_distance"),
  pnl: text("pnl").default("0.00").notNull(), pnlPercent: text("pnl_percent").default("0.00").notNull(),
  strategyUsed: text("strategy_used").notNull(),
  strategyConfluence: text("strategy_confluence", { mode: "json" }).$type<Array<{ name: string; weight: number; signal: string; score: number }>>(),
  aiConfidence: integer("ai_confidence").default(85).notNull(),
  aiReasoning: text("ai_reasoning").notNull(),
  executionType: text("execution_type").default("ai_autonomous").notNull(),
  tradingMode: text("trading_mode").default("paper").notNull(),
  exchangeOrderId: text("exchange_order_id"),
  entryTime: text("entry_time").default("").notNull(), exitTime: text("exit_time"),
  closeReason: text("close_reason"), notes: text("notes"),
  createdAt: text("created_at").default("").notNull(),
  updatedAt: text("updated_at").default("").notNull(),
});

export const watchlists = sqliteTable("watchlists", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(), name: text("name").notNull(),
  market: text("market").notNull(),
  alertHigh: text("alert_high"), alertLow: text("alert_low"),
  aiSentiment: text("ai_sentiment").default("BULLISH"),
  aiScore: integer("ai_score").default(80),
  favorite: integer("favorite", { mode: "boolean" }).default(true),
  notes: text("notes"), createdAt: text("created_at").default("").notNull(),
});

export const backtests = sqliteTable("backtests", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  name: text("name").notNull(), symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(), dateRange: text("date_range").notNull(),
  strategyIds: text("strategy_ids", { mode: "json" }).$type<string[]>().notNull(),
  initialCapital: text("initial_capital").default("10000.00").notNull(),
  finalCapital: text("final_capital").notNull(),
  totalReturnPercent: text("total_return_percent").notNull(),
  winRate: text("win_rate").notNull(), profitFactor: text("profit_factor").notNull(),
  maxDrawdown: text("max_drawdown").notNull(), sharpeRatio: text("sharpe_ratio").notNull(),
  totalTrades: integer("total_trades").notNull(), winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  equityCurve: text("equity_curve", { mode: "json" }).$type<Array<{ date: string; equity: number }>>().notNull(),
  tradeLogs: text("trade_logs", { mode: "json" }).$type<Array<any>>().notNull(),
  createdAt: text("created_at").default("").notNull(),
});

export const aiConversations = sqliteTable("ai_conversations", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  title: text("title").notNull(),
  messages: text("messages", { mode: "json" }).$type<Array<any>>().notNull(),
  createdAt: text("created_at").default("").notNull(),
  updatedAt: text("updated_at").default("").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  title: text("title").notNull(), message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false).notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, any>>(),
  createdAt: text("created_at").default("").notNull(),
});

export const exchangeKeys = sqliteTable("exchange_keys", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  exchangeName: text("exchange_name").notNull(), label: text("label").notNull(),
  apiKey: text("api_key").notNull(), apiSecret: text("api_secret").notNull(),
  passphrase: text("passphrase"), subAccount: text("sub_account"),
  permissions: text("permissions", { mode: "json" }).$type<string[]>().default(["read", "trade"]),
  isTestnet: integer("is_testnet", { mode: "boolean" }).default(true).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  connectionStatus: text("connection_status").default("disconnected").notNull(),
  lastPingMs: integer("last_ping_ms"),
  lastConnectedAt: text("last_connected_at"), lastError: text("last_error"),
  ipWhitelist: text("ip_whitelist"),
  totalTradesViaKey: integer("total_trades_via_key").default(0),
  totalVolume: text("total_volume").default("0.00"),
  createdAt: text("created_at").default("").notNull(),
  updatedAt: text("updated_at").default("").notNull(),
});

export const priceAlerts = sqliteTable("price_alerts", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  symbol: text("symbol").notNull(), name: text("name").notNull(),
  market: text("market").notNull(), alertType: text("alert_type").notNull(),
  targetValue: text("target_value").notNull(), currentValue: text("current_value"),
  condition: text("condition").default(">=").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  isTriggered: integer("is_triggered", { mode: "boolean" }).default(false).notNull(),
  triggeredAt: text("triggered_at"), repeatAfterMinutes: integer("repeat_after_minutes"),
  lastNotifiedAt: text("last_notified_at"),
  notificationChannels: text("notification_channels", { mode: "json" }).$type<string[]>().default(["in_app", "sound"]),
  notes: text("notes"), createdAt: text("created_at").default("").notNull(),
});

export const scanSchedules = sqliteTable("scan_schedules", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  intervalSeconds: integer("interval_seconds").default(30).notNull(),
  targetMarkets: text("target_markets", { mode: "json" }).$type<string[]>().notNull(),
  targetSymbols: text("target_symbols", { mode: "json" }).$type<string[]>(),
  scanType: text("scan_type").default("confluence").notNull(),
  minConfluenceScore: integer("min_confluence_score").default(75),
  autoExecute: integer("auto_execute", { mode: "boolean" }).default(false).notNull(),
  strategyIds: text("strategy_ids", { mode: "json" }).$type<string[]>(),
  lastRunAt: text("last_run_at"), lastRunDurationMs: integer("last_run_duration_ms"),
  totalScansRun: integer("total_scans_run").default(0),
  totalSignalsFound: integer("total_signals_found").default(0),
  totalAutoTrades: integer("total_auto_trades").default(0),
  createdAt: text("created_at").default("").notNull(),
  updatedAt: text("updated_at").default("").notNull(),
});

export const priceFeedSnapshots = sqliteTable("price_feed_snapshots", {
  id: text("id").primaryKey(), symbol: text("symbol").notNull(),
  market: text("market").notNull(), price: text("price").notNull(),
  bid: text("bid"), ask: text("ask"),
  volume24h: text("volume_24h"), change24h: text("change_24h"),
  high24h: text("high_24h"), low24h: text("low_24h"),
  source: text("source").default("internal").notNull(),
  rsi14: text("rsi_14"), emaShort: text("ema_short"), emaLong: text("ema_long"),
  macdSignal: text("macd_signal"), confluenceScore: integer("confluence_score"),
  trendStatus: text("trend_status"),
  capturedAt: text("captured_at").default("").notNull(),
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
