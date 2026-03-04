"use client";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: { turbine: 24, text: "text-lg", gap: "gap-1.5" },
  md: { turbine: 32, text: "text-2xl", gap: "gap-2" },
  lg: { turbine: 44, text: "text-3xl", gap: "gap-3" },
} as const;

type LogoSize = keyof typeof SIZES;

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

export default function Logo({ size = "md", className }: LogoProps) {
  const config = SIZES[size];
  const s = config.turbine;
  const cx = s / 2;
  const cy = s * 0.42;
  const bladeLength = s * 0.38;
  const bladeWidth = s * 0.1;
  const hubRadius = s * 0.06;
  const towerTop = cy + hubRadius + 1;
  const towerBottom = s * 0.92;
  const towerWidth = s * 0.04;

  return (
    <div className={cn("flex items-center", config.gap, className)}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Tower */}
        <line
          x1={cx}
          y1={towerTop}
          x2={cx}
          y2={towerBottom}
          className="stroke-brand-muted/30"
          strokeWidth={towerWidth}
          strokeLinecap="round"
        />

        {/* Spinning blades group */}
        <g className="origin-center animate-spin-turbine" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          {/* Blade 1 — pointing up */}
          <path
            d={`M ${cx} ${cy} L ${cx - bladeWidth / 2} ${cy - bladeLength} Q ${cx} ${cy - bladeLength - bladeWidth * 0.6} ${cx + bladeWidth / 2} ${cy - bladeLength} Z`}
            className="fill-brand-amber"
          />
          {/* Blade 2 — 120 degrees */}
          <path
            d={`M ${cx} ${cy} L ${cx - bladeWidth / 2} ${cy - bladeLength} Q ${cx} ${cy - bladeLength - bladeWidth * 0.6} ${cx + bladeWidth / 2} ${cy - bladeLength} Z`}
            className="fill-brand-amber"
            transform={`rotate(120 ${cx} ${cy})`}
          />
          {/* Blade 3 — 240 degrees */}
          <path
            d={`M ${cx} ${cy} L ${cx - bladeWidth / 2} ${cy - bladeLength} Q ${cx} ${cy - bladeLength - bladeWidth * 0.6} ${cx + bladeWidth / 2} ${cy - bladeLength} Z`}
            className="fill-brand-amber"
            transform={`rotate(240 ${cx} ${cy})`}
          />
        </g>

        {/* Hub center dot */}
        <circle cx={cx} cy={cy} r={hubRadius} className="fill-brand-amber" />
      </svg>

      {/* Wordmark */}
      <span
        className={cn(
          "font-display font-extrabold tracking-[-0.02em]",
          config.text
        )}
      >
        <span className="text-brand-text">Aero</span>
        <span className="text-brand-accent">Stress</span>
      </span>
    </div>
  );
}
