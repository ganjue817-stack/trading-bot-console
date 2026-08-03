import { Radio, ShieldCheck } from "lucide-react";
import type { Snapshot } from "../types";
import { Panel, StatusPill } from "./ui/terminal";

export function ExternalOpinionPanel({ snapshot }: { snapshot: Snapshot }) {
  const opinions = snapshot.externalLiveOpinions;
  const setups = snapshot.trustedExternalSetups;
  return <Panel className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-terminal-line px-4 py-3">
      <div><p className="section-kicker">外部观点</p><p className="mt-1 text-sm text-terminal-text">仅作权重受控的辅助输入，不能单独触发开仓</p></div>
      <StatusPill tone={opinions.length ? "info" : "neutral"}><Radio size={11} />{opinions.length} 条有效</StatusPill>
    </div>
    {opinions.length ? <div className="divide-y divide-terminal-line">{opinions.map((opinion) => <div key={opinion.contentId || `${opinion.platform}-${opinion.broadcaster}`} className="px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs text-terminal-text">{opinion.platform} · {opinion.broadcaster || "--"}</p><p className="mt-1 text-[10px] text-terminal-muted">{opinion.title || opinion.date} · 转写可信度 {opinion.transcriptionConfidence}</p></div><StatusPill tone={opinion.requiresConfirmation ? "warning" : "positive"}>{opinion.requiresConfirmation ? "需要确认" : "已确认"}</StatusPill></div>
      <div className="mt-3 flex flex-wrap gap-2">{opinion.views.map((view, index) => <StatusPill key={`${view.symbol}-${view.direction}-${index}`} tone={view.direction === "long" ? "positive" : "negative"}>{view.symbol} · {view.direction === "long" ? "多" : "空"} · {(view.confidence * 100).toFixed(0)}%</StatusPill>)}</div>
    </div>)}</div> : <div className="px-4 py-6 text-center text-xs text-terminal-faint">当前没有有效的外部直播观点</div>}
    {setups.length > 0 && <div className="border-t border-terminal-line bg-terminal-soft/50 px-4 py-3"><div className="mb-2 flex items-center gap-2 text-[11px] text-terminal-muted"><ShieldCheck size={13} />受控观察点位</div><div className="flex flex-wrap gap-2">{setups.map((setup) => <StatusPill key={`${setup.contentId}-${setup.symbol}`} tone={setup.status === "eligible" ? "positive" : "warning"}>{setup.symbol} · {setup.direction === "long" ? "多" : "空"} · {setup.status === "eligible" ? "可用" : "等待"}</StatusPill>)}</div></div>}
  </Panel>;
}
