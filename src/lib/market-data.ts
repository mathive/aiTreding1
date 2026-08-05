export interface MarketAsset {
  symbol: string;
  name: string;
  market: "crypto" | "stocks" | "forex";
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  volatility: number; // 0-1 scale
  trendStatus: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  aiConfidence: number; // 50-99
  category: string;
  rsi: number;
  macdSignal: "BULLISH_CROSS" | "BEARISH_CROSS" | "NEUTRAL";
  emaTrend: "STRONG_UPTREND" | "UPTREND" | "CONSOLIDATION" | "DOWNTREND";
  supportPrice: number;
  resistancePrice: number;
  recommendedLeverage: number;
}

export const INITIAL_ASSETS: MarketAsset[] = [
  {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    market: "crypto",
    currentPrice: 89450.0,
    change24h: 3.84,
    high24h: 90200.0,
    low24h: 86120.0,
    volume24h: "$38.4B",
    volatility: 0.65,
    trendStatus: "STRONG_BUY",
    aiConfidence: 94,
    category: "Layer 1 / Store of Value",
    rsi: 68.4,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "STRONG_UPTREND",
    supportPrice: 87200.0,
    resistancePrice: 91500.0,
    recommendedLeverage: 10,
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    market: "crypto",
    currentPrice: 3420.5,
    change24h: 4.12,
    high24h: 3485.0,
    low24h: 3260.0,
    volume24h: "$19.2B",
    volatility: 0.72,
    trendStatus: "STRONG_BUY",
    aiConfidence: 89,
    category: "Smart Contracts",
    rsi: 64.2,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "STRONG_UPTREND",
    supportPrice: 3310.0,
    resistancePrice: 3550.0,
    recommendedLeverage: 10,
  },
  {
    symbol: "SOL/USDT",
    name: "Solana",
    market: "crypto",
    currentPrice: 198.8,
    change24h: 7.65,
    high24h: 204.5,
    low24h: 184.2,
    volume24h: "$8.9B",
    volatility: 0.85,
    trendStatus: "STRONG_BUY",
    aiConfidence: 96,
    category: "High-Throughput L1",
    rsi: 74.1,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "STRONG_UPTREND",
    supportPrice: 188.0,
    resistancePrice: 215.0,
    recommendedLeverage: 8,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp",
    market: "stocks",
    currentPrice: 138.65,
    change24h: 2.94,
    high24h: 141.2,
    low24h: 134.8,
    volume24h: "$42.1B",
    volatility: 0.58,
    trendStatus: "BUY",
    aiConfidence: 88,
    category: "AI Semiconductors",
    rsi: 61.8,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "UPTREND",
    supportPrice: 132.5,
    resistancePrice: 144.0,
    recommendedLeverage: 3,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc",
    market: "stocks",
    currentPrice: 248.3,
    change24h: -1.45,
    high24h: 256.0,
    low24h: 244.1,
    volume24h: "$21.5B",
    volatility: 0.78,
    trendStatus: "NEUTRAL",
    aiConfidence: 62,
    category: "EV / Autonomous Tech",
    rsi: 48.3,
    macdSignal: "NEUTRAL",
    emaTrend: "CONSOLIDATION",
    supportPrice: 238.0,
    resistancePrice: 262.0,
    recommendedLeverage: 3,
  },
  {
    symbol: "AAPL",
    name: "Apple Inc",
    market: "stocks",
    currentPrice: 228.4,
    change24h: 1.18,
    high24h: 230.5,
    low24h: 225.8,
    volume24h: "$12.8B",
    volatility: 0.35,
    trendStatus: "BUY",
    aiConfidence: 81,
    category: "Mega-Cap Tech",
    rsi: 58.2,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "UPTREND",
    supportPrice: 222.0,
    resistancePrice: 234.0,
    recommendedLeverage: 2,
  },
  {
    symbol: "XAU/USD",
    name: "Gold Spot",
    market: "forex",
    currentPrice: 2748.6,
    change24h: 0.85,
    high24h: 2758.0,
    low24h: 2724.0,
    volume24h: "$64.2B",
    volatility: 0.42,
    trendStatus: "STRONG_BUY",
    aiConfidence: 91,
    category: "Precious Metals",
    rsi: 66.7,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "STRONG_UPTREND",
    supportPrice: 2715.0,
    resistancePrice: 2785.0,
    recommendedLeverage: 20,
  },
  {
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    market: "forex",
    currentPrice: 1.0845,
    change24h: -0.22,
    high24h: 1.089,
    low24h: 1.082,
    volume24h: "$110B",
    volatility: 0.28,
    trendStatus: "SELL",
    aiConfidence: 78,
    category: "Major FX Pair",
    rsi: 41.5,
    macdSignal: "BEARISH_CROSS",
    emaTrend: "DOWNTREND",
    supportPrice: 1.078,
    resistancePrice: 1.092,
    recommendedLeverage: 30,
  },
  {
    symbol: "AVAX/USDT",
    name: "Avalanche",
    market: "crypto",
    currentPrice: 36.4,
    change24h: 6.2,
    high24h: 37.8,
    low24h: 33.9,
    volume24h: "$1.4B",
    volatility: 0.88,
    trendStatus: "STRONG_BUY",
    aiConfidence: 92,
    category: "L1 Subnets",
    rsi: 71.0,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "STRONG_UPTREND",
    supportPrice: 34.0,
    resistancePrice: 40.5,
    recommendedLeverage: 8,
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    market: "stocks",
    currentPrice: 162.3,
    change24h: 3.45,
    high24h: 165.1,
    low24h: 156.4,
    volume24h: "$8.4B",
    volatility: 0.69,
    trendStatus: "BUY",
    aiConfidence: 86,
    category: "Semiconductors",
    rsi: 63.5,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "UPTREND",
    supportPrice: 154.0,
    resistancePrice: 170.0,
    recommendedLeverage: 3,
  },
  {
    symbol: "SUI/USDT",
    name: "Sui Network",
    market: "crypto",
    currentPrice: 3.18,
    change24h: 11.4,
    high24h: 3.35,
    low24h: 2.82,
    volume24h: "$2.1B",
    volatility: 0.92,
    trendStatus: "STRONG_BUY",
    aiConfidence: 97,
    category: "Move Language L1",
    rsi: 78.3,
    macdSignal: "BULLISH_CROSS",
    emaTrend: "STRONG_UPTREND",
    supportPrice: 2.95,
    resistancePrice: 3.6,
    recommendedLeverage: 6,
  },
  {
    symbol: "GBP/USD",
    name: "British Pound / USD",
    market: "forex",
    currentPrice: 1.2985,
    change24h: 0.15,
    high24h: 1.3025,
    low24h: 1.294,
    volume24h: "$85B",
    volatility: 0.32,
    trendStatus: "NEUTRAL",
    aiConfidence: 65,
    category: "Major FX Pair",
    rsi: 52.0,
    macdSignal: "NEUTRAL",
    emaTrend: "CONSOLIDATION",
    supportPrice: 1.291,
    resistancePrice: 1.306,
    recommendedLeverage: 25,
  },
];

