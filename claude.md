# AeroStress — CLAUDE.md

## Read This First
Before every build session, read this file completely. Do not skip sections.
Do not build screens or features not listed in the current sprint scope.
Check rules.md for enforcement protocols before writing any code.

---

## Project Overview

AeroStress is a predictive maintenance platform that calculates the "True Age" of wind turbines by analyzing the specific terrain and turbulence of their location. While standard SCADA software treats every turbine the same, AeroStress identifies hidden stress in mountainous and coastal sites to predict mechanical failure before it happens.

**My Role:** Frontend lead — asset manager dashboard (Next.js web) and technician inspection flow (Expo mobile).

**Team:**
- **Pape** — Backend & data layer (FastAPI/Python, Supabase/PostGIS, deployment)
- **Jagger** — PDF report generation (Puppeteer)
- **Jo (me)** — Frontend (Next.js dashboard, Mapbox, Expo mobile app)

---

## Tech Stack (Frontend)

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom design tokens
- **Maps:** Mapbox GL JS
- **State Management:** Zustand
- **Database Client:** Supabase JS client (@supabase/supabase-js)
- **Auth:** Supabase Auth (role-based: asset_manager | technician)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Components:** shadcn/ui (customized to AeroStress design system)
- **Animations:** Framer Motion
- **Mobile:** React Native / Expo (Sprint 3)

---

## Backend Contract (from Pape)

### Supabase Project ✅ CONFIRMED
```
NEXT_PUBLIC_SUPABASE_URL=https://ctbpivyarhrwuodarnwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY= (in .env.local — never commit this)
```
- RLS enabled on fleets, turbines, terrain_classifications, stress_calculations
- RLS policies: permissive (`using (true) with check (true)`) for now

### API Architecture ✅ CONFIRMED
**Option B — FastAPI (Python) backend. Frontend calls via `fetch()`.**
- Do NOT query Supabase directly from frontend for turbine data.
- Dev base URL: `http://localhost:8000`
- Production URL: ❓ TBD (ask Pape when deployed)
- CORS allowed: `http://localhost:3000`, `http://127.0.0.1:3000`

### Database Schema ✅ CONFIRMED
Four tables exist: `fleets`, `turbines`, `terrain_classifications`, `stress_calculations`

**`turbines` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| case_id | bigint | USWTDB ID (was `p_tnum`) |
| latitude | double | |
| longitude | double | |
| geometry | geometry(Point, 4326) | PostGIS, auto-filled |
| model | text | Renamed from `t_model` |
| manufacturer | text | Renamed from `t_manu` |
| capacity_kw | integer | Renamed from `t_cap` — NOTE: kW not MW |
| year_operational | integer | Renamed from `p_year` |
| calendar_age_years | double | Computed: 2025 - year_operational |
| project_name | text | Renamed from `p_name` |
| state | text | Renamed from `t_state` |
| county | text | Renamed from `t_county` |
| fleet_id | uuid (nullable) | FK to fleets. Null for USWTDB seed data. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`fleets` table:** Fleet name + timestamps. This is the "farm" concept — operator fleets.

**`terrain_classifications` table:** Lookup table with terrain types + multipliers.

**`stress_calculations` table:** Per-turbine stress data — terrain_class, stress_multiplier, true_age_years. Joined via API, not on the turbines table directly.

### API Endpoints

