import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import type { Position, Snapshot } from "../types";
import { cn } from "../lib/utils";
import { Panel, Stat, StatusPill } from "./ui/terminal";

const displayTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || "--" : date.toLocaleString("zh-CN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export function PositionsBoard({ snapshot }: { snapshot: Snapshot }) {
  const [selectedId, setSelectedId] = useState(snapshot.positions[0]?.id ?? "");
  useEffect(() => {
    if (!snapshot.positions.some((position) => position.id === selectedId)) setSelectedId(snapshot.positions[0]?.id ?? "");
  }, [selectedId, snapshot.positions]);
  const selected = useMemo(() => snapshot.positions.find((position) => position.id === selectedId) ?? snapshot.positions[0] ?? null, [selectedId, snapshot.positions]);
  const floorMet = snapshot.positions.length >= snapshot.minimumOpenPositions;

  return <Panel className="overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terminal-line px-4 py-3">
      <div><p className="section-kicker">实盘持仓</p><p className="mt-1 text-xs text-terminal-muted">交易所镜像与本地执行状态</p></div>
      <div className="flex items-center gap-2"><StatusPill tone={floorMet ? "positive" : "warning"}>{snapshot.positions.length} 仓 / 最低 {snapshot.minimumOpenPositions} 仓</StatusPill><StatusPill tone="neutral">上限 {snapshot.maxOpenPositions}</StatusPill></div>
    </div>
    {!selected ? <div className="grid min-h-48 place-items-center p-6 text-center"><div><XCircle className="mx-auto text-terminal-muted" size={26} /><p className="mt-3 text-sm text-terminal-text">当前无已对账持仓</p><p className="mt-1 text-xs text-terminal-muted">执行器状态：{snapshot.executionStatus}</p></div></div> : <div className="grid xl:grid-cols-[1.45fr_.75fr]">
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-terminal-soft text-terminal-muted"><tr>{["标的 / 方向", "来源", "名义仓位", "入场 / 标记", "未实现盈亏", "止损保护"].map((column) => <th key={column} className="px-4 py-2.5 font-medium">{column}</th>)}</tr></thead>
          <tbody>{snapshot.positions.map((position) => <PositionRow key={position.id} position={position} active={position.id === selected.id} onSelect={() => setSelectedId(position.id)} />)}</tbody>
        </table>
      </div>
      <PositionDetail position={selected} />
    </div>}
  </Panel>;
}

function PositionRow({ position, active, onSelect }: { position: Position; active: boolean; onSelect: () => void }) {
  return <tr onClick={onSelect} className={cn("cursor-pointer border-t border-terminal-line/70 transition-colors hover:bg-terminal-soft/70", active && "bg-terminal-blue/8")}>
    <td className="px-4 py-3"><button onClick={onSelect} className="min-h-11 text-left focus-visible:outline-2 focus-visible:outline-terminal-teal"><span className="block font-mono text-sm font-semibold text-terminal-text">{position.symbol}</span><span className={cn("mt-1 block font-mono text-[11px]", position.side === "long" ? "text-terminal-up" : "text-terminal-down")}>{position.side.toUpperCase()} · {position.leverage}x</span></button></td>
    <td className="max-w-[180px] px-4 py-3"><span className="block truncate text-terminal-muted" title={position.source}>{position.source}</span></td>
    <td className="px-4 py-3 font-mono text-terminal-text">{position.notional.toFixed(2)} U</td>
    <td className="px-4 py-3 font-mono"><span className="text-terminal-muted">{position.entryPrice.toFixed(4)}</span><span className="mx-1.5 text-terminal-faint">/</span><span className="text-terminal-text">{position.markPrice.toFixed(4)}</span></td>
    <td className={cn("px-4 py-3 font-mono font-semibold", position.unrealizedPnl >= 0 ? "text-terminal-up" : "text-terminal-down")}>{position.unrealizedPnl >= 0 ? "+" : ""}{position.unrealizedPnl.toFixed(3)} U</td>
    <td className="px-4 py-3">{position.protected ? <span className="inline-flex items-center gap-1.5 text-terminal-up"><CheckCircle2 size={14} />有效</span> : <span className="inline-flex items-center gap-1.5 text-terminal-down"><XCircle size={14} />缺失</span>}</td>
  </tr>;
}

function PositionDetail({ position }: { position: Position }) {
  const min = Math.min(position.entryPrice, position.markPrice, position.stopPrice);
  const max = Math.max(position.entryPrice, position.markPrice, position.stopPrice);
  const padding = Math.max((max - min) * 0.18, max * 0.002);
  const low = min - padding;
  const high = max + padding;
  const at = (value: number) => `${Math.max(2, Math.min(98, ((value - low) / Math.max(high - low, Number.EPSILON)) * 100))}%`;
  const stopDistance = Math.abs(position.stopPrice - position.markPrice) / Math.max(position.markPrice, Number.EPSILON) * 100;
  const marginUsdt = position.initialMarginUsdt ?? position.notional / Math.max(position.leverage, 1);
  return <aside className="border-t border-terminal-line bg-terminal-soft/35 p-4 xl:border-l xl:border-t-0">
    <div className="flex items-center justify-between"><div><p className="section-kicker">仓位详情</p><h3 className="mt-1 font-mono text-lg font-semibold text-terminal-text">{position.symbol}</h3></div><StatusPill tone={position.protected ? "positive" : "negative"}><ShieldCheck size={11} />{position.protected ? "reduceOnly" : "未保护"}</StatusPill></div>
    <div className="mt-5 grid grid-cols-2 gap-4"><Stat label="数量" value={position.quantity.toFixed(4)} /><Stat label="保证金" value={`${marginUsdt.toFixed(2)} U`} /><Stat label="止损价格" value={position.stopPrice.toFixed(4)} tone="warning" /><Stat label="理论止损风险" value={`${position.stopRisk.toFixed(2)} U`} tone="warning" /></div>
    <div className="mt-6 border-y border-terminal-line py-5">
      <div className="relative h-2 bg-terminal-line"><span className="absolute inset-y-0 w-0.5 bg-terminal-blue" style={{ left: at(position.entryPrice) }} /><span className="absolute inset-y-[-4px] w-1 bg-terminal-text" style={{ left: at(position.markPrice) }} /><span className="absolute inset-y-0 w-0.5 bg-terminal-down" style={{ left: at(position.stopPrice) }} /></div>
      <div className="mt-3 flex justify-between text-[11px] text-terminal-muted"><span><i className="mr-1 inline-block h-1.5 w-1.5 bg-terminal-blue" />入场</span><span><i className="mr-1 inline-block h-1.5 w-1.5 bg-terminal-text" />标记</span><span><i className="mr-1 inline-block h-1.5 w-1.5 bg-terminal-down" />止损</span></div>
    </div>
    <div className="mt-4 space-y-2 text-xs"><div className="flex justify-between gap-4 text-terminal-muted"><span>距离止损</span><b className="font-mono font-medium text-terminal-warn">{stopDistance.toFixed(2)}%</b></div><div className="flex justify-between gap-4 text-terminal-muted"><span>开仓时间</span><b className="font-mono font-medium text-terminal-text">{displayTime(position.openedAt)}</b></div><div className="flex justify-between gap-4 text-terminal-muted"><span>保证金模式</span><b className="font-mono font-medium text-terminal-text">{position.marginMode || "unknown"}</b></div></div>
  </aside>;
}
