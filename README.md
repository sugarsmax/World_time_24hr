> This page was authored with the assistance of an AI coding agent (Claude claude-4.6-opus, via Cursor).

# World Time Clock

A 24-hour analog world clock rendered on HTML5 Canvas. The clock face is split into
day (light) and night (dark) halves, with hands for five cities that adapt colour
based on which half they fall in.

## Cities

| City        | Timezone             | Note             |
| ----------- | -------------------- | ---------------- |
| Portland    | America/Los_Angeles  | Home (blue hand) |
| Boston      | America/New_York     |                  |
| London      | Europe/London        |                  |
| Pune        | Asia/Kolkata         |                  |
| Manila      | Asia/Manila          |                  |

## Usage

Open `docs/index.html` in any modern browser, or serve locally:

```bash
cd docs
python3 -m http.server 8765
# then open http://localhost:8765
```

No build step or dependencies required.

## GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings > Pages**.
3. Under **Source**, select **Deploy from a branch**.
4. Set branch to `main` and folder to `/docs`.
5. Save. The clock will be live at `https://<username>.github.io/World_time_24hr/`.

## How It Works

- **24-hour dial**: Noon at top, midnight at bottom, 6 pm at right, 6 am at left.
- **Day/night halves**: Top semicircle is cream (daytime), bottom is dark (nighttime).
- **Adaptive hands**: Each hand draws in a dark colour on the light half and a light
  colour on the dark half, achieved via canvas clipping.
- **Time calculation**: Uses `Intl.DateTimeFormat` with IANA timezone names, which
  handles DST transitions automatically.
- **Smooth animation**: Redraws every frame via `requestAnimationFrame`.

## Files

```
docs/
  index.html   -- Page shell, canvas element, minimal CSS
  clock.js     -- All clock rendering and time logic
  .nojekyll    -- Prevents GitHub Pages Jekyll processing
```

---

> Footer: Built with Claude claude-4.6-opus via Cursor IDE.
