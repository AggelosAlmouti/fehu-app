"use client";

import { useId } from "react";
import type { MonthlyTotal } from "@/lib/data";

// Colors come from the theme tokens (via inline style — CSS variables aren't
// reliable inside SVG presentation attributes) so the chart can't drift.
const SPEND_COLOR = "var(--foreground)";
const INCOME_COLOR = "var(--accent)";
const GRID_COLOR = "var(--border-strong)";
const AXIS_COLOR = "var(--muted)";
const MARKER_OUTLINE = "var(--background)";

const WIDTH = 300;
const PAD_LEFT = 14;
const PAD_RIGHT = 14;
const PAD_TOP = 10;
const CHART_HEIGHT = 88;
const PAD_BOTTOM = 18;
const HEIGHT = PAD_TOP + CHART_HEIGHT + PAD_BOTTOM;
const BASELINE_Y = PAD_TOP + CHART_HEIGHT;

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

export function InsightsChart({ points }: { points: MonthlyTotal[] }) {
  const gradientId = useId().replace(/:/g, "");

  if (points.length === 0) return null;

  const maxValue = Math.max(1, ...points.map((p) => Math.max(p.spent, p.earned)));
  const niceMax = niceCeiling(maxValue);
  const usableWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const xStep = points.length > 1 ? usableWidth / (points.length - 1) : 0;
  const x = (i: number) => PAD_LEFT + (points.length > 1 ? i * xStep : usableWidth / 2);
  const y = (value: number) => BASELINE_Y - (value / niceMax) * CHART_HEIGHT;

  const spentPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.spent)}`).join(" ");
  const earnedPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.earned)}`).join(" ");
  const areaPath =
    points.length > 1
      ? `${spentPath} L${x(points.length - 1)},${BASELINE_Y} L${x(0)},${BASELINE_Y} Z`
      : "";

  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  const lastIndex = points.length - 1;

  return (
    <div className="mb-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block w-full"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        role="img"
        aria-label={`Monthly spending and income for the last ${points.length} months`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: SPEND_COLOR }} stopOpacity="0.22" />
            <stop offset="100%" style={{ stopColor: SPEND_COLOR }} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, niceMax / 2, niceMax].map((value) => (
          <line
            key={value}
            x1={PAD_LEFT}
            y1={y(value)}
            x2={WIDTH - PAD_RIGHT}
            y2={y(value)}
            style={{ stroke: GRID_COLOR }}
            strokeWidth="1"
            strokeDasharray="2,3"
          />
        ))}

        {points.map(
          (p, i) =>
            (i % labelStep === 0 || i === lastIndex) && (
              <text key={p.key} x={x(i)} y={HEIGHT - 4} textAnchor="middle" fontSize="8" style={{ fill: AXIS_COLOR }}>
                {p.label}
              </text>
            ),
        )}

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {points.length > 1 && (
          <path
            d={earnedPath}
            fill="none"
            style={{ stroke: INCOME_COLOR }}
            strokeWidth="2"
            strokeOpacity="0.7"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {points.length > 1 && (
          <path
            d={spentPath}
            fill="none"
            style={{ stroke: SPEND_COLOR }}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        <circle cx={x(lastIndex)} cy={y(points[lastIndex].earned)} r="4" style={{ fill: INCOME_COLOR, stroke: MARKER_OUTLINE }} strokeWidth="2" />
        <circle cx={x(lastIndex)} cy={y(points[lastIndex].spent)} r="4" style={{ fill: SPEND_COLOR, stroke: MARKER_OUTLINE }} strokeWidth="2" />
      </svg>

      <div className="mt-2 flex items-center gap-4 text-label">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true" />
          Spending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          Income
        </span>
      </div>
    </div>
  );
}
