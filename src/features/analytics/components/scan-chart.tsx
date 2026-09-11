import { formatCount } from "@/features/analytics/utils/format";
import type { TimeseriesPoint } from "@/features/analytics/types";

interface ScanChartProps {
  data: TimeseriesPoint[];
  className?: string;
}

const WIDTH = 640;
const HEIGHT = 200;
const PAD = { top: 14, right: 10, bottom: 28, left: 10 };
const GRID_LINES = 4;

/**
 * Dependency-free SVG bar chart. Deterministic, dark-mode safe (uses theme
 * colors), and accessible: the bars carry <title> tooltips and the chart
 * exposes a textual summary via aria-label.
 */
export function ScanChart({ data, className }: ScanChartProps) {
  const points = data.filter((d) => d.bucket);
  const max = points.reduce((m, d) => Math.max(m, d.count), 0);
  const yMax = Math.max(4, Math.ceil((max * 1.15) / 4) * 4);
  const total = points.reduce((acc, d) => acc + d.count, 0);

  if (points.length === 0 || total === 0) {
    return (
      <div
        className={`flex h-44 items-center justify-center text-sm text-muted-foreground ${className ?? ""}`}
        aria-label="No scan data"
      >
        —
      </div>
    );
  }

  const step = (WIDTH - PAD.left - PAD.right) / points.length;
  const barWidth = Math.max(2, Math.min(step * 0.6, 22));
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const y = (value: number) => PAD.top + plotHeight * (1 - value / yMax);
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const gridValues = Array.from({ length: GRID_LINES }, (_, i) => (yMax / GRID_LINES) * (i + 1));

  return (
    <div className={className} dir="ltr">
      <div className="mb-1 text-right text-xs text-muted-foreground">
        {formatCount(yMax)}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-44"
        role="img"
        aria-label={`${points.length} buckets, ${formatCount(total)} scans total`}
        preserveAspectRatio="none"
      >
        {/* horizontal gridlines */}
        {gridValues.map((v) => (
          <line
            key={v}
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y(v)}
            y2={y(v)}
            className="stroke-border"
            strokeWidth={1}
          />
        ))}

        {/* bars */}
        {points.map((d, i) => {
          const barHeight = Math.max(d.count > 0 ? 1 : 0, (d.count / yMax) * plotHeight);
          const x = PAD.left + i * step + (step - barWidth) / 2;
          return (
            <g key={d.bucket}>
              <rect
                x={x}
                y={y(d.count)}
                width={barWidth}
                height={barHeight}
                className="fill-primary/70 hover:fill-primary transition-colors"
                rx={Math.min(3, barWidth / 2)}
              >
                <title>{`${d.bucket} — ${formatCount(d.count)} scan${d.count === 1 ? "" : "s"}`}</title>
              </rect>
            </g>
          );
        })}

        {/* x labels */}
        {points.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={`label-${d.bucket}`}
              x={PAD.left + i * step + step / 2}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {shortBucket(d.bucket)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

/** Compact bucket label for the axis ("2026-08-12" -> "12/08", "2026-08" -> "08/26"). */
function shortBucket(bucket: string): string {
  const m = bucket.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (m) return `${m[2]}/${m[1]}`;
  const mo = bucket.match(/^(\d{4})-(\d{2})$/);
  if (mo) return `${mo[2]}/${mo[1].slice(2)}`;
  const hour = bucket.match(/\d{2}:00$/);
  if (hour) return hour[0];
  return bucket.slice(0, 10);
}