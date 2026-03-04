"use client";

import Link from "next/link";
import { Wind, AlertTriangle, Loader2 } from "lucide-react";
import { useFarmStore } from "@/stores/useFarmStore";
import { TERRAIN_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Turbine, TerrainClass } from "@/lib/types";

interface TurbineListPanelProps {
  onTurbineClick: (turbine: Turbine) => void;
}

export default function TurbineListPanel({
  onTurbineClick,
}: TurbineListPanelProps) {
  const isLoading = useFarmStore((s) => s.isLoading);
  const error = useFarmStore((s) => s.error);
  const selectedTurbineId = useFarmStore((s) => s.selectedTurbineId);
  const filteredTurbines = useFarmStore((s) => s.getFilteredTurbines());

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-6 w-6 text-brand-amber animate-spin" />
        <p className="text-sm font-body text-brand-muted">
          Loading turbines...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertTriangle className="h-6 w-6 text-terrain-complex" />
        <p className="text-sm font-body text-brand-muted text-center">
          {error}
        </p>
      </div>
    );
  }

  if (filteredTurbines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Wind className="h-6 w-6 text-brand-muted/40" />
        <p className="text-sm font-body text-brand-muted text-center">
          No turbines match the current filter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-mono text-brand-muted px-1">
        {filteredTurbines.length} turbine
        {filteredTurbines.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-1">
        {filteredTurbines.map((turbine) => {
          const handleClick = () => onTurbineClick(turbine);

          return (
            <TurbineListItem
              key={turbine.id}
              turbine={turbine}
              isSelected={turbine.id === selectedTurbineId}
              onClick={handleClick}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── List Item ──

function TurbineListItem({
  turbine,
  isSelected,
  onClick,
}: {
  turbine: Turbine;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = TERRAIN_CONFIG[turbine.terrain_class as TerrainClass];

  return (
    <Link
      href={`/dashboard/turbines/${turbine.id}`}
      onClick={onClick}
      className={cn(
        "block w-full text-left px-3 py-2.5 rounded-lg transition-colors",
        isSelected
          ? "bg-brand-surface2 ring-1 ring-brand-amber/40"
          : "hover:bg-brand-surface2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-body text-brand-text truncate">
            {turbine.project_name}
          </p>
          <p className="text-xs font-body text-brand-muted mt-0.5">
            {turbine.manufacturer} — {turbine.state}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span
            className="text-[10px] font-mono font-semibold uppercase"
            style={{ color: config.color }}
          >
            {turbine.terrain_class}
          </span>
        </div>
      </div>

      <div className="flex gap-4 mt-1.5">
        <div>
          <span className="text-[10px] font-mono text-brand-muted">
            True Age
          </span>
          <p
            className="font-mono font-semibold text-sm leading-tight"
            style={{ color: config.color }}
          >
            {turbine.true_age_years.toFixed(1)}
            <span className="text-[10px] text-brand-muted ml-0.5">yr</span>
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-brand-muted">
            Calendar
          </span>
          <p className="font-mono font-semibold text-sm text-brand-text leading-tight">
            {turbine.calendar_age_years.toFixed(1)}
            <span className="text-[10px] text-brand-muted ml-0.5">yr</span>
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-brand-muted">
            Capacity
          </span>
          <p className="font-mono font-semibold text-sm text-brand-text leading-tight">
            {turbine.capacity_kw}
            <span className="text-[10px] text-brand-muted ml-0.5">kW</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
