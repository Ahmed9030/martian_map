'use client';

import { useMapData } from '@/hooks/useMapData';
import { usePath } from '@/hooks/usePath';
import { useVehicles } from '@/hooks/useVehicles';
import { getPath, getRevisitFlight, getVehicles, vehicleToPathParams } from '@/lib/api';
import type { PathData, PathParams } from '@/lib/api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  createSamplePath,
  isUsableVehicle,
  summarizePath,
  TOUR_FALLBACK_LIMITS,
  useOnboarding,
} from '@/components/onboarding';
import type { TourScenarioResult } from '@/components/onboarding';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  MapPin,
  Flag,
  FlaskConical,
  Clock3,
  Route,
  Crosshair,
  Loader2,
  TriangleAlert,
} from 'lucide-react';


import type { LeafletMap, Layer, Marker } from 'leaflet';

import { LocationDetailsPanel } from './map/LocationDetailsPanel';
import { VehicleCarousel } from './map/VehicleCarousel';
import { VehiclePanel } from './map/VehiclePanel';
import { MAP_LAYER } from './map/layers';
import { useMapSelection } from './map/useMapSelection';
import type { Assignments, DestinationRole } from './map/useMapSelection';
import {
  createPickedPoint,
  createRoutePointIcon,
  isPickedPoint,
  ROUTE_POINT_STYLE,
} from './map/routePoints';
import type { Destination, Vehicle } from '@/lib/api';
import {
  boundsFromCoordinates,
  crsToMap,
  formatCrsPoint,
  isInsideBounds,
  leafletBounds,
  mapToCrs,
} from '@/lib/coords';
import type { LngLat, MapBounds } from '@/lib/coords';
import { MineralComposition } from '@/components/ui/MineralComposition';
import { getRiskLevel } from '@/lib/path/risk';
import { chooseStep, straightLineKm } from '@/lib/path/plan';
import { formatDistanceKm, formatHours } from '@/lib/format';


const ROLE_COLORS: Record<DestinationRole, string> = {
  Start: '#22c55e',
  End: '#ef4444',
  'Science Target': '#38bdf8',
};

const DESTINATION_ROLES: { role: DestinationRole; Icon: React.ElementType; color: string }[] = [
  { role: 'Start', Icon: MapPin, color: 'text-green-400' },
  { role: 'End', Icon: Flag, color: 'text-red-400' },
  { role: 'Science Target', Icon: FlaskConical, color: 'text-cyan-400' },
];

const WEIGHT_FIELDS = [
  { key: 'h2o', label: 'H₂O' },
  { key: 'fe', label: 'Fe' },
  { key: 'si', label: 'Si' },
] as const;

const DEFAULT_MAX_SLOPE = 15;

/** Give the example route request a short budget before falling back. */
const TOUR_DEMO_TIMEOUT_MS = 9000;

interface TourDemoScenario {
  path: PathData;
  sample: boolean;
}

function isUsableDestination(destination: Destination): boolean {
  return Number.isFinite(Number(destination.x_coord)) && Number.isFinite(Number(destination.y_coord));
}

const RISK_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/** Compact Start/End readout for the route-points panel. */
function RoutePointReadout({
  role,
  point,
}: {
  role: 'Start' | 'End';
  point: Destination | null;
}) {
  const style = ROUTE_POINT_STYLE[role];
  const coords = point
    ? formatCrsPoint({ x: Number(point.x_coord), y: Number(point.y_coord) })
    : 'Click the map';

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: style.color }}
      >
        {style.label}
      </span>
      <div className="min-w-0">
        <p className="text-[8px] uppercase tracking-[1px] text-gray-400">{role}</p>
        <p
          className={`truncate font-mono text-[10px] ${
            point ? 'text-white' : 'text-gray-500'
          }`}
          title={point ? coords : undefined}
        >
          {coords}
        </p>
      </div>
    </div>
  );
}

