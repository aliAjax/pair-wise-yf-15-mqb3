import { useMemo, useState } from "react";
import "./styles.css";
import { reviewSelection } from "./domain/rules";
import type { JointBatch, Stage } from "./domain/types";
import { useCaseIndex, useRepository } from "./data/store";
import BatchList from "./ui/BatchList";
import CaseBoard from "./ui/CaseBoard";
import ReviewBar from "./ui/ReviewBar";
import SampleDetail from "./ui/SampleDetail";
import SampleTable from "./ui/SampleTable";
import StageFilter from "./ui/StageFilter";
import TemperatureChart from "./ui/TemperatureChart";

/** 跨案联检台
 * 判定 -> src/domain（规则纯函数）
 * 存取 -> src/data（三案六样 + 不可变建批 + localStorage）
 * 交互 -> src/ui（本文件只负责页面状态编排）
 */
export default function App() {
  const { repo, createBatch, reset } = useRepository();
  const caseIndex = useCaseIndex(repo);

  const [stage, setStage] = useState<Stage | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [focusBatchId, setFocusBatchId] = useState<string | null>(null);
  const [openSampleId, setOpenSampleId] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<JointBatch | null>(null);

  // 勾选即审查（判定模块）
  const review = useMemo(
    () => reviewSelection(selected, repo.samples, repo.cases),
    [selected, repo.samples, repo.cases],
  );

  const stageCounts = useMemo(() => {
    const counts: Record<Stage, number> = {
      卵: 0,
      幼虫: 0,
      蛹: 0,
      成虫: 0,
    };
    for (const s of repo.samples) counts[s.stage] += 1;
    return counts;
  }, [repo.samples]);

  const visibleSamples = useMemo(
    () => (stage ? repo.samples.filter((s) => s.stage === stage) : repo.samples),
    [repo.samples, stage],
  );

  const averageTemp =
    repo.samples.reduce((sum, s) => sum + s.temperature, 0) /
    repo.samples.length;
  const pending = repo.samples.filter((s) => s.batchId === null).length;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const rejectedSamples = useMemo(
    () =>
      selected
        .map((id) => ({ id, reasons: review.reasonsById[id] ?? [] }))
        .filter((x) => x.reasons.length > 0),
    [selected, review.reasonsById],
  );

  const handleCreate = () => {
    const accepted = repo.samples.filter((s) =>
      review.acceptedIds.includes(s.id),
    );
    if (accepted.length < 2) return;
    const batch = createBatch(accepted);
    setLastCreated(batch);
    // 合格样本已入批即从勾选移除；被退回样本保留勾选以便核对理由
    setSelected((prev) => prev.filter((id) => !batch.sampleIds.includes(id)));
    setFocusBatchId(batch.id);
  };

  const openSample = openSampleId
    ? repo.samples.find((s) => s.id === openSampleId) ?? null
    : null;
  const openCase = openSample
    ? repo.cases.find((c) => c.id === openSample.caseId) ?? null
    : null;
  const openBatch = openSample?.batchId
    ? repo.batches.find((b) => b.id === openSample.batchId) ?? null
    : null;

  return (
    <main className="app bench-app">
      <section className="hero">
        <p>hxyfront-62003 · 法医昆虫学 · Port 62003</p>
        <h1>跨案联检台</h1>
        <span>
          鉴定员勾选至少两份样本建立跨案联检批：虫种、发育阶段相同、保存方式一致，
          且采样时刻两两相距24小时以内方可入批；案件封存、已进别批或条件不符的样本退回并注明理由。
          原名单与既有旧批只读不改，联检编号同步到各案件、详情卡与温度曲线。
        </span>
      </section>

      <section className="metrics">
        <article>
          <small>样本 / 联检批</small>
          <strong>
            {repo.samples.length}
            <em> / {repo.batches.length}</em>
          </strong>
        </article>
        <article>
          <small>平均环境温度</small>
          <strong>
            {averageTemp.toFixed(1)}<em>℃</em>
          </strong>
        </article>
        <article>
          <small>在库待联检</small>
          <strong>{pending}</strong>
        </article>
        <article>
          <small>封存案件</small>
          <strong>{repo.cases.filter((c) => c.sealed).length}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>样本联检</p>
            <h2>勾选台 · 三案六样</h2>
          </div>
          <button className="ghost-btn" onClick={reset}>
            恢复预置数据
          </button>
        </div>

        <StageFilter active={stage} counts={stageCounts} onChange={setStage} />

        <ReviewBar
          selectedCount={review.selectedCount}
          tooFew={review.tooFew}
          canCreate={review.canCreate}
          reasonsById={review.reasonsById}
          rejectedSamples={rejectedSamples}
          acceptedCount={review.acceptedIds.length}
          onCreate={handleCreate}
          onClear={() => setSelected([])}
        />

        {lastCreated && (
          <div className="created-flash">
            <b>{lastCreated.code}</b> 已建立：
            {lastCreated.sampleIds.join("、")} 入批，联检编号已同步至{" "}
            {lastCreated.caseIds.join("、")}。原名单与旧批 001 保持不变。
          </div>
        )}

        <SampleTable
          samples={visibleSamples}
          cases={repo.cases}
          batches={repo.batches}
          selectedIds={selected}
          reasonsById={review.reasonsById}
          acceptedIds={review.acceptedIds}
          focusBatchId={focusBatchId}
          reviewing={selected.length > 0}
          onToggle={toggle}
          onOpen={setOpenSampleId}
        />
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>温度记录图</p>
            <h2>采样温度曲线</h2>
          </div>
          <span className="muted">同批样本连线成组；随阶段筛选与建批实时变化</span>
        </div>
        <TemperatureChart
          samples={visibleSamples}
          batches={repo.batches}
          selectedIds={selected}
          focusBatchId={focusBatchId}
          onPick={setOpenSampleId}
        />
      </section>

      <section className="workspace bench-columns">
        <section className="panel">
          <div className="heading">
            <div>
              <p>联检批</p>
              <h2>批次列表</h2>
            </div>
          </div>
          <BatchList
            batches={repo.batches}
            samples={repo.samples}
            focusBatchId={focusBatchId}
            onFocus={setFocusBatchId}
            onOpenSample={setOpenSampleId}
          />
        </section>

        <section className="panel">
          <div className="heading">
            <div>
              <p>案件样本关联</p>
              <h2>关联页</h2>
            </div>
          </div>
          <CaseBoard
            rows={caseIndex}
            batches={repo.batches}
            focusBatchId={focusBatchId}
            onOpenSample={setOpenSampleId}
          />
        </section>
      </section>

      <SampleDetail
        sample={openSample}
        caseFile={openCase}
        batch={openBatch}
        batches={repo.batches}
        onClose={() => setOpenSampleId(null)}
      />
    </main>
  );
}
