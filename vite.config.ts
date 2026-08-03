import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const outputsDir = resolve(process.env.TRADING_DATA_DIR ?? resolve(projectRoot, "outputs"));
const pythonExe = process.env.PYTHON_EXECUTABLE ?? "C:\\Users\\Administrator\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe";
const publicSnapshotUrl = process.env.TRADING_PUBLIC_SNAPSHOT_URL ?? "https://168.144.112.111.sslip.io/api/live_snapshot";
let monitorInFlight = false;
let lastUpstreamSnapshot = "";

const readJson = (name: string) => {
  const file = resolve(outputsDir, name);
  if (!existsSync(file)) return {};
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return {}; }
};

const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const csvRows = (name: string, limit = 60) => {
  const file = resolve(outputsDir, name);
  if (!existsSync(file)) return [] as Record<string, string>[];
  const [header = "", ...lines] = readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const fields = header.split(",");
  return lines.slice(-limit).map((line) => Object.fromEntries(fields.map((field, index) => [field, line.split(",")[index] ?? ""])));
};

const refreshLiveMonitor = () => {
  const snapshot = readJson("live_position_snapshot.json") as Record<string, unknown>;
  const checkedAt = Date.parse(String(snapshot.checked_at ?? ""));
  const currentAge = Number.isFinite(checkedAt) ? Date.now() - checkedAt : Number.POSITIVE_INFINITY;
  if (currentAge < 4_000 || monitorInFlight) return;
  monitorInFlight = true;
  const monitorScript = resolve(projectRoot, "deploy_core/live_position_snapshot.py");
  if (!existsSync(monitorScript) || !existsSync(outputsDir)) return;
  const child = spawn(pythonExe, [monitorScript, "--once"], {
    cwd: projectRoot,
    env: { ...process.env, TRADING_DATA_DIR: outputsDir },
    windowsHide: true,
  });
  child.once("error", () => { monitorInFlight = false; });
  child.once("close", () => { monitorInFlight = false; });
};