export default function Map() {
  const { data: vehicles, isLoading: vehiclesLoading, error: vehiclesError } = useVehicles();
  const { data: pathData, isLoading: pathLoading, error: pathError, run: runPath, reset: resetPath } = usePath();
  const {
    data: scienceData,
    isLoading: scienceLoading,
    error: scienceError,
    run: runScience,
  } = usePath();

  // ── Science Mode state ──────────────────────────────────────────────────
  const [mode, setMode] = useState<'fast' | 'science'>('fast');
  const [weights, setWeights] = useState({ h2o: 0.8, fe: 0.6, si: 0.6 });
  // Science results are only valid for the inputs they were requested with.
  const [scienceRunKey, setScienceRunKey] = useState<string | null>(null);

  // ── Vehicle state ───────────────────────────────────────────────────────
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicleIndex, setVehicleIndex] = useState(0);
  // When arriving from a recorded visit, its stored limits override the
  // currently selected vehicle until the astronaut picks a vehicle manually.
  const [replayVehicle, setReplayVehicle] = useState<Vehicle | null>(null);

  // Derive active vehicle ID: user selection takes precedence, defaulting to vehicles[0]
  const activeVehicleId =
    selectedVehicleId ?? (vehicles?.length ? String(vehicles[0].id) : '');

  const selectedVehicle =
    vehicles?.find((v) => String(v.id) === activeVehicleId) ?? null;

  const routeVehicle = replayVehicle ?? selectedVehicle;
  // The API has no per-vehicle slope limit; 15° is the documented default.
  const effectiveMaxSlope = DEFAULT_MAX_SLOPE;

  /** Fixture data is not always physically consistent (e.g. minTherm > maxTherm). */
  const vehicleWarning = useMemo(() => {
    if (!routeVehicle) return null;
    if (!Number.isFinite(routeVehicle.maxSpead) || routeVehicle.maxSpead <= 0) {
      return 'This vehicle has an invalid speed limit.';
    }
    if (
      !Number.isFinite(routeVehicle.minTherm) ||
      !Number.isFinite(routeVehicle.maxTherm) ||
      routeVehicle.minTherm >= routeVehicle.maxTherm
    ) {
      return `Inconsistent temperature limits (${routeVehicle.minTherm} K ≥ ${routeVehicle.maxTherm} K). Pick another vehicle.`;
    }
    return null;
  }, [routeVehicle]);

  // ── Map / selection state ───────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const routeLayerRef = useRef<Layer | null>(null);
  const destinationModeRef = useRef<DestinationRole>('Start');

  const searchParams = useSearchParams();
  const flightParam = searchParams.get('flight');
  const mapParam = searchParams.get('map');

  const [selectedMap, setSelectedMap] = useState(() =>
    mapParam && /^\d+$/.test(mapParam) ? Number(mapParam) : 1,
  );
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState('');

  const {
    destinationMode,
    setDestinationMode,
    assignments,
    setAssignments,
    selectedDestination,
    setSelectedDestination,
    closeDetails,
  } = useMapSelection();

  const { data, isLoading, error } = useMapData(selectedMap);

  // ── Onboarding tour demo ────────────────────────────────────────────────
  // The tour asks the map for a ready-made scenario; the map owns the drawing
  // and reports the real numbers back so the tooltip can show them.
  const { registerMapController } = useOnboarding();
  const [tourDemo, setTourDemo] = useState<TourDemoScenario | null>(null);
  const [tourDemoLoading, setTourDemoLoading] = useState(false);
  const tourModeRef = useRef(false);
  const tourAbortRef = useRef<AbortController | null>(null);

  // ── Click-to-pick plumbing ──────────────────────────────────────────────
  // Refs keep the Leaflet event handlers (created once per map) in sync with
  // the latest React state without re-creating the map.
  const boundsRef = useRef<MapBounds | null>(null);
  const assignmentsRef = useRef<Assignments>(assignments);
  const pickedLayerRef = useRef<Layer | null>(null);
  const pickedMarkersRef = useRef<Record<DestinationRole, Marker | null>>({
    Start: null,
    End: null,
    'Science Target': null,
  });
  // Set during map initialisation so map clicks can un-highlight a yellow
  // destination that previously held the same role.
  const clearRoleHighlightRef = useRef<(role: DestinationRole) => void>(() => {});
  const mapPickRef = useRef<(lngLat: LngLat) => void>(() => {});

  // ── Toast ───────────────────────────────────────────────────────────────
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    setMapMessage(message);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setMapMessage(null), 3200);
  };
  const notifyRef = useRef(notify);

  useEffect(() => {
    notifyRef.current = notify;
    assignmentsRef.current = assignments;
  });

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  // ── Deep links: /map?flight=<id> replays a visit, /map?map=<id> picks a map ──
  useEffect(() => {
    if (flightParam) {
      let cancelled = false;
      (async () => {
        try {
          const flight = await getRevisitFlight(flightParam);
          if (cancelled) return;
          setReplayVehicle({
            id: -1,
            name: `Recorded visit #${flight.id}`,
            description: null,
            photo: null,
            maxSpead: flight.maxSpeed,
            maxEle: flight.maxEle,
            maxTherm: flight.maxTherm,
            maxWind: flight.maxWind,
            minTherm: flight.minTherm,
          });
          if (flight.map_id) setSelectedMap(flight.map_id);
          const asDestination = (role: DestinationRole, x: number, y: number) => ({
            id: -1,
            title: role,
            description: null,
            photo: null,
            x_coord: x,
            y_coord: y,
            map_id: flight.map_id,
          });
          setAssignments({
            Start: asDestination('Start', flight.x_start_coord, flight.y_start_coord),
            End: asDestination('End', flight.x_end_coord, flight.y_end_coord),
            'Science Target': null,
          });
        } catch {
          // A bad link should leave the map in its normal empty state.
        }
      })();
      return () => {
        cancelled = true;
      };
    }

  }, [flightParam, setAssignments]);

  // Keep ref in sync with state so marker callbacks always see the latest value
  useEffect(() => {
    destinationModeRef.current = destinationMode;
  });

  // ── Map initialisation ──────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || error || !data) return;

    let map: LeafletMap | null = null;
    let cancelled = false;

    async function initializeMap() {
      try {
        const leaflet = await import('leaflet');
        const L = leaflet.default;

        if (cancelled || !mapContainerRef.current) return;

        // Same bounds drive the overlay, `maxBounds`, clicks and destinations.
        const crsBounds = boundsFromCoordinates(data!.coordinates);
        if (!crsBounds) {
          throw new Error('Map coordinates are not valid numbers.');
        }
        boundsRef.current = crsBounds;
        const bounds = leafletBounds(crsBounds);

        const center: [number, number] = [
          (bounds[0][0] + bounds[1][0]) / 2,
          (bounds[0][1] + bounds[1][1]) / 2,
        ];

        map = L.map(mapContainerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -11,
        maxZoom: 3,
        zoomSnap: 0.1,
        center,
        zoom: -11,
        maxBounds: bounds,
        zoomControl: false,
      });


      // Custom Mars Scale Bar
      const MarsScale = L.Control.extend({
      options: {
      position: 'bottomleft',
      },
        
      onAdd: function (map: LeafletMap) {
      const container = L.DomUtil.create(
      'div',
      'mars-scale-control'
    );

    container.innerHTML = `
      <div class="mars-scale-labels">
        <span>0</span>
        <span class="scale-middle"></span>
        <span class="scale-end"></span>
      </div>
      <div class="mars-scale-bar">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div class="mars-scale-unit">KM</div>
    `;

    L.DomEvent.disableClickPropagation(container);

    const updateScale = () => {
      const width = 100;
      const center = map.getSize().y - 40;
      const y = map.containerPointToLatLng([0, center]);
      const x1 = map.containerPointToLatLng([0, center]);
      const x2 = map.containerPointToLatLng([width, center]);

      const distance = map.distance(y, x2) / 1000;

      const niceDistance = Math.pow(
        10,
        Math.floor(Math.log10(distance))
      );

      const value = Math.floor(distance / niceDistance) * niceDistance;

      const pixelWidth = (value / distance) * width;

      container.querySelector('.mars-scale-bar')!.setAttribute(
        'style',
        `width:${pixelWidth}px`
      );

      container.querySelector('.scale-middle')!.textContent =
        `${(value / 2).toFixed(value < 1 ? 2 : 0)}`;

      container.querySelector('.scale-end')!.textContent =
        `${value.toFixed(value < 1 ? 2 : 0)}`;
    };

    map.on('zoomend moveend', updateScale);
    setTimeout(updateScale, 0);

    return container;
  },
});

new MarsScale().addTo(map);
const zoomControl = L.control.zoom({
  position: 'bottomright',
}).addTo(map);

// Reset Map Button
const resetButton = L.DomUtil.create(
  'a',
  'leaflet-control-reset-view',
  zoomControl.getContainer()
) as HTMLAnchorElement;

resetButton.innerHTML = `
  <svg viewBox="0 0 24 24" width="18" height="18"
       fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M12 8v8M8 12h8"></path>
  </svg>
`;

resetButton.href = '#';
resetButton.title = 'Reset Map';
resetButton.setAttribute('role', 'button');

L.DomEvent.disableClickPropagation(resetButton);
L.DomEvent.on(resetButton, 'click', (e: Event) => {
  L.DomEvent.preventDefault(e);
  map?.setView(center, selectedMap === 2 ? -8 : -11, {
  animate: true,
});
});
  
     

        mapRef.current = map;
        map.on('click', (event) => {
          if (!event.originalEvent.defaultPrevented) closeDetails();
          // Clicking the basemap picks the next route point (Start → End → new
          // selection). Clicks on markers never reach here (stopPropagation).
          mapPickRef.current(event.latlng);
        });
        const overlay = L.imageOverlay(selectedMap == 1 ? "/maps/TharsisMap.png" : "/maps/jezeroMap.png", bounds);

       
const markersLayer = L.layerGroup().addTo(map);
routeLayerRef.current = L.layerGroup().addTo(map);
// Green "S" / red "E" markers for points picked by clicking the map.
pickedLayerRef.current = L.layerGroup().addTo(map);
pickedMarkersRef.current = { Start: null, End: null, 'Science Target': null };

const createDestinationIcon = (color: string, selected = false) => {
  if (!selected) {
    return L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#facc15;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }

  
return L.divIcon({
  className: '',
  html: `
    <svg
      width="18"
      height="24"
      viewBox="0 0 32 40"
      xmlns="http://www.w3.org/2000/svg"
      style="
        filter:
          drop-shadow(0 0 3px ${color})
          drop-shadow(0 0 6px ${color});
      "
    >
      <path
        d="M16 39 C12 32 2 22 2 15 A14 14 0 1 1 30 15 C30 22 20 32 16 39Z"
        fill="${color}"
        stroke="#ffffff"
        stroke-width="1.8"
      />
      <circle cx="16" cy="15" r="4" fill="#ffffff"/>
    </svg>
  `,
  iconSize: [24, 30],
  iconAnchor: [12, 25],
  tooltipAnchor: [0, -27],
});

};

// Lets a map click / dragged marker clear a previously highlighted yellow
// destination that held the same role.
clearRoleHighlightRef.current = (role: DestinationRole) => {
  markersLayer.eachLayer((layer: Layer) => {
    if (layer instanceof L.Marker && layer.destinationRole === role) {
      layer.destinationRole = null;
      layer.setIcon(createDestinationIcon('#facc15'));
    }
  });
};

if (Array.isArray(data!.destination)) {
  data!.destination.forEach((destination) => {
    const x = Number(destination.x_coord);
    const y = Number(destination.y_coord);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    // Destinations go through the same CRS → map helper as map clicks.
    const position = crsToMap(x, y, crsBounds);
    const marker = L.marker([position.lat, position.lng], {
      icon: createDestinationIcon('#facc15'),
    });

    marker.destinationRole = null;

    marker.bindTooltip(destination.title, {
      direction: 'top',
      offset: [0, -8],
    });

    marker.on('click', (event?: unknown) => {
      // A destination click sets Start/End; it must not also pick a new point
      // through the map click handler.
      const original = (event as { originalEvent?: Event } | undefined)?.originalEvent;
      original?.stopPropagation();

      const role = destinationModeRef.current;
      const color = ROLE_COLORS[role];

      clearRoleHighlightRef.current(role);

      marker.destinationRole = role;
      marker.setIcon(createDestinationIcon(color, true));

      setAssignments((prev) => ({ ...prev, [role]: destination }));
      setSelectedDestination({ ...destination, role });

      marker
        .bindPopup(`<b>${destination.title}</b><br/>Selected as: ${role}`)
        .openPopup();
    });

    marker.addTo(markersLayer);
  });
}


        overlay.once('load', () => {
          if (cancelled || !map) return;
          requestAnimationFrame(() => {
            if (cancelled || !map) return;
            map.invalidateSize(true);
            map.setView(center, selectedMap === 2 ? -8 : -11);
            setMapLoading(false);
          });
        });

        overlay.once('error', () => {
          if (!cancelled) {
            setMapError('Failed to load Mars map image.');
            setMapLoading(false);
          }
        });

        overlay.addTo(map);
      } catch (err: unknown) {
        if (!cancelled && (err as Error)?.name !== 'AbortError') {
          console.error('Failed to load Mars map:', err);
          setMapError((err as Error)?.message ?? 'Could not load the map.');
          setMapLoading(false);
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
      map?.remove();
      if (mapRef.current === map) {
        mapRef.current = null;
        routeLayerRef.current = null;
      }
    };
  }, [selectedMap, data, isLoading, error, setAssignments, setSelectedDestination, closeDetails]);

  // ── Click-to-pick: Start → End → new selection ─────────────────────────
  useEffect(() => {
    mapPickRef.current = (lngLat: LngLat) => {
      const bounds = boundsRef.current;
      if (!bounds) return;

      const point = mapToCrs(lngLat, bounds);
      if (!isInsideBounds(point, bounds)) {
        notifyRef.current('That point is outside the Mars basemap — click inside the image.');
        return;
      }

      const current = assignmentsRef.current;

      // "Science Target" keeps its own mode; every other click follows the
      // Start → End → reset flow.
      let role: DestinationRole;
      if (destinationModeRef.current === 'Science Target') role = 'Science Target';
      else if (!current.Start) role = 'Start';
      else if (!current.End) role = 'End';
      else role = 'Start';

      // A clicked point replaces any yellow destination that held the role.
      clearRoleHighlightRef.current(role);

      const next: Assignments = {
        ...current,
        [role]: createPickedPoint(role, point, selectedMap),
      };
      // Third click starts a new selection: START = click, END cleared.
      if (role === 'Start') next.End = null;

      setAssignments(next);
      setSelectedDestination(null);
    };
  });

  // ── Picked Start/End markers (draggable to fine-tune) ──────────────────
  useEffect(() => {
    let cancelled = false;

    async function syncPickedMarkers() {
      const layer = pickedLayerRef.current;
      const bounds = boundsRef.current;
      if (!layer || !bounds) return;

      const leaflet = await import('leaflet');
      const L = leaflet.default;
      if (cancelled || pickedLayerRef.current !== layer) return;

      const roles: DestinationRole[] = ['Start', 'End', 'Science Target'];

      for (const role of roles) {
        const point = assignments[role];
        const existing = pickedMarkersRef.current[role];

        // Yellow destination picks keep their own pin; only custom points get
        // the S/E markers.
        if (!point || !isPickedPoint(point)) {
          if (existing) {
            existing.remove();
            pickedMarkersRef.current[role] = null;
          }
          continue;
        }

        const position = crsToMap(Number(point.x_coord), Number(point.y_coord), bounds);
        if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) continue;

        if (existing) {
          const currentPosition = existing.getLatLng();
          if (
            currentPosition.lat !== position.lat ||
            currentPosition.lng !== position.lng
          ) {
            existing.setLatLng([position.lat, position.lng]);
          }
          continue;
        }

        const marker = L.marker([position.lat, position.lng], {
          icon: createRoutePointIcon(L, role),
          draggable: true,
          zIndexOffset: 600,
          autoPan: false,
          keyboard: false,
        });

        marker.bindTooltip(`${ROUTE_POINT_STYLE[role].name} · drag to fine-tune`, {
          direction: 'top',
          offset: [0, -16],
        });

        marker.on('click', (event?: unknown) => {
          // Marker clicks never pick a new point.
          (event as { originalEvent?: Event } | undefined)?.originalEvent?.stopPropagation();
        });

        marker.on('dragend', () => {
          const dragBounds = boundsRef.current;
          if (!dragBounds) return;

          const dragged = marker.getLatLng();
          const crs = mapToCrs({ lat: dragged.lat, lng: dragged.lng }, dragBounds);
          const previous = assignmentsRef.current[role];

          if (!isInsideBounds(crs, dragBounds)) {
            const fallback = crsToMap(
              Number(previous?.x_coord ?? 0),
              Number(previous?.y_coord ?? 0),
              dragBounds,
            );
            marker.setLatLng([fallback.lat, fallback.lng]);
            notifyRef.current('Markers must stay inside the Mars basemap.');
            return;
          }

          setAssignments((prev) => ({
            ...prev,
            [role]: createPickedPoint(role, crs, prev[role]?.map_id ?? null),
          }));
        });

        marker.addTo(layer);
        pickedMarkersRef.current[role] = marker;
      }
    }

    syncPickedMarkers();
    return () => {
      cancelled = true;
    };
  }, [assignments, data, isLoading, mapLoading, setAssignments]);

  // ── Science route validity ─────────────────────────────────────────────
  const scienceSignature = JSON.stringify([
    assignments.Start?.id ?? null,
    assignments.Start?.x_coord ?? null,
    assignments.Start?.y_coord ?? null,
    assignments.End?.id ?? null,
    assignments.End?.x_coord ?? null,
    assignments.End?.y_coord ?? null,
    routeVehicle?.id ?? null,
    selectedMap,
    weights.h2o,
    weights.fe,
    weights.si,
  ]);
  const scienceIsCurrent = scienceRunKey === scienceSignature;
  const scienceRoute = scienceIsCurrent ? scienceData : null;
  const scienceRouteLoading = scienceIsCurrent && scienceLoading;
  const scienceRouteError = scienceIsCurrent ? scienceError : null;

  // ── Path calculation ────────────────────────────────────────────────────
  useEffect(() => {
    // The tour demo runs its own request (without recording a visit).
    if (tourModeRef.current) return;

    const start = assignments.Start;
    const end = assignments.End;

    if (!start || !end || !routeVehicle) {
      resetPath();
      return;
    }

    const params = vehicleToPathParams(routeVehicle);
    runPath({
      map: selectedMap,
      startX: Number(start.x_coord),
      startY: Number(start.y_coord),
      endX: Number(end.x_coord),
      endY: Number(end.y_coord),
      ...params,
      maxSlope: effectiveMaxSlope,
      // Replaying a visit must not create a duplicate visit entry.
      record: flightParam ? '0' : undefined,
    });
  }, [
    assignments.Start,
    assignments.End,
    routeVehicle,
    effectiveMaxSlope,
    flightParam,
    selectedMap,
    runPath,
    resetPath,
  ]);

  const calculateScienceRoute = () => {
    const start = assignments.Start;
    const end = assignments.End;
    if (!start || !end || !routeVehicle || vehicleWarning) return;
    const params = vehicleToPathParams(routeVehicle);
    const step = chooseStep(
      straightLineKm(
        { x: Number(start.x_coord), y: Number(start.y_coord) },
        { x: Number(end.x_coord), y: Number(end.y_coord) },
      ),
    );
    setMode('science');
    setScienceRunKey(scienceSignature);
    void runScience({
      map: selectedMap,
      startX: Number(start.x_coord),
      startY: Number(start.y_coord),
      endX: Number(end.x_coord),
      endY: Number(end.y_coord),
      ...params,
      maxSlope: effectiveMaxSlope,
      mode: 'science',
      h2o: weights.h2o,
      fe: weights.fe,
      si: weights.si,
      step,
      record: flightParam ? '0' : undefined,
    });
  };

  /** "Calculate Route" — same request as the automatic fast-route effect. */
  function calculateFastRoute() {
    const start = assignments.Start;
    const end = assignments.End;
    if (!start || !end || !routeVehicle || vehicleWarning) return;
    void runPath({
      map: selectedMap,
      startX: Number(start.x_coord),
      startY: Number(start.y_coord),
      endX: Number(end.x_coord),
      endY: Number(end.y_coord),
      ...vehicleToPathParams(routeVehicle),
      maxSlope: effectiveMaxSlope,
      record: flightParam ? '0' : undefined,
    });
  }

  /** Clears both route points, the drawn routes and the science result. */
  function clearRoutePoints() {
    setAssignments({ Start: null, End: null, 'Science Target': null });
    setSelectedDestination(null);
    setScienceRunKey(null);
    resetPath();
    if (mode === 'science') setMode('fast');
  }

  // ── Onboarding demo: load a ready-made scenario ─────────────────────────
  const runTourScenario = useCallback(async (): Promise<TourScenarioResult> => {
    const bounds = boundsRef.current;
    const mapData = data;
    if (!bounds || !mapData) {
      throw new Error('The map is still loading.');
    }

    tourAbortRef.current?.abort();
    const controller = new AbortController();
    tourAbortRef.current = controller;
    tourModeRef.current = true;

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, TOUR_DEMO_TIMEOUT_MS);

    const destinations = (mapData.destination ?? []).filter(isUsableDestination);
    const fallbackPoint = (fraction: number, offset: number) => ({
      x: bounds.left + (bounds.right - bounds.left) * fraction,
      y: bounds.bottom + (bounds.top - bounds.bottom) * (0.5 + offset),
    });
    const startCrs = destinations[0]
      ? { x: Number(destinations[0].x_coord), y: Number(destinations[0].y_coord) }
      : fallbackPoint(0.32, -0.06);
    const endCrs = destinations[1]
      ? { x: Number(destinations[1].x_coord), y: Number(destinations[1].y_coord) }
      : fallbackPoint(0.68, 0.08);

    const start = createPickedPoint('Start', startCrs, selectedMap);
    const end = createPickedPoint('End', endCrs, selectedMap);

    setTourDemo(null);
    setTourDemoLoading(true);
    setScienceRunKey(null);
    setMode('fast');
    setAssignments({ Start: start, End: end, 'Science Target': null });
    setSelectedDestination(null);

    try {
      let vehicle = vehicles?.find(isUsableVehicle) ?? null;
      if (!vehicle) {
        try {
          vehicle = (await getVehicles()).find(isUsableVehicle) ?? null;
        } catch {
          vehicle = null;
        }
      }

      const limits = vehicle ? vehicleToPathParams(vehicle) : TOUR_FALLBACK_LIMITS;
      const params: PathParams = {
        map: selectedMap,
        startX: start.x_coord,
        startY: start.y_coord,
        endX: end.x_coord,
        endY: end.y_coord,
        ...limits,
        maxSlope: effectiveMaxSlope,
        // Never record a visit for the tour's demo route.
        record: '0',
      };

      const path = await getPath(params, { signal: controller.signal });
      if (controller.signal.aborted) throw new Error('The example was cancelled.');
      setTourDemo({ path, sample: false });
      return { result: summarizePath(path), sample: false };
    } catch {
      // A cancelled demo (tour closed) must not paint fallback data.
      if (!timedOut && controller.signal.aborted) {
        throw new Error('The example was cancelled.');
      }
      const samplePath = createSamplePath(startCrs, endCrs);
      setTourDemo({ path: samplePath, sample: true });
      return { result: summarizePath(samplePath), sample: true };
    } finally {
      clearTimeout(timeoutId);
      setTourDemoLoading(false);
      if (tourAbortRef.current === controller) tourAbortRef.current = null;
    }
  }, [
    data,
    effectiveMaxSlope,
    selectedMap,
    setAssignments,
    setSelectedDestination,
    vehicles,
  ]);

  /** Restores the map to its pre-tour state (only if the demo is active). */
  const clearTourScenario = useCallback(() => {
    if (!tourModeRef.current) return;
    tourModeRef.current = false;
    tourAbortRef.current?.abort();
    tourAbortRef.current = null;
    setTourDemo(null);
    setTourDemoLoading(false);
    setAssignments({ Start: null, End: null, 'Science Target': null });
    setSelectedDestination(null);
    resetPath();
  }, [resetPath, setAssignments, setSelectedDestination]);

  // Keep the latest closures reachable from the stable controller below.
  const tourScenarioRef = useRef(runTourScenario);
  const clearTourScenarioRef = useRef(clearTourScenario);

  useEffect(() => {
    tourScenarioRef.current = runTourScenario;
    clearTourScenarioRef.current = clearTourScenario;
  }, [runTourScenario, clearTourScenario]);

  useEffect(() => {
    registerMapController({
      runScenario: () => tourScenarioRef.current(),
      clearScenario: () => clearTourScenarioRef.current(),
    });
    return () => registerMapController(null);
  }, [registerMapController]);

  // ── Route drawing ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function drawRoutes() {
      const layer = routeLayerRef.current;
      if (!layer) return;

      layer.clearLayers();

      const leaflet = await import('leaflet');
      const L = leaflet.default;

      if (cancelled) return;

      // `path_data` is in raster CRS units; the same helper as the picked
      // points converts it back into Leaflet lat/lng.
      const toLatLngs = (route: typeof pathData) =>
        (route?.path_data ?? [])
          .map((point) =>
            crsToMap(
              Number(point.X_coordinate),
              Number(point.Y_coordinate),
              boundsRef.current,
            ),
          )
          .filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng))
          .map(({ lat, lng }) => [lat, lng] as [number, number]);

      // The inactive comparison route stays visible as a thin dashed line.
      const drawInactive = (coordinates: [number, number][]) => {
        L.polyline(coordinates, {
          color: '#38bdf8',
          weight: 2,
          opacity: 0.55,
          dashArray: '6 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layer);
      };

      // The active route keeps the original amber glow styling.
      const drawActive = (coordinates: [number, number][]) => {
        L.polyline(coordinates, {
          color: '#fbbf24',
          weight: 12,
          opacity: 0.15,
          lineCap: 'butt',
          lineJoin: 'round',
        }).addTo(layer);
        L.polyline(coordinates, {
          color: '#d97706',
          weight: 6,
          opacity: 0.5,
          lineCap: 'butt',
          lineJoin: 'round',
        }).addTo(layer);
        L.polyline(coordinates, {
          color: '#fde68a',
          weight: 2.5,
          opacity: 1,
          lineCap: 'butt',
          lineJoin: 'round',
        }).addTo(layer);
        L.polyline(coordinates, {
          color: '#ffffff',
          weight: 1,
          opacity: 0.7,
          dashArray: '2 12',
          lineCap: 'butt',
        }).addTo(layer);
      };

      const fastCoordinates = toLatLngs(pathData);
      const scienceCoordinates = toLatLngs(scienceRoute);
      const activeCoordinates =
        mode === 'science' ? scienceCoordinates : fastCoordinates;
      const inactiveCoordinates =
        mode === 'science' ? fastCoordinates : scienceCoordinates;

      if (inactiveCoordinates.length >= 2) drawInactive(inactiveCoordinates);
      if (activeCoordinates.length >= 2) drawActive(activeCoordinates);
    }

    drawRoutes();
    return () => { cancelled = true; };
  }, [pathData, scienceRoute, mode]);

  // ── Onboarding demo route (drawn with a progressive line animation) ─────
  useEffect(() => {
    let cancelled = false;

    async function drawTourRoute() {
      const layer = routeLayerRef.current;
      if (!layer) return;

      layer.clearLayers();
      if (!tourDemo) return;

      const leaflet = await import('leaflet');
      const L = leaflet.default;
      if (cancelled) return;

      const coordinates = tourDemo.path.path_data
        .map((point) =>
          crsToMap(Number(point.X_coordinate), Number(point.Y_coordinate), boundsRef.current),
        )
        .filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng))
        .map(({ lat, lng }) => [lat, lng] as [number, number]);

      if (coordinates.length < 2) return;

      L.polyline(coordinates, {
        color: '#fbbf24',
        weight: 12,
        opacity: 0.15,
        lineCap: 'butt',
        lineJoin: 'round',
      }).addTo(layer);
      L.polyline(coordinates, {
        color: '#d97706',
        weight: 6,
        opacity: 0.5,
        lineCap: 'butt',
        lineJoin: 'round',
      }).addTo(layer);
      const mainLine = L.polyline(coordinates, {
        color: '#fde68a',
        weight: 2.5,
        opacity: 1,
        lineCap: 'butt',
        lineJoin: 'round',
      });
      mainLine.addTo(layer);

      const element = mainLine.getElement() as SVGPathElement | undefined;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!element || reduceMotion || typeof element.getTotalLength !== 'function') return;

      const length = element.getTotalLength();
      element.style.strokeDasharray = `${length}`;
      element.style.strokeDashoffset = `${length}`;
      element.animate(
        [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
        { duration: 1400, easing: 'ease-out', fill: 'forwards' },
      );
    }

    void drawTourRoute();
    return () => { cancelled = true; };
  }, [tourDemo]);

