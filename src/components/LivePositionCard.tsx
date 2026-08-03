import { CheckCircle2, Eye, ShieldCheck, XCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
import { Panel, Stat, StatusPill } from "./ui/terminal";
import type { Position } from "../types";

const candles = [58.84, 58.72, 58.61, 58.67, 58.55, 58.49, 58.57, 58.45, 58.38, 58.31].map((price, index) => ({ time: `${17}:${String(20 + index * 3).padStart(2, "0")}`, price }));

export function LivePositionCard({ position }: { position: Position | null }) {
  if (!position) {
    return <Panel className="grid min-h-[430px] place-items-center p-6"><div className="text-center"><XCircle className="mx-auto text-terminal-muted" size={28} /><p className="mt-3 font-mono text-sm text-terminal-text">当前无实盘持仓</p><p className="mt-1 text-xs text-terminal-muted">控制台仅显示执行器已对账的状态。</p></div></Panel>;
  }

  const steps = ["Telegram 信号解析有效", "准入检查通过", "开仓已成交", "全量保护止损已挂载"];
  const lower = Math.min(position.entryPrice, position.markPrice) - 0.35;
  const upper = Math.max(position.stopPrice, position.entryPrice, position.markPrice) + 0.3;
  const marginUsdt = position.initialMarginUsdt ?? position.notional / Math.max(position.leverage, 1);

  return <Panel className="overflow-hidden">
    <div className="flex flex-col gap-3 border-b border-terminal-line p-4 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="section-kicker">当前持仓 / Telegram 独立路径</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="font-mono text-xl font-semibold text-terminal-text">{position.symbol}</h2><StatusPill tone={position.side === "long" ? "positive" : "negative"}>{position.side.toUpperCase()}</StatusPill><StatusPill tone="info">{position.leverage}x</StatusPill><StatusPill tone="neutral">{position.marginMode || "unknown"}</StatusPill></div></div>
      <StatusPill tone="neutral"><Eye size={11} />只读状态</StatusPill>
    </div>
    <div className="grid xl:grid-cols-[1.25fr_.75fr]">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4"><Stat label="开仓保证金" value={`${marginUsdt.toFixed(0)} U`} hint={`名义 ${position.notional.toFixed(0)} U`} /><Stat label="入场均价" value={position.entryPrice.toFixed(4)} /><Stat label="标记价格" value={<motion.span key={position.markPrice} initial={{ color: "#8fe4c6" }} animate={{ color: "#e7eef5" }}>{position.markPrice.toFixed(3)}</motion.span>} /><Stat label="未实现盈亏" value={`${position.unrealizedPnl >= 0 ? "+" : ""}${position.unrealizedPnl.toFixed(2)} U`} tone={position.unrealizedPnl >= 0 ? "positive" : "negative"} /></div>
        <div className="relative mt-5 h-[202px] border-y border-terminal-line py-3"><ResponsiveContainer width="100%" height="100%"><AreaChart data={candles}><defs><linearGradient id="positionShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3aaee0" stopOpacity="0.2" /><stop offset="1" stopColor="#3aaee0" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#24303c" strokeDasharray="2 4" /><XAxis dataKey="time" tick={{ fill: "#718192", fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis domain={[lower, upper]} width={40} tick={{ fill: "#718192", fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "#10161e", border: "1px solid #2b3b49", borderRadius: 0, fontSize: 11 }} /><ReferenceLine y={position.entryPrice} stroke="#44bee9" strokeDasharray="4 4" label={{ value: "入场", fill: "#5ec9f2", fontSize: 10, position: "insideTopLeft" }} /><ReferenceLine y={position.stopPrice} stroke="#ec6671" strokeDasharray="4 4" label={{ value: `止损 ${position.stopPrice.toFixed(3)}`, fill: "#ee7b83", fontSize: 10, position: "insideTopLeft" }} /><Area type="monotone" dataKey="price" stroke="#48b6e4" strokeWidth={1.5} fill="url(#positionShade)" /></AreaChart></ResponsiveContainer><div className="pointer-events-none absolute bottom-[35%] left-0 right-0 h-[32%] bg-terminal-down/5" /></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="名义仓位" value={`≈ ${position.notional.toFixed(0)} U`} /><Stat label="灾难止损" value="4.00%" tone="warning" /><Stat label="理论止损风险" value={`≈ ${position.stopRisk.toFixed(0)} U`} tone="warning" /><Stat label="保护属性" value="reduceOnly" tone="positive" /></div>
      </div>
      <aside className="border-t border-terminal-line bg-terminal-soft/50 p-4 xl:border-l xl:border-t-0"><p className="section-kicker">仓位生命周期</p><ol className="mt-4 space-y-0">{steps.map((step, index) => <li key={step} className="relative flex gap-3 pb-5 last:pb-0"><span className="z-10 grid h-5 w-5 place-items-center bg-terminal-panel text-terminal-up"><CheckCircle2 size={14} /></span>{index < steps.length - 1 && <i className="absolute left-[9px] top-5 h-[calc(100%-6px)] border-l border-terminal-line" />}<div><p className="text-xs text-terminal-text">{step}</p><p className="mt-0.5 text-[10px] text-terminal-muted">{index === 0 ? "消息解析与来源健康度通过" : index === 1 ? `风险预算、${position.marginMode || "unknown"} 与交易权限检查通过` : index === 2 ? `交易所已确认 ${marginUsdt.toFixed(0)} U 保证金` : "交易所 reduceOnly 全量保护单处于有效状态"}</p></div></li>)}</ol>
        <div className="mt-5 border border-terminal-warn/40 bg-terminal-warn/5 p-3"><div className="flex items-center gap-1.5 text-xs text-terminal-warn"><ShieldCheck size={14} />实盘退出范围</div><p className="mt-1.5 text-[11px] leading-5 text-terminal-muted">当前执行器仅使用固定 4% 止损、单次共识减半与共识反向全平。纸面层的跟随调仓与跟踪止盈不在实盘执行范围内。</p></div>
      </aside>
    </div>
  </Panel>;
}
