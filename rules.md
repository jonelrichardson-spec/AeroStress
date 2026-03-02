# AeroStress — rules.md

## Read Order
1. Read `CLAUDE.md` first — every session, no exceptions.
2. Read this file second.
3. Do not write code until both files are read.

---

## Branch Discipline

- **NEVER commit to `main` directly.**
- Work only in the assigned feature branch (e.g. `jo/dashboard`).
- Do not create new branches without Jo's explicit instruction.
- Do not merge, rebase, or interact with other team members' branches.
- Commit after every meaningful change with a descriptive message.
- Commit message format: `[scope]: description` — e.g. `[map]: add triangle markers with terrain colors`

---

## Build Rules

### Before Writing Any Code
- Confirm which sprint you are in. Only build screens listed in that sprint's scope in CLAUDE.md.
- If a screen depends on data from Pape's backend that isn't available yet, **STOP and ask Jo**. Jo will get the information from Pape. Do not silently mock data or guess at schemas — wait for confirmation before proceeding.
- If something is unclear, ask Jo — do not guess or improvise.

### Code Architecture
- **No inline event handlers.** Extract all handlers to named functions.
  ```tsx
  // ❌ BAD
  <button onClick={() => setOpen(!open)}>

  // ✅ GOOD
  const handleToggle = () => setOpen(!open);
  <button onClick={handleToggle}>
  ```
- **No magic numbers or strings.** All constants go in `/lib/constants.ts`.
  ```tsx
  // ❌ BAD
  if (turbine.stressMultiplier > 1.5) { ... }

  // ✅ GOOD
  import { STRESS_THRESHOLDS } from '@/lib/constants';
  if (turbine.stressMultiplier > STRESS_THRESHOLDS.HIGH) { ... }
  ```
- **All API calls go through `/lib/api.ts`.** No `fetch()` or `supabase.from()` calls inside components.
  ```tsx
  // ❌ BAD (inside a component)
  const data = await supabase.from('turbines').select('*');

  // ✅ GOOD
  import { getTurbines } from '@/lib/api';
  const data = await getTurbines(farmId);
  ```
- **All TypeScript interfaces live in `/lib/types.ts`.** Do not define types inline in components.
- **Separation of concerns.** Components render UI. Logic and data fetching live in hooks, stores, or `/lib/`. If a component file exceeds 150 lines, it probably needs to be split.

### State Management
- Use **Zustand** stores in `/stores/` for shared state (farm data, auth, inspection drafts).
- Use **React state** (`useState`, `useReducer`) for local UI state only (modals, toggles, form inputs).
- Do not use `useContext` for global state — use Zustand instead.

### Styling
- **Tailwind CSS only.** No inline `style={{}}` objects in production components.
- Use the design tokens defined in `tailwind.config.ts` — reference colors as `bg-brand-bg`, `text-brand-muted`, `border-brand-border`, etc.
- Use the font utilities: `font-display` (Syne), `font-mono` (IBM Plex Mono), `font-body` (Lora).
- **Numbers always use `font-mono font-semibold`.** Never render numeric data in Syne or Lora.
- Responsive breakpoints to test: 1440px, 1024px, 768px.

### Design System Enforcement
```
PALETTE (do not deviate):
  bg:        #1c1917
  surface:   #272220
  surface2:  #302a27
  border:    #44393a
  text:      #ffffff
  muted:     #b0b8c4
  amber:     #f4a261  (turbine blades, moderate terrain)
  accent:    #e85d3a  (data numbers, alerts, complex terrain)
  flat:      #52b788
  coastal:   #48cae4
  scada:     #7b72e9

FONTS (do not deviate):
  Syne 800         → headlines, page titles ONLY
  IBM Plex Mono    → numbers, data, labels, kickers, metadata
  Lora             → body text, descriptions, tooltips

MAP:
  Style: mapbox://styles/mapbox/standard
  Config: { colorTheme: "default", lightPreset: "night" }
  Markers: triangles, color = terrain, size = stress, rotation = wind direction
```

---

## Error Handling

- Every async operation must have error handling (try/catch or .catch()).
- Show user-friendly error messages — never expose raw error objects or stack traces.
- All loading states must have a visible indicator (skeleton, spinner, or text).
- If an API call fails, the UI should not break — show a fallback state.

---

## File Naming

- Components: `PascalCase.tsx` — e.g. `TrueAgeCard.tsx`, `StressHeatmap.tsx`
- Utilities/lib: `camelCase.ts` — e.g. `api.ts`, `constants.ts`, `mapHelpers.ts`
- Stores: `use[Name]Store.ts` — e.g. `useFarmStore.ts`
- Pages (Next.js App Router): `page.tsx` inside the appropriate route folder

---

## Phase Completion Protocol

Before marking any sprint as complete:

1. [ ] Every screen in the sprint scope renders without errors.
2. [ ] No TypeScript errors (`npx tsc --noEmit` passes).
3. [ ] No console errors or warnings in browser dev tools.
4. [ ] Responsive check at 1440px, 1024px, 768px.
5. [ ] All colors match the design system — no rogue hex values.
6. [ ] All numbers use IBM Plex Mono — no exceptions.
7. [ ] No inline handlers, no magic numbers, no API calls in components.
8. [ ] Loading and error states exist for every async operation.
9. [ ] Jo can explain every technical decision in the code.
10. [ ] Commit history is clean with descriptive messages.
11. [ ] **Sprint summary delivered to Jo in plain language.** See format below.

### Sprint Summary Format

After every sprint, provide Jo with a summary written in plain language — no jargon, no code blocks. The summary must include:

- **What was built** — describe every screen and feature in normal words.
- **What it does** — explain how a user would actually use what was built.
- **What's connected** — which parts talk to real data vs. still waiting on Pape.
- **What's blocked** — anything that couldn't be finished and why.
- **What's next** — what the next sprint will focus on based on what's done.
- **Decisions made** — any technical choices that were made and why, explained so Jo can repeat them in an interview or presentation.

---

## What NOT To Do

- Do not install packages without asking Jo first.
- Do not add features not in the current sprint scope.
- Do not refactor code from a previous sprint unless Jo requests it.
- Do not create README.md, LICENSE, or boilerplate files unless asked.
- Do not use `localStorage` or `sessionStorage` — use Zustand or Supabase.
- Do not hardcode Mapbox tokens, Supabase keys, or any secrets in code files.
- Do not use `any` as a TypeScript type. Define proper interfaces.
