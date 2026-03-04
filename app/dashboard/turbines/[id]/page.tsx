"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Wind,
  Calendar,
  MapPin,
  Hash,
  Zap,
  ShieldAlert,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFarmStore } from "@/stores/useFarmStore";
import { getTurbineById } from "@/lib/api";
import { TERRAIN_CONFIG, KW_TO_MW_DIVISOR } from "@/lib/constants";
import type { Turbine, TerrainClass } from "@/lib/types";

export default function TurbineDetailPage() {
  const params = useParams<{ id: string }>();
  const turbineId = params.id;

  const [turbine, setTurbine] = useState<Turbine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const turbines = useFarmStore((s) => s.turbines);
  const fetchTurbines = useFarmStore((s) => s.fetchTurbines);

  useEffect(() => {
    const loadTurbine = async () => {
      if (!turbineId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await getTurbineById(turbineId);

        if (data) {
          setTurbine(data);
        } else {
          const fallback = turbines.find((t) => t.id === turbineId);
          if (fallback) {
            setTurbine(fallback);
          } else {
            if (turbines.length === 0) {
              await fetchTurbines();
              const refetch = turbines.find((t) => t.id === turbineId);
              setTurbine(refetch ?? null);
            } else {
              setTurbine(null);
            }
          }
        }
      } catch (err) {
        const fallback = turbines.find((t) => t.id === turbineId);
        if (fallback) {
          setTurbine(fallback);
          setError(null);
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load turbine data"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTurbine();
  }, [turbineId, turbines, fetchTurbines]);

  const terrainConfig = useMemo(() => {
    if (!turbine) return null;
    return TERRAIN_CONFIG[turbine.terrain_class as TerrainClass];
  }, [turbine]);

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
        <Link
          href="/dashboard"
          className="text-sm font-mono text-brand-amber hover:underline mt-2"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── Not Found State ──
  if (!turbine || !terrainConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3">
        <Wind className="h-8 w-8 text-brand-muted/40" />
        <p className="font-body text-sm text-brand-muted">
          Turbine not found
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-mono text-brand-amber hover:underline mt-2"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const capacityMw = turbine.capacity_kw / KW_TO_MW_DIVISOR;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-mono text-brand-muted hover:text-brand-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display font-extrabold text-2xl text-brand-text">
            {turbine.project_name}
          </h1>
          <Badge
            variant="secondary"
            className="font-mono font-semibold text-xs"
            style={{ color: terrainConfig.color }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full mr-1.5"
              style={{ backgroundColor: terrainConfig.color }}
            />
            {terrainConfig.label}
          </Badge>
        </div>
        <p className="font-body text-sm text-brand-muted mt-1">
          {turbine.manufacturer} {turbine.model} — {turbine.state}
        </p>
      </div>

      {/* ── True Age Breakdown (Hero Card) ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            True Age Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 flex-wrap">
            {/* Calendar Age */}
            <div className="text-center">
              <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
                Calendar Age
              </p>
              <p className="font-mono font-semibold text-3xl text-brand-text">
                {turbine.calendar_age_years.toFixed(1)}
              </p>
              <p className="text-xs font-mono text-brand-muted">yrs</p>
            </div>

            <span className="font-body text-2xl text-brand-muted pb-5">×</span>

            {/* Stress Multiplier */}
            <div className="text-center">
              <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
                Stress Multiplier
              </p>
              <p
                className="font-mono font-semibold text-3xl"
                style={{ color: terrainConfig.color }}
              >
                {turbine.stress_multiplier.toFixed(2)}x
              </p>
              <p className="text-xs font-mono text-brand-muted">
                {terrainConfig.risk}
              </p>
            </div>

            <span className="font-body text-2xl text-brand-muted pb-5">=</span>

            {/* True Age */}
            <div className="text-center">
              <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
                True Age
              </p>
              <p className="font-mono font-semibold text-3xl text-brand-accent">
                {turbine.true_age_years.toFixed(1)}
              </p>
              <p className="text-xs font-mono text-brand-muted">yrs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Turbine Specs ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            Turbine Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SpecItem
              icon={Zap}
              label="Capacity"
              value={`${capacityMw.toFixed(2)} MW`}
            />
            <SpecItem
              icon={Calendar}
              label="Year Operational"
              value={String(turbine.year_operational)}
            />
            <SpecItem
              icon={MapPin}
              label="Location"
              value={
                turbine.county
                  ? `${turbine.county}, ${turbine.state}`
                  : turbine.state
              }
            />
            <SpecItem
              icon={Hash}
              label="USWTDB Case ID"
              value={String(turbine.case_id)}
            />
            <SpecItem
              icon={ShieldAlert}
              label="Risk Level"
              value={terrainConfig.risk}
              valueColor={terrainConfig.color}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Inspection History (Placeholder) ── */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-extrabold text-base text-brand-text">
            Inspection History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <ClipboardList className="h-8 w-8 text-brand-muted/40" />
            <p className="font-body text-sm text-brand-muted text-center max-w-sm">
              No inspections recorded yet. Inspection logging will be available
              in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Spec Item ──

function SpecItem({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-brand-muted shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
          {label}
        </p>
        <p
          className="font-mono font-semibold text-sm text-brand-text"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
