import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const helperSource = await readFile(
  new URL("../src/symbol-sorting.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(helperSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const helperModuleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(
  outputText,
)}`;
const { getSameDirectionTraderCount, sortSymbolOpportunities } = await import(
  helperModuleUrl
);

const makeOpportunity = (overrides) => ({
  symbol: "AAA/USDT",
  direction: "long",
  state: "BACKGROUND",
  opportunityScore: null,
  tradeEligible: false,
  sameDirectionTraderCount: 0,
  opposingTraders: [],
  ...overrides,
});

const ordered = sortSymbolOpportunities([
  makeOpportunity({
    symbol: "ELIGIBLE/USDT",
    opportunityScore: 1,
    sameDirectionTraderCount: 1,
    tradeEligible: true,
  }),
  makeOpportunity({
    symbol: "HIGH-SCORE-LOW-SAME/USDT",
    opportunityScore: 99,
    sameDirectionTraderCount: 1,
  }),
  makeOpportunity({
    symbol: "MORE-SAME/USDT",
    opportunityScore: 10,
    sameDirectionTraderCount: 3,
  }),
  makeOpportunity({
    symbol: "TIE-HIGH-SCORE/USDT",
    opportunityScore: 40,
    sameDirectionTraderCount: 2,
  }),
  makeOpportunity({
    symbol: "TIE-LOW-SCORE/USDT",
    opportunityScore: 20,
    sameDirectionTraderCount: 2,
  }),
  makeOpportunity({
    symbol: "BBB/USDT",
    opportunityScore: 7,
    sameDirectionTraderCount: 0,
  }),
  makeOpportunity({
    symbol: "AAA/USDT",
    opportunityScore: 7,
    sameDirectionTraderCount: 0,
  }),
]);

assert.deepEqual(
  ordered.map((item) => item.symbol),
  [
    "MORE-SAME/USDT",
    "HIGH-SCORE-LOW-SAME/USDT",
    "TIE-HIGH-SCORE/USDT",
    "TIE-LOW-SCORE/USDT",
    "AAA/USDT",
    "BBB/USDT",
    "ELIGIBLE/USDT",
  ],
);

assert.deepEqual(
  sortSymbolOpportunities([
    makeOpportunity({
      symbol: "LOWER-SCORE-MORE-SAME/USDT",
      opportunityScore: 53.34,
      sameDirectionTraderCount: 9,
    }),
    makeOpportunity({
      symbol: "HIGHER-SCORE-FEWER-SAME/USDT",
      opportunityScore: 63.02,
      sameDirectionTraderCount: 1,
    }),
  ]).map((item) => item.symbol),
  ["LOWER-SCORE-MORE-SAME/USDT", "HIGHER-SCORE-FEWER-SAME/USDT"],
);

assert.equal(
  getSameDirectionTraderCount(
    makeOpportunity({
      sameDirectionTraderCount: undefined,
      opposingTraders: [{ name: "reverse-only" }],
    }),
  ),
  0,
);
assert.equal(
  sortSymbolOpportunities([
    makeOpportunity({
      symbol: "N-A-SCORE/USDT",
      opportunityScore: null,
      sameDirectionTraderCount: 2,
    }),
    makeOpportunity({
      symbol: "ZERO-SCORE/USDT",
      opportunityScore: 0,
      sameDirectionTraderCount: 2,
    }),
  ])[0].symbol,
  "ZERO-SCORE/USDT",
);
assert.equal(
  sortSymbolOpportunities([
    makeOpportunity({
      symbol: "REVERSE-HEAVY/USDT",
      opportunityScore: 10,
      sameDirectionTraderCount: undefined,
      opposingTraders: new Array(20).fill({}),
    }),
    makeOpportunity({
      symbol: "ONE-SAME/USDT",
      opportunityScore: 10,
      sameDirectionTraderCount: 1,
    }),
  ])[0].symbol,
  "ONE-SAME/USDT",
);

console.log("symbol opportunity sorting tests passed");