**P1 — NOW AVAILABLE (Pape's latest push):**

**Auth (Supabase JWT, Bearer token from `supabase.auth.getSession()`):**
| Endpoint | Auth | Body/Params | Returns |
|----------|------|-------------|---------|
| `GET /profile` | ✅ Bearer | — | `{ id, user_id, role, fleet_id, created_at, updated_at }` |
| `PATCH /profile` | ✅ Bearer | `{ role?, fleet_id? }` | Same as GET /profile |

**Turbine Detail:**
| Endpoint | Auth | Returns |
|----------|------|---------|
| `GET /turbines/{id}` | ❌ | Single turbine (same shape as list + `stress_multiplier`) |
| `GET /turbines/{id}/stress-explanation` | ❌ | `{ explanation: string }` |
| `GET /turbines/{id}/failure-predictions` | ❌ | `{ predictions: [{ component, condition }] }` |
| `GET /turbines/{id}/inspections` | ❌ | `Inspection[]` |

**Inspections CRUD:**
| Endpoint | Auth | Body/Params | Returns |
|----------|------|-------------|---------|
| `POST /turbines/{id}/inspections` | ❌ | `{ conducted_at?, inspector_name?, component_inspected?, condition_found?, severity_rating?, notes? }` | `Inspection` |
| `GET /inspections/{id}` | ❌ | — | `Inspection` |
| `PATCH /inspections/{id}` | ❌ | `{ status?, component_inspected?, condition_found?, severity_rating?, notes?, prediction_match?, attachment_url? }` | `Inspection` |
| `POST /inspections/{id}/attachment` | ❌ | `multipart/form-data` file upload | `Inspection` with `attachment_url` |
| `GET /inspections/{id}/report` | ❌ | — | PDF file |

**Fleet:**
| Endpoint | Auth | Params | Returns |
|----------|------|--------|---------|
| `GET /fleets/{id}/projected-savings` | ❌ | `?annual_om_per_turbine=50000` | `{ fleet_id, annual_om_per_turbine, total_turbines, high_risk_turbines_top_20pct, recommended_reallocation_percent, message }` |

**Auth Note:** Only `GET /profile` and `PATCH /profile` require the Bearer token from Supabase Auth. All other endpoints are currently unauthenticated.

**Sprint 1 — BUILT:**
| Endpoint | Returns |
|----------|---------|
| `GET /turbines?limit=500&offset=0` | All turbines with terrain + stress data |
| `GET /fleets/{fleet_id}/turbines?sort=stress` | Turbines for a specific fleet |

### API Response Shape ✅ CONFIRMED
```json
{
  "id": "uuid-string",
  "case_id": 3003108,
  "latitude": 35.41319,
  "longitude": -101.23229,
  "model": "GE1.85-87",
  "manufacturer": "GE Wind",
  "capacity_kw": 1850,
  "year_operational": 2014,
  "calendar_age_years": 11.0,
  "true_age_years": 11.0,
  "terrain_class": "flat",
  "project_name": "Panhandle Wind 1",
  "state": "TX"
}
```
- Format: Regular JSON (NOT GeoJSON — frontend converts for Mapbox)
- Dates: ISO 8601 strings
- IDs: UUIDs

### Data Seeding ✅ CONFIRMED
- 500 turbines seeded (subset of USWTDB)
- USWTDB version: live API (~V8.2)
- Terrain classification: placeholder heuristic (latitude-based, not USGS yet)
- USGS elevation integration: not yet — planned for later

### STILL PENDING (Not yet available from Pape)
- ❌ Supabase Auth full setup (login/signup UI, session management)
- ❌ Storage buckets for photos (attachment upload works via API, but direct storage access not configured)
- ❌ Supabase realtime subscriptions (for offline sync)
- ❌ Production deployment URL (still TBD)

### NOW AVAILABLE FROM PAPE (P1 Push)
- ✅ `GET /turbines/{id}` — single turbine detail
- ✅ Inspections table and CRUD endpoints
- ✅ Profiles table and `GET /profile`, `PATCH /profile`
- ✅ Stress explanation and failure predictions endpoints
- ✅ Fleet projected savings endpoint
- ✅ Inspection attachment upload via multipart form-data
- ✅ PDF report generation for inspections via `GET /inspections/{id}/report`

---

## Data Models (TypeScript Interfaces)

Matches Pape's confirmed API response shape:

```typescript
// /lib/types.ts — CONFIRMED matches API response

interface Turbine {
  id: string;
  case_id: number;              // USWTDB ID (bigint from API)
  latitude: number;
  longitude: number;
  model: string;
  manufacturer: string;
  capacity_kw: number;          // NOTE: kW not MW
  year_operational: number;
  calendar_age_years: number;
  true_age_years: number;
  terrain_class: 'flat' | 'moderate' | 'complex' | 'coastal';
  project_name: string;
  state: string;
  // Not in current API response but in DB:
  county?: string;
  fleet_id?: string | null;
}

interface Fleet {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  turbines?: Turbine[];
}

// ✅ BUILT — Inspection interface from Pape's P1 push
interface Inspection {
  id: string;
  turbine_id: string;
  conducted_at: string | null;
  inspector_name: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  component_inspected: string | null;
  condition_found: string | null;
  severity_rating: number | null;
  notes: string | null;
  submitted_at: string | null;
  prediction_match: boolean | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

// ✅ BUILT — UserProfile interface from Pape's P1 push
interface UserProfile {
  id: string;
  user_id: string;  // Supabase auth.users.id
  role: 'asset_manager' | 'technician';
  fleet_id: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Terrain Classification Constants

```typescript
// /lib/constants.ts
export const TERRAIN_CONFIG = {
  flat: {
    label: 'Flat (IEC Class C)',
    multiplier: 1.0,
    color: '#52b788',      // green
    risk: 'Standard',
  },
  moderate: {
    label: 'Moderate (IEC Class B)',
    multiplier: 1.3,
    color: '#f4a261',      // amber
    risk: 'Elevated',
  },
  complex: {
    label: 'Complex / Ridge (IEC Class A)',
    multiplier: 1.85,      // midpoint of 1.7–2.0 range
    color: '#e85d3a',      // red-orange
    risk: 'High',
  },
  coastal: {
    label: 'Coastal',
    multiplier: 1.5,       // ❓ CONFIRM WITH TEAM
    color: '#48cae4',      // blue
    risk: 'Elevated',
  },
} as const;

export const SCADA_COLOR = '#7b72e9';  // purple — used for "standard" baseline
```

---

## Design System

### Fonts (Google Fonts — free)
```
Syne (700, 800)          → Headlines and page titles ONLY
IBM Plex Mono (400, 600) → ALL numbers, data values, statistics, labels, 
                            kickers, technical metadata, code
Lora (regular, italic)   → Body text, descriptions, tooltips, contextual prose

⚠️  RULE: Numbers NEVER use Lora or Syne. All numeric values (ages, scores,
    multipliers, counts, percentages) use IBM Plex Mono 600.
```

### Color Palette ✅ FINALIZED
```
--bg:        #1c1917    (Warm Charcoal)
--surface:   #272220
--surface2:  #302a27
--border:    #44393a
--text:      #ffffff    (Arctic Bright)
--muted:     #b0b8c4

Turbine blade color: #f4a261 (Warm Amber)
Data accent (numbers, alerts): #e85d3a (Red-Orange)

Terrain accents (locked — do not change):
--flat:      #52b788
--moderate:  #f4a261
--complex:   #e85d3a
--coastal:   #48cae4
--scada:     #7b72e9
```

### Tailwind v4 Theme (CSS-based — no tailwind.config.ts)

Tailwind v4 uses CSS-based configuration via `@theme` in `app/globals.css` instead of a `tailwind.config.ts` file. All AeroStress design tokens are defined there:

```css
/* app/globals.css — inside @theme inline { ... } */

/* ── AeroStress Brand Colors ── */
--color-brand-bg: #1c1917;
--color-brand-surface: #272220;
--color-brand-surface2: #302a27;
--color-brand-border: #44393a;
--color-brand-text: #ffffff;
--color-brand-muted: #b0b8c4;
--color-brand-amber: #f4a261;
--color-brand-accent: #e85d3a;

/* ── Terrain Colors ── */
--color-terrain-flat: #52b788;
--color-terrain-moderate: #f4a261;
--color-terrain-complex: #e85d3a;
--color-terrain-coastal: #48cae4;

/* ── SCADA baseline ── */
--color-scada: #7b72e9;

/* ── Font Families ── */
--font-display: "Syne", sans-serif;
--font-mono: "IBM Plex Mono", monospace;
--font-body: "Lora", serif;
--font-sans: var(--font-body);
```

Usage in components: `bg-brand-bg`, `text-brand-muted`, `border-brand-border`, `text-terrain-flat`, `font-display`, `font-mono`, `font-body`, etc.

---

## UI Layout Specifications ✅ CRITICAL

**These specifications were finalized after Sprint 1 merge. DO NOT modify without explicit approval.**

### Sidebar (`components/layout/Sidebar.tsx`)
```typescript
// Container
className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 bg-brand-surface border-r border-brand-border"

// ⚠️ CRITICAL: z-40 ensures sidebar renders above TopBar (z-30)

// Logo Header
className="flex items-center justify-center px-4 h-16 border-b border-brand-border overflow-hidden"
<Logo size="md" /> // NOT sm or lg — md fits perfectly within 256px width

// Navigation Items
NAV_ITEMS = [
  { href: "/dashboard", label: "DASHBOARD", icon: Map },
  { href: "/dashboard/turbines", label: "TURBINES", icon: Wind },
  { href: "/inspections", label: "INSPECTIONS", icon: Eye },  // NOT /dashboard/inspections
  { href: "/reports", label: "REPORTS", icon: FileText },      // NOT /dashboard/reports
]

// ⚠️ CRITICAL: Labels MUST be uppercase
// ⚠️ CRITICAL: Inspections/Reports routes are top-level (/inspections, /reports)
// ⚠️ CRITICAL: Icons: Eye for Inspections, FileText for Reports
```

### TopBar (`components/layout/TopBar.tsx`)
```typescript
// Container
className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-brand-bg/80 backdrop-blur-sm border-b border-brand-border"

// Page Titles (MUST match Sidebar labels)
PAGE_TITLES = {
  "/dashboard": "DASHBOARD",
  "/dashboard/turbines": "TURBINES",
  "/inspections": "INSPECTIONS",
  "/reports": "REPORTS",
}

// ⚠️ CRITICAL: All titles MUST be uppercase
// ⚠️ CRITICAL: Routes match Sidebar (top-level for Inspections/Reports)

// Icon Sizes
<Bell className="h-6 w-6" />
<User className="h-6 w-6" />
// ⚠️ NOT h-5 w-5 — use h-6 w-6 for prominence
```

### MobileNav (`components/layout/MobileNav.tsx`)
```typescript
// Uses same NAV_ITEMS as Sidebar
// ⚠️ CRITICAL: Keep in sync with Sidebar routes and labels
```

### Dashboard Layout (`app/dashboard/layout.tsx`)
```typescript
// Content area offset for sidebar
<div className="md:pl-64 flex flex-col min-h-screen">
  <TopBar />
  <main className="flex-1">{children}</main>
</div>

// ⚠️ CRITICAL: md:pl-64 (256px) matches sidebar width (md:w-64)
```

### Dashboard Page (`app/dashboard/page.tsx`)
```typescript
// Main container
className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] pt-2 px-4 pb-4 gap-4 overflow-hidden"
// ⚠️ CRITICAL: overflow-hidden prevents page scrolling

