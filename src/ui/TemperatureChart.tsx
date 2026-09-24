import { useMemo, useState } from "react";
import type { JointBatch, Sample } from "../domain/types";
import { batchColor, formatDateTime } from "./format";

interface Props {
  samples: Sample[];
  batches: JointBatch[];
  selectedIds: string[];
  focusBatchId: string | null;
  onPick: (id: string) => void;
}

const W = 760;
const H = 260;
const PAD = { top: 24, right: 24, bottom: 40, left: 46 };

/** 温度记录图：采样时刻 × 环境温度；同联检批的点用同色折线相连，
 *  联检编号一同步，曲线随之成组变化。 */
export default function TemperatureChart({
  samples,
  batches,
  selectedIds,
  focusBatchId,
  onPick,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const model = useMemo(() => {
    if (samples.length === 0) return null;
    const times = samples.map((s) => new Date(s.sampledAt).getTime());
    const temps = samples.map((s) => s.temperature);
    const minX = Math.min(...times);
    const maxX = Math.max(...times);
    const minY = Math.floor(Math.min(...temps) - 2);
    const maxY = Math.ceil(Math.max(...temps) + 2);
    const sx = (iso: string) => {
      const t = new Date(iso).getTime();
      const ratio = maxX === minX ? 0.5 : (t - minX) / (maxX - minX);
      return PAD.left + ratio * (W - PAD.left - PAD.right);
    };
    const sy = (t: number) =>
      PAD.top + (1 - (t - minY) / (maxY - minY)) * (H - PAD.top - PAD.bottom);

    const grouped = new Map<string | null, Sample[]>();
    for (const s of samples) {
      const list = grouped.get(s.batchId) ?? [];
      list.push(s);
      grouped.set(s.batchId, list);
    }
    const groups = Array.from(grouped.entries()).map(([batchId, list]) => ({
      batchId,
      points: [...list].sort(
        (a, b) =>
          new Date(a.sampledAt).getTime() - new Date(b.sampledAt).getTime(),
      ),
    }));
    return { minX, maxX, minY, maxY, sx, sy, groups };
  }, [samples]);

  if (!model) {
    return (
      <div className="chart-empty">当前筛选下没有温度记录点</div>
    );
  }

  const { minY, maxY, sx, sy, groups } = model;
  const ticks = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i);
  const xTicks = Array.from(
    new Set(
      samples.map((s) =>
        new Date(s.sampledAt).toISOString().slice(0, 10),
      ),
    ),
  ).sort();

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img"
        aria-label="环境温度随采样时刻变化曲线">
        {/* 温度网格 */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={sy(t)}
              y2={sy(t)}
              className="chart-grid"
            />
            <text x={PAD.left - 8} y={sy(t) + 4} className="chart-tick"
              textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {xTicks.map((day) => {
          const anySample = samples.find(
            (s) => new Date(s.sampledAt).toISOString().slice(0, 10) === day,
          );
          if (!anySample) return null;
          const x = sx(anySample.sampledAt);
          return (
            <text key={day} x={x} y={H - 12} className="chart-tick"
              textAnchor="middle">
              {day.slice(5)}
            </text>
          );
        })}

        {/* 同批折线 */}
        {groups.map(({ batchId, points }) => {
          if (!batchId || points.length < 2) return null;
          const d = points
            .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.sampledAt)},${sy(p.temperature)}`)
            .join(" ");
          const dim = focusBatchId !== null && focusBatchId !== batchId;
          return (
            <path
              key={batchId}
              d={d}
              className="chart-line"
              stroke={batchColor(batches, batchId)}
              style={{ opacity: dim ? 0.18 : 1 }}
            />
          );
        })}

        {/* 勾选暂存连线（尚未建批） */}
        {selectedIds.length >= 2 && (
          <polyline
            className="chart-line chart-line-draft"
            points={samples
              .filter((s) => selectedIds.includes(s.id))
              .sort(
                (a, b) =>
                  new Date(a.sampledAt).getTime() -
                  new Date(b.sampledAt).getTime(),
              )
              .map((s) => `${sx(s.sampledAt)},${sy(s.temperature)}`)
              .join(" ")}
          />
        )}

        {/* 数据点 */}
        {samples.map((s) => {
          const selected = selectedIds.includes(s.id);
          const dim = focusBatchId !== null && s.batchId !== focusBatchId;
          return (
            <g
              key={s.id}
              className="chart-point"
              onClick={() => onPick(s.id)}
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(null)}
              opacity={focusBatchId !== null && dim ? 0.3 : 1}
            >
              <circle
                cx={sx(s.sampledAt)}
                cy={sy(s.temperature)}
                r={selected ? 7 : 5}
                className={s.batchId ? "chart-dot chart-dot-batched" : "chart-dot"}
                fill={s.batchId ? batchColor(batches, s.batchId) : "#ffffff"}
                stroke={s.batchId ? batchColor(batches, s.batchId) : "#94a3b8"}
              />
              <text
                x={sx(s.sampledAt)}
                y={sy(s.temperature) - 10}
                className="chart-label"
                textAnchor="middle"
              >
                {s.temperature.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (() => {
        const s = samples.find((x) => x.id === hover);
        if (!s) return null;
        const batch = s.batchId
          ? batches.find((b) => b.id === s.batchId)
          : null;
        return (
          <div
            className="chart-tooltip"
            style={{
              left: `${(sx(s.sampledAt) / W) * 100}%`,
              top: `${(sy(s.temperature) / H) * 100}%`,
            }}
          >
            <b>{s.id}</b>
            <span>{formatDateTime(s.sampledAt)} · {s.temperature}℃</span>
            {batch && <em>{batch.code}</em>}
          </div>
        );
      })()}

      <div className="chart-legend">
        <span><i className="legend-draft" />勾选暂存</span>
        {batches.map((b) => (
          <span key={b.id}>
            <i style={{ background: batchColor(batches, b.id) }} />
            {b.code}
            {b.source === "seed" && <small>（旧批）</small>}
          </span>
        ))}
      </div>
    </div>
  );
}
