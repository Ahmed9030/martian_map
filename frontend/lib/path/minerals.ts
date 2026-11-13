import type { MineralAverages, PathPoint } from "./types";

const MINERAL_FIELDS = ["Fe", "Si", "H2O"] as const;
type MineralField = (typeof MINERAL_FIELDS)[number];

function meanFor(path: readonly PathPoint[], field: MineralField): number {
  let total = 0;
  let count = 0;

  for (const point of path) {
    const value = point[field];
    if (typeof value === "number" && Number.isFinite(value)) {
      total += value;
      count += 1;
    }
  }

  return count === 0 ? 0 : total / count;
}

/** Computes per-mineral means, ignoring null and non-finite values; missing data and empty paths yield zero. */
export function getAverageMinerals(path: readonly PathPoint[]): MineralAverages {
  return {
    fe: meanFor(path, "Fe"),
    si: meanFor(path, "Si"),
    h2o: meanFor(path, "H2O"),
  };
}
