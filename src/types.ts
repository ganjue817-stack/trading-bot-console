export type Side = "long" | "short";
export type BotMode = "running" | "paused" | "circuit" | "review" | "degraded";

export type Position = {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  marginMode: string;
  initialMarginUsdt: number | null;
  stopPrice: number;
  stopQuantity: number;
  notional: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  stopRisk: number;
  source: string;
  openedAt: string;
  protected: boolean;
};

export type SourceHealth = {
  name: string;
  status: "healthy" | "delayed" | "degraded";
  delay: string;
  records: number;
  detail: string;
};

export type ConsensusPoint = { time: string; value: number };

export type ConsensusTraderPosition = {
  stableId: string;
  name: string;
  source: string;
  sources: string[];
  direction: Side;
  cost: number;
  notional: number;
  qualityScore: number | null;
};

export type SymbolOpportunity = {
  symbol: string;
  direction: Side;
  state: string;
  systemAction: string;
  reason: string;
  executionEnabled: boolean;
  currentPrice: number;
  effectiveTraderCount: number;
  sameDirectionTraderCount: number;
  opposingDirectionTraderCount: number;
  dominantSameDirectionUnique: number;
  longUnique: number;
  shortUnique: number;
  totalUnique: number;
  sourceCount: number;
  longRatio: number;
  shortRatio: number;
  directionalConsensus: number;
  failedGates: string[];
  failedGateCount: number;
  costClusterTraderCount: number;
  costClusterSourceCount: number;
  costClusterStrength: number;
  costClusterSpreadPct: number;
  costClusterMedian: number | null;
  costDistancePct: number | null;
  costTolerancePct: number;
  pointQuality: number | null;
  pointQualitySource: string;
  traderQualityScore: number | null;
  traderQualityReason: string;
  styleStatus: string;
  styleReason: string;
  hourStyleStatus: string;
  hourStyleReason: string;
  opportunityScore: number | null;
  scoreAvailable: boolean;
  scoreReason: string;
  tradeEligible: boolean;
  eligibilityReason: string;
  plannedNotional: number;
  assignedStopRisk: number;
  stopPrice: number;
  targetPrice: number;
  rewardRisk: number;
  primaryStructurePrice: number;
  primaryStructureKind: string;
  liquidityStatus: string;
  liquidityFallbackReason: string;
  liquidityAdopted: boolean;
  liquidityStopAdjusted: boolean;
  liquidityAlignedWallKind: string;
  liquidityAlignedWallPrice: number;
  liquidityOpposingWallPrice: number;
  liquidityPersistenceSnapshots: number;
  liquidityVerifiedExchanges: string[];
  liquidityPointQualityAdjustment: number;
  liquidityScoreAdjustment: number;
  consensusTraders: ConsensusTraderPosition[];
  opposingTraders: ConsensusTraderPosition[];
  costClusterTraders: ConsensusTraderPosition[];
};

export type Trader = {
  id: string;
  name: string;
  source: "Bicoin" | "OKX" | "Binance" | "Telegram";
  side: Side;
  score: number;
  weight: number;
  drawdown: number;
  stability: number;
  recent: number;
  latency: string;
  status: "normal" | "watch" | "delayed";
  strategyActive?: boolean;
  updatedAt?: string;
  positions?: {
    symbol: string;
    direction: Side;
    entryPrice: number;
    notional: number;
    syncedAt: string;
  }[];
};

export type ExecutionEvent = {
  id: string;
  time: string;
  type: "open" | "close" | "reduce" | "risk" | "sync";
  symbol: string;
  side: Side | "-";
  path: string;
  reason: string;
  notional: number;
  price: number;
  consensus: number | null;
  fee: number;
  slippage: number;
  pnl: number | null;
  grossPnl?: number | null;
  feeSource?: string;
  pnlSource?: string;
};

export type RiskEvent = { time: string; level: "info" | "warning" | "safe"; title: string; detail: string };