export interface CandlePoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20: number;
  ema50: number;
  ema200: number;
  bbUpper: number;
  bbLower: number;
  bbMiddle: number;
  rsi: number;
  aiSignal?: "BUY" | "SELL" | "EXIT_TP" | "EXIT_SL" | null;
  aiSignalReason?: string;
}

// Deterministic or pseudo-random candle generator for realistic financial charts
export function generateCandles(
  basePrice: number,
  volatility: number,
  timeframe: string = "1h",
  count: number = 60
): CandlePoint[] {
  const candles: CandlePoint[] = [];
  const now = Date.now();
  let intervalMs = 3600 * 1000;
  if (timeframe === "1m") intervalMs = 60 * 1000;
  if (timeframe === "5m") intervalMs = 5 * 60 * 1000;
  if (timeframe === "15m") intervalMs = 15 * 60 * 1000;
  if (timeframe === "4h") intervalMs = 4 * 3600 * 1000;
  if (timeframe === "1D") intervalMs = 24 * 3600 * 1000;

  let currentClose = basePrice * (1 - volatility * 0.08);
  const startTime = now - count * intervalMs;

  const closes: number[] = [];

  for (let i = 0; i < count; i++) {
    const timeVal = new Date(startTime + i * intervalMs);
    const timeStr =
      timeframe === "1D"
        ? timeVal.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : timeVal.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    const trendBias = (i / count) * 0.04; // slight upward drift
    const noise = (Math.sin(i * 0.5) * 0.008 + (Math.random() - 0.48) * 0.015) * volatility;
    const delta = currentClose * (trendBias * 0.1 + noise);
    const open = currentClose;
    const close = Math.max(open + delta, open * 0.8);
    const high = Math.max(open, close) + Math.abs(delta) * (0.3 + Math.random() * 0.6);
    const low = Math.min(open, close) - Math.abs(delta) * (0.3 + Math.random() * 0.6);
    const volume = Math.floor((basePrice * 25 + Math.random() * basePrice * 50) * (1 + Math.abs(delta / open) * 5));

    currentClose = close;
    closes.push(close);

    // Calculate moving averages and Bollinger Bands
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 100);
    const { upper, lower, middle } = calculateBollingerBands(closes, 20, 2);
    const rsi = calculateRSI(closes, 14);

    let aiSignal: "BUY" | "SELL" | "EXIT_TP" | "EXIT_SL" | null = null;
    let aiSignalReason = "";

    // Place simulated signals at strategic points
    if (i === Math.floor(count * 0.35) && close > open) {
      aiSignal = "BUY";
      aiSignalReason = "Confluence Breakout: 20EMA cross + RSI 58 expansion + Volume spike";
    } else if (i === Math.floor(count * 0.65) && close > open) {
      aiSignal = "EXIT_TP";
      aiSignalReason = "Take-Profit Target 1 Hit (+4.8%)";
    } else if (i === Math.floor(count * 0.82) && close > open) {
      aiSignal = "BUY";
      aiSignalReason = "Smart Money Pullback to Support + Trend Pulse Confirmed";
    }

    candles.push({
      time: timeStr,
      timestamp: startTime + i * intervalMs,
      open: Number(open.toFixed(2 > 1 ? 4 : 2)),
      high: Number(high.toFixed(2 > 1 ? 4 : 2)),
      low: Number(low.toFixed(2 > 1 ? 4 : 2)),
      close: Number(close.toFixed(2 > 1 ? 4 : 2)),
      volume,
      ema20: Number(ema20.toFixed(4)),
      ema50: Number(ema50.toFixed(4)),
      ema200: Number(ema200.toFixed(4)),
      bbUpper: Number(upper.toFixed(4)),
      bbLower: Number(lower.toFixed(4)),
      bbMiddle: Number(middle.toFixed(4)),
      rsi: Number(rsi.toFixed(1)),
      aiSignal,
      aiSignalReason,
    });
  }

  return candles;
}

