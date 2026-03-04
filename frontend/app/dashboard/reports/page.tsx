"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, FileDown, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFarmStore } from "@/stores/useFarmStore";
import { TERRAIN_CONFIG, CRITICAL_ACTION_PERCENTILE } from "@/lib/constants";
import type { Turbine, TerrainClass } from "@/lib/types";

export default function CriticalActionReportPage() {
  const turbines = useFarmStore((s) => s.turbines);
  const isLoading = useFarmStore((s) => s.isLoading);
  const error = useFarmStore((s) => s.error);
  const fetchTurbines = useFarmStore((s) => s.fetchTurbines);

  useEffect(() => {
    if (turbines.length === 0 && !isLoading && !error) {
      fetchTurbines();
    }
  }, [turbines.length, isLoading, error, fetchTurbines]);

  const flaggedTurbines = useMemo(() => {
    if (turbines.length === 0) return [];
    const sorted = [...turbines].sort(
      (a, b) => b.true_age_years - a.true_age_years
    );
    const count = Math.max(1, Math.ceil(turbines.length * CRITICAL_ACTION_PERCENTILE));
    return sorted.slice(0, count);
  }, [turbines]);

  const summaryStats = useMemo(() => {
    if (flaggedTurbines.length === 0) {
      return {
        totalFlagged: 0,
        avgTrueAge: 0,
        mostCommonTerrain: null,
      };
    }

    const avgTrueAge =
      flaggedTurbines.reduce((sum, t) => sum + t.true_age_years, 0) /
      flaggedTurbines.length;

    const terrainCounts: Record<string, number> = {};
    flaggedTurbines.forEach((t) => {
      terrainCounts[t.terrain_class] =
        (terrainCounts[t.terrain_class] || 0) + 1;
    });

    const mostCommonTerrain = Object.entries(terrainCounts).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0] as TerrainClass;

    return {
      totalFlagged: flaggedTurbines.length,
      avgTrueAge,
      mostCommonTerrain,
    };
  }, [flaggedTurbines]);

  const reportDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3">
        <Loader2 className="h-8 w-8 text-brand-amber animate-spin" />
        <p className="font-mono text-sm text-brand-muted">
          Loading turbine data...
        </p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3">
        <AlertTriangle className="h-8 w-8 text-terrain-complex" />
        <p className="font-body text-sm text-brand-muted text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  // ── No Data State ──
  if (turbines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3">
        <FileText className="h-8 w-8 text-brand-muted/40" />
        <p className="font-body text-sm text-brand-muted">
          No turbine data available to generate report
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-brand-text">
            Critical Action Report
          </h1>
          <p className="font-body text-sm text-brand-muted mt-1.5 max-w-2xl">
            Top {(CRITICAL_ACTION_PERCENTILE * 100).toFixed(0)}% of turbines
            ranked by True Age (stress-adjusted aging). These assets require
            immediate inspection and potential intervention.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <p className="font-mono text-xs text-brand-muted">
              Generated: {reportDate}
            </p>
            <span className="text-brand-muted/40">•</span>
            <p className="font-mono text-xs text-brand-muted">
              Total Turbines: {turbines.length}
            </p>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled variant="outline" className="shrink-0">
                <FileDown className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">
                PDF generation coming soon (Jagger)
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs text-brand-muted uppercase tracking-wider">
              Total Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono font-semibold text-3xl text-brand-accent">
              {summaryStats.totalFlagged}
            </p>
            <p className="font-body text-xs text-brand-muted mt-1">
              Turbines requiring action
            </p>
          </CardContent>
        </Card>

        <Card className="bg-brand-surface border-brand-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs text-brand-muted uppercase tracking-wider">
              Avg True Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono font-semibold text-3xl text-brand-text">
              {summaryStats.avgTrueAge.toFixed(1)}
            </p>
            <p className="font-body text-xs text-brand-muted mt-1">
              Years (stress-adjusted)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-brand-surface border-brand-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs text-brand-muted uppercase tracking-wider">
              Most Common Terrain
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryStats.mostCommonTerrain && (
              <>
                <Badge
                  variant="secondary"
                  className="font-mono font-semibold text-sm"
                  style={{
                    color:
                      TERRAIN_CONFIG[summaryStats.mostCommonTerrain].color,
                  }}
                >
                  {TERRAIN_CONFIG[summaryStats.mostCommonTerrain].label}
                </Badge>
                <p className="font-body text-xs text-brand-muted mt-2">
                  Among flagged turbines
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Flagged Turbines Table ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            Flagged Turbines
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-4 py-3 font-mono text-xs text-brand-muted uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs text-brand-muted uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs text-brand-muted uppercase tracking-wider">
                    State
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs text-brand-muted uppercase tracking-wider">
                    Terrain Class
                  </th>
                  <th className="text-right px-4 py-3 font-mono text-xs text-brand-muted uppercase tracking-wider">
                    Calendar Age
                  </th>
                  <th className="text-right px-4 py-3 font-mono text-xs text-brand-muted uppercase tracking-wider">
                    Stress Multiplier
                  </th>
                  <th className="text-right px-4 py-3 font-mono text-xs text-brand-muted uppercase tracking-wider">
                    True Age
                  </th>
                  <th className="text-center px-4 py-3 font-mono text-xs text-brand-muted uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {flaggedTurbines.map((turbine, index) => (
                  <TurbineRow
                    key={turbine.id}
                    turbine={turbine}
                    rank={index + 1}
                    isEven={index % 2 === 0}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Table Row ──

function TurbineRow({
  turbine,
  rank,
  isEven,
}: {
  turbine: Turbine;
  rank: number;
  isEven: boolean;
}) {
  const terrainConfig = TERRAIN_CONFIG[turbine.terrain_class as TerrainClass];

  return (
    <tr className={isEven ? "bg-brand-surface" : "bg-brand-surface2"}>
      <td className="px-4 py-3 font-mono font-semibold text-sm text-brand-accent">
        {rank}
      </td>
      <td className="px-4 py-3 font-body text-sm text-brand-text">
        {turbine.project_name}
      </td>
      <td className="px-4 py-3 font-mono text-sm text-brand-muted">
        {turbine.state}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="secondary"
          className="font-mono font-semibold text-xs"
          style={{ color: terrainConfig.color }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full mr-1.5"
            style={{ backgroundColor: terrainConfig.color }}
          />
          {turbine.terrain_class}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold text-sm text-brand-text">
        {turbine.calendar_age_years.toFixed(1)}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold text-sm text-brand-text">
        {turbine.stress_multiplier.toFixed(2)}x
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold text-sm text-brand-accent">
        {turbine.true_age_years.toFixed(1)}
      </td>
      <td className="px-4 py-3 text-center">
        <Link
          href={`/dashboard/turbines/${turbine.id}`}
          className="text-sm font-mono text-brand-amber hover:underline"
        >
          View
        </Link>
      </td>
    </tr>
  );
}
