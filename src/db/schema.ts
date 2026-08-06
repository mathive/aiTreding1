// Minimal Drizzle schema — matches actual SQLite tables in db/index.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  balance: text("balance").default("0"),
  initialBalance: text("initial_balance").default("0"),
  currency: text("currency").default("USD"),
  riskMode: text("risk_mode").default("moderate"),
  maxDailyLoss: text("max_daily_loss").default("0"),
  maxLeverage: integer("max_leverage").default(500),
  autoTradingEnabled: integer("auto_trading_enabled", { mode: "boolean" }).default(true),
  soundEffects: integer("sound_effects", { mode: "boolean" }).default(true),
  theme: text("theme").default("dark"),
  apiKeySimulation: integer("api_key_simulation", { mode: "boolean" }).default(false),
  tradingMode: text("trading_mode").default("live"),
  createdAt: text("created_at").default(""),
  updatedAt: text("updated_at").default(""),
});

export const strategies = sqliteTable("strategies", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  name: text("name").notNull(), description: text("description").notNull(),
  category: text("category").notNull(),
  timeframes: text("timeframes", { mode: "json" }).$type<string[]>().notNull(),
  indicators: text("indicators", { mode: "json" }).$type<Record<string, any>>().notNull(),
  targetAssets: text("target_assets", { mode: "json" }).$type<string[]>().notNull(),
  weight: integer("weight").default(30),
  minConfidence: integer("min_confidence").default(75),
  stopLossPercent: text("stop_loss_percent").default("2.00"),
  takeProfitPercent: text("take_profit_percent").default("5.00"),
  trailingStop: integer("trailing_stop", { mode: "boolean" }).default(true),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  winRate: text("win_rate").default("0"),
  totalTradesCount: integer("total_trades_count").default(0),
  profitFactor: text("profit_factor").default("0"),
  isCustom: integer("is_custom", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(""),
  updatedAt: text("updated_at").default(""),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  title: text("title").notNull(), message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, any>>(),
  createdAt: text("created_at").default(""),
});

export const exchangeKeys = sqliteTable("exchange_keys", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  exchangeName: text("exchange_name").notNull(), label: text("label").notNull(),
  apiKey: text("api_key").notNull(), apiSecret: text("api_secret").notNull(),
  isTestnet: integer("is_testnet", { mode: "boolean" }).default(true),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  connectionStatus: text("connection_status").default("disconnected"),
  createdAt: text("created_at").default(""),
  updatedAt: text("updated_at").default(""),
});

export const aiConversations = sqliteTable("ai_conversations", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  title: text("title").notNull(),
  messages: text("messages", { mode: "json" }).$type<Array<any>>().notNull(),
  createdAt: text("created_at").default(""),
  updatedAt: text("updated_at").default(""),
});

export const backtests = sqliteTable("backtests", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(),
  name: text("name").notNull(), symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(), dateRange: text("date_range").notNull(),
  strategyIds: text("strategy_ids", { mode: "json" }).$type<string[]>().notNull(),
  initialCapital: text("initial_capital").default("10000"),
  finalCapital: text("final_capital").notNull(),
  totalReturnPercent: text("total_return_percent").notNull(),
  winRate: text("win_rate").notNull(), profitFactor: text("profit_factor").notNull(),
  maxDrawdown: text("max_drawdown").notNull(), sharpeRatio: text("sharpe_ratio").notNull(),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  equityCurve: text("equity_curve", { mode: "json" }).$type<any>().notNull(),
  tradeLogs: text("trade_logs", { mode: "json" }).$type<any>().notNull(),
  createdAt: text("created_at").default(""),
});

export type User = typeof users.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ExchangeKey = typeof exchangeKeys.$inferSelect;
export type AiConversation = typeof aiConversations.$inferSelect;
export type Backtest = typeof backtests.$inferSelect;
