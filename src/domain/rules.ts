import type { CaseFile, RejectCode, ReviewResult, Sample } from "./types";

/** 业务模块一：判定模块
 * 只做规则判断，不碰存储、不碰 React。
 * 入批三同：同种、同发育阶段、同保存方式；采样时刻两两相距 ≤ 24 小时。
 * 另：案件封存、已进别批一律退回。
 */

export const WINDOW_MS = 24 * 60 * 60 * 1000; // 二十四小时

export const REJECT_TEXT: Record<RejectCode, string> = {
  CASE_SEALED: "案件已封存，样本不得调出",
  IN_OTHER_BATCH: "该样本已进入其他联检批，禁止重复入批",
  SPECIES_DIFF: "虫种不一致，需同种才能联检",
  STAGE_DIFF: "发育阶段不一致，需同阶段才能联检",
  PRESERVATION_DIFF: "保存方式不一致，预处理不可混用",
  TIME_SPAN: "采样时刻相距超过24小时，发育进度不可比",
};

const withinWindow = (a: string, b: string) =>
  Math.abs(new Date(a).getTime() - new Date(b).getTime()) <= WINDOW_MS;

/** 单样本的"硬伤"：与勾谁无关，永远退回 */
function hardReasons(sample: Sample, cases: CaseFile[]): RejectCode[] {
  const reasons: RejectCode[] = [];
  const caseFile = cases.find((c) => c.id === sample.caseId);
  if (caseFile?.sealed) reasons.push("CASE_SEALED");
  if (sample.batchId) reasons.push("IN_OTHER_BATCH");
  return reasons;
}

/**
 * 审查一次勾选。
 * 先剔硬伤（封存 / 已进别批）；
 * 再以"与组内最早样本三同 + 时刻跨度"判定其余样本是否可入同一批；
 * 合格不足两份则不可建批，且每份都会拿到具体退回理由。
 */
export function reviewSelection(
  selectedIds: string[],
  samples: Sample[],
  cases: CaseFile[],
): ReviewResult {
  const selected = samples.filter((s) => selectedIds.includes(s.id));
  const reasonsById: Record<string, RejectCode[]> = {};

  const reasonsFor = (id: string): RejectCode[] =>
    (reasonsById[id] ??= []);

  // 1) 硬伤
  const clean: Sample[] = [];
  for (const s of selected) {
    const hard = hardReasons(s, cases);
    if (hard.length) reasonsFor(s.id).push(...hard);
    else clean.push(s);
  }

  // 2) 无硬伤的样本按时刻排序，逐个并入"合格组"：
  //    虫种 / 发育阶段 / 保存方式 / 时刻跨度四类条件独立判定，
  //    全部通过才与组内锚点（组内最早）同批，否则逐条列出退回理由。
  const accepted: Sample[] = [];
  const pending = [...clean].sort(
    (a, b) =>
      new Date(a.sampledAt).getTime() - new Date(b.sampledAt).getTime(),
  );
  for (const s of pending) {
    if (accepted.length === 0) {
      // 合格组尚空时，最早的无硬伤样本自动成为锚点
      accepted.push(s);
      continue;
    }
    const anchor = accepted[0];
    if (s.species !== anchor.species) reasonsFor(s.id).push("SPECIES_DIFF");
    if (s.stage !== anchor.stage) reasonsFor(s.id).push("STAGE_DIFF");
    if (s.preservation !== anchor.preservation)
      reasonsFor(s.id).push("PRESERVATION_DIFF");
    if (!withinWindow(anchor.sampledAt, s.sampledAt))
      reasonsFor(s.id).push("TIME_SPAN");
    if (reasonsFor(s.id).length === 0) accepted.push(s);
  }

  const tooFew = selected.length < 2;
  const canCreate = accepted.length >= 2;
  if (!canCreate && !tooFew) {
    for (const s of selected) reasonsFor(s.id); // 保证键存在
  }

  return {
    selectedCount: selected.length,
    tooFew,
    acceptedIds: accepted.map((s) => s.id),
    reasonsById,
    canCreate,
  };
}

/** 单个样本的静态状态（用于行徽标） */
export function sampleStatus(sample: Sample, cases: CaseFile[]): string | null {
  const caseFile = cases.find((c) => c.id === sample.caseId);
  if (caseFile?.sealed) return "案件封存";
  if (sample.batchId) return "已进别批";
  return null;
}
