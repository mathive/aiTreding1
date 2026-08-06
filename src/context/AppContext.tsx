"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MarketAsset } from "@/lib/market-data";
import { formatCurrency, playSound } from "@/lib/utils";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  traderType: string;
  balance: string;
  initialBalance: string;
  liveBalance?: string;
  currency: string;
  riskMode: string;
  maxDailyLoss: string;
  maxLeverage: number;
  autoTradingEnabled: boolean;
  soundEffects: boolean;
  theme: string;
  apiKeySimulation: boolean;
  tradingMode: string; // paper | live
  isLiveVerified?: boolean;
  twoFactorEnabled?: boolean;
  scanIntervalSeconds?: number;
}

export interface StrategyItem {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  traderTypeMatch: string;
  timeframes: string[];
  indicators: Record<string, any>;
  targetAssets: string[];
  weight: number;
  minConfidence: number;
  stopLossPercent: string;
  takeProfitPercent: string;
  trailingStop: boolean;
  isActive: boolean;
  winRate: string;
  totalTradesCount: number;
  profitFactor: string;
  isCustom?: boolean;
  aiPromptOrigin?: string;
}

export interface BotConfigItem {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  selectedStrategyIds: Array<{ strategyId: string; weight: number }>;
  confluenceThreshold: number;
  tradeAllocationType: string;
  tradeAllocationValue: string;
  maxOpenTrades: number;
  allowedMarkets: string[];
  executionMode: string;
  defaultLeverage: number;
  lastScanAt?: string;
  totalBotTrades: number;
  botPnl: string;
}

export interface TradeItem {
  id: string;
  userId: string;
  botConfigId?: string | null;
  symbol: string;
  market: string;
  type: string;
  status: string;
  entryPrice: string;
  exitPrice?: string | null;
  currentPrice: string;
  quantity: string;
  amount: string;
  leverage: number;
  stopLoss?: string | null;
  takeProfit?: string | null;
  trailingStop: boolean;
  trailingDistance?: string | null;
  pnl: string;
  pnlPercent: string;
  strategyUsed: string;
  strategyConfluence?: Array<{ name: string; weight: number; signal: string; score: number }> | null;
  aiConfidence: number;
  aiReasoning: string;
  executionType: string;
  entryTime: string;
  exitTime?: string | null;
  closeReason?: string | null;
  notes?: string | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  market: string;
  alertHigh?: string | null;
  alertLow?: string | null;
  aiSentiment?: string;
  aiScore?: number;
  favorite: boolean;
  notes?: string | null;
  currentPrice?: number;
  change24h?: number;
  trendStatus?: string;
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserAccount | null;
  availableUsers: UserAccount[];
  strategies: StrategyItem[];
  botConfig: BotConfigItem | null;
  trades: TradeItem[];
  openTrades: TradeItem[];
  closedTrades: TradeItem[];
  marketAssets: MarketAsset[];
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  watchlists: WatchlistItem[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  isLoading: boolean;
  isScanning: boolean;
  toastMessage: { text: string; type: "success" | "error" | "info" } | null;
  showToast: (text: string, type?: "success" | "error" | "info") => void;

  // Actions
  refreshAllData: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  createAndSwitchUser: (name: string, traderType: string, initialBalance: number) => Promise<void>;
  updateUserSettings: (settings: Partial<UserAccount>) => Promise<void>;
  resetBalance: () => Promise<void>;

  // Strategies CRUD
  createStrategy: (strategy: Partial<StrategyItem>) => Promise<boolean>;
  updateStrategy: (id: string, updates: Partial<StrategyItem>) => Promise<boolean>;
  deleteStrategy: (id: string) => Promise<boolean>;
  toggleStrategyActive: (id: string, active: boolean) => Promise<boolean>;

  // Bot Actions
  updateBotConfig: (updates: Partial<BotConfigItem>) => Promise<boolean>;
  runScanAndTrade: (forceExecute?: boolean, targetSymbol?: string) => Promise<any>;

  // Trades CRUD & Close
  executeTrade: (tradeData: any) => Promise<boolean>;
  updateTrade: (id: string, updates: Partial<TradeItem>) => Promise<boolean>;
  closeTrade: (id: string, closePercent?: number, closeReason?: string) => Promise<boolean>;
  deleteTrade: (id: string) => Promise<boolean>;

  // Watchlist CRUD
  addToWatchlist: (symbol: string) => Promise<boolean>;
  removeFromWatchlist: (id: string) => Promise<boolean>;
  toggleWatchlistFavorite: (id: string, current: boolean) => Promise<boolean>;

  // Notifications
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // MT5 bridge state
  mt5Connected: boolean;
  setMt5Connected: (v: boolean) => void;
  orderModalSymbol: string | null;
  setOrderModalSymbol: (symbol: string | null) => void;
  editTradeModalItem: TradeItem | null;
  setEditTradeModalItem: (trade: TradeItem | null) => void;
  isCreateStratModalOpen: boolean;
  setIsCreateStratModalOpen: (open: boolean) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [user, setUser] = useState<UserAccount | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>([]);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfigItem | null>(null);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC/USDT");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Modals
  const [orderModalSymbol, setOrderModalSymbol] = useState<string | null>(null);
  const [editTradeModalItem, setEditTradeModalItem] = useState<TradeItem | null>(null);
  const [isCreateStratModalOpen, setIsCreateStratModalOpen] = useState<boolean>(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [mt5Connected, setMt5Connected] = useState<boolean>(false);

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      // Fetch users
      const userRes = await fetch("/api/users");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setAvailableUsers(userData.availableUsers || []);
      }

      // Fetch strategies
      const stratRes = await fetch("/api/strategies");
      if (stratRes.ok) {
        const stratData = await stratRes.json();
        setStrategies(stratData.strategies || []);
      }

      // Fetch bot config
      const botRes = await fetch("/api/bot");
      if (botRes.ok) {
        const botData = await botRes.json();
        setBotConfig(botData.bot?.isActive !== undefined ? botData.bot : null);
      }

      // Fetch trades — sync from MT5 for live positions
      const tradesRes = await fetch("/api/trades?sync=mt5");
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        setTrades(tradesData.trades || []);
      }

