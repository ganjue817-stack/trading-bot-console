import { AlertTriangle, CheckCircle2, CloudOff, ShieldAlert } from "lucide-react";
import type { Snapshot } from "../types";
import { Panel, StatusPill } from "./ui/terminal";

const blockerLabels: Record<string, string> = {
  api_permissions_unverified: "API 权限未验证",
  api_read_permission_missing: "读取权限不可用",
  api_trade_permission_missing: "交易权限不可用",
  consensus_stale: "共识数据陈旧",
  normalized_positions_stale: "标准化持仓陈旧",
  pipeline_run_stale: "完整同步已超时",
  "pipeline health not healthy": "数据管线健康检查未通过",
  "consecutive pipeline failures": "数据管线连续失败",
};
const label = (value: string) => blockerLabels[value] ?? value.replaceAll("_", " ");

export function OperationalStatus({ snapshot }: { snapshot: Snapshot }) {
  const floorMet = snapshot.positions.length >= snapshot.minimumOpenPositions;
  const fresh = snapshot.dataAgeSeconds <= 30 && snapshot.monitor.status === "ok";
  const running = snapshot.executionStatus === "executed" && snapshot.blockers.length === 0;
  const liveOpinionCount = snapshot.externalLiveOpinions.length;
  const liveOpinionNames = snapshot.externalLiveOpinions.map((opinion) => opinion.broadcaster).join("、");
  return <Panel className="overflow-hidden border-l-2 border-l-terminal-warn">
    <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
      <div className="flex min-w-[230px] items-center gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center border ${running ? "border-terminal-up/40 bg-terminal-up/10 text-terminal-up" : "border-terminal-warn/40 bg-terminal-warn/10 text-terminal-warn"}`}>{running ? <CheckCircle2 size={19} /> : <ShieldAlert size={19} />}</div><div><p className="text-sm font-semibold text-terminal-text">{running ? "执行器正常" : "执行器已阻断"}</p><p className="mt-0.5 text-xs text-terminal-muted">{running ? "准入检查通过" : "不会提交新的实盘订单"}</p></div></div>
      <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden border border-terminal-line bg-terminal-line sm:grid-cols-4">
        <StatusMetric label="持仓下限" value={`${snapshot.positions.length} / ${snapshot.minimumOpenPositions}`} detail={`上限 ${snapshot.maxOpenPositions}`} tone={floorMet ? "positive" : "warning"} />
        <StatusMetric label="行情镜像" value={fresh ? "新鲜" : "陈旧"} detail={`${snapshot.dataAgeSeconds}s 前`} tone={fresh ? "positive" : "warning"} />
        <StatusMetric label="API 权限" value={snapshot.apiPermissions.verified ? "已验证" : "未验证"} detail={snapshot.apiPermissions.status} tone={snapshot.apiPermissions.verified ? "positive" : "warning"} />
        <StatusMetric label="外部直播观点" value={liveOpinionCount ? `${liveOpinionCount} 场有效` : "暂无"} detail={liveOpinionNames || "等待当日直播观点"} tone={liveOpinionCount ? "positive" : "warning"} />
      </div>
    </div>
    {(snapshot.blockers.length > 0 || snapshot.pipeline.reasons.length > 0) && <div className="flex flex-wrap items-center gap-2 border-t border-terminal-warn/30 bg-terminal-warn/5 px-4 py-2.5 text-xs"><AlertTriangle size={14} className="shrink-0 text-terminal-warn" /><span className="font-medium text-terminal-warn">当前阻断</span>{[...new Set([...snapshot.blockers, ...snapshot.pipeline.reasons])].map((blocker) => <StatusPill key={blocker} tone="warning">{label(blocker)}</StatusPill>)}{snapshot.monitor.error && <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-terminal-muted"><CloudOff size={13} />{snapshot.monitor.error}</span>}</div>}
  </Panel>;
}

function StatusMetric({ label: title, value, detail, tone }: { label: string; value: string; detail: string; tone: "positive" | "warning" }) {
  return <div className="min-w-0 bg-terminal-panel px-3 py-2.5"><p className="text-xs text-terminal-muted">{title}</p><div className="mt-1 flex items-center gap-1.5"><span className={`h-1.5 w-1.5 shrink-0 ${tone === "positive" ? "bg-terminal-up" : "bg-terminal-warn"}`} /><strong className={`truncate font-mono text-sm ${tone === "positive" ? "text-terminal-text" : "text-terminal-warn"}`}>{value}</strong></div><p className="mt-0.5 truncate text-[11px] text-terminal-faint">{detail}</p></div>;
}
