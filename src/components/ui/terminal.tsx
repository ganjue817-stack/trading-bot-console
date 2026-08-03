import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("terminal-panel", className)}>{children}</section>;
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "positive" | "negative" | "warning" | "info" }) {
  return <span className={cn("status-pill", `status-${tone}`)}>{children}</span>;
}

export function Stat({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "positive" | "negative" | "warning" }) {
  return <div className="min-w-0">
    <p className="text-[10px] uppercase tracking-[0.08em] text-terminal-muted">{label}</p>
    <p className={cn("mt-1 font-mono text-[15px] font-semibold tabular-nums", tone === "positive" && "text-terminal-up", tone === "negative" && "text-terminal-down", tone === "warning" && "text-terminal-warn", tone === "default" && "text-terminal-text")}>{value}</p>
    {hint && <p className="mt-0.5 truncate text-[10px] text-terminal-faint">{hint}</p>}
  </div>;
}