function liveSnapshotPlugin() {
  return {
    name: "read-only-live-snapshot",
    configureServer(server: { middlewares: { use: (path: string, handler: (request: { method?: string }, response: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void }) => void | Promise<void>) => void } }) {
      server.middlewares.use("/api/live_snapshot", async (request, response) => {
        if (request.method !== "GET") { response.statusCode = 405; response.end(""); return; }
        try {
          const upstream = await fetch(publicSnapshotUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
          if (upstream.ok) {
            lastUpstreamSnapshot = await upstream.text();
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.setHeader("Cache-Control", "no-store");
            response.end(lastUpstreamSnapshot);
            return;
          }
        } catch {
          if (lastUpstreamSnapshot) {
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.setHeader("Cache-Control", "no-store");
            response.end(lastUpstreamSnapshot);
            return;
          }
          // Keep the local read-only adapter available when the public snapshot cannot be reached.
        }
        refreshLiveMonitor();
        const status = readJson("live_execution_status.json") as Record<string, unknown>;
        const config = readJson("live_trading_config.json") as { blocked_symbols?: unknown[]; minimum_open_positions?: number; target_open_positions?: number; max_open_positions?: number };
        const state = readJson("live_execution_state.json") as { positions?: Record<string, unknown>[]; pending_intents?: unknown[] };
        const monitor = readJson("live_position_snapshot.json") as { checked_at?: string; status?: string; positions?: Record<string, unknown>[] };
        const permissions = readJson("live_trading_api_permissions.json") as Record<string, unknown>;
        const pipeline = readJson("pipeline_health.json") as Record<string, unknown>;
        const xOpinion = readJson("x_opinion_status.json") as Record<string, unknown>;
        const openPositions = (state.positions ?? []).filter((position) => position.status === "open");
        const decisionRows = csvRows("strategy_decisions_latest.csv", 500);
        const eliteDecision = decisionRows.find((row) => row.reason === "elite_single_source_core")
          ?? decisionRows.find((row) => row.core_origin === "elite_single_source")
          ?? null;
        const eliteSymbolBlocked = Boolean(eliteDecision?.symbol) && (config.blocked_symbols ?? []).map(String).includes(String(eliteDecision?.symbol));
        const consensusRows = csvRows("consensus_latest.csv", 500);
        const selectedConsensus = consensusRows.find((row) => row.symbol === eliteDecision?.symbol) ?? consensusRows[0] ?? null;
        const consensusHistory = selectedConsensus ? csvRows("consensus_history.csv", 500).filter((row) => row.symbol === selectedConsensus.symbol).slice(-8) : [];
        const executionEvents = csvRows("live_execution_events.csv").map((event) => ({
          time: event.time ?? "", event: event.event ?? "", symbol: event.symbol ?? "", direction: event.direction ?? "",
          reason: event.reason ?? "", status: event.status ?? "", notional: number(event.notional), price: number(event.price),
          consensus: number(event.consensus), fee: number(event.total_fees_usdt), slippage: number(event.exit_slippage_usdt), pnl: event.realized_pnl_usdt === "" ? null : number(event.realized_pnl_usdt),
          gross_pnl: event.gross_pnl_usdt === "" ? null : number(event.gross_pnl_usdt), fee_source: event.fee_source ?? "", pnl_source: event.pnl_source ?? "",
        }));
        const checkedAt = String(monitor.checked_at ?? status.checked_at ?? "");
        const age = checkedAt ? Math.max(0, Math.round((Date.now() - Date.parse(checkedAt)) / 1000)) : null;
        const dataAvailable = ["live_execution_status.json", "live_execution_state.json", "live_position_snapshot.json"]
          .some((name) => existsSync(resolve(outputsDir, name)));
        const payload = {
          source: "local_read_only_live_adapter",
          data_available: dataAvailable,
          ready: status.mode === "live" && status.status === "executed",
          checked_at: checkedAt,
          data_age_seconds: age,
          execution: {
            mode: status.mode ?? "disabled", status: status.status ?? "uninitialized", blockers: status.blockers ?? [],
            open_positions: number(status.open_positions), pending_intents: number(status.pending_intents), real_orders_sent: number(status.real_orders_sent),
            minimum_open_positions: number(status.minimum_open_positions ?? config.minimum_open_positions), target_open_positions: number(status.target_open_positions ?? config.target_open_positions),
            max_open_positions: number(status.max_open_positions ?? config.max_open_positions),
            capital_cap_usdt: number(status.capital_cap_usdt), leverage: number(status.leverage), live_risk: status.live_risk ?? {},
          },
          positions: openPositions.map((open) => {
            const monitored = (monitor.positions ?? []).find((position) => position.symbol === open.symbol) ?? {};
            return {
              symbol: String(open.symbol ?? ""), direction: String(open.direction ?? ""), quantity: number(monitored.quantity ?? open.quantity), entry_price: number(monitored.entry_price ?? open.entry_price),
              reference_price: number(monitored.mark_price ?? open.reference_price), mark_price: number(monitored.mark_price ?? open.live_mark_price ?? open.reference_price),
              unrealized_pnl_usdt: monitored.unrealized_pnl_usdt ?? open.live_unrealized_pnl_usdt ?? null, observed_at: String(monitored.observed_at ?? open.live_observed_at ?? monitor.checked_at ?? ""),
              stop_price: number(open.stop_price), leverage: number(open.leverage), notional: number(open.notional),
              estimated_stop_risk_usdt: number(open.estimated_stop_risk_usdt), source: String(open.copy_source ?? open.core_origin ?? "local_strategy"), protected: Boolean(open.stop_order_id),
              opened_at: String(open.opened_at ?? ""),
            };
          }),
          elite_core: eliteDecision ? {
            symbol: eliteDecision.symbol ?? "", direction: String(eliteDecision.action ?? "").replace("paper_open_", ""),
            reason: eliteSymbolBlocked ? "bybit_contract_agreement_required" : eliteDecision.reason ?? "", status: eliteSymbolBlocked ? "blocked" : eliteDecision.status ?? "unknown", planned_notional: number(eliteDecision.planned_notional), risk_usdt: number(eliteDecision.risk_usdt),
            style_status: eliteDecision.style_status ?? "neutral", style_reason: eliteDecision.style_reason ?? "",
          } : { status: "unknown", reason: "awaiting_strategy_snapshot" },
          consensus: selectedConsensus ? {
            symbol: selectedConsensus.symbol, value: number(selectedConsensus.consensus), sources: String(selectedConsensus.sources ?? "").split(/[|;,]/).filter(Boolean).length,
            status: selectedConsensus.signal ?? "insufficient_sources", updated_at: selectedConsensus.snapshot_at ?? "",
            snapshots: consensusHistory.map((row) => ({ time: row.snapshot_at ?? "", value: number(row.consensus) })),
          } : null,
          permissions: { status: permissions.status ?? "unknown", verified: Boolean(permissions.verified), read: Boolean((permissions.permissions as Record<string, unknown> | undefined)?.read), trade: Boolean((permissions.permissions as Record<string, unknown> | undefined)?.trade), withdraw: Boolean((permissions.permissions as Record<string, unknown> | undefined)?.withdraw), error: permissions.error ?? "" },
          monitor: { status: monitor.status ?? "unavailable", checked_at: monitor.checked_at ?? "", error: (monitor as Record<string, unknown>).error ?? "" },
          pipeline: { status: pipeline.status ?? "unknown", reasons: pipeline.reasons ?? [], last_success_at: (pipeline.run_state as Record<string, unknown> | undefined)?.last_success_at ?? "" },
          x_opinion: { status: xOpinion.status ?? "unknown", collection_mode: xOpinion.collection_mode ?? "unknown", display_name: xOpinion.display_name ?? "杰森哥", posts_seen: number(xOpinion.posts_seen), active_opinions: number(xOpinion.active_opinions), checked_at: xOpinion.checked_at ?? "" },
          events: executionEvents,
        };
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(JSON.stringify(payload));
      });
    },
  };
}

export default defineConfig({
  plugins: [liveSnapshotPlugin(), react(), tailwindcss()],
  server: {
    watch: {
      ignored: ["**/.edge-ui-check/**"],
    },
  },
});
