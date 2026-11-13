/** Converts raster CRS metres to kilometres. */
export const CRS_UNIT_TO_KM = 0.001;

/** Slope-to-limit ratios at which path risk increases. */
export const RISK_THRESHOLDS = {
  medium: 0.5,
  high: 0.8,
  critical: 1,
} as const;
