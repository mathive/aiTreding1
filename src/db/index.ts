// Lazy initialization of database — runs once, only on server
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "nexus.db");

// Full table creation SQL
const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT, avatar TEXT,
  role TEXT DEFAULT 'trader', trader_type TEXT DEFAULT 'day_trader',
  balance TEXT DEFAULT '0.00' NOT NULL, initial_balance TEXT DEFAULT '0.00' NOT NULL,
  live_balance TEXT DEFAULT '0.00' NOT NULL, currency TEXT DEFAULT 'USD' NOT NULL,
  risk_mode TEXT DEFAULT 'moderate' NOT NULL, max_daily_loss TEXT DEFAULT '0.00',
  max_leverage INTEGER DEFAULT 10,
  auto_trading_enabled INTEGER DEFAULT 1, sound_effects INTEGER DEFAULT 1,
  theme TEXT DEFAULT 'dark', api_key_simulation INTEGER DEFAULT 1,
  trading_mode TEXT DEFAULT 'paper' NOT NULL,
  is_live_verified INTEGER DEFAULT 0, two_factor_enabled INTEGER DEFAULT 0,
  daily_pnl TEXT DEFAULT '0.00', daily_pnl_reset_at TEXT,
  total_realized_pnl TEXT DEFAULT '0.00', scan_interval_seconds INTEGER DEFAULT 45,
  created_at TEXT DEFAULT '' NOT NULL, updated_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL,
  category TEXT NOT NULL, trader_type_match TEXT DEFAULT 'all',
  timeframes TEXT NOT NULL, indicators TEXT NOT NULL, target_assets TEXT NOT NULL,
  weight INTEGER DEFAULT 30 NOT NULL, min_confidence INTEGER DEFAULT 75 NOT NULL,
  stop_loss_percent TEXT DEFAULT '2.00' NOT NULL, take_profit_percent TEXT DEFAULT '5.50' NOT NULL,
  trailing_stop INTEGER DEFAULT 1 NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL,
  win_rate TEXT DEFAULT '0.00', total_trades_count INTEGER DEFAULT 0,
  profit_factor TEXT DEFAULT '0.00', is_custom INTEGER DEFAULT 0,
  ai_prompt_origin TEXT, created_at TEXT DEFAULT '' NOT NULL, updated_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS bot_configs (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL, selected_strategy_ids TEXT NOT NULL,
  confluence_threshold INTEGER DEFAULT 75 NOT NULL, trade_allocation_type TEXT DEFAULT 'percent' NOT NULL,
  trade_allocation_value TEXT DEFAULT '5.00' NOT NULL, max_open_trades INTEGER DEFAULT 4 NOT NULL,
  allowed_markets TEXT NOT NULL, execution_mode TEXT DEFAULT 'autonomous' NOT NULL,
  default_leverage INTEGER DEFAULT 5 NOT NULL,
  last_scan_at TEXT, total_bot_trades INTEGER DEFAULT 0, bot_pnl TEXT DEFAULT '0.00',
  created_at TEXT DEFAULT '' NOT NULL, updated_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, bot_config_id TEXT,
  symbol TEXT NOT NULL, market TEXT NOT NULL, type TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN' NOT NULL, entry_price TEXT NOT NULL,
  exit_price TEXT, current_price TEXT NOT NULL,
  quantity TEXT NOT NULL, amount TEXT NOT NULL, leverage INTEGER DEFAULT 1 NOT NULL,
  stop_loss TEXT, take_profit TEXT, trailing_stop INTEGER DEFAULT 0 NOT NULL,
  trailing_distance TEXT, pnl TEXT DEFAULT '0.00' NOT NULL, pnl_percent TEXT DEFAULT '0.00' NOT NULL,
  strategy_used TEXT NOT NULL, strategy_confluence TEXT,
  ai_confidence INTEGER DEFAULT 85 NOT NULL, ai_reasoning TEXT NOT NULL,
  execution_type TEXT DEFAULT 'manual' NOT NULL, trading_mode TEXT DEFAULT 'paper' NOT NULL,
  exchange_order_id TEXT, entry_time TEXT DEFAULT '' NOT NULL,
  exit_time TEXT, close_reason TEXT, notes TEXT,
  created_at TEXT DEFAULT '' NOT NULL, updated_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS watchlists (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  symbol TEXT NOT NULL, name TEXT NOT NULL, market TEXT NOT NULL,
  alert_high TEXT, alert_low TEXT, ai_sentiment TEXT DEFAULT 'NEUTRAL',
  ai_score INTEGER DEFAULT 50, favorite INTEGER DEFAULT 1,
  notes TEXT, created_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS backtests (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  symbol TEXT NOT NULL, timeframe TEXT NOT NULL, date_range TEXT NOT NULL,
  strategy_ids TEXT NOT NULL, initial_capital TEXT DEFAULT '10000.00' NOT NULL,
  final_capital TEXT NOT NULL, total_return_percent TEXT NOT NULL,
  win_rate TEXT NOT NULL, profit_factor TEXT NOT NULL,
  max_drawdown TEXT NOT NULL, sharpe_ratio TEXT NOT NULL,
  total_trades INTEGER NOT NULL, winning_trades INTEGER NOT NULL,
  losing_trades INTEGER NOT NULL, equity_curve TEXT NOT NULL,
  trade_logs TEXT NOT NULL, created_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
  messages TEXT NOT NULL, created_at TEXT DEFAULT '' NOT NULL,
  updated_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
  message TEXT NOT NULL, type TEXT NOT NULL, is_read INTEGER DEFAULT 0 NOT NULL,
  metadata TEXT, created_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS exchange_keys (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, exchange_name TEXT NOT NULL,
  label TEXT NOT NULL, api_key TEXT NOT NULL, api_secret TEXT NOT NULL,
  passphrase TEXT, sub_account TEXT, permissions TEXT DEFAULT '["read","trade"]',
  is_testnet INTEGER DEFAULT 1 NOT NULL, is_active INTEGER DEFAULT 1 NOT NULL,
  connection_status TEXT DEFAULT 'disconnected' NOT NULL,
  last_ping_ms INTEGER, last_connected_at TEXT, last_error TEXT,
  ip_whitelist TEXT, total_trades_via_key INTEGER DEFAULT 0,
  total_volume TEXT DEFAULT '0.00', created_at TEXT DEFAULT '' NOT NULL,
  updated_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS price_alerts (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, symbol TEXT NOT NULL,
  name TEXT NOT NULL, market TEXT NOT NULL, alert_type TEXT NOT NULL,
  target_value TEXT NOT NULL, current_value TEXT, condition TEXT DEFAULT '>=' NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL, is_triggered INTEGER DEFAULT 0 NOT NULL,
  triggered_at TEXT, repeat_after_minutes INTEGER, last_notified_at TEXT,
  notification_channels TEXT DEFAULT '["in_app","sound"]',
  notes TEXT, created_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS scan_schedules (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL, interval_seconds INTEGER DEFAULT 30 NOT NULL,
  target_markets TEXT NOT NULL, target_symbols TEXT,
  scan_type TEXT DEFAULT 'confluence' NOT NULL,
  min_confluence_score INTEGER DEFAULT 75,
  auto_execute INTEGER DEFAULT 0 NOT NULL, strategy_ids TEXT,
  last_run_at TEXT, last_run_duration_ms INTEGER,
  total_scans_run INTEGER DEFAULT 0, total_signals_found INTEGER DEFAULT 0,
  total_auto_trades INTEGER DEFAULT 0, created_at TEXT DEFAULT '' NOT NULL,
  updated_at TEXT DEFAULT '' NOT NULL
);
CREATE TABLE IF NOT EXISTS price_feed_snapshots (
  id TEXT PRIMARY KEY, symbol TEXT NOT NULL, market TEXT NOT NULL,
  price TEXT NOT NULL, bid TEXT, ask TEXT,
  volume_24h TEXT, change_24h TEXT, high_24h TEXT, low_24h TEXT,
  source TEXT DEFAULT 'internal' NOT NULL, rsi_14 TEXT,
  ema_short TEXT, ema_long TEXT, macd_signal TEXT,
  confluence_score INTEGER, trend_status TEXT,
  captured_at TEXT DEFAULT '' NOT NULL
);
`;

let sqliteInstance: Database.Database | null = null;
let initDone = false;

function getSQLite(): Database.Database {
  if (!sqliteInstance) {
    sqliteInstance = new Database(DB_PATH);
    sqliteInstance.pragma("journal_mode = WAL");
    sqliteInstance.pragma("foreign_keys = ON");
  }
  return sqliteInstance;
}

export function ensureTables() {
  if (initDone) return;
  try {
    const db = getSQLite();
    db.exec(CREATE_SQL);
    initDone = true;
    console.log("[DB] Tables ready — clean start.");
  } catch (err) {
    console.error("[DB] Table init failed:", (err as Error).message);
  }
}

// Initialize on import
ensureTables();

import { drizzle } from "drizzle-orm/better-sqlite3";
export const db = drizzle(getSQLite());