// Stat Cards
<span className="text-2xl">{stat.value}</span>  // NOT text-6xl
{stat.unit && (
  <span className="text-base ml-1 text-brand-muted">{stat.unit}</span>
)}
// ⚠️ CRITICAL: Separate number (text-2xl) and unit (text-base) to prevent overflow

// Right Panel
className="w-full lg:w-[30rem] h-full flex flex-col gap-4 min-h-0"
// ⚠️ CRITICAL: min-h-0 allows flex children to scroll

// Turbine List Card
className="bg-brand-surface border-brand-border flex-1 flex flex-col min-h-0"
<CardContent className="flex-1 overflow-y-auto">
  <TurbineListPanel />
</CardContent>
// ⚠️ CRITICAL: Only turbine list scrolls, not entire page

// Card Titles (Terrain Classification, Turbine List)
<CardTitle className="font-display font-extrabold text-base text-brand-text text-center">
  Terrain Classification
</CardTitle>
<CardTitle className="font-display font-extrabold text-base text-brand-text text-center">
  Turbine List
</CardTitle>
// ⚠️ CRITICAL: text-center for horizontal centering
```

### StressHeatmap (`components/map/StressHeatmap.tsx`)
```typescript
// Map must re-register triangle image on style changes
const handleStyleData = useCallback(() => {
  const map = mapRef.current?.getMap();
  if (map && !map.hasImage(TRIANGLE_IMAGE_ID)) {
    map.addImage(TRIANGLE_IMAGE_ID, createTriangleImage(), { sdf: true });
  }
}, []);