// The charts and analytics always describe the route the astronaut is viewing.
// While the tour demo is on the map its route stands in for the fast route.
const fastPath = tourDemo?.path ?? pathData;
const activePath = tourDemo?.path ?? (mode === 'science' ? scienceRoute : pathData);
const activePathLoading = tourDemo
  ? tourDemoLoading
  : mode === 'science'
    ? scienceRouteLoading
    : pathLoading;
const activePathError = tourDemo
  ? null
  : mode === 'science'
    ? scienceRouteError
    : pathError;

const temperatureData = activePath?.path_data?.map((point) => ({
  distance: Number(point.Distance_km),
  morning: Number(point.max_therm),
  night: Number(point.min_therm),
})) ?? [];


  // ── Vehicle nav helpers ─────────────────────────────────────────────────
  function nextVehicle() {
    if (!vehicles?.length) return;
    setReplayVehicle(null);
    const next = (vehicleIndex + 1) % vehicles.length;
    setVehicleIndex(next);
    setSelectedVehicleId(String(vehicles[next].id));
  }

  function previousVehicle() {
    if (!vehicles?.length) return;
    setReplayVehicle(null);
    const prev = (vehicleIndex - 1 + vehicles.length) % vehicles.length;
    setVehicleIndex(prev);
    setSelectedVehicleId(String(vehicles[prev].id));
  }

  function handleVehicleSelect(vehicle: Vehicle) {
    setReplayVehicle(null);
    setSelectedVehicleId(String(vehicle.id));
  }

  // ── Map switcher ────────────────────────────────────────────────────────
  function changeMap(mapNumber: number) {
    if (selectedMap === mapNumber) return;
    setMapLoading(true);
    setMapError('');
    setReplayVehicle(null);
    setSelectedMap(mapNumber);
    setAssignments({ Start: null, End: null, 'Science Target': null });
    closeDetails();
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative isolate w-full ${tourDemo ? 'tour-demo-active' : ''}`}
      style={{ height: 'calc(113vh - 80px)', minHeight: '0' }}
    >
      {/* ── Top bar: Map toggle ── */}
      <div
        data-tour="map-switcher"
        className={`absolute top-30 left-[75%] -translate-x-1/2 ${MAP_LAYER.topBar} flex gap-2 rounded-xl bg-[#121214] p-2 shadow-lg pointer-events-auto`}
      >
        {([1, 2] as const).map((mapNum) => (
          <button
            key={mapNum}
            onClick={() => changeMap(mapNum)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              selectedMap === mapNum
                ? 'bg-white text-black'
                : 'text-white hover:bg-white/10'
            }`}
          >
            {mapNum === 1 ? 'Tharsis' : 'Jezero'}
          </button>
        ))}
      </div>

      {/* ── Toast (out-of-bounds clicks, dragging) ── */}
      {mapMessage && (
        <div
          role="status"
          className="pointer-events-none absolute left-1/2 top-20 z-[9500] flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-amber-400/40 bg-[#1b1409]/95 px-3 py-1.5 text-[11px] text-amber-200 shadow-lg backdrop-blur"
        >
          <TriangleAlert size={13} />
          {mapMessage}
        </div>
      )}

     
{/* ── Left panel: Destinations + Route analytics ── */}
<div
  data-tour="destinations-panel"
  className={`absolute top-28 left-4 ${MAP_LAYER.panel} max-h-[calc(100vh-8rem)] w-56 overflow-y-auto glass-panel rounded-xl p-3 text-white`}
>
  {/* Destinations header */}
  <div className="mb-2 flex items-center gap-2">
    <Crosshair size={14} className="text-orange-400" />
    <p className="text-[9px] font-semibold tracking-[1.5px] text-gray-400">
      SELECTED DESTINATIONS
    </p>
  </div>

  {/* Role buttons */}
  {DESTINATION_ROLES.map(({ role, Icon, color }) => (
    <button
      key={role}
      onClick={() => setDestinationMode(role)}
      className={`mb-1.5 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-all duration-300 hover:bg-white/[0.07] ${
        destinationMode === role
          ? 'border-orange-400/50 bg-orange-400/10'
          : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon size={15} className={color} strokeWidth={1.8} />
        <div>
          <p className="text-[8px] text-gray-400">{role}</p>
          <p className="max-w-[125px] truncate text-[10px] font-medium text-white">
            {assignments[role]?.title ?? 'Click to select'}
          </p>
        </div>
      </div>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          assignments[role]
            ? 'bg-green-400 shadow-[0_0_8px_#4ade80]'
            : destinationMode === role
              ? 'bg-orange-400'
              : 'bg-gray-600'
        }`}
      />
    </button>
  ))}

  {/* Route points picked by clicking the map */}
  <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
    <div className="mb-1.5 flex items-center gap-1.5">
      <Crosshair size={12} className="text-orange-400" />
      <p className="text-[8px] font-semibold tracking-[1.5px] text-gray-400">
        PICK ON MAP
      </p>
    </div>

    <div className="space-y-1">
      <RoutePointReadout role="Start" point={assignments.Start} />
      <RoutePointReadout role="End" point={assignments.End} />
    </div>

    <div className="mt-1.5 grid grid-cols-2 gap-1">
      <button
        type="button"
        onClick={clearRoutePoints}
        disabled={!assignments.Start && !assignments.End}
        className="rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1.5 text-[10px] font-semibold text-gray-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={calculateFastRoute}
        disabled={
          !assignments.Start || !assignments.End || pathLoading || !!vehicleWarning
        }
        className="flex items-center justify-center gap-1 rounded-lg border border-orange-400/40 bg-orange-400/15 px-2 py-1.5 text-[10px] font-semibold text-orange-200 transition-colors hover:bg-orange-400/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pathLoading ? (
          <>
            <Loader2 size={11} className="animate-spin" /> Calculating…
          </>
        ) : (
          <>
            <Route size={11} /> Calculate
          </>
        )}
      </button>
    </div>

    <p className="mt-1 text-[8px] leading-relaxed text-gray-500">
      1st click sets Start, 2nd sets End, 3rd starts over. Drag S/E to fine-tune.
    </p>
  </div>

  <div className="my-2.5 h-px bg-white/10" />

  {/* Route analytics */}
  <div className="mb-2 flex items-center justify-between" data-tour="route-analytics">
    <div className="flex items-center gap-1.5">
      <Route size={14} className="text-cyan-400" />
      <p className="text-[9px] font-semibold tracking-[1.5px] text-gray-400">
        ROUTE ANALYTICS
      </p>
    </div>
    <span className="text-[8px] text-cyan-400">LIVE · {mode === 'fast' ? 'A' : 'B'}</span>
  </div>

  <div className="grid grid-cols-2 gap-1.5">
    <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.05] p-2">
      <div className="flex items-center gap-1 text-gray-400">
        <Clock3 size={11} />
        <span className="text-[7px]">TIME</span>
      </div>
      <p className="mt-1.5 text-sm font-bold text-cyan-300">
        {activePath ? `${Number(activePath.estimated_time_hours).toFixed(2)} h` : '--'}
      </p>
    </div>

    <div className="rounded-lg border border-orange-400/20 bg-orange-400/[0.05] p-2">
      <div className="flex items-center gap-1 text-gray-400">
        <Route size={11} />
        <span className="text-[7px]">DISTANCE</span>
      </div>
      <p className="mt-1.5 text-sm font-bold text-orange-300">
        {activePath ? `${Number(activePath.route_length_km).toFixed(2)} km` : '--'}
      </p>
    </div>
  </div>

  <div className="my-2.5 h-px bg-white/10" />

  {/* Science Mode */}
  <div className="mb-2 flex items-center justify-between">
    <div className="flex items-center gap-1.5">
      <FlaskConical size={13} className="text-cyan-400" />
      <p className="text-[9px] font-semibold tracking-[1.5px] text-gray-400">
        ROUTE MODE
      </p>
    </div>
    <span className="text-[8px] text-cyan-400">{mode === 'fast' ? 'A' : 'B'}</span>
  </div>

  <div className="grid grid-cols-2 gap-1">
    {(['fast', 'science'] as const).map((option) => (
      <button
        key={option}
        onClick={() => setMode(option)}
        className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-colors ${
          mode === option
            ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200'
            : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07]'
        }`}
      >
        {option === 'fast' ? 'Fast' : 'Science'}
      </button>
    ))}
  </div>

  {mode === 'science' && (
    <div className="mt-2 space-y-1.5">
      {!scienceRoute && !scienceRouteLoading && (
        <p className="text-[9px] text-gray-500">
          Run the science route to compare it with the fast route.
        </p>
      )}
      {WEIGHT_FIELDS.map(({ key, label }) => (
        <label key={key} className="block">
          <span className="flex items-center justify-between text-[9px] text-gray-400">
            <span>{label} weight</span>
            <span className="text-cyan-300">{Math.round(weights[key] * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={weights[key]}
            onChange={(event) =>
              setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))
            }
            aria-label={`${label} weight`}
            className="mt-0.5 h-1 w-full accent-cyan-400"
          />
        </label>
      ))}

      <button
        onClick={calculateScienceRoute}
        disabled={!assignments.Start || !assignments.End || !!vehicleWarning || scienceRouteLoading}
        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-2 py-1.5 text-[10px] font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {scienceRouteLoading ? (
          <>
            <Loader2 size={12} className="animate-spin" /> Calculating…
          </>
        ) : (
          <>
            <FlaskConical size={12} /> Calculate Science Route
          </>
        )}
      </button>

      {(!assignments.Start || !assignments.End) && (
        <p className="text-[9px] text-gray-500">Assign Start and End on the map first.</p>
      )}
      {scienceRouteError && (
        <p className="text-[10px] text-red-400">{scienceRouteError.message}</p>
      )}
      {vehicleWarning && (
        <p className="flex gap-1 text-[9px] text-amber-400">
          <TriangleAlert size={11} className="mt-px shrink-0" />
          {vehicleWarning}
        </p>
      )}
    </div>
  )}

  {/* Route comparison */}
  {(fastPath || scienceRoute) && (
    <div className="mt-2.5" data-tour="route-comparison">
      <p className="mb-1 text-[8px] font-semibold tracking-[1.5px] text-gray-500">
        ROUTE COMPARISON
      </p>
      <div className="space-y-1">
        <button
          onClick={() => setMode('fast')}
          className={`flex w-full items-center justify-between rounded-lg border px-2 py-1 text-left transition-colors ${
            mode === 'fast'
              ? 'border-amber-400/50 bg-amber-400/10'
              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
          }`}
        >
          <span className="flex items-center gap-1.5 text-[9px] text-gray-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            A · Fast
          </span>
          <span className="text-[9px] text-gray-400">
            {fastPath
              ? `${formatDistanceKm(fastPath.route_length_km)} · ${formatHours(fastPath.estimated_time_hours)}`
              : '--'}
          </span>
        </button>

        <button
          onClick={() => setMode('science')}
          className={`flex w-full items-center justify-between rounded-lg border px-2 py-1 text-left transition-colors ${
            mode === 'science'
              ? 'border-cyan-400/50 bg-cyan-400/10'
              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
          }`}
        >
          <span className="flex items-center gap-1.5 text-[9px] text-gray-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            B · Science
          </span>
          <span className="text-[9px] text-gray-400">
            {scienceRoute
              ? `${formatDistanceKm(scienceRoute.route_length_km)} · ${formatHours(scienceRoute.estimated_time_hours)}`
              : scienceRouteLoading
                ? 'Calculating…'
                : 'Not run'}
          </span>
        </button>
      </div>

      {fastPath && scienceRoute && (
        <p className="mt-1 text-[8px] text-gray-500">
          Slope risk · A {RISK_LABEL[getRiskLevel(fastPath.maximum_slope, effectiveMaxSlope)]} ·
          B {RISK_LABEL[getRiskLevel(scienceRoute.maximum_slope, effectiveMaxSlope)]}
        </p>
      )}
    </div>
  )}

  {activePathLoading && (
    <p className="mt-2 text-center text-[10px] text-cyan-300">
      Calculating route…
    </p>
  )}

  {activePathError && (
    <p className="mt-2 text-[10px] text-red-400">{activePathError.message}</p>
  )}
</div>


          {/* Elevation Profile */}
    {assignments.Start && assignments.End && (
    <div data-tour="terrain-profile" className={`absolute bottom-3 right-1/2 mr-1.5 z-[1000] ${MAP_LAYER.panel} glass-panel h-fit w-[min(22.5rem,calc(50vw-0.75rem))] rounded-xl p-3 text-white`}>  <p className="text-[10px] font-semibold tracking-[2px] text-gray-400">
      ELEVATION PROFILE
    </p>
    <span className="text-[9px] text-orange-400">Elevation (m)</span>


{activePath?.path_data?.length ? (
  <ResponsiveContainer width="100%" height={130}>
    <AreaChart
  data={activePath.path_data}
  margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
>
  <defs>
    <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.4} />
      <stop offset="100%" stopColor="#fb923c" stopOpacity={0.02} />
    </linearGradient>
  </defs>

  <linearGradient id="slopeGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
  </linearGradient>

  <CartesianGrid
    stroke="rgba(255,255,255,0.08)"
    strokeDasharray="3 3"
  />

  <XAxis
    dataKey="Distance_km"
    tick={{ fill: '#9ca3af', fontSize: 9 }}
    tickLine={false}
    axisLine={false}
    tickFormatter={(value) => Number(value).toFixed(1)}
  />

  {/* Elevation axis */}
  <YAxis
    yAxisId="elevation"
    tick={{ fill: '#fb923c', fontSize: 9 }}
    tickLine={false}
    axisLine={false}
    domain={['dataMin', 'dataMax']}
    width={38}
  />

  {/* Slope axis */}
  <YAxis
  yAxisId="slope"
  orientation="right"
  tick={{ fill: '#38bdf8', fontSize: 9 }}
  tickLine={false}
  axisLine={false}
  domain={[0, 'auto']}
  width={45}
  label={{
    value: 'SLOPE (°)',
    angle: 90,
    position: 'insideRight',
    fill: '#38bdf8',
    fontSize: 9,
    fontWeight: 600,
    offset: 5,
  }}
/>

  <Tooltip
    contentStyle={{
      background: '#19191d',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '10px',
      color: '#fff',
      fontSize: '11px',
    }}
    labelFormatter={(value) =>
      `Distance: ${Number(value).toFixed(2)} km`
    }
    formatter={(value, name) => [
      `${Number(value).toFixed(1)} ${name === 'Elevation' ? 'm' : '°'}`,
      name,
    ]}
  />

  {/* Elevation */}
  <Area
    yAxisId="elevation"
    type="monotone"
    dataKey="Elevation"
    name="Elevation"
    stroke="#fb923c"
    strokeWidth={1}
    fill="url(#elevationGradient)"
    baseValue="dataMin"
    dot={false}
    activeDot={{ r: 4, fill: '#fb923c', stroke: '#fff' }}
    isAnimationActive={false}
  />

  {/* Slope */}
  <Area
  yAxisId="slope"
  type="monotone"
  dataKey="Slope_Degrees"
  name="Slope"
  stroke="#38bdf8"
  strokeWidth={1}
  fill="url(#slopeGradient)"
  baseValue={0}
  dot={false}
  activeDot={{ r: 4, fill: '#38bdf8', stroke: '#fff' }}
  isAnimationActive={false}
/>
</AreaChart>
  </ResponsiveContainer>
) : (
  <div className="flex h-[130px] items-center justify-center text-[10px] text-gray-500">
    Select start and end points to view terrain
  </div>
)}

<div className="mt-1 flex justify-center text-[9px] text-gray-500">
  <span>Distance (km)</span>
</div>
</div>
)}




