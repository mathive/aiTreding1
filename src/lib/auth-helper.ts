// Minimal auth — no DB dependency. Everything comes from MT5.
export async function getCurrentUser() {
  return {
    id: "default",
    name: "Trader",
    email: "trader@localhost",
    balance: "0",
    initialBalance: "0",
    currency: "USD",
    riskMode: "moderate",
    maxDailyLoss: "0",
    maxLeverage: 500,
    autoTradingEnabled: true,
    soundEffects: true,
    theme: "dark",
    apiKeySimulation: false,
    tradingMode: "live",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