<MapGL
  onLoad={handleMapLoad}
  onStyleData={handleStyleData}  // ⚠️ CRITICAL for dark mode
/>

// ⚠️ CRITICAL: onStyleData re-registers triangle image when light/dark mode toggles
// Without this, triangles disappear in dark mode
```

### Constants (`lib/constants.ts`)
```typescript
// ⚠️ NO DUPLICATES: Each constant defined exactly once
export const KW_TO_MW_DIVISOR = 1000;  // Line 68 ONLY
```

---

## File Structure

```
aerostress-dashboard/
├── app/
│   ├── layout.tsx              — root layout, font imports, providers
│   ├── page.tsx                — redirect to /dashboard
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx          — sidebar nav, top bar
│   │   ├── page.tsx            — main map view + heatmap
│   │   └── turbines/
│   │       └── [id]/page.tsx   — turbine detail (True Age, inspections)
│   ├── inspections/
│   │   ├── page.tsx            — climb list (technician view)
│   │   └── [id]/page.tsx       — inspection detail / submit form
│   └── reports/
│       └── page.tsx            — Critical Action Report generator
├── components/
│   ├── ui/                     — shadcn/ui components (customized)
│   ├── map/
│   │   ├── StressHeatmap.tsx
│   │   ├── TurbineMarker.tsx
│   │   └── MapControls.tsx
│   ├── turbine/
│   │   ├── TrueAgeCard.tsx
│   │   ├── TerrainBadge.tsx
│   │   └── InspectionHistory.tsx
│   ├── inspection/
│   │   ├── ClimbList.tsx
│   │   ├── InspectionForm.tsx
│   │   └── PhotoUpload.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── TopBar.tsx
│       └── MobileNav.tsx
├── lib/
│   ├── api.ts                  — ALL API/Supabase calls centralized here
│   ├── constants.ts            — terrain config, magic numbers, enums
│   ├── design-tokens.ts        — color palette, spacing, typography
│   ├── supabase.ts             — Supabase client init
│   ├── mapbox.ts               — Mapbox config and helpers
│   ├── utils.ts                — shared utilities
│   └── types.ts                — TypeScript interfaces (from above)
├── stores/
│   ├── useFarmStore.ts         — Zustand: farm & turbine state
│   ├── useAuthStore.ts         — Zustand: auth state
│   └── useInspectionStore.ts   — Zustand: inspection draft state
├── public/
│   └── ...
├── tailwind.config.ts
├── CLAUDE.md                   — THIS FILE
└── rules.md                    — enforcement rules
```

---

## Screen Inventory

### Sprint 1 — COMPLETE
Dashboard layout, Mapbox map with SDF triangle markers, terrain filters, turbine list, stat cards, error states. Two commits merged. Login/Signup blocked on Supabase Auth (not built by Pape yet).

### Sprint 2 Scope (CURRENT) ✅ UNBLOCKED

**All dependencies now available from Pape's P1 push:**
| Screen | Description | Status |
|--------|-------------|--------|
| Turbine Detail View | True Age vs Calendar Age comparison, terrain badge, stress score, inspection history | ✅ Unblocked — `GET /turbines/{id}`, `GET /turbines/{id}/inspections` |
| Heatmap — Live Data | Connect map to real calculated stress data | ✅ Unblocked — `stress_multiplier` in API response |
| Critical Action Report | Top 5% at-risk turbines, downloadable PDF | ✅ Unblocked for list — PDF generation still with Jagger |
| Inspection Detail View | View inspection, update status, upload photos | ✅ Unblocked — `GET /inspections/{id}`, `PATCH /inspections/{id}`, `POST /inspections/{id}/attachment` |

**Sprint 2 next steps:**
- Wire turbine detail page to `GET /turbines/{id}`
- Display inspection history using `GET /turbines/{id}/inspections`
- Add stress explanation tooltip using `GET /turbines/{id}/stress-explanation`
- Show failure predictions on detail page using `GET /turbines/{id}/failure-predictions`
- Build inspection detail/edit screen for asset managers

### Sprint 3 Scope (LATER — Expo Mobile) ✅ PARTIALLY UNBLOCKED
| Screen | Description | Status |
|--------|-------------|--------|
| Climb List | Prioritized inspection queue ranked by stress score | ✅ Unblocked — can use `GET /turbines` sorted by `true_age_years` |
| Inspection Form | Log findings, severity, photos, match against prediction | ✅ Unblocked — `POST /turbines/{id}/inspections`, `POST /inspections/{id}/attachment` |
| Offline Sync | AsyncStorage for field use, auto-sync on reconnect | ⏳ Blocked — needs Supabase realtime subscriptions (not yet configured) |
| Profile/Auth | Login, role display, fleet assignment | ✅ Partially unblocked — `GET /profile`, `PATCH /profile` (needs Supabase Auth setup) |

---

## GitHub & Branching

```
Repo: https://github.com/jonelrichardson-spec/AeroStress
Owner: Jo (jonelrichardson-spec)
Structure: Monorepo — frontend and backend in the same repo
Frontend code: Starting from scratch (no existing frontend)
```

### Branch Discipline
- **main** — protected. Do NOT commit directly. Only merge when branch is complete.
- **jo/frontend-dashboard** — Jo's working branch for the Next.js dashboard
- **pape/backend** — Pape's working branch for Supabase/Express setup
- **jagger/pdf** — Jagger's working branch for PDF generation

### Workflow
1. Always pull latest main before creating a new branch
2. Work exclusively in your feature branch
3. Commit often with descriptive messages
4. Only merge to main when the branch scope is fully complete and tested
5. If you need something from Pape's branch, coordinate — don't merge partial work

❓ **Confirm with Pape:**
- Is there already a `pape/backend` branch with schema/seed work?
- Should Jo branch off `main` or off Pape's branch?
- Any existing folder structure in the repo (like a `/backend` folder)?

---

## Mapbox Configuration ✅ FINALIZED

```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN= (in .env.local — never commit this)
Map Style: mapbox://styles/mapbox/standard
Color Theme: default
Light Preset: night
Initial Center: [-98.5, 39.8] (center of US)
Initial Zoom: 4
```

```jsx
<Map
  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
  mapStyle="mapbox://styles/mapbox/standard"
  initialViewState={{ longitude: -98.5, latitude: 39.8, zoom: 4 }}
  config={{
    colorTheme: "default",
    lightPreset: "night"
  }}
