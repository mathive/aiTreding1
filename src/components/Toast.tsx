"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: { text: string; type: "success" | "error" | "info" } | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md text-sm font-medium",
          message.type === "success" && "bg-emerald-950/90 border-emerald-500/40 text-emerald-200",
          message.type === "error" && "bg-rose-950/90 border-rose-500/40 text-rose-200",
          message.type === "info" && "bg-cyan-950/90 border-cyan-500/40 text-cyan-200"
        )}
      >
        {message.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {message.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
        {message.type === "info" && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
        <span>{message.text}</span>
      </div>
    </div>
  );
};
