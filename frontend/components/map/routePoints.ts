import type { Icon } from 'leaflet';
import type { CrsPoint } from '@/lib/coords';
import type { Destination } from '@/lib/api';

export type RoutePointRole = 'Start' | 'End' | 'Science Target';

/**
 * Points picked by clicking the map (or replayed from a recorded visit) use a
 * negative id because they have no destination record on the backend. The
 * yellow destination markers always have a positive id.
 */
export const PICKED_POINT_ID = -1;

export function isPickedPoint(destination: Destination | null | undefined): boolean {
  return !!destination && destination.id < 0;
}

export const ROUTE_POINT_STYLE: Record<RoutePointRole, { color: string; label: string; name: string }> = {
  Start: { color: '#22c55e', label: 'S', name: 'Custom start' },
  End: { color: '#ef4444', label: 'E', name: 'Custom end' },
  'Science Target': { color: '#38bdf8', label: '★', name: 'Custom science target' },
};

/** Builds the Start/End assignment for a clicked (or dragged) CRS point. */
export function createPickedPoint(
  role: RoutePointRole,
  point: CrsPoint,
  mapId: number | null,
): Destination {
  return {
    id: PICKED_POINT_ID,
    title: ROUTE_POINT_STYLE[role].name,
    description: null,
    photo: null,
    x_coord: Math.round(point.x),
    y_coord: Math.round(point.y),
    map_id: mapId,
  };
}

type DivIconFactory = { divIcon(options: Record<string, unknown>): Icon };

/**
 * Round green "S" / red "E" markers for points picked on the map. Visually
 * distinct from the small yellow destination dots and the teardrop pin used
 * for a highlighted destination.
 */
export function createRoutePointIcon(L: DivIconFactory, role: RoutePointRole): Icon {
  const { color, label } = ROUTE_POINT_STYLE[role];

  return L.divIcon({
    className: 'mars-route-point',
    html: `
      <div style="
        width:30px;height:30px;border-radius:50%;
        background:${color};
        border:2.5px solid #ffffff;
        box-shadow:0 0 0 3px ${color}55, 0 2px 8px rgba(0,0,0,0.55);
        display:flex;align-items:center;justify-content:center;
        color:#fff;font:700 13px/1 ui-sans-serif,system-ui,sans-serif;
        cursor:grab;
      ">${label}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    tooltipAnchor: [0, -16],
  });
}