{/* Temperature Profile */}
{assignments.Start && assignments.End && (
  <div data-tour="temperature-profile" className={`absolute bottom-3 left-1/2 ml-1.5 z-[1000] ${MAP_LAYER.panel} glass-panel h-fit w-[min(22.5rem,calc(50vw-0.75rem))] rounded-xl p-3 text-white`}>
    <p className="text-[10px] font-semibold tracking-[2px] text-gray-400">
      TEMPERATURE PROFILE
    </p>

    <div className="mt-1 flex gap-4 text-[9px]">
      <span className="text-[#A78BFA]">● Morning</span>
      <span className="text-[#2DD4BF]">● Night</span>
    </div>

    {temperatureData.length > 0 ? (
      <ResponsiveContainer width="100%" height={130}>
        <LineChart
          data={temperatureData}
          margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
        >
          <CartesianGrid
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="distance"
            tick={{ fill: '#9ca3af', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={38}
          />

          <Tooltip
            contentStyle={{
              background: '#19191d',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '11px',
            }}
            labelFormatter={(value) =>
              `Distance: ${Number(value).toFixed(2)} km`
            }
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} K`,
              name,
            ]}
          />

          {/* Morning shadow */}
          <Area
            type="monotone"
            dataKey="morning"
            stroke="none"
            fill="#A78BFA"
            fillOpacity={0.15}
            legendType="none"
            tooltipType="none"
          />

          {/* Night shadow */}
          <Area
            type="monotone"
            dataKey="night"
            stroke="none"
            fill="#2DD4BF"
            fillOpacity={0.15}
            legendType="none"
            tooltipType="none"
          />

          {/* Morning line */}
          <Line
            type="monotone"
            dataKey="morning"
            name="Morning"
            stroke="#A78BFA"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 4 }}
          />

          {/* Night line */}
          <Line
            type="monotone"
            dataKey="night"
            name="Night"
            stroke="#2DD4BF"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-[130px] items-center justify-center text-[10px] text-gray-500">
        Temperature data unavailable
      </div>
    )}

    <div className="mt-1 flex justify-center text-[9px] text-gray-500">
      Distance (km)
    </div>
  </div>
)}


      {/* ── Mineral Composition ── */}
      <div data-tour="mineral-composition" className={`absolute bottom-16 right-4 ${MAP_LAYER.panel}`}>
        <MineralComposition
          h2o={activePath?.mean_H2O ?? null}
          si={activePath?.mean_Si ?? null}
          fe={activePath?.mean_Fe ?? null}
          isLoading={activePathLoading}
        />
      </div>

      {/* ── Error overlay ── */}
      {(error || mapError) && (
        <div
          className={`absolute inset-0 ${MAP_LAYER.map} flex items-center justify-center bg-[#121214] text-red-400`}
        >
          {mapError || (error instanceof Error ? error.message : String(error))}
        </div>
      )}

            {/* Map canvas */}
      <div
        data-tour="map-canvas"
        ref={mapContainerRef}
        aria-label="Interactive Mars map"
        style={{ height: '100%', width: '100%' }}
      />

      {/* Vehicle Selector */}
      <VehiclePanel
        isLoading={vehiclesLoading}
        hasError={!!vehiclesError}
        isEmpty={!vehiclesLoading && !vehiclesError && !vehicles?.length}
      >
        {vehicles?.length ? (
          <VehicleCarousel
            vehicles={vehicles}
            vehicleIndex={vehicleIndex}
            onPrevious={previousVehicle}
            onNext={nextVehicle}
            onSelect={handleVehicleSelect}
          />
        ) : null}
      </VehiclePanel>

      {/* Selected Destination Details */}
      <LocationDetailsPanel
        destination={selectedDestination}
        onClose={closeDetails}
      />
    </div>
  );
}
