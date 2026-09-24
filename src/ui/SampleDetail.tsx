import type { CaseFile, JointBatch, Sample } from "../domain/types";
import { batchColor, formatFull } from "./format";

interface Props {
  sample: Sample | null;
  caseFile: CaseFile | null;
  batch: JointBatch | null;
  batches: JointBatch[];
  onClose: () => void;
}

/** 单个样本详情卡片：联检编号在此同步显示 */
export default function SampleDetail({
  sample,
  caseFile,
  batch,
  batches,
  onClose,
}: Props) {
  if (!sample || !caseFile) return null;

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <aside
        className="detail-card"
        role="dialog"
        aria-label={`样本 ${sample.id} 详情`}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <small>样本详情</small>
            <h3>{sample.id}</h3>
          </div>
          <button className="detail-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <dl className="detail-grid">
          <div>
            <dt>所属案件</dt>
            <dd>
              {caseFile.id} · {caseFile.name}
              {caseFile.sealed && <em className="sealed-tag">封存</em>}
            </dd>
          </div>
          <div>
            <dt>采样地点</dt>
            <dd>{caseFile.location}</dd>
          </div>
          <div>
            <dt>采样时刻</dt>
            <dd>{formatFull(sample.sampledAt)}</dd>
          </div>
          <div>
            <dt>环境温度</dt>
            <dd>{sample.temperature.toFixed(1)} ℃</dd>
          </div>
          <div>
            <dt>昆虫种类</dt>
            <dd>{sample.species}</dd>
          </div>
          <div>
            <dt>发育阶段</dt>
            <dd>
              {sample.stageDetail}（{sample.stage}）
            </dd>
          </div>
          <div>
            <dt>保存方式</dt>
            <dd>{sample.preservation}</dd>
          </div>
          <div>
            <dt>联检编号</dt>
            <dd>
              {batch ? (
                <span
                  className="badge batch-badge"
                  style={{
                    color: batchColor(batches, batch.id),
                    borderColor: batchColor(batches, batch.id),
                  }}
                >
                  {batch.code}
                  {batch.source === "seed" ? "（旧批）" : ""}
                </span>
              ) : (
                <span className="muted">未入批</span>
              )}
            </dd>
          </div>
          <div className="detail-note">
            <dt>鉴定备注</dt>
            <dd>{sample.note}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
