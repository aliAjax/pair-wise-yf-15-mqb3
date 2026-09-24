import { useMemo, useState } from "react";
import "./styles.css";

import type { DevelopmentStage } from "./domain/types";
import { STAGES } from "./domain/types";
import { judgeSelection, MIN_BATCH_SIZE } from "./domain/judgment";
import type { WorkbenchState } from "./data/repository";
import {
  averageTemperature,
  countByStage,
  createInitialState,
  fileJointBatch,
  filterByStage,
  pendingCount,
  sampleById,
} from "./data/repository";
import type { StageFilter } from "./data/repository";
import { StageFilterChips } from "./ui/StageFilter";
import { RosterPanel } from "./ui/RosterPanel";
import { TemperatureChart } from "./ui/TemperatureChart";
import { BatchList } from "./ui/BatchList";
import { CaseBoard } from "./ui/CaseBoard";
import { SampleDetail } from "./ui/SampleDetail";

interface FilingResult {
  batchId: string;
  acceptedIds: string[];
  returned: { sampleId: string; reasons: string[] }[];
}

const project = {
  sourceNo: 5,
  id: "hxyfront-62003",
  port: 62003,
};

function App() {
  // 资料存取模块持有的不可变工作台状态
  const [state, setState] = useState<WorkbenchState>(createInitialState);
  // 页面交互状态
  const [stage, setStage] = useState<StageFilter>("全部");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusId, setFocusId] = useState<string | null>(state.samples[0]?.id ?? null);
  const [filing, setFiling] = useState<FilingResult | null>(null);

  const filtered = useMemo(() => filterByStage(state.samples, stage), [state, stage]);

  // 判定模块：勾选变化即实时判定
  const judgment = useMemo(() => {
    const picked = selectedIds
      .map((id) => sampleById(state, id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    return judgeSelection(picked, state);
  }, [selectedIds, state]);

  const returnedCount = judgment.verdicts.filter(
    (v) => !v.accepted && v.reasons.length > 0
  ).length;

  const toggle = (sampleId: string) => {
    setSelectedIds((prev) =>
      prev.includes(sampleId)
        ? prev.filter((id) => id !== sampleId)
        : [...prev, sampleId]
    );
  };

  const inspect = (sampleId: string) => setFocusId(sampleId);

  const fileBatch = () => {
    if (!judgment.canFile) return;
    const accepted = judgment.acceptedIds
      .map((id) => sampleById(state, id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const next = fileJointBatch(state, accepted, new Date());
    const batchId = next.batches[next.batches.length - 1].id;
    setState(next);
    setSelectedIds([]);
    setFiling({
      batchId,
      acceptedIds: judgment.acceptedIds,
      returned: judgment.verdicts
        .filter((v) => !v.accepted && v.reasons.length > 0)
        .map((v) => ({ sampleId: v.sampleId, reasons: v.reasons })),
    });
  };

  const reset = () => {
    const fresh = createInitialState();
    setState(fresh);
    setSelectedIds([]);
    setStage("全部");
    setFocusId(fresh.samples[0]?.id ?? null);
    setFiling(null);
  };

  const avgTemp = averageTemperature(filtered);
  const stageCounts = Object.fromEntries(
    STAGES.map((s) => [s, countByStage(state.samples, s)])
  ) as Record<DevelopmentStage, number>;

  const metrics: [string, string][] = [
    ["联检批次", String(state.batches.length)],
    ["平均温度", avgTemp === null ? "—" : `${avgTemp.toFixed(1)}℃`],
    [
      "发育阶段",
      stage === "全部"
        ? `${new Set(state.samples.map((s) => s.stage)).size} 类`
        : stage,
    ],
    ["待联检", String(pendingCount(state))],
  ];

  return (
    <main className="app">
      <section className="hero">
        <p>
          {project.id} · 源提示词{project.sourceNo} · Port {project.port}
        </p>
        <h1>法医昆虫学 · 跨案联检台</h1>
        <span>
          预置三案六样。鉴定员勾选至少两份样本建立联检批：虫种与发育阶段相同、
          采样时刻相距二十四小时以内且保存方式一致方可入批；案件封存或已进别批的
          样本将被退回并注明理由。联检编号实时同步到名册、温度曲线、案件关联页与详情。
        </span>
      </section>

      <section className="metrics">
        {metrics.map(([label, value]) => (
          <article key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="workspace">
        <aside className="panel">
          <h2>发育阶段筛选</h2>
          <StageFilterChips
            value={stage}
            counts={stageCounts}
            total={state.samples.length}
            onChange={setStage}
          />
          <div className="rules">
            <h3>入批判定规则</h3>
            <ul>
              <li>至少勾选 {MIN_BATCH_SIZE} 份样本</li>
              <li>虫种相同、发育阶段相同</li>
              <li>采样时刻相距 ≤ 24 小时</li>
              <li>保存方式一致</li>
              <li>案件封存 / 已进别批一律退回</li>
            </ul>
          </div>
        </aside>

        <section className="panel">
          <div className="heading">
            <div>
              <p>跨案样本名册</p>
              <h2>联检勾选（已选 {selectedIds.length} 份）</h2>
            </div>
            <div className="toolbar">
              <button onClick={reset}>恢复预置名单</button>
              <button
                className="primary"
                disabled={!judgment.canFile}
                onClick={fileBatch}
              >
                {judgment.canFile
                  ? `建立联检批（${judgment.acceptedIds.length} 份入批${
                      returnedCount > 0 ? ` · ${returnedCount} 份退回` : ""
                    }）`
                  : "建立联检批"}
              </button>
            </div>
          </div>
          <p className={judgment.canFile ? "judge-line ok" : "judge-line"}>
            {judgment.summary}
          </p>
          <RosterPanel
            samples={filtered}
            cases={state.cases}
            selectedIds={selectedIds}
            judgment={judgment}
            batchBySample={state.batchBySample}
            focusId={focusId}
            onToggle={toggle}
            onInspect={inspect}
          />
        </section>
      </section>

      {filing && (
        <section className="banner">
          <div className="banner-head">
            <strong>
              联检批 {filing.batchId} 已建立：{filing.acceptedIds.join("、")} 入批
            </strong>
            <button onClick={() => setFiling(null)}>知道了</button>
          </div>
          {filing.returned.length > 0 && (
            <ul className="reasons">
              {filing.returned.map((r) => (
                <li key={r.sampleId}>
                  {r.sampleId} 退回 —— {r.reasons.join("；")}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="duo">
        <section className="panel">
          <div className="heading">
            <div>
              <p>温度记录图</p>
              <h2>环境温度曲线{stage === "全部" ? "" : ` · ${stage}`}</h2>
            </div>
          </div>
          <TemperatureChart
            samples={filtered}
            batches={state.batches}
            batchBySample={state.batchBySample}
            selectedIds={selectedIds}
            onPick={inspect}
          />
        </section>

        <section className="panel">
          <div className="heading">
            <div>
              <p>单样本详情</p>
              <h2>详情卡片</h2>
            </div>
          </div>
          <SampleDetail
            sample={focusId ? sampleById(state, focusId) ?? null : null}
            state={state}
            judgment={judgment}
            checked={focusId !== null && selectedIds.includes(focusId)}
          />
        </section>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>联检批次</p>
            <h2>已建批次（{state.batches.length}）</h2>
          </div>
        </div>
        <BatchList batches={state.batches} onInspect={inspect} />
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>案件样本关联页</p>
            <h2>三案关联总览</h2>
          </div>
        </div>
        <CaseBoard state={state} onInspect={inspect} />
      </section>
    </main>
  );
}

export default App;
