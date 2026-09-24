import type { JointBatch } from "../domain/types";
import { hoursBetween } from "../domain/judgment";
import { fmtDateTime, fmtHours } from "./format";
import { BATCH_COLORS, batchColor } from "./TemperatureChart";

interface Props {
  batches: readonly JointBatch[];
  onInspect: (sampleId: string) => void;
}

/** 联检批次列表：旧批只读展示，编号同步到名册、案件与详情 */
export function BatchList({ batches, onInspect }: Props) {
  if (batches.length === 0) {
    return (
      <p className="empty">
        尚未建立联检批 —— 在上方名册勾选至少两份样本，通过判定后成批。
      </p>
    );
  }

  return (
    <div className="batch-grid">
      {batches.map((b, i) => (
        <article
          key={b.id}
          className="batch-card"
          style={{ borderTopColor: BATCH_COLORS[i % BATCH_COLORS.length] }}
        >
          <div className="batch-head">
            <strong style={{ color: batchColor(batches, b.id) }}>{b.id}</strong>
            <span className="muted">成批 {fmtDateTime(b.filedAt)}</span>
          </div>
          <p className="muted">
            {b.species} · {b.stage} · {b.preservation}
          </p>
          <p className="muted">
            采样窗 {fmtDateTime(b.windowStart)} ~ {fmtDateTime(b.windowEnd)}（跨度{" "}
            {fmtHours(hoursBetween(b.windowStart, b.windowEnd))}）
          </p>
          <div className="member-chips">
            {b.sampleIds.map((id) => (
              <button key={id} className="chip" onClick={() => onInspect(id)}>
                {id}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
