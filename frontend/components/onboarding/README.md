# Map onboarding tour

A first-visit, spotlight-style tour for `/map`. It is data driven, persisted per
browser and rendered in a portal above the map, its Leaflet controls and the
navbar.

## Files

| File | Responsibility |
| --- | --- |
| `OnboardingProvider.tsx` | Phase state (`closed` / `welcome` / `tour`), step navigation, demo state, toast, portals. Wrap the page with `<OnboardingProvider>`. |
| `OnboardingWelcome.tsx` | Centered glass modal: Start the tour / Skip, let me explore + "Don't show this again". |
| `TourOverlay.tsx` | Dim + spotlight cutout, pulse ring, keyboard shortcuts (→ / ← / Esc). |
| `TourTooltip.tsx` | Tooltip card / bottom sheet, progress, Back / Next / Skip, demo results, focus trap. |
| `steps.ts` | The tour content (one object per step). |
| `useOnboardingState.ts` | localStorage persistence (`martian-map:onboarding`, version 1) in a small external store. |
| `tourTargets.ts` | Resolves a step's target and reports whether the step can be shown. |
| `demoData.ts` | Fallback sample route, risk summary helpers, vehicle guard. |
| `TourHelpButton.tsx` | The persistent (?) button that replays the tour (rendered by `Navbar` on `/map`). |

## When the welcome appears

- **Guests (no profile token):** the welcome shows on every page load. Nothing is
  stored, so there is no "Don't show this again" checkbox.
- **Signed-in visitors:** it shows once per profile token and is then remembered
  in `localStorage` (`martian-map:onboarding`, with the `user` field). Logging in
  with another token (or logging out) makes it appear again.

## Placement rules

The card is always clamped inside the visible viewport (`visualViewport`): 12px
margins, bottom sheets 36px above the bottom edge and capped at 62% of the
height, plus a post-render safety clamp. Only the text/demo area scrolls, so
Back / Next / Done stay pinned and reachable.

## Adding or editing a step

1. Put a `data-tour="my-panel"` attribute on the element you want to highlight
   (see `components/Map.tsx` for examples).
2. Add an entry to `TOUR_STEPS` in `steps.ts`:

```ts
{
  id: 'my-panel',
  targets: ['[data-tour="my-panel"]'], // first visible match wins
  title: 'Short title',
  description: 'One or two sentences.',
  placement: 'auto', // or top | bottom | left | right
  interactive: false, // true lets clicks reach the spotlit element
  action: undefined, // 'demo' renders the "Try an example" panel
}
```

Steps are skipped automatically while their targets are not rendered (for
example the Route Comparison panel only exists once a route has been
calculated). Steps without `targets` render as a centered card, like `finish`.

Bump `ONBOARDING_VERSION` in `useOnboardingState.ts` to show the tour again to
everyone after meaningful changes.

## Demo scenario

The "Try an example" action calls `runScenario()` registered by `Map.tsx`
(`registerMapController`). The map places Start/End markers, requests
`GET /path/` with the first valid vehicle from `GET /vehicles/` and the first two
destinations from `GET /map/`, and never records a visit (`record=0`). If the
request fails or takes longer than 9 s, `createSamplePath()` provides a labelled
"Sample data" route. Closing the tour aborts the request and restores the map.
