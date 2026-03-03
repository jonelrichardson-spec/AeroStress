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
import { MapPin } from "lucide-react";
import { useFarmStore } from "@/stores/useFarmStore";
import { MAP_DEFAULTS, TERRAIN_CONFIG } from "@/lib/constants";
import {
  turbinesToGeoJSON,
  TERRAIN_COLOR_EXPRESSION,
  STRESS_RADIUS_EXPRESSION,
} from "@/lib/mapbox";
import type { Turbine, TerrainClass } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const TURBINE_LAYER_ID = "turbine-circles";

export default function StressHeatmap() {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const turbines = useFarmStore((s) => s.turbines);
  const terrainFilter = useFarmStore((s) => s.terrainFilter);
  const selectedTurbineId = useFarmStore((s) => s.selectedTurbineId);
  const setSelectedTurbine = useFarmStore((s) => s.setSelectedTurbine);

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

  const handleMapLoad = useCallback(() => {
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
    <MapGL
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={MAP_DEFAULTS.STYLE}
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

        {/* Main turbine markers */}
        <Layer
          id={TURBINE_LAYER_ID}
          type="circle"
          paint={{
            "circle-radius": STRESS_RADIUS_EXPRESSION,
            "circle-color": TERRAIN_COLOR_EXPRESSION,
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#1c1917",
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
    </div>
  );
}
