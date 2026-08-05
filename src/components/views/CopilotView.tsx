"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export const CopilotView: React.FC = () => {
  const { user, createStrategy, setOrderModalSymbol, showToast } = useApp();

  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([
    {
      id: "init_1",
      role: "assistant",
      content:
        "👋 Hello! I am **Nexus AI Copilot**, your real-time strategy architect and trend analyst.\n\nI can:\n1. Analyze multi-timeframe confluence for any crypto, stock, or FX pair.\n2. Design custom automated trading strategies based on your risk style.\n3. Identify high-conviction breakout and momentum setups right now.\n\n*What would you like to build or analyze today?*",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || prompt;
    if (!textToSend.trim() || isSending) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            role: "assistant",
            content: data.reply,
            suggestedStrategy: data.suggestedStrategy,
            tradeIdea: data.tradeIdea,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        showToast(data.error || "Failed to process question", "error");
      }
    } catch {
      showToast("AI Copilot service unavailable", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveSuggestedStrategy = async (strat: any) => {
    const success = await createStrategy({
      name: strat.name,
      description: strat.description,
      category: strat.category,
      traderTypeMatch: strat.traderTypeMatch,
      timeframes: strat.timeframes,
      indicators: strat.indicators,
      targetAssets: strat.targetAssets,
      weight: strat.weight || 30,
      minConfidence: strat.minConfidence || 75,
      stopLossPercent: strat.stopLossPercent || "2.00",
      takeProfitPercent: strat.takeProfitPercent || "5.00",
      trailingStop: strat.trailingStop !== false,
      aiPromptOrigin: strat.aiPromptOrigin,
    });
    if (success) {
      showToast(`Strategy "${strat.name}" added to your strategy library!`, "success");
    }
  };

  const suggestionChips = [
    "Analyze Bitcoin & Solana momentum confluence",
    "Create a high-win-rate scalping strategy for Crypto",
    "What are the top 3 breakout setups in Tech stocks?",
    "Build a 4h swing trading system for Gold and NVDA",
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Nexus AI Trading Copilot</h1>
            <p className="text-xs text-slate-400">Natural language market diagnostics & strategy code synthesis</p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-2xl text-xs space-y-3 leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-medium shadow-lg shadow-indigo-950/40 rounded-br-none"
                    : "bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-line prose-invert">
                  {msg.content}
                </div>

                {/* Suggested Strategy Card */}
                {msg.suggestedStrategy && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-purple-800/80 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-purple-400">
                        Generated Strategy Architecture
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        SL {msg.suggestedStrategy.stopLossPercent}% / TP {msg.suggestedStrategy.takeProfitPercent}%
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{msg.suggestedStrategy.name}</h4>
                    <p className="text-[11px] text-slate-400">{msg.suggestedStrategy.description}</p>
                    <button
                      onClick={() => handleSaveSuggestedStrategy(msg.suggestedStrategy)}
                      className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Save & Add to Autonomous Bot
                    </button>
                  </div>
                )}

                {/* Suggested Trade Idea Card */}
                {msg.tradeIdea && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-cyan-800/80 flex items-center justify-between text-xs mt-2">
                    <div>
                      <span className="font-bold text-white">{msg.tradeIdea.symbol}</span>
                      <span className="text-cyan-400 font-bold ml-2">{msg.tradeIdea.direction}</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Target: ${msg.tradeIdea.target.toLocaleString()} | SL: ${msg.tradeIdea.stopLoss.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setOrderModalSymbol(msg.tradeIdea.symbol)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-[11px] text-white cursor-pointer"
                    >
                      Trade Setup
                    </button>
                  </div>
                )}

                <div className="text-[9px] font-mono text-slate-400 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
        {isSending && (
          <div className="flex gap-3 items-center text-xs text-purple-400 animate-pulse">
            <Bot className="w-5 h-5" />
            <span>Nexus AI is synthesizing market data and strategy vectors...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips & Input */}
      <div className="space-y-2 pt-2 border-t border-slate-800 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-purple-300 hover:border-purple-800 whitespace-nowrap transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 focus-within:border-purple-500 transition-colors"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Nexus AI to analyze a ticker or design an automated strategy..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !prompt.trim()}
            className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
