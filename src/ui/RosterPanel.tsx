import type { CaseFile, Sample } from "../domain/types";
import type { BatchJudgment } from "../domain/judgment";
import { verdictOf } from "../domain/judgment";
import { fmtDateTime } from "./format";

interface Props {
  samples: readonly Sample[];
  cases: readonly CaseFile[];
  selectedIds: readonly string[];
  judgment: BatchJudgment;
  batchBySample: Readonly<Record<string, string>>;
  focusId: string | null;
  onToggle: (sampleId: string) => void;
  onInspect: (sampleId: string) => void;
}

/** 样本名册：勾选建批，实时展示判定结论与退回理由 */
export function RosterPanel({
  samples,
  cases,
  selectedIds,
  judgment,
  batchBySample,
  focusId,
  onToggle,
  onInspect,
}: Props) {
  const sealedCases = new Set(cases.filter((c) => c.sealed).map((c) => c.id));

  if (samples.length === 0) {
    return <p className="empty">该发育阶段暂无样本，请切换筛选。</p>;
  }

  return (
    <div className="roster">
      {samples.map((s) => {
        const checked = selectedIds.includes(s.id);
        const verdict = checked ? verdictOf(judgment, s.id) : undefined;
        const batchId = batchBySample[s.id];
        const sealed = sealedCases.has(s.caseId);
        const rowClass = [
          "roster-row",
          checked ? "checked" : "",
          verdict && !verdict.accepted && verdict.reasons.length > 0
            ? "rejected"
            : "",
          focusId === s.id ? "focused" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <article key={s.id} className={rowClass}>
            <label className="pick" title="勾选参与联检">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(s.id)}
              />
            </label>

            <div className="roster-main">
              <div className="roster-title">
                <button className="link" onClick={() => onInspect(s.id)}>
                  {s.id}
                </button>
                <span className="stage-chip">{s.stage}</span>
                <span className="muted">
                  {s.species} · {s.subStage}
                </span>
                {sealed && <span className="badge sealed">案件封存</span>}
              </div>
              <p className="muted">
                {s.caseId} · 采样 {fmtDateTime(s.sampledAt)} · {s.preservation} ·{" "}
                {s.temperature.toFixed(1)}℃
              </p>
              {verdict && verdict.reasons.length > 0 && (
                <ul className="reasons">
                  {verdict.reasons.map((r) => (
                    <li key={r}>退回：{r}</li>
                  ))}
                </ul>
              )}
              {verdict && verdict.accepted && (
                <p className="ok-line">判定通过，可入批</p>
              )}
            </div>

            <div className="roster-side">
              {batchId ? (
                <span className="badge batch">{batchId}</span>
              ) : (
                <span className="badge pending">待联检</span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
