import type { WorkbenchState } from "../data/repository";
import { batchesOfCase, samplesOfCase } from "../data/repository";

interface Props {
  state: WorkbenchState;
  onInspect: (sampleId: string) => void;
}

/** 案件样本关联页：联检编号实时同步到各案件 */
export function CaseBoard({ state, onInspect }: Props) {
  return (
    <div className="case-grid">
      {state.cases.map((c) => {
        const own = samplesOfCase(state, c.id);
        const related = batchesOfCase(state, c.id);
        return (
          <article key={c.id} className={c.sealed ? "case-card sealed" : "case-card"}>
            <div className="case-head">
              <div>
                <strong>{c.id}</strong>
                <p className="muted">{c.title}</p>
              </div>
              {c.sealed ? (
                <span className="badge sealed">已封存</span>
              ) : (
                <span className="badge open">在办</span>
              )}
            </div>

            <ul className="case-samples">
              {own.map((s) => {
                const batchId = state.batchBySample[s.id];
                return (
                  <li key={s.id}>
                    <button className="link" onClick={() => onInspect(s.id)}>
                      {s.id}
                    </button>
                    <span className="muted">
                      {s.species} · {s.stage}
                    </span>
                    {batchId ? (
                      <span className="badge batch">{batchId}</span>
                    ) : (
                      <span className="badge pending">待联检</span>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="muted case-batches">
              联检批次：
              {related.length > 0
                ? related.map((b) => b.id).join("、")
                : "暂无"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
