# Phase 0 — Fix component-remount bug (sidebar/flicker/form-reset)

## Problem

`Header`, `Drawer`, `Home`, `AddCustom`, `TimersScreen`, `GoalsScreen`, `ReportsScreen`,
`NotificationsScreen`, `InsightsScreen`, `AIScreen`, `NotesScreen` are all defined as
functions *inside* `App()` in `src/App.jsx`, then rendered as JSX (`<Home />`, etc.).

`App` re-renders every second (`setInterval(() => setNow(Date.now()), 1000)`, used to
drive live timer displays). Every re-render redefines all of the above as new function
references, so React treats them as new component types at those JSX positions and
unmounts + remounts them every second. This wipes local component state (goal form
drafts, the add-custom-task input, dialog/drawer open state feel) and replays
mount-triggered CSS animations (the drawer's slide-in), which reads as "sidebar
auto-opens/closes," "widgets flicker," "goal form resets."

## Fix

Hoist every one of the above to real, module-scope components (defined once, not
per-render). React then only re-renders them in place on App's tick — it does not
unmount/remount — so local state and mounted DOM nodes survive.

## Wiring

Reuse the existing `ThemeContext` pattern (already in `src/theme.js`) rather than
prop-drilling ~15 values per screen. Add a sibling `AppContext` (`src/appContext.js`)
carrying shared data/actions: `data`, `save`, `saveSetting`, `lang`, `user`, `today`,
`dayLog`, `customToday`, `setField`, `setCustom`, `runs`, `toggleRun`, `resetRun`,
`elapsedOf`, `timers`, `widgets`, `templates`, `showToast`, `askConfirm`, `setScreen`,
`setDrawer`, `doneCount`, `totalCount`, `pct`, `buildReport`, `activeTemplateText`,
`dark`, `toggleDark`, `toggleLang`, and the styles object `S`. Screens read it via
`useContext(AppContext)` instead of closing over `App`'s locals.

## File layout

- `src/appContext.js` — new context
- `src/lib/constants.js` — `FIXED`, `METRICS`, `T`/`tr`, `QUOTES`, `WIDGET_META`,
  `DEFAULT_TIMERS`, `DEFAULT_WIDGETS`, `DEFAULT_TEMPLATE`, `RUN_KEY`, `EMPTY`
  (pure data, moved verbatim)
- `src/lib/metrics.js` — `dayMetric`, `rangeMetric`, `streakMetric` (pure functions,
  moved verbatim)
- `src/components/Icon.jsx` — `Icon`, `Ring`, `ICONS` map
- `src/components/Header.jsx`, `src/components/Drawer.jsx`
- `src/screens/Home.jsx` (incl. `AddCustom` and `renderWidget`), `Timers.jsx`,
  `Goals.jsx`, `Reports.jsx`, `Notifications.jsx`, `Insights.jsx`, `AI.jsx`, `Notes.jsx`
- `App.jsx` shrinks to: auth/data-loading effects, the debounced save logic, the
  countdown-completion watcher, and the routing shell (`AppContext.Provider` +
  `ThemeContext.Provider` + tab bar)

## Explicitly out of scope for this phase

- No Supabase schema changes.
- No behavior or visual changes — this is a structural refactor only.
- Not decoupling the 1-second tick itself (that's Phase 2, tied to timer internals
  and daily-total persistence). Hoisting alone removes the remount, which is the
  actual bug; the tick becoming a plain in-place re-render is provably harmless once
  identity is stable.

## Verification (manual, before calling this phase done)

- Type in the Goals "new goal" form and wait >1s without losing input.
- Open the drawer; confirm the slide-in animation doesn't replay while it's open.
- Add a custom Sadhna task; confirm the input doesn't clear itself mid-typing.
- Open the delete-confirm sheet and a toast; confirm both stay until dismissed.
- Click through every tab (Home/Timers/Goals/Reports) and drawer screens
  (Insights/Notes/AI/Notifications) to confirm no visual/behavioral regression.
