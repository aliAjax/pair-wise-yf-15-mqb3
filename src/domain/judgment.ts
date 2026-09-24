/**
 * 判定模块（纯函数，不依赖 UI 与存取实现）
 *
 * 联检规则：
 *  1. 至少勾选两份样本；
 *  2. 虫种相同、发育阶段相同（以勾选集合的多数派为批内基准，并列取采样最早者）；
 *  3. 批内采样时刻相距不超过 24 小时（取覆盖样本最多的时间窗，并列取最早）；
 *  4. 保存方式一致；
 *  5. 案件已封存、已进别批的样本一律退回并给出理由。
 */

import type { CaseFile, Sample } from "./types";

export const JOINT_WINDOW_HOURS = 24;
export const MIN_BATCH_SIZE = 2;

export interface JudgmentContext {
  cases: readonly CaseFile[];
  /** sampleId -> 联检编号 */
  batchBySample: Readonly<Record<string, string>>;
}

export interface SampleVerdict {
  sampleId: string;
  accepted: boolean;
  /** 退回理由（可多条）；入批样本为空数组 */
  reasons: string[];
}

export interface BatchJudgment {
  verdicts: SampleVerdict[];
  /** 判定可入批的样本 id（按采样时刻升序） */
  acceptedIds: string[];
  /** 是否满足成批条件（可入批样本 ≥ 2） */
  canFile: boolean;
  summary: string;
}

const HOUR_MS = 3_600_000;

export function hoursBetween(a: string, b: string): number {
  return Math.abs(+new Date(b) - +new Date(a)) / HOUR_MS;
}

/** 众数；并列时保留先出现者（调用方按采样时刻升序传入，即并列取最早采样者） */
function majority(values: string[]): string {
  const counts = new Map<string, number>();
  let best = values[0];
  let bestCount = 0;
  for (const value of values) {
    const n = (counts.get(value) ?? 0) + 1;
    counts.set(value, n);
    if (n > bestCount) {
      best = value;
      bestCount = n;
    }
  }
  return best;
}

/** 在按时间升序的样本中，找覆盖样本最多的 24 小时窗；并列取最早窗口 */
function bestWindow(sorted: Sample[], hours: number): Sample[] {
  let best: Sample[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const start = +new Date(sorted[i].sampledAt);
    const group = sorted.filter((s) => {
      const span = +new Date(s.sampledAt) - start;
      return span >= 0 && span <= hours * HOUR_MS;
    });
    if (group.length > best.length) best = group;
  }
  return best;
}

/** 对当前勾选集合做联检判定，返回每份样本的入批/退回结论 */
export function judgeSelection(
  selected: readonly Sample[],
  ctx: JudgmentContext
): BatchJudgment {
  const sorted = [...selected].sort(
    (a, b) => +new Date(a.sampledAt) - +new Date(b.sampledAt)
  );
  const reasons = new Map<string, string[]>();
  const reject = (id: string, reason: string) => {
    reasons.set(id, [...(reasons.get(id) ?? []), reason]);
  };

  if (sorted.length < MIN_BATCH_SIZE) {
    return {
      verdicts: sorted.map((s) => ({ sampleId: s.id, accepted: false, reasons: [] })),
      acceptedIds: [],
      canFile: false,
      summary: `至少勾选 ${MIN_BATCH_SIZE} 份样本才能建立联检批`,
    };
  }

  const caseById = new Map(ctx.cases.map((c) => [c.id, c]));

  // 规则 5：个案剔除 —— 案件封存 / 已进别批
  let pool = sorted.filter((s) => {
    const owner = caseById.get(s.caseId);
    if (owner?.sealed) {
      reject(s.id, `案件 ${s.caseId} 已封存，样本退回`);
      return false;
    }
    const batchId = ctx.batchBySample[s.id];
    if (batchId) {
      reject(s.id, `已进别批 ${batchId}，不得重复入批`);
      return false;
    }
    return true;
  });

  // 规则 2：虫种、发育阶段与批内多数派一致（两项分别核对，各自给出理由）
  if (pool.length > 0) {
    const refSpecies = majority(pool.map((s) => s.species));
    const sameSpecies = pool.filter((s) => s.species === refSpecies);
    const refStage = majority(
      (sameSpecies.length > 0 ? sameSpecies : pool).map((s) => s.stage)
    );
    pool = pool.filter((s) => {
      let ok = true;
      if (s.species !== refSpecies) {
        reject(s.id, `虫种不一致（批内为${refSpecies}）`);
        ok = false;
      }
      if (s.stage !== refStage) {
        reject(s.id, `发育阶段不一致（批内为${refStage}）`);
        ok = false;
      }
      return ok;
    });
  }

  // 规则 3：24 小时联检窗
  let windowed = pool;
  if (pool.length > 0) {
    const win = bestWindow(pool, JOINT_WINDOW_HOURS);
    const inWindow = new Set(win.map((s) => s.id));
    const anchor = win[0].sampledAt;
    windowed = pool.filter((s) => {
      if (inWindow.has(s.id)) return true;
      reject(
        s.id,
        `采样时刻超出 ${JOINT_WINDOW_HOURS} 小时联检窗（距批内最早 ${hoursBetween(
          anchor,
          s.sampledAt
        ).toFixed(1)} 小时）`
      );
      return false;
    });
  }

  // 规则 4：保存方式一致（基准取时间窗内多数派，窗内外样本一并核对）
  let accepted = windowed;
  if (windowed.length > 0) {
    const refPreservation = majority(windowed.map((s) => s.preservation));
    for (const s of pool) {
      if (s.preservation !== refPreservation) {
        reject(s.id, `保存方式不一致（批内为${refPreservation}）`);
      }
    }
    accepted = windowed.filter((s) => s.preservation === refPreservation);
  }

  const acceptedIds = accepted.map((s) => s.id);
  const canFile = acceptedIds.length >= MIN_BATCH_SIZE;
  const verdicts: SampleVerdict[] = sorted.map((s) => ({
    sampleId: s.id,
    accepted: acceptedIds.includes(s.id),
    reasons: reasons.get(s.id) ?? [],
  }));
  const returned = verdicts.filter((v) => !v.accepted && v.reasons.length > 0).length;

  return {
    verdicts,
    acceptedIds,
    canFile,
    summary: canFile
      ? `可成批：${acceptedIds.length} 份入批${returned > 0 ? `，${returned} 份退回` : ""}`
      : "不可成批：可入批样本不足两份",
  };
}

export function verdictOf(
  judgment: BatchJudgment,
  sampleId: string
): SampleVerdict | undefined {
  return judgment.verdicts.find((v) => v.sampleId === sampleId);
}
