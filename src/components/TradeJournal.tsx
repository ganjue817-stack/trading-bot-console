import { Download, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ExecutionEvent } from "../types";
import { MockApi } from "../mock-api";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Panel, StatusPill } from "./ui/terminal";

export function TradeJournal({ events }: { events: ExecutionEvent[] }) {
  const [symbol, setSymbol] = useState("全部");
  const [path, setPath] = useState("全部");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => events.filter((event) => (symbol === "全部" || event.symbol === symbol) && (path === "全部" || event.path === path) && `${event.reason}${event.symbol}`.toLowerCase().includes(query.toLowerCase())), [events, path, query, symbol]);
  const exportRows = () => {
    const blob = new Blob([MockApi.exportCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "live-execution-journal.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return <Panel className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-terminal-line p-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="section-kicker">执行日志与复盘</p><p className="mt-1 text-xs text-terminal-muted">本地执行器只读记录，CSV 导出不包含密钥或写入能力</p></div><div className="flex flex-wrap gap-2"><label className="terminal-input"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索原因或标的" /></label><select value={symbol} onChange={(event) => setSymbol(event.target.value)} className="terminal-select"><option>全部</option>{Array.from(new Set(events.map((event) => event.symbol))).filter(Boolean).map((item) => <option key={item}>{item}</option>)}</select><select value={path} onChange={(event) => setPath(event.target.value)} className="terminal-select"><option>全部</option>{Array.from(new Set(events.map((event) => event.path))).map((item) => <option key={item}>{item}</option>)}</select><Button size="sm" variant="outline" onClick={exportRows}><Download size={14} />导出 CSV</Button></div></div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1240px] text-left text-xs"><thead className="bg-terminal-soft text-[11px] text-terminal-muted"><tr>{["时间", "标的", "方向", "来源路径", "开平仓原因", "名义", "价格", "毛盈亏", "手续费", "费用来源", "净盈亏", "盈亏来源"].map((column) => <th key={column} className="px-3 py-2.5 font-medium">{column}</th>)}</tr></thead><tbody>{rows.map((event) => <tr key={event.id} className="border-t border-terminal-line/70 hover:bg-terminal-soft/70"><td className="px-3 py-3 font-mono text-terminal-faint">{event.time}</td><td className="px-3 py-3 font-mono text-terminal-text">{event.symbol || "--"}</td><td className={cn("px-3 py-3 font-mono", event.side === "long" ? "text-terminal-up" : event.side === "short" ? "text-terminal-down" : "text-terminal-muted")}>{event.side === "-" ? "--" : event.side.toUpperCase()}</td><td className="px-3 py-3"><StatusPill tone={event.path.includes("TG") ? "info" : event.type === "risk" ? "warning" : "neutral"}>{event.path}</StatusPill></td><td className="max-w-[260px] truncate px-3 py-3 text-terminal-muted" title={event.reason}>{event.reason}</td><td className="px-3 py-3 font-mono text-terminal-text">{event.notional ? `${event.notional.toFixed(2)}U` : "--"}</td><td className="px-3 py-3 font-mono text-terminal-text">{event.price ? event.price.toFixed(4) : "--"}</td><td className="px-3 py-3 font-mono text-terminal-muted">{event.grossPnl == null ? "--" : `${event.grossPnl >= 0 ? "+" : ""}${event.grossPnl.toFixed(3)}U`}</td><td className="px-3 py-3 font-mono text-terminal-muted">{event.fee ? `${event.fee.toFixed(3)}U` : "--"}</td><td className="px-3 py-3 text-terminal-muted">{event.feeSource || "--"}</td><td className={cn("px-3 py-3 font-mono", event.pnl === null ? "text-terminal-faint" : event.pnl >= 0 ? "text-terminal-up" : "text-terminal-down")}>{event.pnl === null ? "--" : `${event.pnl >= 0 ? "+" : ""}${event.pnl.toFixed(3)}U`}</td><td className="px-3 py-3 text-terminal-muted">{event.pnlSource || "--"}</td></tr>)}</tbody></table></div>
    <div className="divide-y divide-terminal-line md:hidden">{rows.map((event) => <article key={event.id} className="p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-sm font-semibold text-terminal-text">{event.symbol || "系统事件"}</p><p className="mt-1 font-mono text-[11px] text-terminal-faint">{event.time}</p></div><StatusPill tone={event.type === "risk" ? "warning" : event.type === "close" ? "negative" : "neutral"}>{event.type.toUpperCase()}</StatusPill></div><p className="mt-3 text-xs leading-5 text-terminal-muted">{event.reason}</p><div className="mt-3 grid grid-cols-3 gap-3"><Metric label="名义" value={event.notional ? `${event.notional.toFixed(0)}U` : "--"} /><Metric label="费用" value={event.fee ? `${event.fee.toFixed(3)}U` : "--"} /><Metric label="净盈亏" value={event.pnl == null ? "--" : `${event.pnl >= 0 ? "+" : ""}${event.pnl.toFixed(3)}U`} /></div>{(event.feeSource || event.pnlSource) && <p className="mt-3 text-[11px] text-terminal-faint">费用：{event.feeSource || "未知"} · 盈亏：{event.pnlSource || "未知"}</p>}</article>)}</div>
    {rows.length === 0 && <div className="grid h-32 place-items-center text-xs text-terminal-muted"><span className="flex items-center gap-2"><Filter size={14} />没有匹配的执行记录</span></div>}
  </Panel>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] text-terminal-muted">{label}</p><p className="mt-1 truncate font-mono text-xs text-terminal-text">{value}</p></div>;
}
