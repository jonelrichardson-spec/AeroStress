# Deploying AeroStress

## Option A: Supabase as backend (no FastAPI server)

If you use **Supabase** as your backend, the frontend can load turbines directly from Supabase. You do **not** need to deploy the Python API.

### Vercel environment variables

In **Vercel** → your project → **Settings** → **Environment Variables**, set:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (same value as `SUPABASE_URL`, e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase **anon/public** key (same value as `SUPABASE_KEY`) |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Your Mapbox public token (`pk.…`) |

**Important:** Use the `NEXT_PUBLIC_` names so the browser can read them. Do **not** set `NEXT_PUBLIC_API_BASE_URL` — the app will use Supabase for turbine data.

### Supabase RLS (if you use Row Level Security)

If you enable RLS on `turbines` or `stress_calculations`, add a policy that allows **anon** to `SELECT` (e.g. "Allow public read for turbines and stress_calculations"). Otherwise the frontend may get permission errors.

Redeploy the Vercel project after saving the variables.

---

## Option B: Deploy the FastAPI backend

If you prefer to run the Python API (for recalibration, stress overrides, etc.):

### Why turbine data doesn't load on Vercel

The frontend can call the **backend API** for turbine data. By default it would use `http://localhost:8000`, which only works on your machine. So you either use Supabase directly (Option A) or deploy the API and set its URL in Vercel.

### 1. Deploy the backend

Deploy the `backend/` app to a host that gives you a public URL, for example:

- [Railway](https://railway.app) (Python/FastAPI)
- [Render](https://render.com) (Web Service)
- [Fly.io](https://fly.io)
- Any other Python host

**Backend env vars** (same as local): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, and optionally `INSPECTION_SUBMITTED_WEBHOOK_URL`.

**CORS:** Set `CORS_ORIGINS` to your Vercel URL(s), comma-separated:

```bash
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
```

Use the exact Vercel URL(s) you see in the browser (e.g. `https://aerostress.vercel.app`). After deployment, note the **backend base URL** (e.g. `https://your-api.railway.app`).

---

### 2. Configure Vercel (frontend)

In [Vercel](https://vercel.com) → your project → **Settings** → **Environment Variables**, add:

| Name | Value | Environments |
|------|--------|---------------|
| `NEXT_PUBLIC_API_BASE_URL` | Your backend URL, e.g. `https://your-api.railway.app` | Production, Preview |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Your Mapbox public token (`pk.…`) | Production, Preview |

No trailing slash on `NEXT_PUBLIC_API_BASE_URL`. Redeploy after saving.

---

### 3. Checklist

- [ ] Backend deployed and returning `GET /turbines` (e.g. open `https://your-api.railway.app/turbines` in a browser or curl).
- [ ] Backend has `CORS_ORIGINS` set to your Vercel URL.
- [ ] Vercel has `NEXT_PUBLIC_API_BASE_URL` set to that backend URL.
- [ ] Vercel has `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` set.
- [ ] Redeploy Vercel after changing env vars.

After that, the Vercel app should load turbine data from your deployed API.

---

## Summary

- **Supabase only (Option A):** Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel. Do not set `NEXT_PUBLIC_API_BASE_URL`.
- **FastAPI backend (Option B):** Deploy the backend, set `NEXT_PUBLIC_API_BASE_URL` in Vercel. Do not set the `NEXT_PUBLIC_SUPABASE_*` vars if you want the app to use the API for turbines.
