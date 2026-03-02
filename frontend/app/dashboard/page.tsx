"use client";

import { MapPin, Wind, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TERRAIN_CONFIG } from "@/lib/constants";
import type { TerrainClass } from "@/lib/types";

const STAT_CARDS = [
  { label: "Total Turbines", value: "500", icon: Wind, color: "text-brand-amber" },
  { label: "High Stress", value: "38", icon: AlertTriangle, color: "text-terrain-complex" },
  { label: "Avg True Age", value: "14.2 yr", icon: Activity, color: "text-scada" },
  { label: "Sites Monitored", value: "12", icon: MapPin, color: "text-terrain-coastal" },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* Map Area */}
      <div className="flex-1 relative bg-brand-surface rounded-lg m-4 mr-0 lg:mr-4 overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <MapPin className="h-12 w-12 text-brand-muted/40" />
          <p className="font-mono text-sm text-brand-muted">
            Mapbox integration — next branch
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <aside className="w-full lg:w-96 flex flex-col gap-4 p-4 overflow-y-auto">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-brand-surface border-brand-border">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-xs font-body text-brand-muted">
                      {stat.label}
                    </span>
                  </div>
                  <p className="font-mono font-semibold text-2xl text-brand-text">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Terrain Legend */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-extrabold text-base text-brand-text">
              Terrain Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.entries(TERRAIN_CONFIG) as [TerrainClass, typeof TERRAIN_CONFIG[TerrainClass]][]).map(
              ([key, config]) => (
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
              )
            )}
          </CardContent>
        </Card>

        {/* Turbine List Placeholder */}
        <Card className="bg-brand-surface border-brand-border flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-extrabold text-base text-brand-text">
              Turbine List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Wind className="h-8 w-8 text-brand-muted/40" />
              <p className="text-sm font-body text-brand-muted text-center">
                Turbine data loads when connected to the API
              </p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
