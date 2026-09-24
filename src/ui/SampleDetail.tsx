import type { Sample } from "../domain/types";
import type { WorkbenchState } from "../data/repository";
import { batchOfSample, caseById } from "../data/repository";
import type { BatchJudgment } from "../domain/judgment";
import { verdictOf } from "../domain/judgment";
import { fmtDateTime } from "./format";

interface Props {
  sample: Sample | null;
  state: WorkbenchState;
  judgment: BatchJudgment;
  checked: boolean;
}

/** 单个样本详情卡片：联检编号与判定结论同步展示 */
export function SampleDetail({ sample, state, judgment, checked }: Props) {
  if (!sample) {
    return <p className="empty">在名册或关联页点击样本编号，查看详情。</p>;
  }

  const owner = caseById(state, sample.caseId);
  const batch = batchOfSample(state, sample.id);
  const verdict = checked ? verdictOf(judgment, sample.id) : undefined;

  const fields: [string, string][] = [
    ["采样地点", sample.location],
    ["环境温度", `${sample.temperature.toFixed(1)}℃`],
    ["暴露阶段", sample.exposureStage],
    ["昆虫种类", sample.species],
    ["发育阶段", `${sample.stage}（${sample.subStage}）`],
    ["采样时间", fmtDateTime(sample.sampledAt)],
    ["保存方式", sample.preservation],
    ["鉴定备注", sample.note],
    ["所属案件", `${sample.caseId} · ${owner?.title ?? "未知"}`],
  ];

  return (
    <div className="detail">
      <div className="detail-head">
        <h3>{sample.id}</h3>
        {owner?.sealed && <span className="badge sealed">案件封存</span>}
        {batch ? (
          <span className="badge batch">{batch.id}</span>
        ) : (
          <span className="badge pending">待联检</span>
        )}
      </div>

      <dl className="detail-grid">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div>
          <dt>联检编号</dt>
          <dd>{batch ? batch.id : "尚未入批"}</dd>
        </div>
      </dl>

      {verdict && verdict.reasons.length > 0 && (
        <ul className="reasons">
          {verdict.reasons.map((r) => (
            <li key={r}>退回：{r}</li>
          ))}
        </ul>
      )}
      {verdict && verdict.accepted && <p className="ok-line">当前勾选判定通过，可入批</p>}
    </div>
  );
}
