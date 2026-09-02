# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start Vite dev server (default http://localhost:5173). The `/items` page needs the backend reachable at `localhost:8080` (via the Vite dev proxy, see `vite.config.js`) — see "Backend" below for how to run it.
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run oxlint (config in `.oxlintrc.json`)
- No test suite/framework is configured in this repo (no test script, no test runner dependency) — this is intentional.

Docker: `docker compose up` builds and runs the `meal-planner` service (nginx serving the built frontend, host port 8090). It joins the external `meal-planner-net` Docker network so its nginx reverse proxy can reach the backend container by name — see "Backend" below.

## Backend

The Kotlin/Spring Boot master-items microservice lives in its own repo:
[ragav24/meal-planner-service](https://github.com/ragav24/meal-planner-service) (was `server/` here
until it was split out, preserving history). This repo has no server-side code of its own.

To run it locally alongside this frontend:

```
docker network create meal-planner-net   # once
docker compose up                        # in the meal-planner-service repo (backend + mongo)
docker compose up                        # in this repo (frontend, host port 8090)
```

Or for `npm run dev`, just get the backend reachable at `localhost:8080` — either
`docker compose up` in the meal-planner-service repo, or `./gradlew bootRun` there against a
locally reachable MongoDB. See that repo's CLAUDE.md for details.

## Architecture

React Router SPA (Vite + React 19) with two routes — `/` (the weekly planner grid) and `/items` (the master items list page) — backed by the separate `meal-planner-service` microservice for the master items list only. The weekly meal-plan grid itself is still `localStorage`-only; there is no server-side persistence for it.

- `src/main.jsx` — entry point; wraps `App` in `BrowserRouter`, imports global CSS (Bootstrap, Font Awesome, `index.css`).
- `src/App.jsx` — shell rendering the header (title + nav linking `/` and `/items`, styled via the shared `.app-btn` classes through `NavLink`'s active-state render prop) and the `<Routes>` for `MealPlanner` and `MasterItemsPage`.
- `src/components/MealPlanner.jsx` — owns the meal plan state (`mealPlan`, shape `{ [day]: { [meal]: string[] } }`) via `useLocalStorage('weeklyMealPlan', ...)`. Renders an `ItemsSidebar` (draggable master items) alongside the day/meal grid built from `DAYS`/`MEALS` constants, passing each cell's items + an `onChange` callback down to `MealBox`, plus `masterItems`/`onCommitItem` (from `useMasterItems`) for autocomplete and drag-drop. `onCommitItem` is bound per-cell to `(text) => addItem(text, meal)` so items added directly in a cell get auto-tagged with that meal's category. Toolbar actions:
  - Print: `window.print()` (print-specific styling relies on `.no-print`, see below).
  - Reset: clears the plan back to an empty grid after a `window.confirm`.
  - Surprise Me (dice icon): fills only *empty* cells, picking randomly per meal from master items tagged for that meal category (`buildFillerQueue` shuffles and avoids same-item repeats across adjacent days). Never overwrites existing entries; alerts if no items are tagged yet.
  - Download: uses `html2canvas` to rasterize the `plannerRef` DOM node into a PNG named `meal-planner_<year>_<month>_week<N>.png`. In the `onclone` callback it hides `.no-print` elements so controls/placeholders don't get baked into the exported image.
  - Share to WhatsApp: on mobile, uses the Web Share API (`navigator.share`) with the rasterized PNG attached plus a text summary — desktop skips straight to a `wa.me` link instead, since desktop `navigator.share` opens the OS-wide share sheet rather than WhatsApp specifically.
  - A week label (`Week N · date range, year`) is computed via ISO 8601 week numbering and shown top-left.
- `src/components/MealBox.jsx` — one cell of the grid. Manages local `draft` state for the "add new item" field and autocomplete state (`openFieldKey`, `highlightedIndex`); the saved items list is otherwise fully controlled by the parent (`items`/`onChange`). Pressing Backspace on an empty item input deletes that item. Every item commit (Enter or blur, on both the draft field and existing item fields, or a drag-drop from `ItemsSidebar`) calls `onCommitItem(text)`. `masterItems` (a plain `string[]`) drives suggestion filtering (case-insensitive `startsWith`, top 6). Is also an HTML5 drop target (`onDragOver`/`onDrop`, `.meal-box-drag-over` highlight) for items dragged from `ItemsSidebar`.
- `src/components/ItemsSidebar.jsx` — left panel listing all master items as draggable pill chips (`.items-sidebar-item`) in a wrapping flow layout (not a fixed one-per-row list, so more items fit), with a filter input. Drag data goes over `text/plain`.
- `src/components/AutocompleteDropdown.jsx` — portaled (via `createPortal` to `document.body`) suggestion list, `position: fixed` and positioned off the anchor input's `getBoundingClientRect()` so it isn't clipped by `.meal-box`'s `overflow-y: auto` or neighboring grid cells. Closes on window scroll; supports mouse and keyboard (arrows/Enter/Escape) selection.
- `src/pages/MasterItemsPage.jsx` — the `/items` page: add/rename/delete UI for the master items list, each row keyed and operated by server-assigned id (not array index). Renaming that collides with another item (case-insensitive) is rejected by the backend; the row silently reverts its local draft rather than showing an error. Each row also has toggleable meal-type tag chips (Breakfast/Lunch/Dinner) via `onToggleTag`/`updateTags`. Reuses the `.manage-items-*`/`.meal-item*` CSS classes.
- `src/hooks/useLocalStorage.js` — generic `useState` + `localStorage` sync hook; swallows read/write errors silently and accepts a lazy function as `initialValue` (evaluated once, like `useState`).
- `src/hooks/useMasterItems.js` — API-backed master items list (talks to `src/api/masterItemsApi.js`, i.e. `GET/POST/PUT/DELETE /api/items` plus `PUT /api/items/{id}/tags`, proxied through nginx/Vite — no CORS handling needed anywhere). On first-ever mount (guarded by a `masterItemsSeeded` localStorage flag), one-time-seeds the backend from whatever distinct items are already present in `weeklyMealPlan`, so existing local data isn't invisible to autocomplete. Exposes `items` (`{id, name, mealTypes}[]`, server-sorted) for `MasterItemsPage`/`MealPlanner`, and a derived `masterItemNames` (plain `string[]`) for `MealBox`/`ItemsSidebar`. `addItem(name, mealType?)` is fire-and-forget (matches `MealBox`'s uncoupled commit call) and, when `mealType` is given, also tags the item with it if not already tagged; `updateItem`/`removeItem`/`updateTags` are awaited by callers that need the result (rename conflict handling, tag toggle UI).
- `src/api/masterItemsApi.js` — thin `fetch` wrapper for the `/api/items` REST contract; throws on non-OK responses with `.status`/`.body` attached.
- `src/constants.js` — the only place `DAYS` and `MEALS` are defined; `MEALS` values (`"Breakfast"`/`"Lunch"`/`"Dinner"`) double as the meal-type tag vocabulary.

### Infra

- `nginx.conf` — used by the frontend's production Docker image; reverse-proxies `/api/` to `items-service:8080` (Docker network DNS — see "Backend" above for how that container gets on the same network) and falls back to `index.html` for React Router's client-side routes.
- `vite.config.js` — dev-server proxy for `/api` → `http://localhost:8080`, mirroring nginx's role for `npm run dev`.
- `docker-compose.yml` — just the `meal-planner` service (nginx + built frontend), joined to the external `meal-planner-net` network.
