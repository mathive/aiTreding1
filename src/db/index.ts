// SQLite DB - auto-creates empty tables on first import
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "nexus.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  balance TEXT DEFAULT '0', initial_balance TEXT DEFAULT '0',
  currency TEXT DEFAULT 'USD', risk_mode TEXT DEFAULT 'moderate',
  max_daily_loss TEXT DEFAULT '0', max_leverage INTEGER DEFAULT 500,
  auto_trading_enabled INTEGER DEFAULT 1, sound_effects INTEGER DEFAULT 1,
  theme TEXT DEFAULT 'dark', api_key_simulation INTEGER DEFAULT 0,
  trading_mode TEXT DEFAULT 'live' NOT NULL,
  created_at TEXT DEFAULT '', updated_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  description TEXT NOT NULL, category TEXT NOT NULL,
  timeframes TEXT NOT NULL, indicators TEXT NOT NULL, target_assets TEXT NOT NULL,
  weight INTEGER DEFAULT 30, min_confidence INTEGER DEFAULT 75,
  stop_loss_percent TEXT DEFAULT '2.00', take_profit_percent TEXT DEFAULT '5.00',
  trailing_stop INTEGER DEFAULT 1, is_active INTEGER DEFAULT 1,
  win_rate TEXT DEFAULT '0', total_trades_count INTEGER DEFAULT 0,
  profit_factor TEXT DEFAULT '0', is_custom INTEGER DEFAULT 0,
  created_at TEXT DEFAULT '', updated_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL,
  is_read INTEGER DEFAULT 0, metadata TEXT, created_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS exchange_keys (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  exchange_name TEXT NOT NULL, label TEXT NOT NULL,
  api_key TEXT NOT NULL, api_secret TEXT NOT NULL,
  is_testnet INTEGER DEFAULT 1, is_active INTEGER DEFAULT 1,
  connection_status TEXT DEFAULT 'disconnected',
  created_at TEXT DEFAULT '', updated_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  title TEXT NOT NULL, messages TEXT NOT NULL,
  created_at TEXT DEFAULT '', updated_at TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS backtests (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  symbol TEXT NOT NULL, timeframe TEXT NOT NULL, date_range TEXT NOT NULL,
  strategy_ids TEXT NOT NULL, initial_capital TEXT DEFAULT '10000',
  final_capital TEXT NOT NULL, total_return_percent TEXT NOT NULL,
  win_rate TEXT NOT NULL, profit_factor TEXT NOT NULL,
  max_drawdown TEXT NOT NULL, sharpe_ratio TEXT NOT NULL,
  total_trades INTEGER NOT NULL,
  winning_trades INTEGER NOT NULL, losing_trades INTEGER NOT NULL,
  equity_curve TEXT NOT NULL, trade_logs TEXT NOT NULL,
  created_at TEXT DEFAULT ''
);
`);

import { drizzle } from "drizzle-orm/better-sqlite3";
export const db = drizzle(sqlite);
sqlite.pragma("table_info"); // warm up
