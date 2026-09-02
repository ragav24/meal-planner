# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Frontend:
- `npm install` — install dependencies
- `npm run dev` — start Vite dev server (default http://localhost:5173). The `/items` page needs the backend reachable at `localhost:8080` (via its Vite dev proxy, see `vite.config.js`) — run `docker compose up mongo items-service` first, or `cd server && ./gradlew bootRun` against a locally reachable MongoDB.
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run oxlint (config in `.oxlintrc.json`)
- No test suite/framework is configured in this repo (no test script, no test runner dependency) — this is intentional, and extends to the backend too (no JVM test framework either).

Backend (`server/`):
- `cd server && ./gradlew bootRun` — run the Kotlin/Spring Boot service standalone on port 8080 (needs MongoDB reachable at `mongodb://localhost:27017/mealplanner` by default, override via `MONGODB_URI`).
- `cd server && ./gradlew bootJar` — build the runnable jar.

Docker: `docker compose up` builds and runs three services — `meal-planner` (nginx serving the built frontend, host port 8090), `items-service` (the Kotlin backend, host port 8080), and `mongo` (MongoDB, data in a named volume). The nginx container reverse-proxies `/api/` to `items-service` and falls back to `index.html` for unknown paths so client-side routes resolve on direct load/refresh (see `nginx.conf`).

## Architecture

React Router SPA (Vite + React 19) with two routes — `/` (the weekly planner grid) and `/items` (the master items list page) — backed by a Kotlin/Spring Boot microservice for the master items list only. The weekly meal-plan grid itself is still `localStorage`-only; there is no server-side persistence for it.

### Frontend

- `src/main.jsx` — entry point; wraps `App` in `BrowserRouter`, imports global CSS (Bootstrap, Font Awesome, `index.css`).
- `src/App.jsx` — shell rendering the header (title + nav linking `/` and `/items`, styled via the shared `.app-btn` classes through `NavLink`'s active-state render prop) and the `<Routes>` for `MealPlanner` and `MasterItemsPage`.
- `src/components/MealPlanner.jsx` — owns the meal plan state (`mealPlan`, shape `{ [day]: { [meal]: string[] } }`) via `useLocalStorage('weeklyMealPlan', ...)`. Renders the day/meal grid from `DAYS`/`MEALS` constants, passing each cell's items + an `onChange` callback down to `MealBox`, plus `masterItems`/`onCommitItem` (from `useMasterItems`) for autocomplete. Toolbar actions:
  - Print: `window.print()` (print-specific styling relies on `.no-print`, see below).
  - Reset: clears the plan back to an empty grid after a `window.confirm`.
  - Download: uses `html2canvas` to rasterize the `plannerRef` DOM node into a PNG named `meal-planner_<year>_<month>_week<N>.png`. In the `onclone` callback it hides `.no-print` elements so controls/placeholders don't get baked into the exported image.
  - Share to WhatsApp: on mobile, uses the Web Share API (`navigator.share`) with the rasterized PNG attached plus a text summary — desktop skips straight to a `wa.me` link instead, since desktop `navigator.share` opens the OS-wide share sheet rather than WhatsApp specifically.
  - A week label (`Week N · date range, year`) is computed via ISO 8601 week numbering and shown top-left.
- `src/components/MealBox.jsx` — one cell of the grid. Manages local `draft` state for the "add new item" field and autocomplete state (`openFieldKey`, `highlightedIndex`); the saved items list is otherwise fully controlled by the parent (`items`/`onChange`). Pressing Backspace on an empty item input deletes that item. Every item commit (Enter or blur, on both the draft field and existing item fields) calls `onCommitItem(text)`, which `MealPlanner` wires to `useMasterItems`'s `addItem` — typing directly into the grid keeps the master items list in sync. `masterItems` (a plain `string[]`) drives suggestion filtering (case-insensitive `startsWith`, top 6).
- `src/components/AutocompleteDropdown.jsx` — portaled (via `createPortal` to `document.body`) suggestion list, `position: fixed` and positioned off the anchor input's `getBoundingClientRect()` so it isn't clipped by `.meal-box`'s `overflow-y: auto` or neighboring grid cells. Closes on window scroll; supports mouse and keyboard (arrows/Enter/Escape) selection.
- `src/pages/MasterItemsPage.jsx` — the `/items` page: add/rename/delete UI for the master items list, each row keyed and operated by server-assigned id (not array index). Renaming that collides with another item (case-insensitive) is rejected by the backend; the row silently reverts its local draft rather than showing an error. Reuses the `.manage-items-*`/`.meal-item*` CSS classes.
- `src/hooks/useLocalStorage.js` — generic `useState` + `localStorage` sync hook; swallows read/write errors silently and accepts a lazy function as `initialValue` (evaluated once, like `useState`).
- `src/hooks/useMasterItems.js` — API-backed master items list (talks to `src/api/masterItemsApi.js`, i.e. `GET/POST/PUT/DELETE /api/items`, proxied through nginx/Vite — no CORS handling needed anywhere). On first-ever mount (guarded by a `masterItemsSeeded` localStorage flag), one-time-seeds the backend from whatever distinct items are already present in `weeklyMealPlan`, so existing local data isn't invisible to autocomplete. Exposes `items` (`{id, name}[]`, server-sorted) for `MasterItemsPage`, and a derived `masterItemNames` (plain `string[]`) for `MealBox`. `addItem` is fire-and-forget (matches `MealBox`'s uncoupled commit call); `updateItem`/`removeItem` are awaited by callers that need the result (rename conflict handling).
- `src/api/masterItemsApi.js` — thin `fetch` wrapper for the `/api/items` REST contract; throws on non-OK responses with `.status`/`.body` attached.
- `src/constants.js` — the only place `DAYS` and `MEALS` are defined.

### Backend — `server/` (Kotlin + Spring Boot + MongoDB)

A standalone microservice, its own Gradle project (Kotlin DSL), persisting only the master items list. No test framework, by deliberate extension of the frontend's no-test-suite convention.

- `MasterItem` (`item/MasterItem.kt`) — Mongo document: `id`, `name` (display casing), `normalizedName` (lowercased, `@Indexed(unique = true)` — the source of truth for case-insensitive uniqueness).
- `MasterItemController` (`item/MasterItemController.kt`) — `GET/POST /api/items`, `PUT/DELETE /api/items/{id}`. `POST` is idempotent on a case-insensitive name match (returns the existing item with 200 rather than erroring); `PUT` returns 409 with the colliding `existingItem` if the new name collides with a *different* item, 404 if the id doesn't exist.
- `MasterItemService` (`item/MasterItemService.kt`) — the dedupe/collision logic backing the controller.
- `common/GlobalExceptionHandler.kt` — maps domain exceptions to HTTP status codes/error bodies.
- `application.yml` — Mongo URI from `MONGODB_URI` env var (default `mongodb://localhost:27017/mealplanner`), `auto-index-creation: true` (required for the unique index above to actually get created).
- `Dockerfile` — multi-stage: `eclipse-temurin:21-jdk-alpine` builder (Gradle `bootJar`) → `eclipse-temurin:21-jre-alpine` runtime.

### Infra

- `nginx.conf` — used by the frontend's production Docker image; reverse-proxies `/api/` to `items-service:8080` (Compose service-name DNS) and falls back to `index.html` for React Router's client-side routes.
- `vite.config.js` — dev-server proxy for `/api` → `http://localhost:8080`, mirroring nginx's role for `npm run dev`.
- `docker-compose.yml` — `meal-planner` (nginx + built frontend), `items-service` (Kotlin backend), `mongo` (with a named volume for data durability).
