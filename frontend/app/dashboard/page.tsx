"use client";

import { useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { MapPin, Wind, Siren, Hourglass, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TERRAIN_CONFIG, STRESS_THRESHOLDS } from "@/lib/constants";
import { useFarmStore } from "@/stores/useFarmStore";
import MapControls from "@/components/map/MapControls";
import TurbineListPanel from "@/components/turbine/TurbineListPanel";
import type { Turbine, TerrainClass } from "@/lib/types";

// Mapbox must be loaded client-side only (no SSR)
const StressHeatmap = dynamic(
  () => import("@/components/map/StressHeatmap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-surface">
        <Loader2 className="h-8 w-8 text-brand-amber animate-spin" />
        <p className="font-mono text-sm text-brand-muted">Loading map...</p>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const turbines = useFarmStore((s) => s.turbines);
  const fetchTurbines = useFarmStore((s) => s.fetchTurbines);
  const setSelectedTurbine = useFarmStore((s) => s.setSelectedTurbine);

  useEffect(() => {
    fetchTurbines();
  }, [fetchTurbines]);

  const stats = useMemo(() => {
    if (turbines.length === 0) {
      return { total: 0, highStress: 0, avgTrueAge: 0, sites: 0 };
    }

    const highStress = turbines.filter(
      (t) =>
        (TERRAIN_CONFIG[t.terrain_class as TerrainClass]?.multiplier ?? 1) >=
        STRESS_THRESHOLDS.HIGH
    ).length;

    const avgTrueAge =
      turbines.reduce((sum, t) => sum + t.true_age_years, 0) /
      turbines.length;

    const sites = new Set(turbines.map((t) => t.project_name)).size;

    return { total: turbines.length, highStress, avgTrueAge, sites };
  }, [turbines]);

  const handleTurbineClick = useCallback(
    (turbine: Turbine) => {
      setSelectedTurbine(turbine.id);
    },
    [setSelectedTurbine]
  );

  const STAT_CARDS = [
    {
      label: "Total Turbines",
      value: stats.total > 0 ? stats.total.toLocaleString() : "—",
      icon: Wind,
      color: "text-brand-amber",
    },
    {
      label: "High Stress",
      value: stats.total > 0 ? stats.highStress.toLocaleString() : "—",
      icon: Siren,
      color: "text-terrain-complex",
    },
    {
      label: "Average True\u00A0Age",
      value:
        stats.avgTrueAge > 0 ? `${stats.avgTrueAge.toFixed(1)} yr` : "—",
      icon: Hourglass,
      color: "text-scada",
    },
    {
      label: "Sites Monitored",
      value: stats.sites > 0 ? stats.sites.toLocaleString() : "—",
      icon: MapPin,
      color: "text-terrain-coastal",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] pt-2 px-4 pb-4 gap-4">
      {/* Map Area */}
      <div className="flex-1 relative bg-brand-surface rounded-lg overflow-hidden">
        <StressHeatmap />
      </div>

      {/* Right Panel */}
      <aside className="w-full lg:w-[30rem] h-full flex flex-col gap-4 overflow-y-auto min-h-0">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="bg-brand-surface border-brand-border"
              >
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-base font-body text-brand-muted">
                      {stat.label}
                    </span>
                  </div>
                  <p className="font-mono font-semibold text-6xl text-brand-text">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Terrain Legend */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="font-display font-extrabold text-base text-brand-text">
              Terrain Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0 px-6 pb-4">
            {(
              Object.entries(TERRAIN_CONFIG) as [
                TerrainClass,
                (typeof TERRAIN_CONFIG)[TerrainClass],
              ][]
            ).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-sm font-body text-brand-muted">
                    {config.label}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="font-mono font-semibold text-xs"
                  style={{ color: config.color }}
                >
                  {config.multiplier}x
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Filter + Turbine List */}
        <Card className="bg-brand-surface border-brand-border flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="font-display font-extrabold text-base text-brand-text">
              Turbine List
            </CardTitle>
            <div className="mt-2">
              <MapControls />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <TurbineListPanel onTurbineClick={handleTurbineClick} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
