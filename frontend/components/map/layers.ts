/** Shared map stacking order: map < panels < top bar < modal. */
export const MAP_LAYER = {
  map: 'z-[1000]',
  panel: 'z-[1100]',
  topBar: 'z-[9000]',
  modal: 'z-[9999]',
} as const;
