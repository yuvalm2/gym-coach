# Gym Coach

A local-first **mobile PWA** that plans and tracks machine-based gym workouts across multiple gyms.

It separates three things:
- **Muscles** — a fixed taxonomy.
- **Exercises/machines** — each mapped to primary/secondary muscles, with *complexity* and *joint-load* tags plus safety *mitigation cues*.
- **Gyms** — each holds the subset of machines actually available there.

Your **plan targets muscles, not machines**. At workout time you pick a gym and the app resolves each
movement-pattern slot to an *available* machine there, **rotating** away from what you used last visit —
filtered to your joint-care and complexity limits, and occasionally introducing a new joint-friendly option.

## Run it

It's a no-build static PWA. Serve the folder over HTTP (a service worker needs `https` or `localhost`):

```bash
cd C:\code\gym-coach
python -m http.server 8000
```

Then open **http://localhost:8000** on your computer.

## Install on your phone

**Live deployment: <https://yuvalm2.github.io/gym-coach/>** — deploying an update is just
`git push` (GitHub Pages rebuilds in ~1 minute; the network-first service worker picks the
new version up on the next online launch).

A real install (standalone window + offline) requires a **secure origin**: `localhost` or any
HTTPS host. Over plain-HTTP LAN IP the app only runs as a browser tab — no service worker,
no install prompt. On the HTTPS URL above:

- **Android Chrome**: menu → *Add to Home screen → Install*.
- **iOS Safari**: share sheet → *Add to Home Screen*.

Workout data lives in IndexedDB **per origin** — settle on the long-term URL before logging
history, or move it later with Profile → Export/Import.

Updates: the service worker is network-first, so any deployed change is picked up on the next
online launch; offline it falls back to the cached app (worst case after a 3 s timeout).

## Screens

- **Today** — pick a gym → generated session (supersets/finisher tuned to your goal) → log sets/reps/weight → *Finish & save*. Tap **↻ swap** to cycle alternatives.
- **Gyms** — add a gym (pre-filled with common machines), tick what's available, ★ favourite / 🚫 avoid any exercise, add a custom machine — or **photograph one**: *Add by photo* sends the picture to Claude, which matches it against the catalog or drafts a fully tagged entry (muscles, complexity, joint load + mitigation cue) for you to review and accept.
- **History** — past sessions, expandable.
- **Profile** — goal *(configurable)*, days/week, variety, joint handling, knee/back/shoulder care, complexity. Export/Import a JSON backup (photos excluded). Holds your **Anthropic API key** for photo ID — stored only in this device's IndexedDB, sent only to api.anthropic.com (browser-direct, no middle server).

## Default profile (all editable in-app)

The app ships tuned for cautious machine-based training: weight loss / conditioning · 3 days/week · gradual variety · joint-friendly + cues · knee & lower-back care · avoid complex lifts.

## Files

| File | Role |
|------|------|
| `index.html` | App shell + bottom nav |
| `styles.css` | Mobile-first dark theme |
| `db.js` | IndexedDB wrapper (meta / gyms / sessions / exercises) |
| `library.js` | Built-in tagged exercise catalog (`MUSCLES`, `PATTERNS`, `LIBRARY`) |
| `engine.js` | Goal presets, day templates, session generator |
| `identify.js` | Photo → machine ID via the Claude API (`claude-opus-4-8`, strict-JSON output; SDK loaded on demand from jsDelivr) |
| `app.js` | UI, state, event wiring |
| `sw.js` | Offline cache (network-first with cache fallback) |
| `tools/make_icons.py` | Regenerates the icon set (stdlib only) |

## Roadmap

- Progress charts; rest timer; weekly volume per muscle.
- Optional cloud sync.
