import "server-only";
import { db } from "@/db";
import { aiTradeDecisions } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface TradeApprovalInput {
  symbol: string; direction: "BUY" | "SELL"; price: number; volume: number;
  stopLoss?: number; takeProfit?: number; technicalConfidence: number;
  alignmentCount: number; strategySignals: unknown[]; account?: unknown; openPositions?: unknown[];
}

export interface TradeApproval {
  id: string; approved: boolean; verdict: "APPROVE" | "REJECT" | "WAIT";
  confidence: number; reason: string; riskFlags: string[]; model: string;
  billingUnavailable: boolean;
}

let billingUnavailableUntil = 0;

const schema = {
  type: "object", additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["APPROVE", "REJECT", "WAIT"] },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    reason: { type: "string" },
    risk_flags: { type: "array", items: { type: "string" } },
  },
  required: ["verdict", "confidence", "reason", "risk_flags"],
};

export async function requestAITradeApproval(input: TradeApprovalInput): Promise<TradeApproval> {
  const id = crypto.randomUUID();
  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  let verdict: TradeApproval["verdict"] = "REJECT", confidence = 0;
  let reason = "AI approval unavailable; trade blocked.", riskFlags: string[] = ["AI_UNAVAILABLE"];
  let billingUnavailable = false;
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    if (Date.now() < billingUnavailableUntil) {
      billingUnavailable = true;
      throw new Error("OpenAI billing remains unavailable; using cached billing status");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model,
        instructions: "You are the final risk officer for a live MT5 trading system. Review only the supplied data. Approve only when direction, strategy alignment, risk/reward, account exposure, and market conditions support the trade. Reject conflicting or excessive-risk setups. Use WAIT when conditions are ambiguous. Never invent data.",
        input: JSON.stringify(input),
        text: { format: { type: "json_schema", name: "trade_approval", strict: true, schema } },
      }),
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 500);
      billingUnavailable = response.status === 429 && /insufficient_quota|credit_balance_exhausted|no credits remaining/i.test(errorText);
      if (billingUnavailable) billingUnavailableUntil = Date.now() + 5 * 60_000;
      throw new Error(`OpenAI API ${response.status}: ${errorText}`);
    }
    billingUnavailableUntil = 0;
    const payload: any = await response.json();
    const outputText = payload.output_text || payload.output?.flatMap((item: any) => item.content || []).find((item: any) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("OpenAI returned no structured decision");
    const parsed = JSON.parse(outputText);
    verdict = parsed.verdict; confidence = parsed.confidence; reason = parsed.reason; riskFlags = parsed.risk_flags;
  } catch (error: any) {
    reason = billingUnavailable
      ? "OpenAI billing is unavailable; strict technical fallback is permitted."
      : error?.name === "AbortError" ? "AI approval timed out; trade blocked." : `AI approval failed; trade blocked. ${error.message}`;
    riskFlags = billingUnavailable ? ["AI_BILLING_UNAVAILABLE", "TECHNICAL_FALLBACK"] : ["AI_UNAVAILABLE"];
  }
  const approved = verdict === "APPROVE" && confidence >= 70;
  if (verdict === "APPROVE" && !approved) { verdict = "REJECT"; riskFlags = [...riskFlags, "LOW_AI_CONFIDENCE"]; }
  const now = new Date().toISOString();
  await db.insert(aiTradeDecisions).values({ id, symbol: input.symbol, direction: input.direction, verdict, confidence, reason, riskFlags, technicalConfidence: input.technicalConfidence, model, executed: false, createdAt: now, updatedAt: now });
  return { id, approved, verdict, confidence, reason, riskFlags, model, billingUnavailable };
}

export async function finalizeAITradeDecision(id: string, ticket: string | number) {
  await db.update(aiTradeDecisions).set({ executed: true, orderTicket: String(ticket), updatedAt: new Date().toISOString() }).where(eq(aiTradeDecisions.id, id));
}