      // Fetch market assets
      const marketRes = await fetch("/api/market");
      if (marketRes.ok) {
        const marketData = await marketRes.json();
        setMarketAssets(marketData.assets || []);
      }

      // Fetch notifications
      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }

      // Fetch watchlist
      const wlRes = await fetch("/api/watchlists");
      if (wlRes.ok) {
        const wlData = await wlRes.json();
        setWatchlists(wlData.watchlist || []);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Periodic LIVE market price tick via real API polling
  useEffect(() => {
    let isMounted = true;
    async function tick() {
      try {
        const marketRes = await fetch("/api/market");
        if (marketRes.ok && isMounted) {
          const marketData = await marketRes.json();
          if (marketData.assets && marketData.assets.length > 0) {
            setMarketAssets(marketData.assets);
          }
        }
      } catch {}
    }
    tick();
    const interval = setInterval(tick, 15_000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // Update open positions live PnL whenever market prices change
  useEffect(() => {
    if (marketAssets.length === 0) return;
    setTrades((prevTrades) =>
      prevTrades.map((trade) => {
        if (trade.status !== "OPEN") return trade;
        const liveAsset = marketAssets.find((a) => a.symbol === trade.symbol);
        if (!liveAsset) return trade;
        const currentPrice = liveAsset.currentPrice;
        const entryPrice = Number(trade.entryPrice);
        const leverage = trade.leverage || 1;
        const amount = Number(trade.amount);
        let pnlPercent = 0;
        if (trade.type === "BUY") pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100 * leverage;
        else pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100 * leverage;
        const pnl = (amount * pnlPercent) / 100;
        return { ...trade, currentPrice: String(currentPrice.toFixed(4)), pnl: String(pnl.toFixed(2)), pnlPercent: String(pnlPercent.toFixed(2)) };
      })
    );
  }, [marketAssets]);

  // Periodic autonomous AI Bot scan cycle (every 45 seconds if bot is active)
  useEffect(() => {
    if (!botConfig?.isActive || !user?.autoTradingEnabled) return;

    const botInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/bot/scan-and-trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceExecute: false }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.newTradesCount > 0) {
            if (user?.soundEffects) playSound("buy");
            showToast(`🤖 AI Bot Auto-Executed ${data.newTradesCount} high-confluence trade(s)!`, "success");
            refreshAllData();
          }
        }
      } catch {
        // Ignore background fetch error
      }
    }, 45000);

    return () => clearInterval(botInterval);
  }, [botConfig?.isActive, user?.autoTradingEnabled, user?.soundEffects, showToast, refreshAllData]);

  // User Actions
  const switchUser = async (userId: string) => {
    try {
      const res = await fetch("/api/users/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        showToast(`Active trader profile switched to ${data.user.name}`, "info");
        await refreshAllData();
      }
    } catch {
      showToast("Failed to switch trader profile", "error");
    }
  };

  const createAndSwitchUser = async (name: string, traderType: string, initialBalance: number) => {
    try {
      const res = await fetch("/api/users/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createNew: true, name, traderType, initialBalance }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        showToast(`Trader account "${data.user.name}" created and activated!`, "success");
        await refreshAllData();
      }
    } catch {
      showToast("Failed to create new trader account", "error");
    }
  };

  const updateUserSettings = async (settings: Partial<UserAccount>) => {
    try {
      // Optimistic update
      setUser((prev) => (prev ? { ...prev, ...settings } : null));

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        showToast("Settings updated successfully", "success");
      }
    } catch {
      showToast("Failed to update settings", "error");
    }
  };

  const resetBalance = async () => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToInitial: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (user?.soundEffects) playSound("profit");
        showToast(`Paper trading balance reset to ${formatCurrency(data.user.initialBalance)}`, "success");
      }
    } catch {
      showToast("Failed to reset balance", "error");
    }
  };

  // Strategies CRUD
  const createStrategy = async (strategy: Partial<StrategyItem>) => {
    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategy),
      });
      if (res.ok) {
        const data = await res.json();
        setStrategies((prev) => [data.strategy, ...prev]);
        if (user?.soundEffects) playSound("profit");
        showToast(`Strategy "${data.strategy.name}" added to library!`, "success");
        return true;
      }
      return false;
    } catch {
      showToast("Failed to create strategy", "error");
      return false;
    }
  };

  const updateStrategy = async (id: string, updates: Partial<StrategyItem>) => {
    try {
      setStrategies((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      const res = await fetch(`/api/strategies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        showToast("Strategy updated", "success");
        return true;
      }
      return false;
    } catch {
      showToast("Failed to update strategy", "error");
      return false;
    }
  };

  const deleteStrategy = async (id: string) => {
    try {
      const target = strategies.find((s) => s.id === id);
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Deleted strategy "${target?.name || id}"`, "info");
        return true;
      }
      return false;
    } catch {
      showToast("Failed to delete strategy", "error");
      return false;
    }
  };

  const toggleStrategyActive = async (id: string, active: boolean) => {
    return updateStrategy(id, { isActive: active });
  };

  // Bot Actions
  const updateBotConfig = async (updates: Partial<BotConfigItem>) => {
    try {
      setBotConfig((prev) => (prev ? { ...prev, ...updates } : null));
      const res = await fetch("/api/bot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data.bot);
        showToast("Autonomous Bot configuration saved", "success");
        return true;
      }
      return false;
    } catch {
      showToast("Failed to update bot config", "error");
      return false;
    }
  };

  const runScanAndTrade = async (forceExecute = false, targetSymbol?: string) => {
    setIsScanning(true);
    if (user?.soundEffects) playSound("scan");
    try {
      const res = await fetch("/api/bot/scan-and-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceExecute, targetSymbol }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.newTradesCount > 0) {
          if (user?.soundEffects) playSound("buy");
          showToast(`🚀 AI executed ${data.newTradesCount} high-probability trade(s)!`, "success");
        } else {
          showToast(data.message || "Market scan finished. No triggers met threshold.", "info");
        }
        await refreshAllData();
        return data;
      } else {
        showToast(data.error || "Scan failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Scan error", "error");
    } finally {
      setIsScanning(false);
    }
  };

  // Trades CRUD & Close
  const executeTrade = async (tradeData: any) => {
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData),
      });
      const data = await res.json();
      if (res.ok) {
        if (user?.soundEffects) playSound(tradeData.type === "BUY" ? "buy" : "sell");
        showToast(`Trade placed on ${tradeData.symbol} successfully!`, "success");
        await refreshAllData();
        return true;
      } else {
        showToast(data.error || "Failed to execute trade", "error");
        return false;
      }
    } catch (err: any) {
      showToast(err.message || "Trade execution failed", "error");
      return false;
    }
  };

  const updateTrade = async (id: string, updates: Partial<TradeItem>) => {
    try {
      setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      const res = await fetch(`/api/trades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        showToast("Position parameters updated", "success");
        return true;
      }
      return false;
    } catch {
      showToast("Failed to update position", "error");
      return false;
    }
  };

  const closeTrade = async (id: string, closePercent = 100, closeReason = "manual_close") => {
    try {
      const target = trades.find((t) => t.id === id);
      const res = await fetch(`/api/trades/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closePercent, closeReason }),
      });
      const data = await res.json();
      if (res.ok) {
        if (user?.soundEffects) {
          if (data.realizedPnl >= 0) playSound("profit");
          else playSound("sell");
        }
        showToast(
          `Closed position on ${target?.symbol || ""}. Realized PnL: ${data.realizedPnl >= 0 ? "+" : ""}$${data.realizedPnl}`,
          data.realizedPnl >= 0 ? "success" : "info"
        );
        await refreshAllData();
        return true;
      } else {
        showToast(data.error || "Failed to close position", "error");
        return false;
      }
    } catch {
      showToast("Failed to close position", "error");
      return false;
    }
  };

  const deleteTrade = async (id: string) => {
    try {
      setTrades((prev) => prev.filter((t) => t.id !== id));
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Trade log record deleted", "info");
        return true;
      }
      return false;
    } catch {
      showToast("Failed to delete trade record", "error");
      return false;
    }
  };

  // Watchlist Actions
  const addToWatchlist = async (symbol: string) => {
    try {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlists((prev) => [data.item, ...prev]);
        showToast(`Added ${symbol} to watchlist`, "success");
        return true;
      }
      return false;
    } catch {
      showToast("Failed to add to watchlist", "error");
      return false;
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      setWatchlists((prev) => prev.filter((w) => w.id !== id));
      const res = await fetch(`/api/watchlists/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Removed from watchlist", "info");
        return true;
      }
      return false;
    } catch {
      showToast("Failed to remove watchlist item", "error");
      return false;
    }
  };

  const toggleWatchlistFavorite = async (id: string, current: boolean) => {
    try {
      setWatchlists((prev) => prev.map((w) => (w.id === id ? { ...w, favorite: !current } : w)));
      const res = await fetch(`/api/watchlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !current }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // Notification Actions
  const markAllNotificationsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications", { method: "PATCH" });
    } catch {
      // Ignore
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch {
      // Ignore
    }
  };

  const openTrades = trades.filter((t) => t.status === "OPEN");
  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        user,
        availableUsers,
        strategies,
        botConfig,
        trades,
        openTrades,
        closedTrades,
        marketAssets,
        notifications,
        unreadNotifsCount,
        watchlists,
        selectedSymbol,
        setSelectedSymbol,
        isLoading,
        isScanning,
        toastMessage,
        showToast,
        refreshAllData,
        switchUser,
        createAndSwitchUser,
        updateUserSettings,
        resetBalance,
        createStrategy,
        updateStrategy,
        deleteStrategy,
        toggleStrategyActive,
        updateBotConfig,
        runScanAndTrade,
        executeTrade,
        updateTrade,
        closeTrade,
        deleteTrade,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlistFavorite,
        markAllNotificationsRead,
        deleteNotification,
        orderModalSymbol,
        setOrderModalSymbol,
        editTradeModalItem,
        setEditTradeModalItem,
        isCreateStratModalOpen,
        setIsCreateStratModalOpen,
        mt5Connected,
        setMt5Connected,
        isDepositModalOpen,
        setIsDepositModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
