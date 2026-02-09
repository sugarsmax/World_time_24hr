> This document was authored with the assistance of an AI coding agent (Claude claude-4.6-opus, via Cursor).

# Session Notes -- World Time Clock Build

## What Was Built

A 24-hour analog world time clock as a static web app, inspired by a watch face reference image. Deployed to GitHub Pages.

**Live URL:** <a href="https://sugarsmax.github.io/World_time_24hr/" target="_blank">https://sugarsmax.github.io/World_time_24hr/</a>  
**Repo:** <a href="https://github.com/sugarsmax/World_time_24hr" target="_blank">https://github.com/sugarsmax/World_time_24hr</a>

## Design

- Circular 24-hour dial: noon at top, midnight at bottom
- Day/night regions as a pie-slice wedge based on actual Portland sunrise/sunset times (NOAA solar equations), not a fixed 6am/6pm split
- 5 city hands radiating from center, with city names as rotated labels along each hand
- Hands adapt colour: dark strokes on the day wedge, light strokes on the night wedge (canvas arc-clipping)
- Portland hand highlighted in blue as the "home" city
- Sun icon at the midpoint of the day arc, crescent moon at the midpoint of the night arc
- Hour numbers (1-12, repeated twice) and tick marks around the edge
- Smooth `requestAnimationFrame` animation, retina-aware, responsive

## Cities and Timezones

| City        | IANA Timezone       |
| ----------- | ------------------- |
| Portland, OR | America/Los_Angeles |
| Boston, MA   | America/New_York    |
| London       | Europe/London       |
| Pune, India  | Asia/Kolkata        |
| Manila       | Asia/Manila         |

## Tech Stack

- Pure HTML5 + Canvas + vanilla JS -- zero dependencies
- Time zones handled via `Intl.DateTimeFormat` with IANA names (DST-aware automatically)
- GitHub Pages deployment from `/docs` folder

## File Structure

```
World_time_24hr/
  .gitignore
  README.md
  docs/
    index.html      -- Page shell, canvas element, minimal CSS
    clock.js        -- All rendering and time logic (~220 lines)
    .nojekyll       -- Prevents GitHub Pages Jekyll processing
```

## Key Implementation Details

- **Angle math:** `hoursSinceNoon * 15 - 90` degrees maps 24-hour time to canvas angles (noon = top)
- **Sunrise/sunset:** NOAA Solar Calculator equations compute sunrise and sunset for Portland's lat/lng (45.52 N, 122.68 W) using Julian Day, solar declination, equation of time, and hour-angle formulas. Recomputed hourly; DST-aware via `Intl` UTC-offset detection.
- **Night wedge:** The dark region is a pie-slice arc from the sunset angle clockwise through midnight to the sunrise angle, rather than a fixed semicircle. The wedge shifts with the seasons -- wider in winter, narrower in summer.
- **Adaptive hand colours:** Each hand is drawn twice using `ctx.clip()` -- once clipped to the day wedge (dark colour) and once to the night wedge (light colour)
- **Label readability:** Labels rotate with the hand angle, but flip 180 degrees when pointing left so text is never upside-down (`if (Math.cos(angle) < 0) angle += Math.PI`)
- **City config** is a simple array at the top of `clock.js` -- easy to add/remove/reorder cities

## How to Edit Cities

Open `docs/clock.js` and modify the `CITIES` array at the top:

```javascript
const CITIES = [
    { name: 'PORTLAND',  tz: 'America/Los_Angeles', home: true  },
    { name: 'BOSTON',    tz: 'America/New_York',    home: false },
    // ...
];
```

Set `home: true` on whichever city should get the blue accent hand.

## Deployment Notes

- GitHub Pages configured to deploy from `main` branch, `/docs` folder
- First deploy failed (transient GitHub access error on freshly-public repo) -- resolved by pushing a second commit
- Changes auto-deploy on push to `main`

## Potential Next Steps (not started)

- Add digital time readout on hover or below the clock
- Add/remove cities dynamically via a settings panel
- Wrap as a macOS menubar app or Electron desktop widget
- Add subtle transition animation at the day/night boundary
- Make home location configurable (currently hardcoded to Portland, OR)

---

> Footer: Built with Claude claude-4.6-opus via Cursor IDE.
