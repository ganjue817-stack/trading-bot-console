import type { ExecutionEvent, Position, Snapshot, Trader } from "./types";

const names = ["Northstar", "Delta Ridge", "Helix Quant", "Axiom Wave", "Harbor Alpha", "Vector Trace", "Orbit Flow", "Cinder Peak", "Mosaic Lab", "Kite Capital", "Riverstone", "Meridian", "Sable Alpha", "Polar Signal", "Aster Vault"];
const sources: Trader["source"][] = ["Bicoin", "OKX", "Binance", "Telegram"];

const traders: Trader[] = Array.from({ length: 150 }, (_, index) => {
  const source = sources[index % sources.length];
  return {
    id: `trader-${index + 1}`,
    name: `${names[index % names.length]} ${String(Math.floor(index / names.length) + 1).padStart(2, "0")}`,
    source,
    side: index % 3 === 0 ? "short" : "long",
    score: Number((0.94 - (index % 18) * 0.021).toFixed(3)),
    weight: Number(Math.min(source === "Telegram" ? 0.02 : 0.05, 0.008 + (17 - (index % 18)) * 0.0023).toFixed(3)),
    drawdown: Number((2.1 + (index % 12) * 0.58).toFixed(1)),
    stability: Number((0.96 - (index % 9) * 0.028).toFixed(2)),
    recent: Number((-2.6 + (index % 17) * 0.62).toFixed(1)),
    latency: `${8 + (index % 7) * 3}s`,
    status: index % 17 === 0 ? "watch" : index % 29 === 0 ? "delayed" : "normal",
  };
});

const makePosition = (markPrice = 58.314): Position => {
  const quantity = 17.07;
  const entryPrice = 58.5460;
  const unrealizedPnl = (entryPrice - markPrice) * quantity;
  return {
    id: "HYPE-20260723-173546",
    symbol: "HYPE/USDT",
    side: "short",
    quantity,
    entryPrice,
    markPrice,
    leverage: 5,
    marginMode: "ISOLATED_MARGIN",
    initialMarginUsdt: Math.round((quantity * markPrice / 5) * 100) / 100,
    stopPrice: 60.898,
    stopQuantity: quantity,
    notional: Math.round(quantity * markPrice),
    unrealizedPnl,
    unrealizedPnlPct: (unrealizedPnl / (quantity * entryPrice / 5)) * 100,
    stopRisk: 40,
    source: "Telegram 熬鹰仓",
    openedAt: "17:35:46",
    protected: true,
  };
};

const baseEvents: ExecutionEvent[] = [
  { id: "e-1", time: "17:35:46", type: "open", symbol: "HYPE/USDT", side: "short", path: "TG 熬鹰仓", reason: "tg_target_snapshot", notional: 1000, price: 58.546, consensus: null, fee: 0.6, slippage: 0.17, pnl: null },
  { id: "e-2", time: "17:35:47", type: "risk", symbol: "HYPE/USDT", side: "short", path: "保护订单", reason: "reduceOnly 保护止损已挂载", notional: 1000, price: 60.898, consensus: null, fee: 0, slippage: 0, pnl: null },
  { id: "e-3", time: "17:31:19", type: "sync", symbol: "HYPE/USDT", side: "-", path: "执行器", reason: "未决提交已核验，无交易所订单", notional: 0, price: 0, consensus: null, fee: 0, slippage: 0, pnl: null },
  { id: "e-4", time: "16:49:36", type: "risk", symbol: "HYPE/USDT", side: "short", path: "普通共识", reason: "requires_2_sources，禁止普通路径开仓", notional: 0, price: 58.458, consensus: -0.595, fee: 0, slippage: 0, pnl: null },
];

