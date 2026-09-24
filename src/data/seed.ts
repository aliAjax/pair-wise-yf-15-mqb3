import type { CaseFile, JointBatch, Sample } from "../domain/types";

/** 业务模块二（资料存取）· 预置三案六样
 *
 * 编排约束：一案封存；旧批 001 已占两份；剩余未封存样本中
 * 042-B / 051-B 可再建跨案新批，042-C 多项不符用于演示退回理由。
 */

export const SEED_CASES: CaseFile[] = [
  {
    id: "CASE-042",
    name: "北郊草地无名尸案",
    location: "室外草地",
    sealed: false,
  },
  {
    id: "CASE-051",
    name: "城南水沟抛尸案",
    location: "水沟边缘阴影区",
    sealed: false,
  },
  {
    id: "CASE-077",
    name: "东山林地白骨化案",
    location: "东山林地",
    sealed: true,
    sealedNote: "已随案卷封存，证物不得跨案调出",
  },
];

const FLY = "大头金蝇（Chrysomya megacephala）";

export const SEED_SAMPLES: Sample[] = [
  {
    id: "CASE-042-A",
    caseId: "CASE-042",
    species: FLY,
    stage: "幼虫",
    stageDetail: "幼虫三龄",
    sampledAt: "2026-09-10T10:00:00",
    temperature: 26.4,
    preservation: "75%乙醇浸泡",
    note: "口沟清晰，体长14.2mm",
    batchId: "seed-1",
  },
  {
    id: "CASE-042-B",
    caseId: "CASE-042",
    species: FLY,
    stage: "幼虫",
    stageDetail: "幼虫三龄",
    sampledAt: "2026-09-10T20:00:00",
    temperature: 22.1,
    preservation: "75%乙醇浸泡",
    note: "与A样同点位夜间二次采集",
    batchId: null,
  },
  {
    id: "CASE-042-C",
    caseId: "CASE-042",
    species: "丝光绿蝇（Lucilia sericata）",
    stage: "幼虫",
    stageDetail: "幼虫二龄",
    sampledAt: "2026-09-12T20:00:00",
    temperature: 23.8,
    preservation: "干燥针插",
    note: "现场临时针插；距首批采样已逾24小时，多项待核",
    batchId: null,
  },
  {
    id: "CASE-051-A",
    caseId: "CASE-051",
    species: FLY,
    stage: "幼虫",
    stageDetail: "幼虫三龄",
    sampledAt: "2026-09-11T09:00:00",
    temperature: 27.8,
    preservation: "75%乙醇浸泡",
    note: "水沟阴影处采集；已在旧批 001",
    batchId: "seed-1",
  },
  {
    id: "CASE-051-B",
    caseId: "CASE-051",
    species: FLY,
    stage: "幼虫",
    stageDetail: "幼虫三龄",
    sampledAt: "2026-09-11T18:00:00",
    temperature: 24.5,
    preservation: "75%乙醇浸泡",
    note: "与 CASE-042-B 相隔22小时，可跨案联检",
    batchId: null,
  },
  {
    id: "CASE-077-A",
    caseId: "CASE-077",
    species: FLY,
    stage: "蛹",
    stageDetail: "蛹期（空蛹壳）",
    sampledAt: "2026-09-15T10:00:00",
    temperature: 25.2,
    preservation: "干燥纸袋",
    note: "案卷封存，仅作记录不可调出",
    batchId: null,
  },
];

/** 既有旧批：原名单已带引用，用来演示"已进别批"与旧批不可改坏 */
export const SEED_BATCHES: JointBatch[] = [
  {
    id: "seed-1",
    code: "JCB-2026-001",
    source: "seed",
    sampleIds: ["CASE-042-A", "CASE-051-A"],
    caseIds: ["CASE-042", "CASE-051"],
    species: FLY,
    stage: "幼虫",
    preservation: "75%乙醇浸泡",
    startedAt: "2026-09-10T10:00:00",
    endedAt: "2026-09-11T09:00:00",
    createdAt: "2026-09-11T12:00:00",
  },
];
