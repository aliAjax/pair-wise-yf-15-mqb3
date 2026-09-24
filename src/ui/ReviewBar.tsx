import type { RejectCode } from "../domain/types";
import { REJECT_TEXT } from "../domain/rules";

interface Props {
  selectedCount: number;
  tooFew: boolean;
  canCreate: boolean;
  reasonsById: Record<string, RejectCode[]>;
  rejectedSamples: { id: string; reasons: RejectCode[] }[];
  acceptedCount: number;
  onCreate: () => void;
  onClear: () => void;
}

/** 审查操作条：勾选即审查；可建批时才允许建立联检批 */
export default function ReviewBar({
  selectedCount,
  tooFew,
  canCreate,
  rejectedSamples,
  acceptedCount,
  onCreate,
  onClear,
}: Props) {
  return (
    <div className="review-bar">
      <div className="review-summary">
        <span className="review-count">
          已勾选 <b>{selectedCount}</b> 份
          {selectedCount >= 2 && <>，合格 <b className="ok">{acceptedCount}</b> 份</>}
        </span>
        {tooFew && selectedCount > 0 && (
          <span className="review-hint">至少勾选两份样本才能建立联检批</span>
        )}
        {selectedCount >= 2 && !canCreate && (
          <span className="review-hint warn">
            合格样本不足两份，无法建批，请看退回理由
          </span>
        )}
        {canCreate && (
          <span className="review-hint ok">
            合格 {acceptedCount} 份，可建立跨案联检批
            {rejectedSamples.length > 0 &&
              `；另有 ${rejectedSamples.length} 份将被退回`}
          </span>
        )}
      </div>

      {canCreate && rejectedSamples.length > 0 && (
        <ul className="review-reasons">
          {rejectedSamples.map(({ id, reasons }) =>
            reasons.map((code) => (
              <li key={`${id}-${code}`}>
                <b>{id}</b> 退回：{REJECT_TEXT[code]}
              </li>
            )),
          )}
        </ul>
      )}

      <div className="review-actions">
        <button
          className="primary"
          disabled={!canCreate}
          onClick={onCreate}
          title={canCreate ? "合格样本入批，其余按理由退回" : "暂不满足入批条件"}
        >
          建立联检批
        </button>
        <button onClick={onClear} disabled={selectedCount === 0}>
          清空勾选
        </button>
      </div>
    </div>
  );
}
