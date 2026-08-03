import type { ReactNode } from "react";
import { Activity, BarChart3, BookOpenText, LayoutDashboard, ShieldCheck, UsersRound } from "lucide-react";
import { cn } from "../lib/utils";
import { TerminalCanvas } from "./TerminalCanvas";

export type View = "overview" | "position" | "signals" | "traders" | "risk" | "journal";

const nav: { id: View; label: string; shortLabel: string; description: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "交易总览", shortLabel: "总览", description: "权益与执行", icon: LayoutDashboard },
  { id: "position", label: "当前持仓", shortLabel: "持仓", description: "仓位与保护", icon: Activity },
  { id: "signals", label: "信号共识", shortLabel: "信号", description: "准入与来源", icon: BarChart3 },
  { id: "traders", label: "交易来源", shortLabel: "来源", description: "质量与权重", icon: UsersRound },
  { id: "risk", label: "风险中心", shortLabel: "风控", description: "预算与熔断", icon: ShieldCheck },
  { id: "journal", label: "执行日志", shortLabel: "日志", description: "流水与复盘", icon: BookOpenText },
];

export function AppShell({ activeView, onViewChange, children }: { activeView: View; onViewChange: (view: View) => void; children: ReactNode }) {
  return <div className="terminal-shell relative isolate min-h-dvh overflow-x-hidden bg-terminal-bg text-terminal-text">
    <a href="#main-content" className="skip-link">跳至主要内容</a>
    <TerminalCanvas />
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[196px] flex-col border-r border-terminal-line bg-terminal-panel/96 lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-terminal-line px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-terminal-teal/40 bg-terminal-teal/10 text-terminal-teal"><Activity size={18} aria-hidden="true" /></div>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-terminal-text">Aegis Console</p><p className="mt-0.5 font-mono text-[9px] tracking-[0.12em] text-terminal-faint">LIVE OPERATIONS</p></div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="交易控制台导航">
        {nav.map(({ id, label, description, icon: Icon }) => <button key={id} type="button" onClick={() => onViewChange(id)} aria-current={activeView === id ? "page" : undefined} className={cn("group flex h-12 w-full items-center gap-3 rounded-[6px] px-3 text-left transition-colors hover:bg-terminal-soft focus-visible:outline-2 focus-visible:outline-terminal-teal", activeView === id ? "bg-terminal-soft text-terminal-text" : "text-terminal-muted")}>
          <Icon size={17} className={cn("shrink-0", activeView === id ? "text-terminal-teal" : "text-terminal-faint group-hover:text-terminal-muted")} aria-hidden="true" />
          <span className="min-w-0"><span className="block truncate text-xs font-medium">{label}</span><span className="mt-0.5 block truncate text-[10px] text-terminal-faint">{description}</span></span>
          {activeView === id ? <span className="ml-auto h-5 w-0.5 bg-terminal-teal" aria-hidden="true" /> : null}
        </button>)}
      </nav>
      <div className="border-t border-terminal-line px-4 py-4"><div className="flex items-center gap-2 text-[10px] text-terminal-muted"><span className="h-1.5 w-1.5 bg-terminal-up" /><span>只读操作界面</span></div><p className="mt-1.5 font-mono text-[9px] text-terminal-faint">NO ORDER ENTRY</p></div>
    </aside>
    <main className="relative z-10 min-w-0 lg:pl-[196px]">{children}</main>
    <nav className="mobile-nav fixed inset-x-0 bottom-0 z-30 flex border-t border-terminal-line bg-terminal-panel/96 px-1 backdrop-blur lg:hidden" aria-label="移动端导航">
      {nav.map(({ id, shortLabel, icon: Icon }) => <button key={id} type="button" onClick={() => onViewChange(id)} aria-current={activeView === id ? "page" : undefined} className={cn("relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[9px] text-terminal-muted focus-visible:outline-2 focus-visible:outline-terminal-teal", activeView === id && "text-terminal-teal")}>{activeView === id ? <span className="absolute inset-x-3 top-0 h-0.5 bg-terminal-teal" /> : null}<Icon size={16} aria-hidden="true" /><span className="truncate">{shortLabel}</span></button>)}
    </nav>
  </div>;
}
