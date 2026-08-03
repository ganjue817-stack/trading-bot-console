import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Crosshair,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MockApi } from "./mock-api";
import {
  getSameDirectionTraderCount,
  sortSymbolOpportunities,
} from "./symbol-sorting";
import type { Side, Snapshot, SymbolOpportunity, Trader } from "./types";

const REFRESH_SECONDS = 10;
const money = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const decimal = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 4 });
const compact = new Intl.NumberFormat("zh-CN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type TabKey =
  | "overview"
  | "positions"
  | "symbols"
  | "traders"
  | "history"
  | "risk";
type RankedPosition = {
  id: string;
  symbol: string;
  side: "long" | "short";
  entry_price: number | null;
  mark_price: number | null;
  notional: number | null;
  unrealized_pnl: number | null;
};
type RankedTrader = {
  id: string;
  name: string;
  platform: string;
  profile_url: string;
  roi_pct: number | null;
  pnl_usdt: number | null;
  quality_score: number | null;
  source_rank: number;
  win_rate_30d_pct: number | null;
  category: string;
  selection_tier_label: string;
  current_position_status: string;
  positions: RankedPosition[];
};
type SmartMoneySnapshot = {
  generated_at: string;
  selected_trader_count: number;
  active_trader_count: number;
  open_position_count: number;
  traders: RankedTrader[];
};

const TRADER_SCORE_OVERRIDES = new Map<string, number>([
  ["okx:d07a08c58f123ee3", 30],
  ["okx:8938b1a2b45a3c71", 30],
]);

function traderQualityScore(trader: RankedTrader) {
  return (
    TRADER_SCORE_OVERRIDES.get(trader.id.trim().toLowerCase()) ??
    trader.quality_score
  );
}
type SourceRow = {
  stableId: string;
  name: string;
  source: string;
  direction: Side;
  cost: number;
  notional: number;
  weight: number | null;
  score: number | null;
  stability: number | null;
  drawdown: number | null;
  syncedAt: string;
};

const tabs: { id: TabKey; label: string }[] = [
  { id: "overview", label: "账户总览" },
  { id: "positions", label: "实盘持仓" },
  { id: "symbols", label: "币种跟踪" },
  { id: "traders", label: "交易员排行" },
  { id: "history", label: "交易历史" },
  { id: "risk", label: "风险保护" },
];

function usdt(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "--"
    : `${money.format(value)} USDT`;
}
function signedUsdt(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "--"
    : `${value > 0 ? "+" : ""}${money.format(value)} USDT`;
}
function sideLabel(side: Side | "-") {
  return side === "long" ? "做多" : side === "short" ? "做空" : "--";
}
function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
function score(value: number | null) {
  return value !== null && Number.isFinite(value) ? value.toFixed(2) : "--";
}
function marginModeLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "unknown") return "unknown";
  if (["isolated", "isolated_margin", "1"].includes(normalized)) return "逐仓";
  if (["cross", "crossed", "cross_margin", "regular_margin", "0"].includes(normalized)) return "全仓";
  return value;
}
function bytesLabel(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value.toFixed(0)} B`;
}
function actionLabel(action: string) {
  return (
    (
      {
        open: "开仓",
        close: "平仓",
        reduce: "减仓",
        risk: "风控",
        sync: "同步",
        add: "加仓",
        rebuild: "重建",
      } as Record<string, string>
    )[action] ?? action
  );
}
function statusLabel(status: string) {
  return status === "executed" || status === "ready"
    ? "运行中"
    : status === "blocked"
      ? "准入受阻"
      : status === "simulation"
        ? "模拟回退"
        : "待确认";
}
function evidenceReasonLabel(reason: string) {
  return (
    (
      {
        formal_strategy_opportunity_score: "线上正式策略评分",
        formal_strategy_score_unavailable: "线上正式评分字段缺失",
        effective_weight_score: "交易员有效权重均值",
        trader_quality_unavailable: "交易员质量字段缺失",
        current_open_position_cost_cluster: "当前公开持仓成本簇",
        current_price_or_cost_cluster_unavailable: "现价或成本簇字段缺失",
        requires_3_unique_current_positions: "同向稳定身份不足 3 人",
        formal_strategy_decision_unavailable: "无线上正式策略决策",
        formal_entry_gates_not_passed: "正式准入门禁未通过",
        entry_eligible: "正式准入门禁已通过",
      } as Record<string, string>
    )[reason] ?? reason.replaceAll("_", " ")
  );
}
function eventReasonLabel(reason: string) {
  return (
    (
      {
        tg_target_snapshot: "Telegram 目标仓位同步",
        exchange_position_closed: "交易所仓位已平",
        elite_copy_core_reserve: "核心跟单仓位保留",
        elite_target_snapshot: "交易员目标仓位同步",
        elite_single_source_core: "单一核心来源跟随",
        elite_source_target_closed: "来源交易员目标仓位已平",
        elite_source_explicit_close: "来源交易员明确平仓",
        orphan_elite_source_closed: "失配来源仓位已平",
        superseded_by_reserve_core: "被核心保留仓位替换",
        reserve_core_high_weight: "核心高权重仓位保留",
        consensus_exit: "共识退出",
        pending_submission_not_found_on_exchange: "交易所未发现待提交订单",
        position_notional_cap_reconciliation: "仓位名义金额上限校正",
        telegram_close: "Telegram 明确信号平仓",
        manual_source_disqualified: "来源资格已取消",
        manual_sizing_correction: "仓位规模校正",
        ranked_consensus_overlay: "排序共识叠加",
        ranked_consensus_overlay_stop_failed: "排序共识保护止损失败",
        profit_stop_sync_failed: "盈利保护止损同步失败",
        aggregate_consensus_faded: "聚合共识消退",
        profit_stop: "盈利保护止损",
        manual_residual_adopted: "残余仓位纳入保护",
        protective_stop_resized: "保护止损重新调整",
      } as Record<string, string>
    )[reason] ?? reason.replaceAll("_", " ")
  );
}
function dateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? "--"
    : date.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
}

function findTrader(snapshot: Snapshot, name: string, source: string) {
  return snapshot.traders.find(
    (trader) =>
      trader.name === name &&
      trader.source.toLowerCase() === source.toLowerCase(),
  );
}
function sourceRows(
  snapshot: Snapshot,
  opportunity: SymbolOpportunity,
): SourceRow[] {
  const seen = new Set<string>();
  return [
    ...opportunity.consensusTraders,
    ...opportunity.opposingTraders,
  ].flatMap((row) => {
    const key = `${row.stableId}:${row.direction}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const trader = findTrader(snapshot, row.name, row.source);
    const position = trader?.positions?.find(
      (item) =>
        item.symbol === opportunity.symbol && item.direction === row.direction,
    );
    return [
      {
        stableId: row.stableId,
        name: row.name,
        source: row.sources.length ? row.sources.join(" / ") : row.source,
        direction: row.direction,
        cost: position?.entryPrice || row.cost,
        notional: position?.notional || row.notional,
        weight: trader?.weight ?? null,
        score: row.qualityScore ?? trader?.score ?? null,
        stability: trader?.stability ?? null,
        drawdown: trader?.drawdown ?? null,
        syncedAt: position?.syncedAt || trader?.updatedAt || "",
      },
    ];
  });
}
function positionOrigins(snapshot: Snapshot, symbol: string): SourceRow[] {
  const seen = new Set<string>();
  return snapshot.traders.flatMap((trader: Trader) =>
    (trader.positions ?? []).flatMap((position) => {
      if (
        position.symbol !== symbol ||
        seen.has(`${trader.id}:${position.direction}`)
      )
        return [];
      seen.add(`${trader.id}:${position.direction}`);
      return [
        {
          stableId: trader.id,
          name: trader.name,
          source: trader.source,
          direction: position.direction,
          cost: position.entryPrice,
          notional: position.notional,
          weight: trader.weight,
          score: trader.score,
          stability: trader.stability,
          drawdown: trader.drawdown,
          syncedAt: position.syncedAt,
        },
      ];
    }),
  );
}

