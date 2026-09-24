/**
 * 资料存取模块（仓库层）
 *
 * 工作台状态不可变：成批只返回新状态，原名单与旧批别原样保留，
 * 联检编号通过 batchBySample 索引同步到各案件与详情视图。
 */

import type { CaseFile, DevelopmentStage, JointBatch, Sample } from "../domain/types";
import { PRESET_CASES, PRESET_SAMPLES } from "./preset";

export interface WorkbenchState {
  readonly cases: readonly CaseFile[];
  /** 原名单，永不被改写 */
  readonly samples: readonly Sample[];
  /** 旧批只增不改 */
  readonly batches: readonly JointBatch[];
  /** sampleId -> 联检编号 */
  readonly batchBySample: Readonly<Record<string, string>>;
  /** 下一个联检编号序号 */
  readonly nextSerial: number;
}

export function createInitialState(): WorkbenchState {
  return {
    cases: PRESET_CASES,
    samples: PRESET_SAMPLES,
    batches: [],
    batchBySample: {},
    nextSerial: 1,
  };
}

export function formatBatchId(serial: number, now: Date): string {
  return `LJ-${now.getFullYear()}-${String(serial).padStart(3, "0")}`;
}

/**
 * 建立联检批：以判定通过的样本成批，返回全新状态。
 * 不改动传入的 state、原名单与任何旧批。
 */
export function fileJointBatch(
  state: WorkbenchState,
  accepted: readonly Sample[],
  now: Date = new Date()
): WorkbenchState {
  const sorted = [...accepted].sort(
    (a, b) => +new Date(a.sampledAt) - +new Date(b.sampledAt)
  );
  const batch: JointBatch = Object.freeze({
    id: formatBatchId(state.nextSerial, now),
    sampleIds: Object.freeze(sorted.map((s) => s.id)),
    species: sorted[0].species,
    stage: sorted[0].stage,
    preservation: sorted[0].preservation,
    windowStart: sorted[0].sampledAt,
    windowEnd: sorted[sorted.length - 1].sampledAt,
    filedAt: now.toISOString(),
  });

  const batchBySample: Record<string, string> = { ...state.batchBySample };
  for (const s of sorted) batchBySample[s.id] = batch.id;

  return {
    ...state,
    batches: Object.freeze([...state.batches, batch]),
    batchBySample,
    nextSerial: state.nextSerial + 1,
  };
}

/* ---------- 选择器（只读查询） ---------- */

export function sampleById(
  state: WorkbenchState,
  sampleId: string
): Sample | undefined {
  return state.samples.find((s) => s.id === sampleId);
}

export function caseById(
  state: WorkbenchState,
  caseId: string
): CaseFile | undefined {
  return state.cases.find((c) => c.id === caseId);
}

export function samplesOfCase(
  state: WorkbenchState,
  caseId: string
): readonly Sample[] {
  return state.samples.filter((s) => s.caseId === caseId);
}

export function batchOfSample(
  state: WorkbenchState,
  sampleId: string
): JointBatch | undefined {
  const id = state.batchBySample[sampleId];
  return state.batches.find((b) => b.id === id);
}

/** 某案件参与过的联检批 */
export function batchesOfCase(
  state: WorkbenchState,
  caseId: string
): readonly JointBatch[] {
  const own = new Set(state.samples.filter((s) => s.caseId === caseId).map((s) => s.id));
  return state.batches.filter((b) => b.sampleIds.some((id) => own.has(id)));
}

export type StageFilter = DevelopmentStage | "全部";

export function filterByStage(
  samples: readonly Sample[],
  stage: StageFilter
): readonly Sample[] {
  return stage === "全部" ? samples : samples.filter((s) => s.stage === stage);
}

export function countByStage(
  samples: readonly Sample[],
  stage: DevelopmentStage
): number {
  return samples.filter((s) => s.stage === stage).length;
}

export function averageTemperature(samples: readonly Sample[]): number | null {
  if (samples.length === 0) return null;
  const sum = samples.reduce((acc, s) => acc + s.temperature, 0);
  return Math.round((sum / samples.length) * 10) / 10;
}

export function pendingCount(state: WorkbenchState): number {
  return state.samples.filter((s) => !state.batchBySample[s.id]).length;
}
