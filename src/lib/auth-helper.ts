// Pure static auth — always returns a valid user. No DB, no seed.
export async function getCurrentUser() {
  return {
    id: "default", name: "Trader", email: "trader@localhost",
    balance: "0", initialBalance: "0", currency: "USD",
    riskMode: "moderate", maxDailyLoss: "0", maxLeverage: 500,
    autoTradingEnabled: true, soundEffects: true, apiKeySimulation: false,
    tradingMode: "live", traderType: "day_trader",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}
