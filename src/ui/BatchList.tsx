import type { JointBatch, Sample } from "../domain/types";
import { batchColor, formatDateTime, spanHours } from "./format";

interface Props {
  batches: JointBatch[];
  samples: Sample[];
  focusBatchId: string | null;
  onFocus: (id: string | null) => void;
  onOpenSample: (id: string) => void;
}

/** 联检批列表：点选某批后，温度曲线、样本表、案件关联页同步聚焦 */
export default function BatchList({
  batches,
  samples,
  focusBatchId,
  onFocus,
  onOpenSample,
}: Props) {
  return (
    <div className="batch-list">
      {batches.map((b) => {
        const active = focusBatchId === b.id;
        return (
          <article
            key={b.id}
            className={
              "batch-card" +
              (active ? " is-focus" : "") +
              (b.source === "seed" ? " is-seed" : "")
            }
            style={{ borderTopColor: batchColor(batches, b.id) }}
          >
            <header>
              <div>
                <b>{b.code}</b>
                <span className="batch-tag">
                  {b.source === "seed" ? "既有旧批" : "本次新建"}
                </span>
              </div>
              <button
                className="link-btn"
                onClick={() => onFocus(active ? null : b.id)}
              >
                {active ? "取消聚焦" : "聚焦此批"}
              </button>
            </header>
            <p className="batch-meta">
              {b.caseIds.join(" × ")} · {b.stage} · {b.preservation}
            </p>
            <p className="batch-meta">
              {formatDateTime(b.startedAt)} → {formatDateTime(b.endedAt)}
              <em>（跨度 {spanHours(b.startedAt, b.endedAt).toFixed(1)} 小时）</em>
            </p>
            <div className="batch-samples">
              {b.sampleIds.map((id) => (
                <button
                  key={id}
                  className="batch-sample-chip"
                  onClick={() => onOpenSample(id)}
                >
                  {id}
                </button>
              ))}
            </div>
          </article>
        );
      })}
      {(() => {
        const loose = samples.filter((s) => s.batchId === null).length;
        return (
          <p className="batch-foot">
            共 {batches.length} 个联检批；在库未入批样本 {loose} 份。
          </p>
        );
      })()}
    </div>
  );
}
