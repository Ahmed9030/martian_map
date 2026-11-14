// Minimal local typings for the subset of Leaflet used by components/Map.tsx.
// Leaflet ships without TypeScript declarations and the project does not
// depend on @types/leaflet, so the surface we use is declared here.
declare module "leaflet" {
  export interface Layer {
    addTo(map: unknown): this;
    remove(): this;
    clearLayers(): this;
    eachLayer(fn: (layer: Layer) => void): this;
    setStyle(style: Record<string, unknown>): this;
    bindTooltip(content: string, options?: Record<string, unknown>): this;
    bindPopup(content: string): Marker;
    openPopup(): this;
    on(event: string, fn: (event?: unknown) => void): this;
    once(event: string, fn: () => void): this;
    setIcon(icon: unknown): this;
    /** SVG element of a vector layer, once it is on the map. */
    getElement(): Element | undefined;
    destinationRole?: string | null;
  }

  export interface Marker extends Layer {
    bindPopup(content: string): Marker;
    setLatLng(latlng: [number, number]): this;
    getLatLng(): { lat: number; lng: number };
  }

  export interface LeafletMap {
    on(
      event: "click",
      fn: (event: { latlng: { lat: number; lng: number }; originalEvent: MouseEvent }) => void,
    ): this;
    on(event: string, fn: (...args: never[]) => void): this;
    invalidateSize(animate?: boolean): void;
    setView(
      center: [number, number],
      zoom: number,
      options?: { animate?: boolean },
    ): this;
    remove(): void;
    getSize(): { x: number; y: number };
    containerPointToLatLng(point: [number, number]): [number, number];
    distance(a: [number, number], b: [number, number]): number;
  }

  export interface ControlInstance {
    addTo(map: LeafletMap): ControlInstance;
    getContainer(): HTMLElement;
  }

  export class Control implements ControlInstance {
    constructor(options?: Record<string, unknown>);
    options: Record<string, unknown>;
    static extend(
      props: Record<string, unknown>,
    ): new (options?: Record<string, unknown>) => ControlInstance;
    addTo(map: LeafletMap): ControlInstance;
    getContainer(): HTMLElement;
  }

  export interface DomUtil {
    create(
      tagName: string,
      className?: string,
      container?: HTMLElement,
    ): HTMLElement;
  }

  export interface DomEvent {
    disableClickPropagation(element: HTMLElement): void;
    on(element: HTMLElement, type: string, fn: (event: Event) => void): void;
    preventDefault(event: Event): void;
  }

  export interface Icon {
    options: Record<string, unknown>;
  }

  const L: {
    CRS: { Simple: unknown };
    Control: typeof Control;
    DomUtil: DomUtil;
    DomEvent: DomEvent;
    Marker: { new (...args: unknown[]): Marker };
    map(
      element: HTMLElement | null,
      options?: Record<string, unknown>,
    ): LeafletMap;
    imageOverlay(
      url: string,
      bounds: [[number, number], [number, number]],
    ): Layer & { once(event: string, fn: () => void): void };
    layerGroup(): Layer;
    marker(latlng: [number, number], options?: Record<string, unknown>): Marker;
    circleMarker(
      latlng: [number, number],
      options?: Record<string, unknown>,
    ): Layer;
    polyline(
      latlngs: [number, number][],
      options?: Record<string, unknown>,
    ): Layer;
    divIcon(options: Record<string, unknown>): Icon;
    control: {
      zoom(options?: Record<string, unknown>): ControlInstance;
    };
  };

  export default L;
}