/>
```

### Heatmap Layer Strategy
- Each turbine plots as a **triangle marker** (pointing upward by default)
- Triangle **rotates to show wind direction** when data is available
- Color = terrain class color from TERRAIN_CONFIG
- Size = proportional to stress multiplier (larger = higher stress)
- Triangles are easier tap targets on mobile than circles
- On click/tap = open turbine detail panel
- ❓ Does Pape return GeoJSON, or do we transform the data client-side?
- ❓ Does USWTDB or any data source include wind direction per turbine? 
  If not, we default to upward-pointing and add rotation in a future version.

---

## Mock Data (Use Until Pape's API is Ready)

For Sprint 1 development, use mock data in `/lib/mock-data.ts`:

```typescript
// ❓ Replace with real Supabase queries once Pape confirms schema

export const MOCK_TURBINES: Turbine[] = [
  {
    id: '1',
    uswtdbId: 'p3000001',
    projectName: 'Altamont Pass Wind Farm',
    lat: 37.7352,
    lng: -121.6333,
    state: 'CA',
    county: 'Alameda',
    manufacturer: 'Vestas',
    model: 'V47',
    capacityMw: 0.66,
    hubHeightM: 55,
    rotorDiameter: 47,
    yearInstalled: 2001,
    terrainClass: 'complex',
    stressMultiplier: 1.85,
    trueAge: 46.25,       // 25 years × 1.85
    calendarAge: 25,
    farmId: 'farm-001',
  },
  // ... add 10-20 more spanning all terrain types
];
```

---

## Quality Checklist (Before Every PR)

- [ ] No inline event handlers — all extracted to named functions
- [ ] No magic numbers — all constants in `/lib/constants.ts`
- [ ] All API calls go through `/lib/api.ts`
- [ ] TypeScript interfaces match Pape's schema
- [ ] Responsive layout tested at 1440px, 1024px, 768px
- [ ] Terrain colors match TERRAIN_CONFIG exactly
- [ ] Loading states on all async operations
- [ ] Error handling with user-friendly messages
- [ ] Can explain every technical decision if asked (no code vibing)
