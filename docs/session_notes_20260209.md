> This document was authored with the assistance of an AI coding agent (Claude claude-4.6-opus, via Cursor).

# Session Notes -- World Time Clock Build

## What Was Built

A 24-hour analog world time clock as a static web app, inspired by a watch face reference image. Deployed to GitHub Pages.

**Live URL:** <a href="https://sugarsmax.github.io/World_time_24hr/" target="_blank">https://sugarsmax.github.io/World_time_24hr/</a>  
**Repo:** <a href="https://github.com/sugarsmax/World_time_24hr" target="_blank">https://github.com/sugarsmax/World_time_24hr</a>

## Design

- Circular 24-hour dial: noon at top, midnight at bottom
- Top half cream (day), bottom half dark (night), split at the 6am/6pm horizontal line
- 5 city hands radiating from center, with city names as rotated labels along each hand
- Hands adapt colour: dark strokes on the light half, light strokes on the dark half (canvas clipping)
- Portland hand highlighted in blue as the "home" city
- Sun icon in the day half, crescent moon in the night half
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
- **Adaptive hand colours:** Each hand is drawn twice using `ctx.clip()` -- once clipped to the top half (dark colour) and once to the bottom half (light colour)
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

---

> Footer: Built with Claude claude-4.6-opus via Cursor IDE.
