import { CRS_UNIT_TO_KM } from "./constants";
import type { PathPoint } from "./types";

/**
 * Returns cumulative straight-line distance at each waypoint in Step order.
 * Empty paths return an empty array; a single point has distance zero. Input is not mutated.
 */
export function addCumulativeDistance(path: readonly PathPoint[]): PathPoint[] {
  let distanceKm = 0;

  return path.map((point, index) => {
    if (index > 0) {
      const previous = path[index - 1];
      const deltaX = point.X_coordinate - previous.X_coordinate;
      const deltaY = point.Y_coordinate - previous.Y_coordinate;
      distanceKm += Math.hypot(deltaX, deltaY) * CRS_UNIT_TO_KM;
    }

    return { ...point, Distance_km: distanceKm };
  });
}
