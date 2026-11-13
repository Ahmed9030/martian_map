declare module 'leaflet' {
  export interface Layer {
    addTo(map: unknown): this;
    remove(): this;
    clearLayers(): this;
    eachLayer(fn: (layer: Layer) => void): this;
    setStyle(style: Record<string, unknown>): this;
    bindTooltip(content: string, options?: Record<string, unknown>): this;
    bindPopup(content: string): { openPopup: () => void };
    on(event: string, fn: () => void): this;
    destinationRole?: string | null;
  }

  export interface LeafletMap {
    on(event: 'click', fn: (event: { originalEvent: MouseEvent }) => void): this;
    invalidateSize(animate?: boolean): void;
    setView(center: [number, number], zoom: number): this;
    remove(): void;
  }

  const L: {
    CRS: { Simple: unknown };
    map(element: HTMLElement | null, options?: Record<string, unknown>): LeafletMap;
    imageOverlay(
      url: string,
      bounds: [[number, number], [number, number]],
    ): Layer & { once(event: string, fn: () => void): void };
    layerGroup(): Layer;
    circleMarker(latlng: [number, number], options?: Record<string, unknown>): Layer;
    polyline(latlngs: [number, number][], options?: Record<string, unknown>): Layer;
  };

  export default L;
}
