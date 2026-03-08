🌬 AeroStress: Wind Turbine Predictive Maintenance Platform
Team: Pape (backend), Jagger (PDF reports) | Built: Spring 2026 (MVP Complete)
A predictive maintenance platform for wind turbines that calculates True Age: how much a turbine has actually aged relative to its calendar age, based on IEC 61400-1 terrain stress multipliers. A turbine on a flat plain and one on a ridge may be the same calendar age, but the ridge turbine has been under significantly more stress. AeroStress makes that difference visible and actionable.
I was the frontend lead, building the Next.js dashboard and Expo mobile app. Delivered features include: a Mapbox stress heatmap with SDF triangle markers and terrain filters, a turbine detail page with True Age breakdown, inspection CRUD with photo upload, and PDF report download. The backend is a FastAPI/Python service with 500 seeded turbines and PostGIS for geospatial queries.
Stack: Next.js 16 · Tailwind CSS v4 · Zustand · Mapbox GL JS · Expo · FastAPI · Supabase/PostGIS
Live Demo: [Add link here] | Repo: jonelrichardson-spec/AeroStress
