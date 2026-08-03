import { AlertTriangle, CheckCircle2, CircleMinus, Clock3, ShieldCheck, XCircle } from "lucide-react";
import type { ExecutionEvent } from "../types";
import { cn } from "../lib/utils";
import { Panel, StatusPill } from "./ui/terminal";

const iconFor = { open: CheckCircle2, close: XCircle, reduce: CircleMinus, risk: ShieldCheck, sync: Clock3 };
const toneFor = { open: "positive", close: "negative", reduce: "warning", risk: "info", sync: "neutral" } as const;

export function ExecutionTimeline({ events }: { events: ExecutionEvent[] }) {
  return <Panel className="p-4"><div className="flex items-start justify-between"><div><p className="section-kicker">执行日志</p><p className="mt-1 text-xs text-terminal-muted">订单生命周期与风险动作</p></div><StatusPill tone="positive"><CheckCircle2 size={10} />无未决订单锁</StatusPill></div><ol className="mt-4 grid gap-2">{events.slice(0, 4).map((event) => { const Icon = iconFor[event.type]; return <li key={event.id} className="flex items-start gap-3 border-l-2 border-terminal-line bg-terminal-soft/50 p-3"><Icon size={15} className={cn("mt-0.5 shrink-0", event.type === "open" ? "text-terminal-up" : event.type === "risk" ? "text-terminal-blue" : "text-terminal-warn")} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] text-terminal-faint">{event.time}</span><span className="text-xs text-terminal-text">{event.symbol}</span><StatusPill tone={toneFor[event.type]}>{event.path}</StatusPill></div><p className="mt-1 text-[11px] text-terminal-muted">{event.reason}</p></div>{event.notional > 0 && <span className="font-mono text-[11px] text-terminal-text">{event.notional}U</span>}</li>; })}</ol></Panel>;
}
