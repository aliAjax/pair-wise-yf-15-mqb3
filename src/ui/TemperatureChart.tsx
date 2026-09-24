import type { JointBatch, Sample } from "../domain/types";
import { fmtDate, fmtTime } from "./format";

/** 联检批配色（按成批顺序循环） */
export const BATCH_COLORS = [
  "#365314",
  "#a16207",
  "#dc2626",
  "#1d4ed8",
  "#7c3aed",
  "#0f766e",
];

export function batchColor(
  batches: readonly JointBatch[],
  batchId: string
): string {
  const index = batches.findIndex((b) => b.id === batchId);
  const safe = ((index % BATCH_COLORS.length) + BATCH_COLORS.length) % BATCH_COLORS.length;
  return BATCH_COLORS[safe];
}

interface Props {
  samples: readonly Sample[];
  batches: readonly JointBatch[];
  batchBySample: Readonly<Record<string, string>>;
  selectedIds: readonly string[];
  onPick: (sampleId: string) => void;
}

const W = 760;
const H = 300;
const PAD = { left: 52, right: 20, top: 20, bottom: 52 };
const HOUR_MS = 3_600_000;

/** 温度记录图：横轴采样时刻、纵轴环境温度；随阶段筛选、勾选与联检编号联动 */
export function TemperatureChart({
  samples,
  batches,
  batchBySample,
  selectedIds,
  onPick,
}: Props) {
  if (samples.length === 0) {
    return <p className="empty">该发育阶段暂无样本温度记录。</p>;
  }

  const sorted = [...samples].sort(
    (a, b) => +new Date(a.sampledAt) - +new Date(b.sampledAt)
  );
  const times = sorted.map((s) => +new Date(s.sampledAt));
  const temps = sorted.map((s) => s.temperature);
  const tMin = Math.min(...times) - 6 * HOUR_MS;
  const tMax = Math.max(...times) + 6 * HOUR_MS;
  const yMin = Math.floor(Math.min(...temps)) - 1;
  const yMax = Math.ceil(Math.max(...temps)) + 1;

  const x = (t: number) =>
    PAD.left + ((t - tMin) / (tMax - tMin || 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) =>
    PAD.top + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - PAD.top - PAD.bottom);

  const yTicks = Array.from({ length: 4 }, (_, i) => yMin + ((yMax - yMin) * i) / 3);
  const linePoints = sorted
    .map((s) => `${x(+new Date(s.sampledAt))},${y(s.temperature)}`)
    .join(" ");
  const legendBatches = batches.filter((b) =>
    b.sampleIds.some((id) => sorted.some((s) => s.id === id))
  );

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="样本环境温度曲线">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              className="grid"
            />
            <text x={PAD.left - 8} y={y(tick) + 4} className="tick" textAnchor="end">
              {tick.toFixed(0)}℃
            </text>
          </g>
        ))}

        {sorted.length > 1 && <polyline points={linePoints} className="temp-line" />}

        {sorted.map((s) => {
          const batchId = batchBySample[s.id];
          const selected = selectedIds.includes(s.id);
          const cx = x(+new Date(s.sampledAt));
          const cy = y(s.temperature);
          return (
            <g
              key={s.id}
              className="dot"
              onClick={() => onPick(s.id)}
              style={{ cursor: "pointer" }}
            >
              <title>
                {`${s.id} · ${fmtDate(s.sampledAt)} ${fmtTime(s.sampledAt)} · ${s.temperature.toFixed(1)}℃${
                  batchId ? ` · ${batchId}` : ""
                }`}
              </title>
              {selected && <circle cx={cx} cy={cy} r={11} className="dot-ring" />}
              <circle
                cx={cx}
                cy={cy}
                r={6}
                fill={batchId ? batchColor(batches, batchId) : "#94a3b8"}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text x={cx} y={H - PAD.bottom + 18} className="tick" textAnchor="middle">
                {fmtDate(s.sampledAt)}
              </text>
              <text x={cx} y={H - PAD.bottom + 32} className="tick" textAnchor="middle">
                {fmtTime(s.sampledAt)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="legend">
        <span className="legend-item">
          <i style={{ background: "#94a3b8" }} /> 待联检
        </span>
        <span className="legend-item">
          <i className="ring-demo" /> 已勾选
        </span>
        {legendBatches.map((b) => (
          <span key={b.id} className="legend-item">
            <i style={{ background: batchColor(batches, b.id) }} /> {b.id}
          </span>
        ))}
      </div>
    </div>
  );
}