const initialSnapshot = (): Snapshot => ({
  updatedAt: new Date(),
  dataMode: "simulation",
  snapshotDetail: "full",
  botMode: "running",
  executionStatus: "simulation",
  blockers: [],
  position: makePosition(),
  positions: [makePosition()],
  eliteCore: {
    symbol: "SNDK/USDT", side: "short", status: "unknown", reason: "awaiting_strategy_snapshot",
    plannedNotional: 1000, riskUsdt: 40, styleStatus: "neutral", styleReason: "",
  },
  externalLiveOpinions: [],
  trustedExternalSetups: [],
  executionPolicy: {
    consensusEntryEnabled: true,
    consensusExitEnabled: false,
    sourceExitEnabled: true,
    profitStopEnabled: true,
    profitStopTriggerR: 1,
    profitStopLockR: 0.1,
    fullCycleCostRate: 0.0015,
    labels: [
      "共识仅用于开仓",
      "监控交易员平仓或源仓位消失时退出",
      "反向共识不直接平仓或减仓",
      "浮盈达到1R加预计双边手续费后启动盈利保护止损",
      "交易所保护止损与软件灾难止损持续有效",
    ],
  },
  resetBaseline: {
    active: false,
    resetAt: "",
    archiveDir: "",
    eventsArchiveSha256: "",
    eventsArchiveRows: 0,
    totalRealizedPnlBaseline: 0,
  },
  sourceShadow: {
    generatedAt: "",
    sourceCount: 0,
    closedEpisodeCount: 0,
    usableOutcomeCount: 0,
    discardedOutcomeCount: 0,
    discardedInputRows: 0,
    sourceBacklogBytes: 0,
    discardedReasons: {},
  },
  accountEquity: null,
  accountAvailable: null,
  capitalBasis: "strategy_ledger",
  equity: 1000,
  dailyPnl: 0,
  totalRealizedPnl: 0,
  drawdown: 0,
  riskUsed: 40,
  riskLimit: 50,
  maxOpenPositions: 5,
  minimumOpenPositions: 2,
  targetOpenPositions: 2,
  pendingIntents: 0,
  realOrdersSent: 0,
  dataAgeSeconds: 9,
  apiPermissions: { status: "simulation", verified: false, read: false, trade: false, withdraw: false, error: "" },
  monitor: { status: "simulation", error: "", checkedAt: "" },
  pipeline: { status: "simulation", reasons: [], lastSuccessAt: "" },
  sources: [
    { name: "Bicoin", status: "healthy", delay: "12s", records: 54, detail: "公开持仓快照" },
    { name: "OKX", status: "healthy", delay: "16s", records: 47, detail: "公开交易员池" },
    { name: "Binance", status: "healthy", delay: "21s", records: 38, detail: "观察池事件" },
    { name: "Telegram", status: "healthy", delay: "8s", records: 1, detail: "熬鹰频道已授权" },
    { name: "X / 杰森哥", status: "healthy", delay: "远程", records: 14, detail: "服务器采集，仅作为观点权重" },
  ],
  consensus: {
    symbol: "HYPE/USDT",
    value: -0.595,
    direction: "偏空",
    sources: 1,
    status: "requires_2_sources",
    entryConsensus: 0,
    snapshots: [
      { time: "17:43", value: -0.41 }, { time: "17:46", value: -0.52 }, { time: "17:49", value: -0.595 },
      { time: "17:52", value: -0.48 }, { time: "17:55", value: -0.56 },
    ],
  },
  symbolOpportunities: [],
  equitySeries: [
    { time: "09:00", equity: 1000, pnl: 0, drawdown: 0 }, { time: "11:00", equity: 1000, pnl: 0, drawdown: 0 },
    { time: "13:00", equity: 1000, pnl: 0, drawdown: 0 }, { time: "15:00", equity: 1000, pnl: 0, drawdown: 0 },
    { time: "17:00", equity: 1000, pnl: 0, drawdown: 0 }, { time: "17:35", equity: 1000, pnl: 0, drawdown: 0 },
  ],
  traders,
  executionEvents: baseEvents,
  riskEvents: [
    { time: "17:35:47", level: "safe", title: "保护止损已确认", detail: "HYPE 17.07 张 reduceOnly 止损已挂载至 60.898。" },
    { time: "17:35:46", level: "warning", title: "组合风险预算偏紧", detail: "已使用 40U / 50U；375U 普通信号仓禁止开仓。" },
    { time: "17:31:19", level: "info", title: "执行锁已清理", detail: "交易所无匹配订单，允许进行一次新的入场提交。" },
  ],
});

let state = initialSnapshot();

const clone = () => structuredClone(state);
const delay = (ms = 240) => new Promise((resolve) => window.setTimeout(resolve, ms));

export class MockApi {
  static async getSnapshot(): Promise<Snapshot> {
    await delay(180);
    return this.loadLiveSnapshot();
  }

  static async refresh(): Promise<Snapshot> {
    await delay(420);
    const live = await this.loadLiveSnapshot();
    if (live.dataMode === "live_read_only") return live;
    const pulse = ((Date.now() % 13) - 6) * 0.006;
    if (state.position) {
      state.position = makePosition(Number((state.position.markPrice + pulse).toFixed(3)));
      state.equity = Number((1000 + state.position.unrealizedPnl).toFixed(2));
      state.dailyPnl = Number((state.equity - 1000).toFixed(2));
    }
    state.updatedAt = new Date();
    state.dataAgeSeconds = 0;
    return clone();
  }

  private static async loadLiveSnapshot(): Promise<Snapshot> {
    try {
      return await this.loadLiveSnapshotFrom("/api/live_snapshot_compact.json");
    } catch {
      try {
        return await this.loadLiveSnapshotFrom("/api/live_snapshot");
      } catch {
        // A transient read-only snapshot failure must not erase the last verified live view.
        if (state.dataMode === "live_read_only") return clone();
        state.dataMode = "simulation";
        return clone();
      }
    }
  }

  static async getFullSnapshot(): Promise<Snapshot | null> {
    try {
      return await this.loadLiveSnapshotFrom("/api/live_snapshot");
    } catch {
      return null;
    }
  }

