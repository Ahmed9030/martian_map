'use client';

import { useMapData } from '@/hooks/useMapData';
import { usePath } from '@/hooks/usePath';
import { useVehicles } from '@/hooks/useVehicles';
import { getRevisitFlight, vehicleToPathParams } from '@/lib/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Orbit,
  MapPin,
  Flag,
  FlaskConical,
  Clock3,
  Route,
  Crosshair,
  Loader2,
  TriangleAlert,
} from 'lucide-react';


import type { LeafletMap, Layer } from 'leaflet';

import { LocationDetailsPanel } from './map/LocationDetailsPanel';
import { VehicleCarousel } from './map/VehicleCarousel';
import { VehiclePanel } from './map/VehiclePanel';
import { MAP_LAYER } from './map/layers';
import { useMapSelection } from './map/useMapSelection';
import type { DestinationRole } from './map/useMapSelection';
import type { Vehicle } from '@/lib/api';
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

const RISK_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

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

        const coordinates = data!.coordinates;

        if (
          !Array.isArray(coordinates) ||
          coordinates.length < 4 ||
          !coordinates[1] ||
          !coordinates[3]
        ) {
          throw new Error('Invalid map coordinates received.');
        }

        const bounds: [[number, number], [number, number]] = [
          [coordinates[3][1], coordinates[3][0]],
          [coordinates[1][1], coordinates[1][0]],
        ];

        if (!bounds.flat().every(Number.isFinite)) {
          throw new Error('Map coordinates are not valid numbers.');
        }

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
        });
        const overlay = L.imageOverlay(selectedMap == 1 ? "/maps/TharsisMap.png" : "/maps/jezeroMap.png", bounds);

       
const markersLayer = L.layerGroup().addTo(map);
routeLayerRef.current = L.layerGroup().addTo(map);

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

if (Array.isArray(data!.destination)) {
  data!.destination.forEach((destination) => {
    const x = Number(destination.x_coord);
    const y = Number(destination.y_coord);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const marker = L.marker([y, x], {
      icon: createDestinationIcon('#facc15'),
    });

    marker.destinationRole = null;

    marker.bindTooltip(destination.title, {
      direction: 'top',
      offset: [0, -8],
    });

    marker.on('click', () => {
      const role = destinationModeRef.current;
      const color = ROLE_COLORS[role];

      markersLayer.eachLayer((layer: Layer) => {
        if (
          layer instanceof L.Marker &&
          layer.destinationRole === role
        ) {
          layer.destinationRole = null;
          layer.setIcon(createDestinationIcon('#facc15'));
        }
      });

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

  // ── Science route validity ─────────────────────────────────────────────
  const scienceSignature = JSON.stringify([
    assignments.Start?.id ?? assignments.Start?.x_coord ?? null,
    assignments.End?.id ?? assignments.End?.x_coord ?? null,
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

      const toLatLngs = (route: typeof pathData) =>
        (route?.path_data ?? [])
          .map(
            (point) =>
              [Number(point.Y_coordinate), Number(point.X_coordinate)] as [
                number,
                number,
              ],
          )
          .filter(([y, x]) => Number.isFinite(y) && Number.isFinite(x));

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

// The charts and analytics always describe the route the astronaut is viewing.
const activePath = mode === 'science' ? scienceRoute : pathData;
const activePathLoading = mode === 'science' ? scienceRouteLoading : pathLoading;
const activePathError = mode === 'science' ? scienceRouteError : pathError;

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
      className="relative isolate w-full"
      style={{ height: 'calc(113vh - 80px)', minHeight: '0' }}
    >
      {/* ── Top bar: Map toggle ── */}
      <div
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

     
{/* ── Left panel: Destinations + Route analytics ── */}
<div
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

  <div className="my-2.5 h-px bg-white/10" />

  {/* Route analytics */}
  <div className="mb-2 flex items-center justify-between">
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
  {(pathData || scienceRoute) && (
    <div className="mt-2.5">
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
            {pathData
              ? `${formatDistanceKm(pathData.route_length_km)} · ${formatHours(pathData.estimated_time_hours)}`
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

      {pathData && scienceRoute && (
        <p className="mt-1 text-[8px] text-gray-500">
          Slope risk · A {RISK_LABEL[getRiskLevel(pathData.maximum_slope, effectiveMaxSlope)]} ·
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
    <div className={`absolute bottom-3 right-1/2 mr-1.5 z-[1000] ${MAP_LAYER.panel} glass-panel h-fit w-[min(22.5rem,calc(50vw-0.75rem))] rounded-xl p-3 text-white`}>  <p className="text-[10px] font-semibold tracking-[2px] text-gray-400">
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
  <div className={`absolute bottom-3 left-1/2 ml-1.5 z-[1000] ${MAP_LAYER.panel} glass-panel h-fit w-[min(22.5rem,calc(50vw-0.75rem))] rounded-xl p-3 text-white`}>
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
      <MineralComposition
        h2o={activePath?.mean_H2O ?? null}
        si={activePath?.mean_Si ?? null}
        fe={activePath?.mean_Fe ?? null}
        isLoading={activePathLoading}
        className={`absolute bottom-16 right-4 ${MAP_LAYER.panel}`}
      />

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
