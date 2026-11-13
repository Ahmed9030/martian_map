import { RISK_THRESHOLDS } from "./constants";
import type { PathPoint, RiskLevel } from "./types";

const RISK_ORDER: readonly RiskLevel[] = ["low", "medium", "high", "critical"];

/** Classifies slope relative to its safe limit; invalid slopes or non-positive limits are critical. */
export function getRiskLevel(slopeDegrees: number, maxSafeSlope: number): RiskLevel {
  if (
    !Number.isFinite(slopeDegrees) ||
    slopeDegrees < 0 ||
    !Number.isFinite(maxSafeSlope) ||
    maxSafeSlope <= 0
  ) {
    return "critical";
  }

  const ratio = slopeDegrees / maxSafeSlope;
  if (ratio >= RISK_THRESHOLDS.critical) return "critical";
  if (ratio >= RISK_THRESHOLDS.high) return "high";
  if (ratio >= RISK_THRESHOLDS.medium) return "medium";
  return "low";
}

/** Returns the worst slope risk on a path; an empty path has low risk. */
export function getOverallPathRisk(
  path: readonly PathPoint[],
  maxSafeSlope: number,
): RiskLevel {
  let worstRisk: RiskLevel = "low";

  for (const point of path) {
    const risk = getRiskLevel(point.Slope_Degrees ?? Number.NaN, maxSafeSlope);
    if (RISK_ORDER.indexOf(risk) > RISK_ORDER.indexOf(worstRisk)) worstRisk = risk;
    if (worstRisk === "critical") return worstRisk;
  }

  return worstRisk;
}
