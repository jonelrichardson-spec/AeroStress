# AeroStress: Wind Turbine Predictive Maintenance Platform

Wind turbines age differently depending on the terrain they sit on. A turbine on a flat plain and one on a ridge may share the same calendar age, but the ridge turbine has been under significantly more stress. AeroStress makes that difference visible by calculating **True Age**: how much a turbine has actually aged relative to its calendar age, based on IEC 61400-1 terrain stress multipliers.

Built during Pursuit's AI-Native Builder Fellowship (Spring 2026). I was the frontend lead.

## What I Built

- Mapbox stress heatmap with SDF triangle markers and terrain filters
- Turbine detail page with True Age breakdown
- Inspection CRUD with photo upload
- PDF report download
- Next.js dashboard and Expo mobile app

The backend is a FastAPI/Python service with 500 seeded turbines and PostGIS for geospatial queries.

## Tech Stack

- **Frontend**: Next.js 16 · Tailwind CSS v4 · Zustand · Mapbox GL JS · Expo
- **Backend**: FastAPI · Supabase/PostGIS

## Team

- Jonel Richardson (frontend)
- Pape (backend)
- Jagger (PDF reports)

## Live Demo

[aerostress.vercel.app](https://aerostress-aikh6j84j-papes-projects-f59f593c.vercel.app/dashboard)

## Repo

[jonelrichardson-spec/AeroStress](https://github.com/jonelrichardson-spec/AeroStress)
