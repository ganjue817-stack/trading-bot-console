import { Activity, Database, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { Button } from "./ui/button";
import { StatusPill } from "./ui/terminal";
import type { Snapshot } from "../types";

const headerNumber = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BotStatusBar({ snapshot, secondsToRefresh, loading, onRefresh }: { snapshot: Snapshot; secondsToRefresh: number; loading: boolean; onRefresh: () => void }) {
  const isRunning = snapshot.botMode === "running";
  const equityLabel = snapshot.dataMode === "live_read_only" ? "Bybit账户净值" : "模拟净值";
  const refresh = `${String(Math.floor(secondsToRefresh / 60)).padStart(2, "0")}:${String(secondsToRefresh % 60).padStart(2, "0")}`;
  return <header className="sticky top-0 z-20 border-b border-terminal-line bg-terminal-bg/96 backdrop-blur">
    <div className="flex h-[56px] items-center gap-3 px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 lg:hidden"><Activity size={17} className="shrink-0 text-terminal-teal" aria-hidden="true" /><span className="truncate text-sm font-semibold">Aegis Console</span></div>
      <div className="hidden items-center gap-2 lg:flex"><StatusPill tone={isRunning ? "positive" : "warning"}><span className={`h-1.5 w-1.5 ${isRunning ? "bg-terminal-up" : "bg-terminal-warn"}`} />{isRunning ? "监控运行" : "执行受限"}</StatusPill><StatusPill tone={snapshot.dataMode === "live_read_only" ? "info" : "warning"}><Database size={11} aria-hidden="true" />{snapshot.dataMode === "live_read_only" ? "实盘镜像" : "模拟回退"}</StatusPill></div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center divide-x divide-terminal-line xl:flex"><HeaderMetric label={equityLabel} value={`${headerNumber.format(snapshot.equity)} U`} /><HeaderMetric label="策略变化" value={`${snapshot.dailyPnl >= 0 ? "+" : ""}${headerNumber.format(snapshot.dailyPnl)} U`} tone={snapshot.dailyPnl >= 0 ? "positive" : "negative"} /></div>
        <div className="hidden items-center gap-2 text-[11px] text-terminal-muted sm:flex"><ShieldCheck size={13} className={snapshot.positions.every((position) => position.protected) ? "text-terminal-up" : "text-terminal-down"} aria-hidden="true" /><span>保护单 {snapshot.positions.filter((position) => position.protected).length}/{snapshot.positions.length}</span></div>
        <div className="flex min-w-[48px] items-center justify-end gap-1.5 border-l border-terminal-line pl-3 font-mono text-[11px] tabular-nums text-terminal-muted"><Timer size={12} aria-hidden="true" />{refresh}</div>
        <Button size="icon" variant="ghost" aria-label="刷新只读镜像" title="刷新只读镜像" onClick={onRefresh} disabled={loading}>{loading ? <RefreshCw size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}</Button>
      </div>
    </div>
    {snapshot.dataMode !== "live_read_only" ? <div className="flex min-h-8 items-center gap-2 border-t border-terminal-warn/25 bg-terminal-warn/7 px-4 py-1.5 text-[11px] text-terminal-warn lg:px-6"><span className="h-1.5 w-1.5 shrink-0 bg-terminal-warn" /><span className="truncate">实时快照不可用，当前展示模拟回退数据；指标不代表实盘账户。</span></div> : null}
  </header>;
}

function HeaderMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "negative" }) {
  return <div className="min-w-[108px] px-4"><p className="text-[9px] text-terminal-faint">{label}</p><p className={`mt-0.5 font-mono text-[11px] font-semibold tabular-nums ${tone === "positive" ? "text-terminal-up" : tone === "negative" ? "text-terminal-down" : "text-terminal-text"}`}>{value}</p></div>;
}
