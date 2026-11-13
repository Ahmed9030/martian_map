import { addCumulativeDistance, getAverageMinerals, getRiskLevel } from "./index";
import type { PathPoint } from "./types";

const point = (overrides: Partial<PathPoint> = {}): PathPoint => ({
  Step: 1,
  X_coordinate: 0,
  Y_coordinate: 0,
  Elevation: 0,
  Slope_Degrees: 0,
  therm: 0,
  H2O: null,
  Fe: null,
  Si: null,
  Distance_km: 0,
  ...overrides,
});

// Small executable examples covering empty, singleton, normal, and incomplete data.
export const pathHelperExamples = {
  emptyDistance: addCumulativeDistance([]),
  singlePointDistance: addCumulativeDistance([point()]),
  normalDistances: addCumulativeDistance([
    point({ Step: 1, X_coordinate: 0, Y_coordinate: 0 }),
    point({ Step: 2, X_coordinate: 3000, Y_coordinate: 4000 }),
  ]).map(({ Distance_km }) => Distance_km),
  invalidSlopeLimit: getRiskLevel(2, 0),
  mineralValuesIgnoringNull: getAverageMinerals([
    point({ Fe: 10, Si: null, H2O: 4 }),
    point({ Fe: null, Si: 8, H2O: 6 }),
  ]),
} as const;
