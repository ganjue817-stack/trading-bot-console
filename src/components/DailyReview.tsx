import { BarChart3, CheckCircle2 } from "lucide-react";
import type { ExecutionEvent } from "../types";
import { Panel } from "./ui/terminal";

export function DailyReview({ events }: { events: ExecutionEvent[] }) {
  const closed = events.filter((event) => event.type === "close" && event.pnl !== null);
  const wins = closed.filter((event) => Number(event.pnl) > 0);
  const losses = closed.filter((event) => Number(event.pnl) < 0);
  const net = closed.reduce((total, event) => total + Number(event.pnl), 0);
  const fees = events.reduce((total, event) => total + event.fee, 0);
  const slippage = events.reduce((total, event) => total + event.slippage, 0);
  const profit = wins.reduce((total, event) => total + Number(event.pnl), 0);
  const loss = Math.abs(losses.reduce((total, event) => total + Number(event.pnl), 0));
  const provenanceComplete = closed.every((event) => Boolean(event.pnlSource) && Boolean(event.feeSource));
  const metrics = [
    ["已平仓", String(closed.length), "实盘事件"],
    ["胜率", closed.length ? `${(wins.length / closed.length * 100).toFixed(1)}%` : "--", `${wins.length} 胜 / ${losses.length} 负`],
    ["盈亏比", loss > 0 ? (profit / loss).toFixed(2) : "--", "按净盈亏"],
    ["净盈亏", `${net >= 0 ? "+" : ""}${net.toFixed(3)}U`, "已平仓合计"],
    ["记录费用", `${fees.toFixed(3)}U`, provenanceComplete ? "来源完整" : "历史字段不完整"],
    ["记录滑点", `${slippage.toFixed(3)}U`, "执行事件合计"],
  ];
  return <Panel className="p-4"><div className="flex items-start justify-between"><div><p className="section-kicker">日报与复盘</p><p className="mt-1 text-xs text-terminal-muted">仅统计本地实盘执行事件</p></div><BarChart3 size={17} className="text-terminal-blue" /></div><div className="mt-4 grid grid-cols-2 gap-px border border-terminal-line bg-terminal-line sm:grid-cols-3">{metrics.map(([label, value, hint]) => <div key={label} className="bg-terminal-panel p-3"><p className="text-[11px] text-terminal-muted">{label}</p><p className="mt-1 font-mono text-sm text-terminal-text">{value}</p><p className="mt-1 text-[10px] text-terminal-faint">{hint}</p></div>)}</div><div className="mt-4 flex items-start gap-2 border-l-2 border-terminal-teal bg-terminal-teal/5 p-3 text-[11px] leading-5 text-terminal-muted"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-terminal-teal" />{provenanceComplete ? "费用与盈亏来源均已记录。" : "旧事件缺少交易所费用或盈亏来源；新事件会记录实值或保守估算来源。"}</div></Panel>;
}
