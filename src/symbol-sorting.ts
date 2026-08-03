import type { SymbolOpportunity } from "./types";

export function getSameDirectionTraderCount(
  opportunity: Pick<SymbolOpportunity, "sameDirectionTraderCount">,
) {
  const value = Number(opportunity.sameDirectionTraderCount);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function numericScore(value: number | null) {
  return value !== null && Number.isFinite(value) ? value : -1;
}

function stableSymbolKey(opportunity: SymbolOpportunity) {
  return `${opportunity.symbol}:${opportunity.direction}:${opportunity.state}`;
}

export function sortSymbolOpportunities(
  opportunities: SymbolOpportunity[],
): SymbolOpportunity[] {
  return [...opportunities].sort((left, right) => {
    const leftHasEntryConsensus = getSameDirectionTraderCount(left) >= 3;
    const rightHasEntryConsensus = getSameDirectionTraderCount(right) >= 3;
    if (leftHasEntryConsensus !== rightHasEntryConsensus) {
      return rightHasEntryConsensus ? 1 : -1;
    }

    const scoreDelta =
      numericScore(right.opportunityScore) - numericScore(left.opportunityScore);
    if (scoreDelta !== 0) return scoreDelta;

    const traderCountDelta =
      getSameDirectionTraderCount(right) - getSameDirectionTraderCount(left);
    if (traderCountDelta !== 0) return traderCountDelta;

    return stableSymbolKey(left).localeCompare(stableSymbolKey(right), "en", {
      sensitivity: "base",
    });
  });
}
