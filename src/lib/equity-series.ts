export type EquityPoint = { time: string; equity: number; pnl: number; drawdown: number };

const MAX_SESSION_SAMPLES = 72;

export function appendEquityPoint(series: EquityPoint[], point: EquityPoint): EquityPoint[] {
  const last = series.at(-1);
  const next = last?.time === point.time ? [...series.slice(0, -1), point] : [...series, point];
  return next.slice(-MAX_SESSION_SAMPLES);
}
