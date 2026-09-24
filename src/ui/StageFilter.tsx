import type { Stage } from "../domain/types";
import { STAGES } from "../data/store";

interface Props {
  active: Stage | null;
  counts: Record<Stage, number>;
  onChange: (stage: Stage | null) => void;
}

/** 发育阶段筛选：随筛选联动样本表与温度曲线 */
export default function StageFilter({ active, counts, onChange }: Props) {
  return (
    <div className="chips stage-chips" role="group" aria-label="发育阶段筛选">
      <button
        className={active === null ? "chip-on" : ""}
        onClick={() => onChange(null)}
      >
        全部阶段
      </button>
      {STAGES.map((stage) => (
        <button
          key={stage}
          className={active === stage ? "chip-on" : ""}
          disabled={counts[stage] === 0}
          onClick={() => onChange(stage)}
        >
          {stage}
          <i>{counts[stage]}</i>
        </button>
      ))}
    </div>
  );
}
