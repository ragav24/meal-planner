# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start Vite dev server (default http://localhost:5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run oxlint (config in `.oxlintrc.json`)
- No test suite/framework is configured in this repo (no test script, no test runner dependency).
- Docker: `docker compose up` builds via `Dockerfile` (multi-stage: Vite build → nginx) and serves on host port 8090 (see `docker-compose.yml`).

## Architecture

Single-page React app (Vite + React 19, no router, no backend/API) that renders a 7-day x 3-meal grid and persists it to `localStorage`. There is no server-side or global state store — everything flows through one piece of state owned by `MealPlanner`.

- `src/main.jsx` — entry point; imports global CSS (Bootstrap, Font Awesome, `index.css`) and mounts `App`.
- `src/App.jsx` — trivial shell rendering the header and `MealPlanner`.
- `src/components/MealPlanner.jsx` — owns the entire meal plan state (`mealPlan`, shape `{ [day]: { [meal]: string[] } }`) via `useLocalStorage('weeklyMealPlan', ...)`. Renders the day/meal grid from `DAYS`/`MEALS` constants and passes each cell's items + an `onChange` callback down to `MealBox`. Also implements the three toolbar actions:
  - Print: `window.print()` (print-specific styling relies on `.no-print` class, see below).
  - Reset: clears the plan back to an empty grid after a `window.confirm`.
  - Download: uses `html2canvas` to rasterize the `plannerRef` DOM node into a PNG. In the `onclone` callback it hides `.no-print` elements so add/remove controls and placeholder text don't get baked into the exported image — this same class is reused for the print stylesheet, so treat it as a shared "not part of the artifact" convention when adding new UI to the grid.
- `src/components/MealBox.jsx` — one cell of the grid. Manages its own local `draft` input state for the "add new item" field, but the actual list of items is fully controlled by the parent (`items`/`onChange` props) — this component holds no source-of-truth state for saved items. Notable UX detail: pressing Backspace on an empty item input deletes that item (`handleItemKeyDown`).
- `src/hooks/useLocalStorage.js` — generic `useState` + `localStorage` sync hook; swallows read/write errors silently (e.g. private browsing) and falls back to the passed-in initial value.
- `src/constants.js` — the only place `DAYS` and `MEALS` are defined; both `MealPlanner`'s empty-plan shape and its rendering loop derive from these arrays, so adding/reordering a day or meal type only requires editing this file.

No API layer, no routing, no test infrastructure — the entire app is these five files plus global CSS/Bootstrap.
