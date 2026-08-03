import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Crosshair, UsersRound } from "lucide-react";
import type { Snapshot } from "../types";
import { cn } from "../lib/utils";
import { Panel, StatusPill } from "./ui/terminal";

function price(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) return "N/A";
  if (value >= 1000) return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toLocaleString("zh-CN", { maximumFractionDigits: 4 });
  return value.toLocaleString("zh-CN", { maximumSignificantDigits: 6 });
}

function sourceName(source: string) {
  return source === "okx" ? "OKX" : source === "binance" ? "Binance" : source;
}

export function ConsensusPanel({ snapshot }: { snapshot: Snapshot }) {
  const [expanded, setExpanded] = useState("");
  const opportunities = useMemo(
    () => [...snapshot.symbolOpportunities].sort((left, right) =>
      Number(right.tradeEligible) - Number(left.tradeEligible)
      || right.sameDirectionTraderCount - left.sameDirectionTraderCount
      || (right.opportunityScore ?? -1) - (left.opportunityScore ?? -1)),
    [snapshot.symbolOpportunities],
  );

  return <Panel className="overflow-hidden">
    <div className="border-b border-terminal-line px-4 py-3">
      <p className="section-kicker">币种共识机会</p>
      <p className="mt-1 text-sm text-terminal-text">当前公开持仓按稳定交易员身份去重</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-left text-xs">
        <thead className="bg-terminal-soft text-[10px] text-terminal-muted"><tr>
          <th className="w-9 px-3 py-2.5" aria-label="展开明细" />
          {["币种", "方向", "同向 / 反向", "多 / 空", "当前成本簇", "离簇", "正式评分", "准入"].map((column) =>
            <th key={column} className="px-3 py-2.5 font-medium">{column}</th>)}
        </tr></thead>
        <tbody>{opportunities.slice(0, 24).map((item) => {
          const isExpanded = expanded === item.symbol;
          return <Fragment key={item.symbol}>
            <tr className="border-t border-terminal-line/70 hover:bg-terminal-soft/60">
              <td className="px-3 py-3">
                <button type="button" className="grid h-7 w-7 place-items-center text-terminal-muted" onClick={() => setExpanded(isExpanded ? "" : item.symbol)}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              </td>
              <td className="px-3 py-3"><p className="font-mono font-semibold text-terminal-text">{item.symbol}</p><p className="mt-1 text-[10px] text-terminal-faint">{item.totalUnique} 个唯一身份</p></td>
              <td className={cn("px-3 py-3 font-mono", item.direction === "long" ? "text-terminal-up" : "text-terminal-down")}>{item.direction.toUpperCase()}</td>
              <td className="px-3 py-3 font-mono text-terminal-text">{item.sameDirectionTraderCount} / {item.opposingDirectionTraderCount}</td>
              <td className="px-3 py-3 font-mono text-terminal-text">{item.longUnique} / {item.shortUnique}</td>
              <td className="px-3 py-3"><p className="font-mono text-terminal-blue">{item.costClusterTraderCount} 人 · {price(item.costClusterMedian)}</p><p className="mt-1 text-[10px] text-terminal-muted">{item.costClusterSourceCount} 个来源</p></td>
              <td className="px-3 py-3 font-mono text-terminal-text">{item.costDistancePct === null ? "N/A" : `${(Math.abs(item.costDistancePct) * 100).toFixed(2)}%`}</td>
              <td className="px-3 py-3"><p className="font-mono text-terminal-text">{item.opportunityScore === null ? "N/A" : item.opportunityScore.toFixed(1)}</p><p className="mt-1 text-[10px] text-terminal-muted">{item.scoreReason}</p></td>
              <td className="px-3 py-3"><StatusPill tone={item.tradeEligible ? "positive" : "neutral"}>{item.tradeEligible ? "可交易" : "背景观察"}</StatusPill><p className="mt-1 text-[10px] text-terminal-muted">{item.eligibilityReason}</p></td>
            </tr>
            {isExpanded && <tr className="border-t border-terminal-line bg-terminal-bg/70"><td colSpan={9} className="px-4 py-4">
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-terminal-muted"><UsersRound size={13} />同向当前持仓 · {item.consensusTraders.length} 人</div>
                  <div className="divide-y divide-terminal-line/70 border-y border-terminal-line">{item.consensusTraders.map((trader) =>
                    <div key={`${trader.stableId}-${trader.direction}`} className="grid grid-cols-[minmax(120px,1fr)_100px_100px] gap-3 py-2 text-[11px]">
                      <span className="truncate text-terminal-text">{trader.name}</span>
                      <span className="text-terminal-muted">{(trader.sources.length ? trader.sources : [trader.source]).map(sourceName).join(" / ")}</span>
                      <span className="text-right font-mono text-terminal-blue">{price(trader.cost)}</span>
                    </div>)}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-terminal-muted"><Crosshair size={13} />有效成本簇 · {item.costClusterTraderCount} 人</div>
                  <div className="divide-y divide-terminal-line/70 border-y border-terminal-line">{item.costClusterTraders.map((trader) =>
                    <div key={`${trader.stableId}-${trader.direction}`} className="grid grid-cols-[minmax(120px,1fr)_100px] gap-3 py-2 text-[11px]">
                      <span className="truncate text-terminal-text">{trader.name}</span>
                      <span className="text-right font-mono text-terminal-blue">{price(trader.cost)}</span>
                    </div>)}
                  </div>
                </div>
              </div>
            </td></tr>}
          </Fragment>;
        })}</tbody>
      </table>
    </div>
  </Panel>;
}