function DirectionBadge({ side }: { side: Side }) {
  return (
    <span
      className={`direction-badge ${side === "long" ? "is-long" : "is-short"}`}
    >
      {sideLabel(side)}
    </span>
  );
}
function MetricCard({
  icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
function SectionHeading({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <span>{note}</span>
    </div>
  );
}

function RiskPanel({
  snapshot,
  isRunning,
}: {
  snapshot: Snapshot;
  isRunning: boolean;
}) {
  const riskPercent =
    snapshot.riskLimit > 0
      ? Math.min(100, (snapshot.riskUsed / snapshot.riskLimit) * 100)
      : 0;
  return (
    <article className="panel risk-panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">账户保护</p>
          <h2>{statusLabel(snapshot.executionStatus)}</h2>
        </div>
        <span
          className={`state-tag ${isRunning ? "state-good" : "state-watch"}`}
        >
          {isRunning ? "正常" : "观察"}
        </span>
      </div>
      <div className="risk-number">
        <strong>{riskPercent.toFixed(1)}%</strong>
        <span>止损风险占用</span>
      </div>
      <div className="risk-track">
        <i style={{ width: `${riskPercent}%` }} />
      </div>
      <dl className="key-list">
        <div>
          <dt>风险预算</dt>
          <dd>{usdt(snapshot.riskLimit)}</dd>
        </div>
        <div>
          <dt>已用风险</dt>
          <dd>{usdt(snapshot.riskUsed)}</dd>
        </div>
        <div>
          <dt>保护止损</dt>
          <dd>
            {snapshot.positions.every((position) => position.protected)
              ? "全部已确认"
              : "存在待确认仓位"}
          </dd>
        </div>
        <div>
          <dt>待处理意图</dt>
          <dd>{snapshot.pendingIntents} 个</dd>
        </div>
      </dl>
      {snapshot.blockers.length > 0 && (
        <p className="warning-copy">{snapshot.blockers.join("；")}</p>
      )}
    </article>
  );
}

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [rankSnapshot, setRankSnapshot] = useState<SmartMoneySnapshot | null>(null);
  const [rankError, setRankError] = useState("");
  const [rankSearch, setRankSearch] = useState("");
  const [rankPlatform, setRankPlatform] = useState("全部");
  const [refreshing, setRefreshing] = useState(false);
  const [remaining, setRemaining] = useState(REFRESH_SECONDS);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const strategySnapshotRequest =
        activeTab === "symbols"
          ? MockApi.getFullSnapshot().then(
              (fullSnapshot) => fullSnapshot ?? MockApi.getSnapshot(),
            )
          : MockApi.getSnapshot();
      const [strategyResult, rankResult] = await Promise.allSettled([
        strategySnapshotRequest,
        fetch("/api/smart-money/snapshot", { cache: "no-store" }).then(
          async (response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return (await response.json()) as SmartMoneySnapshot;
          },
        ),
      ]);
      if (strategyResult.status === "fulfilled") {
        setSnapshot(strategyResult.value);
      } else {
        throw strategyResult.reason;
      }
      if (
        rankResult.status === "fulfilled" &&
        Array.isArray(rankResult.value.traders)
      ) {
        setRankSnapshot(rankResult.value);
        setRankError("");
      } else {
        setRankError("交易员排行暂时无法读取，实盘数据不受影响");
      }
      setRemaining(REFRESH_SECONDS);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const timer = window.setInterval(
      () => setRemaining((value) => (value > 0 ? value - 1 : REFRESH_SECONDS)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (remaining === 0) void load();
  }, [load, remaining]);
  const orderedSymbolOpportunities = useMemo(
    () => (snapshot ? sortSymbolOpportunities(snapshot.symbolOpportunities) : []),
    [snapshot],
  );
  useEffect(() => {
    if (snapshot && !selectedSymbol)
      setSelectedSymbol(
        snapshot.positions[0]?.symbol ??
          orderedSymbolOpportunities[0]?.symbol ??
          "",
      );
  }, [orderedSymbolOpportunities, selectedSymbol, snapshot]);
  const selectedOpportunity = useMemo(
    () =>
      orderedSymbolOpportunities.find(
        (item) => item.symbol === selectedSymbol,
      ) ??
      orderedSymbolOpportunities[0] ??
      null,
    [orderedSymbolOpportunities, selectedSymbol],
  );
  const selectedSources = useMemo(
    () =>
      snapshot && selectedOpportunity
        ? sourceRows(snapshot, selectedOpportunity)
        : [],
    [snapshot, selectedOpportunity],
  );
  const rankedTraders = useMemo(() => {
    const query = rankSearch.trim().toLowerCase();
    return [...(rankSnapshot?.traders ?? [])]
      .filter(
        (trader) =>
          (rankPlatform === "全部" || trader.platform === rankPlatform) &&
          (!query ||
            trader.name.toLowerCase().includes(query) ||
            trader.positions.some((position) =>
              position.symbol.toLowerCase().includes(query),
            )),
      )
      .sort(
        (left, right) =>
          left.source_rank - right.source_rank ||
          (right.roi_pct ?? Number.NEGATIVE_INFINITY) -
            (left.roi_pct ?? Number.NEGATIVE_INFINITY) ||
          (traderQualityScore(right) ?? -1) -
            (traderQualityScore(left) ?? -1),
      );
  }, [rankPlatform, rankSearch, rankSnapshot]);
  if (!snapshot)
    return (
      <div className="app-shell loading-state">
        <div className="loading-mark">
          <Activity size={22} />
          正在读取实盘账户快照...
        </div>
      </div>
    );

  const isRunning =
    snapshot.executionStatus === "executed" ||
    snapshot.executionStatus === "ready";
  const currentPnlTone = snapshot.dailyPnl >= 0 ? "positive" : "negative";
  const selectedSupport = selectedSources.filter(
    (item) => item.direction === selectedOpportunity?.direction,
  ).length;
  const selectedOpposingSources = selectedSources.filter(
    (item) => item.direction !== selectedOpportunity?.direction,
  );
  const selectedSameDirectionCount = selectedOpportunity
    ? getSameDirectionTraderCount(selectedOpportunity)
    : selectedSupport;
  const selectedOpposition =
    selectedOpportunity?.opposingDirectionTraderCount ?? 0;
  const overviewPosition = snapshot.positions[0] ?? null;
  const overviewOrigins = overviewPosition
    ? positionOrigins(snapshot, overviewPosition.symbol).slice(0, 3)
    : [];
  const riskPercent =
    snapshot.riskLimit > 0
      ? Math.min(100, (snapshot.riskUsed / snapshot.riskLimit) * 100)
      : 0;
  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === "symbols" && !selectedSymbol)
      setSelectedSymbol(orderedSymbolOpportunities[0]?.symbol ?? "");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">
              <Activity size={19} />
            </span>
            <span>交易账户观察</span>
          </div>
          <div className="topbar-status">
            <span className={`live-indicator ${isRunning ? "live" : "watch"}`}>
              <i />
              {isRunning ? "实时只读" : "状态观察"}
            </span>
            <button
              className="icon-button"
              type="button"
              title="立即刷新数据"
              aria-label="立即刷新数据"
              onClick={() => void load()}
              disabled={refreshing}
            >
              <RefreshCw size={17} className={refreshing ? "spin" : ""} />
            </button>
          </div>
        </div>
        <nav className="page-nav" aria-label="展示栏目">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => switchTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="dashboard-window">
        {activeTab === "overview" && (
          <section className="tab-content overview-tab">
            <SectionHeading
              eyebrow="BYBIT USDT 永续合约 · 只读展示"
              title="实盘账户表现"
              note={`数据时间 ${dateTime(snapshot.updatedAt)} · ${remaining}s 后刷新`}
            />
            <section className="metric-grid">
              <MetricCard
                icon={<WalletCards size={20} />}
                label="账户总权益"
                value={usdt(snapshot.equity)}
                detail={
                  snapshot.capitalBasis === "account_equity"
                    ? "交易所实时资金"
                    : "策略账本口径"
                }
              />
              <MetricCard
                icon={
                  snapshot.dailyPnl >= 0 ? (
                    <ArrowUpRight size={20} />
                  ) : (
                    <ArrowDownRight size={20} />
                  )
                }
                label="当日盈亏"
                value={signedUsdt(snapshot.dailyPnl)}
                detail="已实现 + 当前浮盈"
                tone={currentPnlTone}
              />
              <MetricCard
                icon={<TrendingUp size={20} />}
                label="累计已实现"
                value={signedUsdt(snapshot.totalRealizedPnl)}
                detail={
                  snapshot.resetBaseline.active
                    ? `重置后口径 · ${dateTime(snapshot.resetBaseline.resetAt)}`
                    : "实际平仓结果"
                }
                tone={snapshot.totalRealizedPnl >= 0 ? "positive" : "negative"}
              />
              <MetricCard
                icon={<CircleDollarSign size={20} />}
                label="可用保证金"
                value={usdt(snapshot.accountAvailable)}
                detail="交易所可用余额"
              />
              <MetricCard
                icon={<Crosshair size={20} />}
                label="实盘仓位"
                value={`${snapshot.positions.length} 个`}
                detail={`目标 ${snapshot.targetOpenPositions} · 上限 ${snapshot.maxOpenPositions}`}
              />
              <MetricCard
                icon={<BarChart3 size={20} />}
                label="当前回撤"
                value={`${snapshot.drawdown.toFixed(2)}%`}
                detail={`风险占用 ${riskPercent.toFixed(1)}%`}
              />
            </section>
            <div className="overview-workspace">
              <article className="panel equity-panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-kicker">账户权益曲线</p>
                    <h2>{usdt(snapshot.equity)}</h2>
                  </div>
                  <div className="change-pill">
                    <TrendingUp size={15} />
                    {snapshot.equitySeries.length} 个真实净值点
                  </div>
                </div>
                <div className="equity-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={snapshot.equitySeries}
                      margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="equityFill"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#3b82f6"
                            stopOpacity={0.34}
                          />
                          <stop
                            offset="100%"
                            stopColor="#3b82f6"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        minTickGap={32}
                        tick={{ fill: "#7f92ad", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={58}
                        tickFormatter={(value) => compact.format(value)}
                        tick={{ fill: "#7f92ad", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111c2e",
                          border: "1px solid #253a56",
                          borderRadius: 8,
                          color: "#edf5ff",
                        }}
                        formatter={(value) => [
                          usdt(Number(value ?? 0)),
                          "账户权益",
                        ]}
                        labelStyle={{ color: "#9fb0c6" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="#4f9cff"
                        strokeWidth={2.3}
                        fill="url(#equityFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-footer">
                  <span>起始记录 {snapshot.equitySeries[0]?.time ?? "--"}</span>
                  <span>
                    最新记录 {snapshot.equitySeries.at(-1)?.time ?? "--"}
                  </span>
                </div>
              </article>
              <aside className="panel overview-rail">
                <div className="rail-header">
                  <div>
                    <p className="panel-kicker">当前实盘摘要</p>
                    <h2>
                      {overviewPosition ? overviewPosition.symbol : "暂无仓位"}
                    </h2>
                  </div>
                  {overviewPosition && (
                    <DirectionBadge side={overviewPosition.side} />
                  )}
                </div>
                {overviewPosition ? (
                  <>
                    <div className="rail-pnl">
                      <span>未实现盈亏</span>
                      <strong
                        className={
                          overviewPosition.unrealizedPnl >= 0
                            ? "pnl-positive"
                            : "pnl-negative"
                        }
                      >
                        {signedUsdt(overviewPosition.unrealizedPnl)}
                      </strong>
                    </div>
                    <dl className="rail-stats">
                      <div>
                        <dt>账户开仓价</dt>
                        <dd>{decimal.format(overviewPosition.entryPrice)}</dd>
                      </div>
                      <div>
                        <dt>当前标记价</dt>
                        <dd>{decimal.format(overviewPosition.markPrice)}</dd>
                      </div>
                      <div>
                        <dt>保护止损</dt>
                        <dd>{decimal.format(overviewPosition.stopPrice)}</dd>
                      </div>
                      <div>
                        <dt>风险占用</dt>
                        <dd>{usdt(overviewPosition.stopRisk)}</dd>
                      </div>
                    </dl>
                    <div className="rail-origins">
                      <span>开仓跟随来源</span>
                      {overviewOrigins.length ? (
                        overviewOrigins.map((origin) => (
                          <div key={`${origin.name}-${origin.source}`}>
                            <p>
                              <b>{origin.name}</b>
                              <small>
                                {origin.source} · 开仓价{" "}
                                {decimal.format(origin.cost)}
                              </small>
                            </p>
                            <DirectionBadge side={origin.direction} />
                          </div>
                        ))
                      ) : (
                        <p className="empty-copy">当前未匹配到公开来源仓位。</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="empty-copy rail-empty">
                    交易所当前没有已确认的实盘仓位。
                  </p>
                )}
                <div className="rail-risk">
                  <div>
                    <span>账户风险保护</span>
                    <b>
                      {snapshot.positions.every(
                        (position) => position.protected,
                      )
                        ? "保护正常"
                        : "存在待确认"}
                    </b>
                  </div>
                  <div className="risk-track">
                    <i style={{ width: `${riskPercent}%` }} />
                  </div>
                  <small>
                    {usdt(snapshot.riskUsed)} / {usdt(snapshot.riskLimit)}
                  </small>
                </div>
              </aside>
            </div>
          </section>
        )}
        {activeTab === "positions" && (
          <section className="tab-content">
            <SectionHeading
              eyebrow="实际账户仓位"
              title="实盘持仓与开仓依据"
              note="只显示交易所已确认持仓"
            />
            <div className="position-grid">
              {snapshot.positions.length ? (
                snapshot.positions.map((position) => {
                  const origins = positionOrigins(snapshot, position.symbol);
                  return (
                    <article className="position-card" key={position.id}>
                      <div className="position-top">
                        <div>
                          <div className="symbol-line">
                            <h2>{position.symbol}</h2>
                            <DirectionBadge side={position.side} />
                          </div>
                          <p>账户开仓于 {dateTime(position.openedAt)}</p>
                        </div>
                        <strong
                          className={
                            position.unrealizedPnl >= 0
                              ? "pnl-positive"
                              : "pnl-negative"
                          }
                        >
                          {signedUsdt(position.unrealizedPnl)}
                        </strong>
                      </div>
                      <div className="position-stats">
                        <div>
                          <span>账户开仓价</span>
                          <strong>{decimal.format(position.entryPrice)}</strong>
                        </div>
                        <div>
                          <span>标记价格</span>
                          <strong>{decimal.format(position.markPrice)}</strong>
                        </div>
                        <div>
                          <span>止损价格</span>
                          <strong>{decimal.format(position.stopPrice)}</strong>
                        </div>
                        <div>
                          <span>风险占用</span>
                          <strong>{usdt(position.stopRisk)}</strong>
                        </div>
                        <div>
                          <span>数量</span>
                          <strong>{decimal.format(position.quantity)}</strong>
                        </div>
                        <div>
                          <span>保证金模式</span>
                          <strong>{marginModeLabel(position.marginMode)}</strong>
                        </div>
                        <div>
                          <span>初始保证金</span>
                          <strong>{usdt(position.initialMarginUsdt)}</strong>
                        </div>
                      </div>
                      <div className="origin-block">
                        <div className="origin-title">
                          <span>开仓来源与跟随依据</span>
                          <em>{position.source || "交易所快照"}</em>
                        </div>
                        {origins.length ? (
                          origins.slice(0, 4).map((origin) => (
                            <div
                              className="origin-row"
                              key={`${origin.name}-${origin.source}`}
                            >
                              <div>
                                <b>{origin.name}</b>
                                <small>
                                  {origin.source} · 原始开仓价{" "}
                                  {decimal.format(origin.cost)}
                                </small>
                              </div>
                              <div>
                                <DirectionBadge side={origin.direction} />
                                <small>
                                  {origin.weight === null
                                    ? "未分配权重"
                                    : `权重 ${percent(origin.weight)}`}
                                </small>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="empty-copy">
                            当前没有可匹配的来源仓位快照。
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="empty-panel">
                  当前没有交易所已确认的实盘持仓。
                </article>
              )}
            </div>
          </section>
        )}
        {activeTab === "symbols" && (
          <section className="tab-content symbols-tab">
            <SectionHeading
              eyebrow="全部跟踪币种"
              title="币种共识观察"
              note="候选信号，不等同于账户已持仓"
            />
            <div className="symbol-workspace">
              <article className="panel consensus-panel">
                <div className="table-scroll symbol-list-scroll">
                  <table className="data-table opportunity-table">
                    <thead>
                      <tr>
                        <th>币种</th>
                        <th>方向</th>
                        <th>现价</th>
                        <th>同向人数</th>
                        <th>评分</th>
                        <th>成本簇中位数</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {orderedSymbolOpportunities.map((item) => (
                        <tr
                          className={
                            item.symbol === selectedOpportunity?.symbol
                              ? "selected"
                              : ""
                          }
                          key={item.symbol}
                          onClick={() => setSelectedSymbol(item.symbol)}
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ")
                              setSelectedSymbol(item.symbol);
                          }}
                        >
                          <td>
                            <strong>{item.symbol}</strong>
                            <small>
                              {item.tradeEligible
                                ? "可交易"
                                : item.sameDirectionTraderCount < 3
                                  ? "背景观察（不足 3 人）"
                                  : "背景观察"}
                            </small>
                          </td>
                          <td>
                            <DirectionBadge side={item.direction} />
                          </td>
                          <td>{decimal.format(item.currentPrice)}</td>
                          <td>
                            {getSameDirectionTraderCount(item)} 人
                            <small>
                              反向 {item.opposingDirectionTraderCount} · 身份合计{" "}
                              {item.totalUnique}
                            </small>
                          </td>
                          <td>
                            <b className="score-value" title={item.scoreReason}>
                              {item.opportunityScore === null
                                ? "N/A"
                                : item.opportunityScore.toFixed(2)}
                            </b>
                            <small title={item.pointQualitySource}>
                              点位质量{" "}
                              {item.pointQuality === null
                                ? "N/A"
                                : (item.pointQuality * 100).toFixed(0)}
                            </small>
                          </td>
                          <td>
                            {item.costClusterMedian === null
                              ? "N/A"
                              : decimal.format(item.costClusterMedian)}
                          </td>
                          <td>
                            <ChevronRight size={17} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              {selectedOpportunity && (
                <article className="panel coin-detail-panel">
                  <div className="coin-detail-header">
                    <div>
                      <p className="panel-kicker">
                        {selectedOpportunity.tradeEligible
                          ? "可交易"
                          : selectedOpportunity.sameDirectionTraderCount < 3
                            ? "背景观察（不足 3 人，不可入场）"
                            : "背景观察"}
                      </p>
                      <div className="symbol-line">
                        <h2>{selectedOpportunity.symbol}</h2>
                        <DirectionBadge side={selectedOpportunity.direction} />
                      </div>
                      <p>
                        {selectedOpportunity.reason ||
                          "基于当前交易员仓位快照汇总。"}
                      </p>
                    </div>
                    <div className="coin-meta">
                      <div>
                        <span>方向共识</span>
                        <strong>
                          {Math.abs(
                            selectedOpportunity.directionalConsensus,
                          ).toFixed(2)}
                        </strong>
                      </div>
                      <div>
                        <span>计划名义金额</span>
                        <strong>
                          {usdt(selectedOpportunity.plannedNotional)}
                        </strong>
                      </div>
                      <div>
                        <span>系统动作</span>
                        <strong>
                          {selectedOpportunity.systemAction === "hold"
                            ? "观察持有"
                            : selectedOpportunity.systemAction}
                        </strong>
                      </div>
                      <div>
                        <span>目标价</span>
                        <strong>
                          {selectedOpportunity.targetPrice > 0
                            ? decimal.format(selectedOpportunity.targetPrice)
                            : "--"}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="coin-summary">
                    <div>
                      <Users size={18} />
                      <span>
                        同向 <b>{selectedSameDirectionCount}</b> 人
                      </span>
                    </div>
                    <div>
                      <Activity size={18} />
                      <span>
                        反向 <b>{selectedOpposition}</b> 人
                      </span>
                    </div>
                    <div>
                      <BarChart3 size={18} />
                      <span>
                        多空比{" "}
                        <b>
                          {(selectedOpportunity.longRatio * 100).toFixed(0)}% /{" "}
                          {(selectedOpportunity.shortRatio * 100).toFixed(0)}%
                        </b>
                      </span>
                    </div>
                    <div>
                      <Crosshair size={18} />
                      <span>
                        当前持仓成本簇{" "}
                        <b>{selectedOpportunity.costClusterTraderCount}</b>人 /{" "}
                        {selectedOpportunity.costClusterSourceCount} 来源
                      </span>
                    </div>
                    <div>
                      <Users size={18} />
                      <span>
                        身份合计{" "}
                        <b>{selectedOpportunity.totalUnique}</b> 人
                      </span>
                    </div>
                    <div>
                      <Crosshair size={18} />
                      <span>
                        成本中位 / 离簇{" "}
                        <b>
                          {selectedOpportunity.costClusterMedian === null
                            ? "N/A"
                            : decimal.format(selectedOpportunity.costClusterMedian)}
                          {" / "}
                          {selectedOpportunity.costDistancePct === null
                            ? "N/A"
                            : `${(Math.abs(selectedOpportunity.costDistancePct) * 100).toFixed(2)}%`}
                        </b>
                      </span>
                    </div>
                  </div>
                  <div className="liquidity-summary" aria-label="盘口流动性辅助">
                    <div>
                      <span>1 小时主结构位</span>
                      <strong>{selectedOpportunity.primaryStructurePrice > 0 ? decimal.format(selectedOpportunity.primaryStructurePrice) : "--"}</strong>
                      <small>{selectedOpportunity.primaryStructureKind === "support" ? "支撑" : selectedOpportunity.primaryStructureKind === "resistance" ? "阻力" : "未形成"}</small>
                    </div>
                    <div>
                      <span>同向盘口墙</span>
                      <strong>{selectedOpportunity.liquidityAlignedWallPrice > 0 ? decimal.format(selectedOpportunity.liquidityAlignedWallPrice) : "--"}</strong>
                      <small>{selectedOpportunity.liquidityAlignedWallKind === "bid" ? "买墙" : selectedOpportunity.liquidityAlignedWallKind === "ask" ? "卖墙" : "无"}</small>
                    </div>
                    <div>
                      <span>持续验证</span>
                      <strong>{selectedOpportunity.liquidityPersistenceSnapshots} 次快照</strong>
                      <small>{selectedOpportunity.liquidityVerifiedExchanges.length ? selectedOpportunity.liquidityVerifiedExchanges.join(" / ").toUpperCase() : "尚无跨所验证"}</small>
                    </div>
                    <div>
                      <span>实际采用</span>
                      <strong className={selectedOpportunity.liquidityAdopted ? "is-adopted" : ""}>
                        {selectedOpportunity.liquidityAdopted ? "已采用" : "纯 1 小时结构"}
                      </strong>
                      <small>
                        {selectedOpportunity.liquidityAdopted
                          ? selectedOpportunity.liquidityStopAdjusted ? "止损已在结构与有效墙外侧" : "有效墙确认原结构位"
                          : selectedOpportunity.liquidityFallbackReason || "盘口中性回退"}
                      </small>
                    </div>
                  </div>
                  <div className="liquidity-summary" aria-label="策略准入与评分依据">
                    <div>
                      <span>正式策略评分</span>
                      <strong>
                        {selectedOpportunity.opportunityScore === null
                          ? "N/A"
                          : selectedOpportunity.opportunityScore.toFixed(2)}
                      </strong>
                      <small title={selectedOpportunity.scoreReason}>
                        {evidenceReasonLabel(selectedOpportunity.scoreReason)}
                      </small>
                    </div>
                    <div>
                      <span>交易员质量</span>
                      <strong>
                        {selectedOpportunity.traderQualityScore === null
                          ? "N/A"
                          : selectedOpportunity.traderQualityScore.toFixed(2)}
                      </strong>
                      <small title={selectedOpportunity.traderQualityReason}>
                        {evidenceReasonLabel(selectedOpportunity.traderQualityReason)}
                      </small>
                    </div>
                    <div>
                      <span>当前持仓点位质量</span>
                      <strong>
                        {selectedOpportunity.pointQuality === null
                          ? "N/A"
                          : (selectedOpportunity.pointQuality * 100).toFixed(0)}
                      </strong>
                      <small title={selectedOpportunity.pointQualitySource}>
                        {evidenceReasonLabel(selectedOpportunity.pointQualitySource)}
                      </small>
                    </div>
                    <div>
                      <span>准入状态</span>
                      <strong>{selectedOpportunity.tradeEligible ? "可交易" : "不可入场"}</strong>
                      <small title={selectedOpportunity.eligibilityReason}>
                        {evidenceReasonLabel(selectedOpportunity.eligibilityReason)}
                      </small>
                    </div>
                  </div>
                  <div className="source-list-heading">
                    <div>
                      <strong>交易员身份明细</strong>
                      <span>
                        已展示 <b>{selectedSources.length}</b> / {selectedOpportunity.totalUnique} 人
                      </span>
                    </div>
                    <div className="identity-counts" aria-label="身份明细分组统计">
                      <span className="identity-same">同向 {selectedSupport}</span>
                      <span className="identity-opposing">反向 {selectedOpposingSources.length}</span>
                    </div>
                  </div>
                  <div
                    className="table-scroll source-list-scroll"
                    tabIndex={0}
                    aria-label="全部交易员身份明细，可上下左右滚动"
                  >
                    <table className="data-table source-table">
                      <thead>
                        <tr>
                          <th>开仓交易员</th>
                          <th>来源</th>
                          <th>身份关系</th>
                          <th>方向</th>
                          <th>开仓价</th>
                          <th>名义金额</th>
                          <th>策略权重</th>
                          <th>评分</th>
                          <th>稳定度</th>
                          <th>最大回撤</th>
                          <th>同步时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSources.length ? (
                          selectedSources.map((row) => (
                            <tr
                              key={`${row.stableId}-${row.direction}`}
                            >
                              <td>
                                <strong>{row.name}</strong>
                              </td>
                              <td>{row.source}</td>
                              <td>
                                <span
                                  className={`identity-relation ${
                                    row.direction === selectedOpportunity.direction
                                      ? "identity-same"
                                      : "identity-opposing"
                                  }`}
                                >
                                  {row.direction === selectedOpportunity.direction
                                    ? "同向"
                                    : "反向"}
                                </span>
                              </td>
                              <td>
                                <DirectionBadge side={row.direction} />
                              </td>
                              <td>{decimal.format(row.cost)}</td>
                              <td>
                                {row.notional > 0 ? usdt(row.notional) : "--"}
                              </td>
                              <td>
                                {row.weight === null
                                  ? "--"
                                  : percent(row.weight)}
                              </td>
                              <td>{score(row.score)}</td>
                              <td>{score(row.stability)}</td>
                              <td>
                                {row.drawdown === null
                                  ? "--"
                                  : `${row.drawdown.toFixed(2)}%`}
                              </td>
                              <td>
                                {row.syncedAt ? dateTime(row.syncedAt) : "--"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={11} className="empty-cell">
                              当前币种暂无可展示的交易员开仓明细。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              )}
            </div>
          </section>
        )}
        {activeTab === "history" && (
          <section className="tab-content">
            <SectionHeading
              eyebrow="账户真实动作"
              title="历史开平仓记录"
              note="结果以实际执行记录为准"
            />
            <article className="panel execution-panel">
              <div className="table-scroll event-list-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>动作</th>
                      <th>币种</th>
                      <th>方向</th>
                      <th>来源与原因</th>
                      <th>名义金额</th>
                      <th>实际盈亏</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.executionEvents.map((event) => (
                      <tr key={event.id}>
                        <td>{event.time || "--"}</td>
                        <td>
                          <span className="event-label">
                            {actionLabel(event.type)}
                          </span>
                        </td>
                        <td>
                          <strong>{event.symbol || "--"}</strong>
                        </td>
                        <td>
                          {event.side === "-" ? (
                            "--"
                          ) : (
                            <DirectionBadge side={event.side} />
                          )}
                        </td>
                        <td className="event-reason">
                          {eventReasonLabel(event.reason || event.path || "--")}
                        </td>
                        <td>
                          {event.notional > 0 ? usdt(event.notional) : "--"}
                        </td>
                        <td
                          className={
                            event.pnl === null || event.pnl === undefined
                              ? ""
                              : event.pnl >= 0
                                ? "pnl-positive"
                                : "pnl-negative"
                          }
                        >
                          {signedUsdt(event.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}
        {activeTab === "risk" && (
          <section className="tab-content risk-tab">
            <SectionHeading
              eyebrow="账户层面风险"
              title="风险与保护状态"
              note="仅展示实时保护结果，不提供人工操作"
            />
            <div className="risk-workspace">
              <RiskPanel snapshot={snapshot} isRunning={isRunning} />
              <article className="panel risk-detail-panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-kicker">保护核对</p>
                    <h2>当前仓位保护</h2>
                  </div>
                  <ShieldCheck size={21} className="shield-icon" />
                </div>
                <div className="protection-list">
                  {snapshot.positions.length ? (
                    snapshot.positions.map((position) => (
                      <div key={position.id}>
                        <CheckCircle2
                          size={17}
                          className={
                            position.protected
                              ? "is-protected"
                              : "is-unprotected"
                          }
                        />
                        <span>
                          <b>{position.symbol}</b> {sideLabel(position.side)} ·
                          止损 {decimal.format(position.stopPrice)}
                        </span>
                        <strong>
                          {position.protected ? "已确认" : "待确认"}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p className="empty-copy">当前没有需要保护的实盘持仓。</p>
                  )}
                </div>
                <div className="policy-list">
                  <p>
                    跟随来源平仓：
                    {snapshot.executionPolicy.sourceExitEnabled
                      ? "已启用"
                      : "未启用"}
                  </p>
                  <p>
                    盈利保护止损：
                    {snapshot.executionPolicy.profitStopEnabled
                      ? "已启用"
                      : "未启用"}
                  </p>
                  <p>
                    共识退出：
                    {snapshot.executionPolicy.consensusExitEnabled
                      ? "已启用"
                      : "未启用"}
                  </p>
                </div>
              </article>
            </div>
          </section>
        )}
        {activeTab === "traders" && (
          <section className="tab-content traders-tab">
            <SectionHeading
              eyebrow="BINANCE · OKX · BYBIT"
              title="聪明钱交易员排行"
              note={
                rankSnapshot
                  ? `${rankSnapshot.selected_trader_count} 人 · ${rankSnapshot.open_position_count} 个公开仓位 · ${dateTime(rankSnapshot.generated_at)}`
                  : "正在读取独立交易员快照"
              }
            />
            <div className="rank-summary">
              <div><span>收录交易员</span><strong>{rankSnapshot?.selected_trader_count ?? "--"}</strong></div>
              <div><span>当前持仓人数</span><strong>{rankSnapshot?.active_trader_count ?? "--"}</strong></div>
              <div><span>公开仓位</span><strong>{rankSnapshot?.open_position_count ?? "--"}</strong></div>
              <div><span>当前筛选</span><strong>{rankedTraders.length}</strong></div>
            </div>
            <article className="panel trader-rank-panel">
              <div className="rank-toolbar">
                <div className="rank-platforms">
                  {["全部", "Binance", "OKX", "Bybit"].map((platform) => (
                    <button
                      type="button"
                      key={platform}
                      className={rankPlatform === platform ? "active" : ""}
                      onClick={() => setRankPlatform(platform)}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
                <input
                  value={rankSearch}
                  onChange={(event) => setRankSearch(event.target.value)}
                  placeholder="搜索交易员或持仓币种"
                  aria-label="搜索交易员或持仓币种"
                />
              </div>
              {rankError ? (
                <p className="rank-error">{rankError}</p>
              ) : (
                <div className="table-scroll trader-rank-scroll">
                  <table className="data-table trader-rank-table">
                    <thead>
                      <tr>
                        <th>排名</th>
                        <th>交易员</th>
                        <th>平台 / 榜单</th>
                        <th>30日收益率</th>
                        <th>30日胜率</th>
                        <th>30日盈亏</th>
                        <th>质量分</th>
                        <th>当前公开仓位</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedTraders.map((trader) => (
                        <tr key={trader.id}>
                          <td className="rank-number">
                            {trader.source_rank <= 100 ? `#${trader.source_rank}` : "补充"}
                          </td>
                          <td>
                            <a href={trader.profile_url} target="_blank" rel="noreferrer">
                              {trader.name}
                            </a>
                            <small>{trader.current_position_status === "open" ? "当前有公开仓位" : "当前空仓"}</small>
                          </td>
                          <td>
                            <strong>{trader.platform}</strong>
                            <small>{trader.category === "public_lead" ? "带单榜" : "个人公开榜"} · {trader.selection_tier_label}</small>
                          </td>
                          <td className={(trader.roi_pct ?? 0) >= 0 ? "pnl-positive" : "pnl-negative"}>
                            {trader.roi_pct === null ? "--" : `${trader.roi_pct >= 0 ? "+" : ""}${trader.roi_pct.toFixed(2)}%`}
                          </td>
                          <td>{trader.win_rate_30d_pct === null ? "--" : `${trader.win_rate_30d_pct.toFixed(2)}%`}</td>
                          <td className={(trader.pnl_usdt ?? 0) >= 0 ? "pnl-positive" : "pnl-negative"}>{signedUsdt(trader.pnl_usdt)}</td>
                          <td className="score-value">{score(traderQualityScore(trader))}</td>
                          <td className="rank-positions">
                            <strong>{trader.positions.length} 个</strong>
                            <small>
                              {trader.positions.length
                                ? trader.positions.slice(0, 3).map((position) => `${position.symbol} ${sideLabel(position.side)}`).join(" · ")
                                : "--"}
                            </small>
                          </td>
                        </tr>
                      ))}
                      {!rankedTraders.length && (
                        <tr><td className="empty-cell" colSpan={8}>没有符合当前筛选的交易员。</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
