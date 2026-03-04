"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import MapGL, {
  Source,
  Layer,
  Popup,
  type MapRef,
  type MapMouseEvent,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { MapPin, Moon, Sun } from "lucide-react";
import { useFarmStore } from "@/stores/useFarmStore";
import { MAP_DEFAULTS, TERRAIN_CONFIG } from "@/lib/constants";
import {
  turbinesToGeoJSON,
  TERRAIN_COLOR_EXPRESSION,
  STRESS_SIZE_EXPRESSION,
  TRIANGLE_IMAGE_ID,
  createTriangleImage,
} from "@/lib/mapbox";
import type { Turbine, TerrainClass } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const TURBINE_LAYER_ID = "turbine-markers";

const MAP_STYLES = {
  light: "mapbox://styles/mapbox/standard",
  dark: "mapbox://styles/mapbox/dark-v11",
} as const;

export default function StressHeatmap() {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const turbines = useFarmStore((s) => s.turbines);
  const terrainFilter = useFarmStore((s) => s.terrainFilter);
  const selectedTurbineId = useFarmStore((s) => s.selectedTurbineId);
  const setSelectedTurbine = useFarmStore((s) => s.setSelectedTurbine);
  const mapTheme = useFarmStore((s) => s.mapTheme);
  const toggleMapTheme = useFarmStore((s) => s.toggleMapTheme);

  const filteredTurbines = useFarmStore((s) => s.getFilteredTurbines());

  const geojson = useMemo(
    () => turbinesToGeoJSON(filteredTurbines),
    [filteredTurbines]
  );

  const selectedTurbine = useMemo(() => {
    if (!selectedTurbineId) return null;
    return turbines.find((t) => t.id === selectedTurbineId) ?? null;
  }, [selectedTurbineId, turbines]);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const feature = e.features?.[0];
      if (feature && feature.properties) {
        setSelectedTurbine(feature.properties.id as string);
      } else {
        setSelectedTurbine(null);
      }
    },
    [setSelectedTurbine]
  );

  const handlePopupClose = useCallback(() => {
    setSelectedTurbine(null);
  }, [setSelectedTurbine]);

  const handleThemeToggle = useCallback(() => {
    toggleMapTheme();
  }, [toggleMapTheme]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && !map.hasImage(TRIANGLE_IMAGE_ID)) {
      map.addImage(TRIANGLE_IMAGE_ID, createTriangleImage(), { sdf: true });
    }
    setMapLoaded(true);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-surface">
        <MapPin className="h-12 w-12 text-brand-muted/40" />
        <p className="font-mono text-sm text-brand-muted">
          Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Theme Toggle Button */}
      <button
        onClick={handleThemeToggle}
        className="absolute top-4 left-4 z-10 p-2.5 rounded-lg bg-brand-surface/90 backdrop-blur-sm border border-brand-border text-brand-text hover:bg-brand-surface2 transition-colors shadow-lg"
        aria-label={
          mapTheme === "light" ? "Switch to dark mode" : "Switch to light mode"
        }
      >
        {mapTheme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>

      <MapGL
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLES[mapTheme]}
        initialViewState={{
          longitude: MAP_DEFAULTS.CENTER[0],
          latitude: MAP_DEFAULTS.CENTER[1],
          zoom: MAP_DEFAULTS.ZOOM,
        }}
        interactiveLayerIds={[TURBINE_LAYER_ID]}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        cursor="pointer"
        style={{ width: "100%", height: "100%" }}
      >
      {mapLoaded && (
      <Source id="turbines" type="geojson" data={geojson}>
        {/* Outer glow for selected turbine */}
        <Layer
          id="turbine-selected-ring"
          type="circle"
          filter={
            selectedTurbineId
              ? ["==", ["get", "id"], selectedTurbineId]
              : ["==", "id", ""]
          }
          paint={{
            "circle-radius": 18,
            "circle-color": "transparent",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-opacity": 0.8,
          }}
        />

        {/* Triangle turbine markers */}
        <Layer
          id={TURBINE_LAYER_ID}
          type="symbol"
          layout={{
            "icon-image": TRIANGLE_IMAGE_ID,
            "icon-size": STRESS_SIZE_EXPRESSION,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          }}
          paint={{
            "icon-color": TERRAIN_COLOR_EXPRESSION,
            "icon-opacity": 0.85,
          }}
        />
      </Source>
      )}

      {/* Popup on selected turbine */}
      {selectedTurbine && (
        <Popup
          longitude={selectedTurbine.longitude}
          latitude={selectedTurbine.latitude}
          anchor="bottom"
          onClose={handlePopupClose}
          closeButton={false}
          className="turbine-popup"
        >
          <TurbinePopup turbine={selectedTurbine} />
        </Popup>
      )}
      </MapGL>
    </div>
  );
}

// ── Popup Content ──

function TurbinePopup({ turbine }: { turbine: Turbine }) {
  const config = TERRAIN_CONFIG[turbine.terrain_class as TerrainClass];

  return (
    <div className="p-2 min-w-[200px]">
      <p className="font-display font-bold text-sm text-brand-bg leading-tight">
        {turbine.project_name}
      </p>
      <p className="text-xs text-gray-600 mt-0.5">
        {turbine.manufacturer} {turbine.model} — {turbine.state}
      </p>

      <div className="flex items-center gap-1.5 mt-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span className="text-xs text-gray-700">{config.label}</span>
      </div>

      <div className="flex gap-4 mt-2">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            True Age
          </p>
          <p
            className="font-mono font-semibold text-sm"
            style={{ color: config.color }}
          >
            {turbine.true_age_years.toFixed(1)} yr
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            Calendar
          </p>
          <p className="font-mono font-semibold text-sm text-gray-700">
            {turbine.calendar_age_years.toFixed(1)} yr
          </p>
        </div>
      </div>

      <Link
        href={`/dashboard/turbines/${turbine.id}`}
        className="block mt-3 text-center text-xs font-mono font-semibold text-brand-bg bg-brand-amber/90 hover:bg-brand-amber rounded px-3 py-1.5 transition-colors"
      >
        View Details
      </Link>
    </div>
  );
}
