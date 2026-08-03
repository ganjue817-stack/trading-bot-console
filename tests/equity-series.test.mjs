import test from "node:test";
import assert from "node:assert/strict";
import { appendEquityPoint } from "../src/lib/equity-series.ts";

test("appends a new session equity sample", () => {
  const first = { time: "14:30:00", equity: 1000, pnl: 0, drawdown: 0 };
  const second = { time: "14:30:05", equity: 1003.96, pnl: 3.96, drawdown: 0 };
  assert.deepEqual(appendEquityPoint([first], second), [first, second]);
});

test("replaces a sample with the same timestamp", () => {
  const stale = { time: "14:30:05", equity: 1001, pnl: 1, drawdown: 0 };
  const fresh = { time: "14:30:05", equity: 1002, pnl: 2, drawdown: 0 };
  assert.deepEqual(appendEquityPoint([stale], fresh), [fresh]);
});

test("keeps at most 72 session samples", () => {
  const existing = Array.from({ length: 72 }, (_, index) => ({ time: String(index), equity: 1000 + index, pnl: index, drawdown: 0 }));
  const next = { time: "72", equity: 1072, pnl: 72, drawdown: 0 };
  const result = appendEquityPoint(existing, next);
  assert.equal(result.length, 72);
  assert.equal(result[0].time, "1");
  assert.equal(result[71].time, "72");
});
