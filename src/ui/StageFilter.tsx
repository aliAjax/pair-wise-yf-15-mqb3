import type { DevelopmentStage } from "../domain/types";
import { STAGES } from "../domain/types";
import type { StageFilter } from "../data/repository";

interface Props {
  value: StageFilter;
  counts: Record<DevelopmentStage, number>;
  total: number;
  onChange: (stage: StageFilter) => void;
}

/** 发育阶段筛选：全部 / 卵 / 幼虫 / 蛹 / 成虫 */
export function StageFilterChips({ value, counts, total, onChange }: Props) {
  const options: { key: StageFilter; label: string; count: number }[] = [
    { key: "全部", label: "全部", count: total },
    ...STAGES.map((s) => ({ key: s as StageFilter, label: s, count: counts[s] })),
  ];
  return (
    <div className="chips">
      {options.map((opt) => (
        <button
          key={opt.key}
          className={value === opt.key ? "chip active" : "chip"}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
          <em>{opt.count}</em>
        </button>
      ))}
    </div>
  );
}
