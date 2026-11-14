import type { TourStep } from './types';

/**
 * Tour content. Edit, reorder or add steps here — no component changes needed.
 *
 * - `targets` are `data-tour` selectors; the first one that is visible wins.
 * - Steps whose targets are missing are skipped automatically, so panels that
 *   are planned but not built yet (Layers, Environmental Conditions) stay in
 *   the config without breaking the tour.
 * - Steps without targets render as a centered card.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'map',
    targets: ['[data-tour="map-canvas"]'],
    title: 'Explore the Martian surface',
    description:
      'Drag to pan and use the zoom controls to get closer. A click anywhere on the map drops your next Start or End point.',
    placement: 'bottom',
  },
  {
    id: 'layers',
    targets: ['[data-tour="layers-panel"]'],
    title: 'Turn layers on and off',
    description:
      'Satellite imagery, elevation, slope, terrain hazards and science targets can each be shown or hidden.',
    placement: 'right',
  },
  {
    id: 'vehicle',
    targets: ['[data-tour="vehicle-panel"]', '[data-tour="vehicle-launcher"]'],
    title: 'Choose your vehicle',
    description:
      'Each vehicle has its own speed, slope, temperature and wind limits. Pick one that can survive the route.',
    placement: 'left',
    interactive: true,
  },
  {
    id: 'start-end',
    targets: ['[data-tour="destinations-panel"]'],
    title: 'Set a Start and an End',
    description:
      'Select Start, click the map, then do the same for End. Try the example below to see a full route in seconds.',
    placement: 'right',
    interactive: true,
    action: 'demo',
  },
  {
    id: 'route-comparison',
    targets: ['[data-tour="route-comparison"]'],
    title: 'Compare your routes',
    description:
      'Route A is the fast path, Route B optimises science. Check distance, time and slope risk before you commit.',
    placement: 'right',
  },
  {
    id: 'terrain-profile',
    targets: ['[data-tour="terrain-profile"]'],
    title: 'Read the terrain profile',
    description:
      'Orange is elevation, cyan is slope. Hover the chart to inspect any point, and the temperature chart follows the same distance.',
    placement: 'top',
  },
  {
    id: 'minerals',
    targets: ['[data-tour="mineral-composition"]'],
    title: 'Science mode',
    description:
      'Water, silicon and iron show how scientifically valuable the route is. Raise a weight in science mode to favour it.',
    placement: 'left',
  },
  {
    id: 'environment',
    targets: ['[data-tour="environmental-conditions"]'],
    title: 'Environmental conditions',
    description:
      'Temperature, wind and radiation along the way tell you whether the rover can operate safely.',
    placement: 'left',
  },
  {
    id: 'finish',
    title: "You're ready to explore",
    description:
      'Replay this tour anytime from the (?) button in the navigation. Now go plan a mission.',
  },
];
