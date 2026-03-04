"use client";

import { TERRAIN_CONFIG } from "@/lib/constants";
import { useFarmStore } from "@/stores/useFarmStore";
import { cn } from "@/lib/utils";
import type { TerrainClass } from "@/lib/types";

const TERRAIN_KEYS = Object.keys(TERRAIN_CONFIG) as TerrainClass[];

export default function MapControls() {
  const terrainFilter = useFarmStore((s) => s.terrainFilter);
  const toggleTerrainFilter = useFarmStore((s) => s.toggleTerrainFilter);
  const setTerrainFilter = useFarmStore((s) => s.setTerrainFilter);

  const isAllActive = terrainFilter === null;

  const handleAllClick = () => {
    setTerrainFilter(null);
  };

  const handleTerrainClick = (terrainClass: TerrainClass) => {
    toggleTerrainFilter(terrainClass);
  };

  return (
    <div className="flex flex-wrap gap-1 justify-center">
      <button
        onClick={handleAllClick}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-semibold transition-colors border",
          isAllActive
            ? "bg-brand-surface2 border-brand-amber text-brand-amber"
            : "bg-brand-surface border-brand-border text-brand-muted hover:border-brand-muted"
        )}
      >
        All
      </button>

      {TERRAIN_KEYS.map((key) => {
        const config = TERRAIN_CONFIG[key];
        const isActive =
          terrainFilter === null || terrainFilter.includes(key);

        return (
          <button
            key={key}
            onClick={() => handleTerrainClick(key)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono font-semibold transition-colors border",
              isActive && terrainFilter !== null
                ? "bg-brand-surface2 border-current"
                : terrainFilter !== null
                  ? "bg-brand-surface border-brand-border text-brand-muted hover:border-brand-muted opacity-50"
                  : "bg-brand-surface border-brand-border text-brand-muted hover:border-brand-muted"
            )}
            style={
              isActive && terrainFilter !== null
                ? { color: config.color, borderColor: config.color }
                : undefined
            }
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        );
      })}
    </div>
  );
}