function calculateEMA(data: number[], period: number): number {
  if (data.length === 0) return 0;
  if (data.length <= period) {
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length;
  }
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateBollingerBands(data: number[], period: number = 20, multiplier: number = 2) {
  if (data.length < 2) {
    const val = data[0] || 0;
    return { upper: val, lower: val, middle: val };
  }
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / slice.length;
  const stdDev = Math.sqrt(variance);
  return {
    upper: mean + stdDev * multiplier,
    lower: mean - stdDev * multiplier,
    middle: mean,
  };
}

function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 55;
  let gains = 0;
  let losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period || 0.0001;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Multi-strategy confluence calculation engine
export interface StrategyEvaluationResult {
  symbol: string;
  confluenceScore: number; // 0 - 100
  signal: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  direction: "LONG" | "SHORT" | "HOLD";
  targetPriceTP1: number;
  targetPriceTP2: number;
  stopLossPrice: number;
  riskRewardRatio: number;
  strategyBreakdowns: Array<{
    strategyId: string;
    strategyName: string;
    weight: number;
    signal: "BUY" | "SELL" | "NEUTRAL";
    score: number;
    reason: string;
  }>;
  aiSummary: string;
}

export function evaluateMultiStrategyConfluence(
  asset: MarketAsset,
  selectedStrategies: Array<{ id: string; name: string; category: string; weight: number }>
): StrategyEvaluationResult {
  if (!selectedStrategies || selectedStrategies.length === 0) {
    return {
      symbol: asset.symbol,
      confluenceScore: 50,
      signal: "NEUTRAL",
      direction: "HOLD",
      targetPriceTP1: asset.currentPrice * 1.03,
      targetPriceTP2: asset.currentPrice * 1.06,
      stopLossPrice: asset.currentPrice * 0.98,
      riskRewardRatio: 2.0,
      strategyBreakdowns: [],
      aiSummary: "No active strategies selected for confluence evaluation.",
    };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const breakdowns = [];

  for (const strat of selectedStrategies) {
    const weight = strat.weight || 25;
    totalWeight += weight;

    let stratScore = 60;
    let signal: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL";
    let reason = "";

    switch (strat.category) {
      case "breakout":
        if (asset.currentPrice >= asset.resistancePrice * 0.985 || asset.change24h > 3.0) {
          stratScore = 92;
          signal = "BUY";
          reason = `Upper resistance breakout confirmed at ${asset.resistancePrice}. Volume surge detected.`;
        } else if (asset.currentPrice <= asset.supportPrice * 1.015) {
          stratScore = 25;
          signal = "SELL";
          reason = `Support breakdown alert at ${asset.supportPrice}.`;
        } else {
          stratScore = 65;
          signal = "BUY";
          reason = `Consolidating inside channel. Approaching breakout zone.`;
        }
        break;

      case "momentum":
      case "trend_follow":
        if (asset.emaTrend === "STRONG_UPTREND" && asset.rsi < 75) {
          stratScore = 95;
          signal = "BUY";
          reason = `Triple EMA golden alignment (20 > 50 > 200). ADX strong trend confirmation.`;
        } else if (asset.emaTrend === "DOWNTREND") {
          stratScore = 20;
          signal = "SELL";
          reason = `Death cross active on 1h/4h frames. Downward momentum dominating.`;
        } else {
          stratScore = 70;
          signal = "BUY";
          reason = `Moderate bullish momentum with EMA 20 holding as dynamic support.`;
        }
        break;

      case "smart_money":
        if (asset.volatility > 0.6 && asset.rsi > 55) {
          stratScore = 88;
          signal = "BUY";
          reason = `Institutional liquidity sweep at key lows followed by heavy volume absorption.`;
        } else {
          stratScore = 72;
          signal = "BUY";
          reason = `Order book depth shows 68% bid-side imbalance favoring continuation.`;
        }
        break;

      case "mean_reversion":
        if (asset.rsi < 35) {
          stratScore = 90;
          signal = "BUY";
          reason = `Oversold bounce trigger (RSI: ${asset.rsi.toFixed(1)}). Lower Bollinger band rejection.`;
        } else if (asset.rsi > 78) {
          stratScore = 30;
          signal = "SELL";
          reason = `Overbought exhaustion warning (RSI: ${asset.rsi.toFixed(1)}).`;
        } else {
          stratScore = 60;
          signal = "NEUTRAL";
          reason = `Price oscillating within standard 2-sigma deviation envelope.`;
        }
        break;

      case "ml_ai":
      case "sentiment":
      default:
        stratScore = asset.aiConfidence;
        signal = asset.aiConfidence >= 75 ? "BUY" : asset.aiConfidence <= 45 ? "SELL" : "NEUTRAL";
        reason = `Neural predictive ensemble model output: ${asset.aiConfidence}% directional probability.`;
        break;
    }

    totalWeightedScore += stratScore * weight;
    breakdowns.push({
      strategyId: strat.id,
      strategyName: strat.name,
      weight,
      signal,
      score: stratScore,
      reason,
    });
  }

  const confluenceScore = Math.round(totalWeightedScore / (totalWeight || 1));
  let finalSignal: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL" = "NEUTRAL";
  let direction: "LONG" | "SHORT" | "HOLD" = "HOLD";

  if (confluenceScore >= 85) {
    finalSignal = "STRONG_BUY";
    direction = "LONG";
  } else if (confluenceScore >= 70) {
    finalSignal = "BUY";
    direction = "LONG";
  } else if (confluenceScore <= 35) {
    finalSignal = "STRONG_SELL";
    direction = "SHORT";
  } else if (confluenceScore <= 48) {
    finalSignal = "SELL";
    direction = "SHORT";
  } else {
    finalSignal = "NEUTRAL";
    direction = "HOLD";
  }

  const tp1Mult = direction === "LONG" ? 1.035 : 0.965;
  const tp2Mult = direction === "LONG" ? 1.075 : 0.925;
  const slMult = direction === "LONG" ? 0.98 : 1.02;

  const targetPriceTP1 = Number((asset.currentPrice * tp1Mult).toFixed(4));
  const targetPriceTP2 = Number((asset.currentPrice * tp2Mult).toFixed(4));
  const stopLossPrice = Number((asset.currentPrice * slMult).toFixed(4));

  const reward = Math.abs(targetPriceTP1 - asset.currentPrice);
  const risk = Math.abs(asset.currentPrice - stopLossPrice) || 1;
  const riskRewardRatio = Number((reward / risk).toFixed(2));

  const topStrat = breakdowns.sort((a, b) => b.score - a.score)[0];
  const aiSummary =
    finalSignal === "STRONG_BUY" || finalSignal === "BUY"
      ? `High-probability ${direction} confluence (${confluenceScore}/100) led by "${topStrat?.strategyName}". Target 1: $${targetPriceTP1} with 1:${riskRewardRatio} R/R.`
      : finalSignal === "STRONG_SELL" || finalSignal === "SELL"
      ? `Bearish breakdown confluence (${confluenceScore}/100). Downward continuation target: $${targetPriceTP1}.`
      : `Mixed signals (${confluenceScore}/100). Awaiting volatility expansion or key level breakout.`;

  return {
    symbol: asset.symbol,
    confluenceScore,
    signal: finalSignal,
    direction,
    targetPriceTP1,
    targetPriceTP2,
    stopLossPrice,
    riskRewardRatio: riskRewardRatio > 0 ? riskRewardRatio : 2.5,
    strategyBreakdowns: breakdowns,
    aiSummary,
  };
}
