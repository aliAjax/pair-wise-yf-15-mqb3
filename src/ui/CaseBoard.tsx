import type { JointBatch } from "../domain/types";
import { batchColor } from "./format";

export interface CaseRow {
  caseFile: {
    id: string;
    name: string;
    location: string;
    sealed: boolean;
    sealedNote?: string;
  };
  samples: {
    id: string;
    stage: string;
    batchId: string | null;
  }[];
  batchCodes: string[];
}

interface Props {
  rows: CaseRow[];
  batches: JointBatch[];
  focusBatchId: string | null;
  onOpenSample: (id: string) => void;
}

/** 案件样本关联页：联检编号同步展示在各案件下 */
export default function CaseBoard({
  rows,
  batches,
  focusBatchId,
  onOpenSample,
}: Props) {
  return (
    <div className="case-board">
      {rows.map(({ caseFile, samples, batchCodes }) => (
        <article
          key={caseFile.id}
          className={"case-card" + (caseFile.sealed ? " is-sealed" : "")}
        >
          <header>
            <div>
              <b>{caseFile.id}</b>
              <span>{caseFile.name} · {caseFile.location}</span>
            </div>
            {caseFile.sealed && (
              <span className="badge badge-sealed">案件封存</span>
            )}
          </header>
          {caseFile.sealed && caseFile.sealedNote && (
            <p className="case-seal-note">{caseFile.sealedNote}</p>
          )}

          <div className="case-sync">
            <small>联检编号同步</small>
            {batchCodes.length ? (
              <div className="case-codes">
                {batchCodes.map((code) => {
                  const batch = batches.find((b) => b.code === code);
                  const focus =
                    focusBatchId !== null && batch?.id === focusBatchId;
                  return (
                    <span
                      key={code}
                      className={
                        "badge batch-badge" + (focus ? " is-focus-badge" : "")
                      }
                      style={
                        batch
                          ? {
                              color: batchColor(batches, batch.id),
                              borderColor: batchColor(batches, batch.id),
                            }
                          : undefined
                      }
                    >
                      {code}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="muted">暂无联检批</span>
            )}
          </div>

          <ul className="case-samples">
            {samples.map((s) => {
              const batch = s.batchId
                ? batches.find((b) => b.id === s.batchId)
                : null;
              const dim =
                focusBatchId !== null && s.batchId !== focusBatchId;
              return (
                <li key={s.id} className={dim ? "is-dim" : ""}>
                  <button className="cell-link" onClick={() => onOpenSample(s.id)}>
                    {s.id}
                  </button>
                  <small>{s.stage}</small>
                  {batch ? (
                    <span
                      className="batch-badge"
                      style={{
                        color: batchColor(batches, batch.id),
                      }}
                    >
                      {batch.code}
                    </span>
                  ) : (
                    <span className="muted">未入批</span>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
