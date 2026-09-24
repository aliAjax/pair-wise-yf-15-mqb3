import type { CaseFile, RejectCode, Sample } from "../domain/types";
import { REJECT_TEXT, sampleStatus } from "../domain/rules";
import { batchColor, formatDateTime } from "./format";
import type { JointBatch } from "../domain/types";

interface Props {
  samples: Sample[];
  cases: CaseFile[];
  batches: JointBatch[];
  selectedIds: string[];
  reasonsById: Record<string, RejectCode[]>;
  acceptedIds: string[];
  focusBatchId: string | null;
  reviewing: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}

/** 样本勾选台：鉴定员在此挑选跨案样本建立联检批 */
export default function SampleTable({
  samples,
  cases,
  batches,
  selectedIds,
  reasonsById,
  acceptedIds,
  focusBatchId,
  reviewing,
  onToggle,
  onOpen,
}: Props) {
  if (samples.length === 0) {
    return <p className="empty-hint">该阶段下暂无样本。</p>;
  }

  return (
    <div className="sample-table">
      <div className="sample-row sample-head">
        <span>选</span>
        <span>样本 / 案件</span>
        <span>虫种 · 发育阶段</span>
        <span>采样时刻</span>
        <span>温度 / 保存</span>
        <span>状态</span>
      </div>

      {samples.map((s) => {
        const caseFile = cases.find((c) => c.id === s.caseId);
        const status = sampleStatus(s, cases);
        const checked = selectedIds.includes(s.id);
        const reasons = reasonsById[s.id] ?? [];
        const accepted = acceptedIds.includes(s.id);
        const batch = s.batchId
          ? batches.find((b) => b.id === s.batchId)
          : null;
        const dim = focusBatchId !== null && s.batchId !== focusBatchId;

        return (
          <div
            key={s.id}
            className={[
              "sample-row",
              checked ? "is-checked" : "",
              accepted ? "is-accepted" : "",
              reasons.length ? "is-rejected" : "",
              dim ? "is-dim" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <label className="pick" title={status ? status : "勾选入批候选"}>
              <input
                type="checkbox"
                checked={checked}
                disabled={false}
                onChange={() => onToggle(s.id)}
              />
            </label>

            <button className="cell-link" onClick={() => onOpen(s.id)}>
              <b>{s.id}</b>
              <small>
                {caseFile?.id} · {caseFile?.name}
                {caseFile?.sealed && <em className="sealed-tag">封存</em>}
              </small>
            </button>

            <div className="cell">
              <span>{s.species}</span>
              <small>{s.stageDetail}（{s.stage}）</small>
            </div>

            <div className="cell">
              <span>{formatDateTime(s.sampledAt)}</span>
            </div>

            <div className="cell">
              <span>{s.temperature.toFixed(1)}℃ · {s.preservation}</span>
            </div>

            <div className="cell status-cell">
              {batch ? (
                <span
                  className="badge batch-badge"
                  style={{
                    color: batchColor(batches, batch.id),
                    borderColor: batchColor(batches, batch.id),
                  }}
                >
                  {batch.code}
                </span>
              ) : status ? (
                <span
                  className={
                    "badge " +
                    (status === "案件封存" ? "badge-sealed" : "badge-locked")
                  }
                >
                  {status}
                </span>
              ) : (
                <span className="badge badge-free">在库可检</span>
              )}
            </div>

            {reviewing && checked && (reasons.length > 0 || accepted) && (
              <div className="row-verdict">
                {accepted && (
                  <span className="verdict-ok">符合入批条件</span>
                )}
                {reasons.map((code) => (
                  <span key={code} className="verdict-no">
                    退回：{REJECT_TEXT[code]}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