export type EliteCoreStatus = {
  symbol: string;
  side: Side | null;
  status: "eligible" | "blocked" | "unknown";
  reason: string;
  plannedNotional: number;
  riskUsdt: number;
  styleStatus: "positive" | "warning" | "neutral";
  styleReason: string;
};

export type ExternalOpinionView = {
  symbol: string;
  direction: Side;
  confidence: number;
  entries: unknown[];
  stops: unknown[];
  targets: unknown[];
  validityConditions: string[];
  risk: string[];
};

export type ExternalLiveOpinion = {
  platform: string;
  broadcaster: string;
  date: string;
  contentId: string;
  title: string;
  transcriptionEngine: string;
  transcriptionConfidence: string;
  requiresConfirmation: boolean;
  standaloneExecutionAllowed: boolean;
  validUntil: string;
  views: ExternalOpinionView[];
  riskPrinciples: string[];
};

export type TrustedExternalSetup = {
  contentId: string;
  broadcaster: string;
  symbol: string;
  direction: Side;
  status: "eligible" | "blocked";
  reason: string;
  marketPrice: number;
  entryTriggerPrice: number;
  stopPrice: number;
  takeProfitPrice: number;
  rewardRisk: number;
  plannedNotional: number;
  validUntil: string;
};

export type ExecutionPolicy = {
  consensusEntryEnabled: boolean;
  consensusExitEnabled: boolean;
  sourceExitEnabled: boolean;
  profitStopEnabled: boolean;
  profitStopTriggerR: number;
  profitStopLockR: number;
  fullCycleCostRate: number;
  liquidityCollectorOnline?: boolean;
  liquidityFusionEnabled?: boolean;
  liquidityValidatedWallCount?: number;
  liquidityAdoptedDecisionCount?: number;
  labels: string[];
};

export type SourceShadow = {
  generatedAt: string;
  sourceCount: number;
  closedEpisodeCount: number;
  usableOutcomeCount: number;
  discardedOutcomeCount: number;
  discardedInputRows: number;
  sourceBacklogBytes: number;
  discardedReasons: Record<string, number>;
};

export type ResetBaseline = {
  active: boolean;
  resetAt: string;
  archiveDir: string;
  eventsArchiveSha256: string;
  eventsArchiveRows: number;
  totalRealizedPnlBaseline: number;
};

export type Snapshot = {
  updatedAt: Date;
  dataMode: "live_read_only" | "simulation";
  snapshotDetail: "compact" | "full";
  botMode: BotMode;
  executionStatus: string;
  blockers: string[];
  position: Position | null;
  positions: Position[];
  eliteCore: EliteCoreStatus;
  externalLiveOpinions: ExternalLiveOpinion[];
  trustedExternalSetups: TrustedExternalSetup[];
  executionPolicy: ExecutionPolicy;
  resetBaseline: ResetBaseline;
  sourceShadow: SourceShadow;
  accountEquity: number | null;
  accountAvailable: number | null;
  capitalBasis: "account_equity" | "strategy_ledger";
  equity: number;
  dailyPnl: number;
  totalRealizedPnl: number;
  drawdown: number;
  riskUsed: number;
  riskLimit: number;
  maxOpenPositions: number;
  minimumOpenPositions: number;
  targetOpenPositions: number;
  pendingIntents: number;
  realOrdersSent: number;
  dataAgeSeconds: number;
  apiPermissions: {
    status: string;
    verified: boolean;
    read: boolean;
    trade: boolean;
    withdraw: boolean;
    error: string;
  };
  monitor: { status: string; error: string; checkedAt: string };
  pipeline: { status: string; reasons: string[]; lastSuccessAt: string };
  sources: SourceHealth[];
  consensus: {
    symbol: string;
    value: number;
    direction: "偏空" | "偏多";
    sources: number;
    status: "requires_2_sources";
    snapshots: ConsensusPoint[];
    entryConsensus: number;
  };
  symbolOpportunities: SymbolOpportunity[];
  equitySeries: { time: string; equity: number; pnl: number; drawdown: number }[];
  traders: Trader[];
  executionEvents: ExecutionEvent[];
  riskEvents: RiskEvent[];
};