  private static async loadLiveSnapshotFrom(endpoint: string): Promise<Snapshot> {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error("live_snapshot_unavailable");
      const payload = await response.json() as {
        ready?: boolean; checked_at?: string; data_age_seconds?: number | null; compact_schema_version?: number;
        execution?: {
          status?: string; blockers?: string[]; capital_basis?: string; capital_cap_usdt?: number;
          account_funds_status?: string; account_equity_usdt?: number | null; account_available_usdt?: number | null;
          portfolio_stop_risk_fraction?: number;
          portfolio_stop_risk_limit_usdt?: number | null; minimum_open_positions?: number;
          target_open_positions?: number; max_open_positions?: number; pending_intents?: number;
          real_orders_sent?: number;
          live_risk?: { equity_usdt?: number; daily_realized_pnl_usdt?: number; total_realized_pnl_usdt?: number; peak_equity_usdt?: number; consecutive_losses?: number };
        };
        execution_policy?: { consensus_entry_enabled?: boolean; consensus_exit_enabled?: boolean; source_exit_enabled?: boolean; profit_stop_enabled?: boolean; profit_stop_trigger_r?: number; profit_stop_lock_r?: number; full_cycle_cost_rate?: number; liquidity_collector_online?: boolean; liquidity_fusion_enabled?: boolean; liquidity_validated_wall_count?: number; liquidity_adopted_decision_count?: number; labels?: string[] };
        reset_baseline?: { active?: boolean; reset_at?: string; archive_dir?: string; events_archive_sha256?: string; events_archive_rows?: number; total_realized_pnl_usdt_baseline?: number };
        positions?: { symbol: string; direction: string; quantity: number; entry_price: number; reference_price: number; mark_price?: number; unrealized_pnl_usdt?: number | null; observed_at?: string; stop_price: number; leverage: number; notional: number; margin_mode?: string; initial_margin_usdt?: number | null; estimated_stop_risk_usdt: number; source: string; protected: boolean; opened_at: string }[];
        elite_core?: { symbol?: string; direction?: string; status?: string; reason?: string; planned_notional?: number; risk_usdt?: number; style_status?: string; style_reason?: string };
        external_live_opinion?: {
          source?: { platform?: string; broadcaster?: string; date?: string; content_id?: string; title?: string };
          transcription?: { engine?: string; confidence?: string; requires_confirmation?: boolean };
          strategy_role?: { standalone_execution_allowed?: boolean; valid_until?: string };
          views?: { symbol?: string; direction?: string; confidence?: number; entries?: unknown[]; stops?: unknown[]; targets?: unknown[]; validity_conditions?: string[]; risk?: string[] }[];
          risk_principles?: string[];
        };
        external_live_opinions?: {
          source?: { platform?: string; broadcaster?: string; date?: string; content_id?: string; title?: string };
          transcription?: { engine?: string; confidence?: string; requires_confirmation?: boolean };
          strategy_role?: { standalone_execution_allowed?: boolean; valid_until?: string };
          views?: { symbol?: string; direction?: string; confidence?: number; entries?: unknown[]; stops?: unknown[]; targets?: unknown[]; validity_conditions?: string[]; risk?: string[] }[];
          risk_principles?: string[];
        }[];
        trusted_external_setups?: { content_id?: string; broadcaster?: string; symbol?: string; direction?: string; status?: string; reason?: string; market_price?: number; entry_trigger_price?: number; stop_price?: number; take_profit_price?: number; reward_risk?: number; planned_notional?: number; valid_until?: string }[];
        traders?: {
          id?: string; name?: string; source?: string; strategy_active?: boolean; score?: number; weight?: number;
          drawdown?: number; stability?: number; recent?: number; updated_at?: string;
          positions?: { symbol?: string; direction?: string; entry_price?: number; notional?: number; synced_at?: string }[];
        }[];
        permissions?: { status?: string; verified?: boolean; read?: boolean; trade?: boolean; withdraw?: boolean; error?: string };
        monitor?: { status?: string; checked_at?: string; error?: string };
        pipeline?: { status?: string; reasons?: string[]; last_success_at?: string };
        x_opinion?: { status?: string; collection_mode?: string; display_name?: string; posts_seen?: number; active_opinions?: number; checked_at?: string };
        consensus?: { symbol?: string; value?: number; sources?: number; status?: string; updated_at?: string; snapshots?: { time?: string; value?: number }[] } | null;
        symbol_opportunities?: {
          symbol?: string; direction?: string; state?: string; system_action?: string; reason?: string; execution_enabled?: boolean;
          current_price?: number; effective_trader_count?: number; same_direction_trader_count?: number; opposing_direction_trader_count?: number;
          dominant_same_direction_unique?: number; long_unique?: number; short_unique?: number; total_unique?: number;
          source_count?: number; long_ratio?: number; short_ratio?: number;
          consensus_trader_count?: number;
          directional_consensus?: number; failed_gates?: string[]; failed_gate_count?: number;
          cost_cluster_trader_count?: number; cost_cluster_source_count?: number; cost_cluster_strength?: number; cost_cluster_spread_pct?: number;
          cost_cluster_median?: number | null; cost_distance_pct?: number | null; cost_tolerance_pct?: number; point_quality?: number | null;
          point_quality_source?: string; trader_quality_score?: number | null; trader_quality_reason?: string;
          style_status?: string; style_reason?: string; hour_style_status?: string; hour_style_reason?: string;
          opportunity_score?: number | null; score_available?: boolean; score_reason?: string; trade_eligible?: boolean; eligibility_reason?: string;
          planned_notional?: number; assigned_stop_risk?: number; stop_price?: number; target_price?: number; reward_risk?: number;
          primary_structure_price?: number; primary_structure_kind?: string; liquidity_status?: string; liquidity_fallback_reason?: string;
          liquidity_adopted?: boolean; liquidity_stop_adjusted?: boolean; liquidity_aligned_wall_kind?: string;
          liquidity_aligned_wall_price?: number; liquidity_opposing_wall_price?: number; liquidity_persistence_snapshots?: number;
          liquidity_verified_exchanges?: string[]; liquidity_point_quality_adjustment?: number; liquidity_score_adjustment?: number;
          consensus_traders?: { stable_id?: string; name?: string; source?: string; sources?: string[]; direction?: string; cost?: number; notional?: number; quality_score?: number | null }[];
          opposing_traders?: { stable_id?: string; name?: string; source?: string; sources?: string[]; direction?: string; cost?: number; notional?: number; quality_score?: number | null }[];
          cost_cluster_traders?: { stable_id?: string; name?: string; source?: string; sources?: string[]; direction?: string; cost?: number; notional?: number; quality_score?: number | null }[];
        }[];
        events?: { time?: string; event?: string; symbol?: string; direction?: string; reason?: string; status?: string; notional?: number; price?: number; consensus?: number; fee?: number; slippage?: number; pnl?: number; gross_pnl?: number | null; fee_source?: string; pnl_source?: string }[];
        equity_series?: { time?: string; equity?: number; pnl?: number; drawdown?: number }[];
        source_shadow?: { generated_at?: string; source_count?: number; closed_episode_count?: number; usable_outcome_count?: number; discarded_outcome_count?: number; discarded_input_rows?: number; source_backlog_bytes?: number; discarded_reasons?: Record<string, number> };
      };
      const positions = (payload.positions ?? []).map((sourcePosition) => {
        const markPrice = sourcePosition.mark_price || sourcePosition.reference_price || sourcePosition.entry_price;
        const side: "long" | "short" = sourcePosition.direction === "long" ? "long" : "short";
        const derivedPnl = (markPrice - sourcePosition.entry_price) * sourcePosition.quantity * (side === "long" ? 1 : -1);
        const unrealizedPnl = Number.isFinite(sourcePosition.unrealized_pnl_usdt) ? Number(sourcePosition.unrealized_pnl_usdt) : derivedPnl;
        return {
          id: `live-${sourcePosition.symbol}`, symbol: sourcePosition.symbol, side, quantity: sourcePosition.quantity,
          entryPrice: sourcePosition.entry_price, markPrice, leverage: sourcePosition.leverage,
          marginMode: sourcePosition.margin_mode || "unknown", initialMarginUsdt: sourcePosition.initial_margin_usdt ?? null,
          stopPrice: sourcePosition.stop_price, stopQuantity: sourcePosition.quantity, notional: sourcePosition.notional,
          unrealizedPnl, unrealizedPnlPct: sourcePosition.notional ? unrealizedPnl / (sourcePosition.notional / Math.max(sourcePosition.leverage, 1)) * 100 : 0,
          stopRisk: sourcePosition.estimated_stop_risk_usdt || sourcePosition.notional * 0.04, source: sourcePosition.source,
          openedAt: sourcePosition.opened_at, protected: sourcePosition.protected,
        };
      });
      const position = positions[0] ?? null;
      const liveRisk = payload.execution?.live_risk ?? {};
      const elite = payload.elite_core ?? {};
      const externalOpinions = payload.external_live_opinions?.length ? payload.external_live_opinions : payload.external_live_opinion ? [payload.external_live_opinion] : [];
      const totalUnrealized = positions.reduce((total, item) => total + item.unrealizedPnl, 0);
      const totalStopRisk = positions.reduce((total, item) => total + item.stopRisk, 0);
      const liveEvents: ExecutionEvent[] = (payload.events ?? []).map((event, index) => ({
        id: `live-event-${index}-${event.time ?? ""}`,
        time: event.time ?? "",
        type: event.event === "open" || event.event === "close" || event.event === "reduce" || event.event === "risk" ? event.event : "sync",
        symbol: event.symbol ?? "",
        side: event.direction === "long" || event.direction === "short" ? event.direction : "-",
        path: event.status ?? "执行器",
        reason: event.reason ?? "",
        notional: Number(event.notional ?? 0), price: Number(event.price ?? 0), consensus: Number.isFinite(event.consensus) ? Number(event.consensus) : null,
        fee: Number(event.fee ?? 0), slippage: Number(event.slippage ?? 0), pnl: event.pnl === undefined ? null : Number(event.pnl),
        grossPnl: event.gross_pnl === undefined ? null : event.gross_pnl, feeSource: event.fee_source ?? "", pnlSource: event.pnl_source ?? "",
      }));
      const executionStatus = payload.execution?.status ?? "unknown";
      const xOpinion = payload.x_opinion;
      const sourceShadow = payload.source_shadow ?? {};
      const resetBaseline = payload.reset_baseline ?? {};
      const reportedAccountEquity = Number(payload.execution?.account_equity_usdt ?? 0);
      const accountEquity = payload.execution?.account_funds_status === "ok" && reportedAccountEquity > 0
        ? reportedAccountEquity
        : null;
      const reportedAccountAvailable = Number(payload.execution?.account_available_usdt ?? 0);
      const accountAvailable = accountEquity !== null && reportedAccountAvailable >= 0
        ? reportedAccountAvailable
        : null;
      const ledgerEquity = Number(liveRisk.equity_usdt ?? payload.execution?.capital_cap_usdt ?? 1000) + totalUnrealized;
      const liveEquity = accountEquity ?? ledgerEquity;
      const serverEquitySeries = (payload.equity_series ?? []).flatMap((point) => {
        const equity = Number(point.equity ?? 0);
        if (!Number.isFinite(equity) || equity <= 0) return [];
        const timestamp = point.time ? new Date(point.time) : null;
        return [{
          time: timestamp && !Number.isNaN(timestamp.getTime())
            ? timestamp.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
            : "--",
          equity,
          pnl: Number(point.pnl ?? 0),
          drawdown: Number(point.drawdown ?? 0),
        }];
      });
      const latestEquityPoint = serverEquitySeries.at(-1);
      const liveDailyPnl = latestEquityPoint?.pnl ?? ((liveRisk.daily_realized_pnl_usdt ?? 0) + totalUnrealized);
      const liveDrawdown = latestEquityPoint?.drawdown
        ?? Math.max(0, ((liveRisk.peak_equity_usdt ?? 0) - (liveRisk.equity_usdt ?? 0)) / Math.max(liveRisk.peak_equity_usdt ?? 1, 1) * 100);
      const publishedRiskLimit = Number(payload.execution?.portfolio_stop_risk_limit_usdt ?? 0);
      const liveRiskLimit = publishedRiskLimit > 0
        ? publishedRiskLimit
        : liveEquity * Number(payload.execution?.portfolio_stop_risk_fraction ?? 0.20);
      const consensus = payload.consensus;
      state = {
        ...state,
        dataMode: "live_read_only",
        snapshotDetail: payload.compact_schema_version ? "compact" : "full",
        updatedAt: payload.checked_at ? new Date(payload.checked_at) : new Date(),
         botMode: executionStatus === "executed" || executionStatus === "ready" ? "running" : "degraded",
        executionStatus,
        blockers: payload.execution?.blockers ?? [],
        position, positions,
        eliteCore: {
          symbol: elite.symbol ?? "--", side: elite.direction === "long" || elite.direction === "short" ? elite.direction : null,
          status: elite.status === "eligible" || elite.status === "blocked" ? elite.status : "unknown",
          reason: elite.reason ?? "awaiting_strategy_snapshot", plannedNotional: Number(elite.planned_notional ?? 0), riskUsdt: Number(elite.risk_usdt ?? 0),
          styleStatus: elite.style_status === "warning" ? "warning" : elite.status === "eligible" ? "positive" : "neutral",
          styleReason: elite.style_reason ?? "",
        },
        externalLiveOpinions: externalOpinions.flatMap((external) => external.source ? [{
          platform: external.source.platform ?? "",
          broadcaster: external.source.broadcaster ?? "",
          date: external.source.date ?? "",
          contentId: external.source.content_id ?? "",
          title: external.source.title ?? "",
          transcriptionEngine: external.transcription?.engine ?? "",
          transcriptionConfidence: external.transcription?.confidence ?? "unknown",
          requiresConfirmation: Boolean(external.transcription?.requires_confirmation),
          standaloneExecutionAllowed: Boolean(external.strategy_role?.standalone_execution_allowed),
          validUntil: external.strategy_role?.valid_until ?? "",
          views: (external.views ?? []).flatMap((view) => view.direction === "long" || view.direction === "short" ? [{
            symbol: view.symbol ?? "--", direction: view.direction, confidence: Number(view.confidence ?? 0), entries: view.entries ?? [], stops: view.stops ?? [], targets: view.targets ?? [], validityConditions: view.validity_conditions ?? [], risk: view.risk ?? [],
          }] : []),
          riskPrinciples: external.risk_principles ?? [],
        }] : []),
        trustedExternalSetups: (payload.trusted_external_setups ?? []).flatMap((setup) =>
          (setup.direction === "long" || setup.direction === "short") && (setup.status === "eligible" || setup.status === "blocked") ? [{
            contentId: setup.content_id ?? "", broadcaster: setup.broadcaster ?? "", symbol: setup.symbol ?? "", direction: setup.direction,
            status: setup.status, reason: setup.reason ?? "", marketPrice: Number(setup.market_price ?? 0), entryTriggerPrice: Number(setup.entry_trigger_price ?? 0),
            stopPrice: Number(setup.stop_price ?? 0), takeProfitPrice: Number(setup.take_profit_price ?? 0), rewardRisk: Number(setup.reward_risk ?? 0),
            plannedNotional: Number(setup.planned_notional ?? 0), validUntil: setup.valid_until ?? "",
          }] : []),
        executionPolicy: {
          consensusEntryEnabled: payload.execution_policy?.consensus_entry_enabled ?? true,
          consensusExitEnabled: payload.execution_policy?.consensus_exit_enabled ?? false,
          sourceExitEnabled: payload.execution_policy?.source_exit_enabled ?? true,
          profitStopEnabled: payload.execution_policy?.profit_stop_enabled ?? true,
          profitStopTriggerR: Number(payload.execution_policy?.profit_stop_trigger_r ?? 1),
          profitStopLockR: Number(payload.execution_policy?.profit_stop_lock_r ?? 0.1),
          fullCycleCostRate: Number(payload.execution_policy?.full_cycle_cost_rate ?? 0.0015),
          liquidityCollectorOnline: Boolean(payload.execution_policy?.liquidity_collector_online),
          liquidityFusionEnabled: Boolean(payload.execution_policy?.liquidity_fusion_enabled),
          liquidityValidatedWallCount: Number(payload.execution_policy?.liquidity_validated_wall_count ?? 0),
          liquidityAdoptedDecisionCount: Number(payload.execution_policy?.liquidity_adopted_decision_count ?? 0),
          labels: payload.execution_policy?.labels ?? [],
        },
        resetBaseline: {
          active: Boolean(resetBaseline.active),
          resetAt: resetBaseline.reset_at ?? "",
          archiveDir: resetBaseline.archive_dir ?? "",
          eventsArchiveSha256: resetBaseline.events_archive_sha256 ?? "",
          eventsArchiveRows: Number(resetBaseline.events_archive_rows ?? 0),
          totalRealizedPnlBaseline: Number(resetBaseline.total_realized_pnl_usdt_baseline ?? 0),
        },
        sourceShadow: {
          generatedAt: sourceShadow.generated_at ?? "",
          sourceCount: Number(sourceShadow.source_count ?? 0),
          closedEpisodeCount: Number(sourceShadow.closed_episode_count ?? 0),
          usableOutcomeCount: Number(sourceShadow.usable_outcome_count ?? 0),
          discardedOutcomeCount: Number(sourceShadow.discarded_outcome_count ?? 0),
          discardedInputRows: Number(sourceShadow.discarded_input_rows ?? 0),
          sourceBacklogBytes: Number(sourceShadow.source_backlog_bytes ?? 0),
          discardedReasons: sourceShadow.discarded_reasons ?? {},
        },
        accountEquity,
        accountAvailable,
        capitalBasis: accountEquity === null ? "strategy_ledger" : "account_equity",
        equity: liveEquity,
        dailyPnl: Number(liveRisk.daily_realized_pnl_usdt ?? 0) + totalUnrealized,
        totalRealizedPnl: Number(liveRisk.total_realized_pnl_usdt ?? 0),
        drawdown: liveDrawdown,
        riskUsed: totalStopRisk,
        riskLimit: liveRiskLimit,
        maxOpenPositions: payload.execution?.max_open_positions ?? 5,
        minimumOpenPositions: payload.execution?.minimum_open_positions ?? 2,
        targetOpenPositions: payload.execution?.target_open_positions ?? 2,
        pendingIntents: payload.execution?.pending_intents ?? 0,
        realOrdersSent: payload.execution?.real_orders_sent ?? 0,
        dataAgeSeconds: payload.data_age_seconds ?? state.dataAgeSeconds,
        apiPermissions: {
          status: payload.permissions?.status ?? "unknown", verified: Boolean(payload.permissions?.verified), read: Boolean(payload.permissions?.read),
          trade: Boolean(payload.permissions?.trade), withdraw: Boolean(payload.permissions?.withdraw), error: payload.permissions?.error ?? "",
        },
        monitor: { status: payload.monitor?.status ?? "unknown", error: payload.monitor?.error ?? "", checkedAt: payload.monitor?.checked_at ?? "" },
        pipeline: { status: payload.pipeline?.status ?? "unknown", reasons: payload.pipeline?.reasons ?? [], lastSuccessAt: payload.pipeline?.last_success_at ?? "" },
        consensus: consensus ? {
          symbol: consensus.symbol ?? "--", value: Number(consensus.value ?? 0), direction: Number(consensus.value ?? 0) >= 0 ? "偏多" : "偏空",
          sources: Number(consensus.sources ?? 0), status: "requires_2_sources", entryConsensus: 0,
          snapshots: (consensus.snapshots ?? []).map((point) => ({ time: point.time ? new Date(point.time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "--", value: Number(point.value ?? 0) })),
        } : { symbol: "--", value: 0, direction: "偏多", sources: 0, status: "requires_2_sources", entryConsensus: 0, snapshots: [] },
        symbolOpportunities: (payload.symbol_opportunities ?? []).flatMap((item) => {
          if (!item.symbol || (item.direction !== "long" && item.direction !== "short")) return [];
          const mapTraders = (rows: typeof item.consensus_traders = []) => (rows ?? []).flatMap((row) =>
            row.direction === "long" || row.direction === "short" ? [{
              stableId: row.stable_id ?? row.name ?? "--",
              name: row.name ?? "--", source: row.source ?? "", sources: row.sources ?? (row.source ? [row.source] : []),
              direction: row.direction as "long" | "short", cost: Number(row.cost ?? 0), notional: Number(row.notional ?? 0),
              qualityScore: row.quality_score === null || row.quality_score === undefined ? null : Number(row.quality_score),
            }] : []);
          const consensusTraders = mapTraders(item.consensus_traders);
          const opposingTraders = mapTraders(item.opposing_traders);
          const costClusterTraders = mapTraders(item.cost_cluster_traders);
          const explicitConsensusCount = Number(item.consensus_trader_count);
          const sameDirectionTraderCount = Number.isFinite(explicitConsensusCount)
            ? Math.max(0, explicitConsensusCount)
            : consensusTraders.length;
          const nullableNumber = (value: number | null | undefined) =>
            value === null || value === undefined || !Number.isFinite(Number(value))
              ? null
              : Number(value);
          return [{
            symbol: item.symbol, direction: item.direction, state: item.state ?? "BACKGROUND",
            systemAction: item.system_action ?? "hold", reason: item.reason ?? "", executionEnabled: Boolean(item.execution_enabled),
            currentPrice: Number(item.current_price ?? 0), effectiveTraderCount: Number(item.effective_trader_count ?? 0),
            sameDirectionTraderCount,
            opposingDirectionTraderCount: Number(item.opposing_direction_trader_count ?? opposingTraders.length),
            dominantSameDirectionUnique: Number(item.dominant_same_direction_unique ?? sameDirectionTraderCount),
            longUnique: Number(item.long_unique ?? 0), shortUnique: Number(item.short_unique ?? 0), totalUnique: Number(item.total_unique ?? 0),
            sourceCount: Number(item.source_count ?? 0), longRatio: Number(item.long_ratio ?? 0), shortRatio: Number(item.short_ratio ?? 0),
            directionalConsensus: Number(item.directional_consensus ?? 0),
            failedGates: item.failed_gates ?? [], failedGateCount: Number(item.failed_gate_count ?? item.failed_gates?.length ?? 0),
            costClusterTraderCount: Number(item.cost_cluster_trader_count ?? 0), costClusterSourceCount: Number(item.cost_cluster_source_count ?? 0),
            costClusterStrength: Number(item.cost_cluster_strength ?? 0), costClusterSpreadPct: Number(item.cost_cluster_spread_pct ?? 0),
            costClusterMedian: nullableNumber(item.cost_cluster_median), costDistancePct: nullableNumber(item.cost_distance_pct),
            costTolerancePct: Number(item.cost_tolerance_pct ?? 0), pointQuality: nullableNumber(item.point_quality),
            pointQualitySource: item.point_quality_source ?? "", traderQualityScore: nullableNumber(item.trader_quality_score),
            traderQualityReason: item.trader_quality_reason ?? "", styleStatus: item.style_status ?? "", styleReason: item.style_reason ?? "",
            hourStyleStatus: item.hour_style_status ?? "", hourStyleReason: item.hour_style_reason ?? "",
            opportunityScore: nullableNumber(item.opportunity_score), scoreAvailable: Boolean(item.score_available),
            scoreReason: item.score_reason ?? "", tradeEligible: Boolean(item.trade_eligible), eligibilityReason: item.eligibility_reason ?? "",
            plannedNotional: Number(item.planned_notional ?? 0), assignedStopRisk: Number(item.assigned_stop_risk ?? 0),
            stopPrice: Number(item.stop_price ?? 0), targetPrice: Number(item.target_price ?? 0), rewardRisk: Number(item.reward_risk ?? 0),
            primaryStructurePrice: Number(item.primary_structure_price ?? 0), primaryStructureKind: item.primary_structure_kind ?? "",
            liquidityStatus: item.liquidity_status ?? "neutral", liquidityFallbackReason: item.liquidity_fallback_reason ?? "",
            liquidityAdopted: Boolean(item.liquidity_adopted), liquidityStopAdjusted: Boolean(item.liquidity_stop_adjusted),
            liquidityAlignedWallKind: item.liquidity_aligned_wall_kind ?? "", liquidityAlignedWallPrice: Number(item.liquidity_aligned_wall_price ?? 0),
            liquidityOpposingWallPrice: Number(item.liquidity_opposing_wall_price ?? 0), liquidityPersistenceSnapshots: Number(item.liquidity_persistence_snapshots ?? 0),
            liquidityVerifiedExchanges: item.liquidity_verified_exchanges ?? [], liquidityPointQualityAdjustment: Number(item.liquidity_point_quality_adjustment ?? 0),
            liquidityScoreAdjustment: Number(item.liquidity_score_adjustment ?? 0),
            consensusTraders, opposingTraders, costClusterTraders,
          }];
        }),
        traders: (payload.traders ?? []).flatMap((item, index) => {
          const source = item.source === "OKX" || item.source === "Binance" || item.source === "Telegram" || item.source === "Bicoin" ? item.source : null;
          if (!source) return [];
          const mappedPositions = (item.positions ?? []).flatMap((position) =>
            position.symbol && (position.direction === "long" || position.direction === "short") ? [{
              symbol: position.symbol, direction: position.direction as "long" | "short", entryPrice: Number(position.entry_price ?? 0),
              notional: Number(position.notional ?? 0), syncedAt: position.synced_at ?? "",
            }] : []);
          const updatedAt = item.updated_at ?? "";
          const ageSeconds = updatedAt ? Math.max(0, (Date.now() - new Date(updatedAt).getTime()) / 1000) : Number.POSITIVE_INFINITY;
          return [{
            id: item.id ?? `live-trader-${index}`, name: item.name ?? "--", source,
            side: (mappedPositions[0]?.direction ?? "long") as "long" | "short", score: Number(item.score ?? 0), weight: Number(item.weight ?? 0),
            drawdown: Number(item.drawdown ?? 0), stability: Number(item.stability ?? 0), recent: Number(item.recent ?? 0),
            latency: Number.isFinite(ageSeconds) ? `${Math.round(ageSeconds)}s` : "--",
            status: ageSeconds > 600 ? "delayed" : ageSeconds > 180 ? "watch" : "normal",
            strategyActive: Boolean(item.strategy_active), updatedAt, positions: mappedPositions,
          }];
        }),
        equitySeries: serverEquitySeries.length ? serverEquitySeries : [{ time: payload.checked_at ? new Date(payload.checked_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "当前", equity: liveEquity, pnl: liveDailyPnl, drawdown: liveDrawdown }],
        sources: [
          ...state.sources.filter((source) => source.name !== "X / 杰森哥" && !source.name.includes("Btc星辰")),
          { name: `X / ${xOpinion?.display_name ?? "杰森哥"}`, status: xOpinion?.status === "ok" ? "healthy" : "degraded", delay: xOpinion?.collection_mode === "remote_server" ? "远程" : "本机", records: Number(xOpinion?.posts_seen ?? 0), detail: `${Number(xOpinion?.active_opinions ?? 0)} 条当前有效观点` },
          { name: "Source shadow", status: Number(sourceShadow.source_backlog_bytes ?? 0) > 0 ? "delayed" : "healthy", delay: `${Number(sourceShadow.source_backlog_bytes ?? 0)} bytes`, records: Number(sourceShadow.usable_outcome_count ?? 0), detail: `可用 ${Number(sourceShadow.usable_outcome_count ?? 0)} / 丢弃 ${Number(sourceShadow.discarded_outcome_count ?? 0)}` },
          ...externalOpinions.flatMap((external) => external.source ? [{ name: `${external.source.platform ?? "外部直播"} / ${external.source.broadcaster ?? "--"}`, status: "healthy" as const, delay: external.source.date ?? "当日", records: external.views?.length ?? 0, detail: "权重受控的辅助观点" }] : []),
        ],
        executionEvents: liveEvents.length ? liveEvents : state.executionEvents,
      };
      return clone();
  }

  static exportCsv(events: ExecutionEvent[]) {
    const headings = ["时间", "标的", "方向", "来源路径", "原因", "名义仓位", "价格", "共识", "毛盈亏", "手续费", "费用来源", "滑点", "净盈亏", "盈亏来源"];
    const lines = events.map((event) => [event.time, event.symbol, event.side, event.path, event.reason, event.notional, event.price, event.consensus ?? "", event.grossPnl ?? "", event.fee, event.feeSource ?? "", event.slippage, event.pnl ?? "", event.pnlSource ?? ""].join(","));
    return [headings.join(","), ...lines].join("\n");
  }
}
