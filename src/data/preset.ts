/**
 * 预置数据：三案六样。
 * 全部深冻结 —— 原名单是只读事实，任何模块都不得改写。
 */

import type { CaseFile, Sample } from "../domain/types";

function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      freezeDeep((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

export const PRESET_CASES: readonly CaseFile[] = freezeDeep<CaseFile[]>([
  { id: "CASE-042", title: "城郊草地女尸案", sealed: false },
  { id: "CASE-051", title: "排水沟男尸案", sealed: false },
  { id: "CASE-063", title: "废弃仓库藏尸案", sealed: true },
]);

export const PRESET_SAMPLES: readonly Sample[] = freezeDeep<Sample[]>([
  {
    id: "CASE-042-A",
    caseId: "CASE-042",
    location: "室外草地（尸体北侧）",
    temperature: 26.4,
    exposureStage: "肿胀期",
    species: "丝光绿蝇",
    stage: "幼虫",
    subStage: "三龄",
    sampledAt: "2026-09-21T08:30:00",
    preservation: "乙醇保存（75%）",
    note: "体表集群采集，已拍照固定",
  },
  {
    id: "CASE-042-B",
    caseId: "CASE-042",
    location: "阴影区域（头部下方）",
    temperature: 24.8,
    exposureStage: "肿胀期",
    species: "丝光绿蝇",
    stage: "幼虫",
    subStage: "三龄",
    sampledAt: "2026-09-21T19:10:00",
    preservation: "乙醇保存（75%）",
    note: "形态复核与 CASE-042-A 一致",
  },
  {
    id: "CASE-051-A",
    caseId: "CASE-051",
    location: "水沟边缘（漂浮物）",
    temperature: 23.1,
    exposureStage: "腐败期",
    species: "丝光绿蝇",
    stage: "幼虫",
    subStage: "三龄",
    sampledAt: "2026-09-22T12:40:00",
    preservation: "冷冻保存（-20℃）",
    note: "打捞后低温暂存，待联检",
  },
  {
    id: "CASE-051-B",
    caseId: "CASE-051",
    location: "岸边泥滩",
    temperature: 23.4,
    exposureStage: "腐败期",
    species: "大头金蝇",
    stage: "蛹",
    subStage: "蛹期第3日",
    sampledAt: "2026-09-22T07:20:00",
    preservation: "乙醇保存（75%）",
    note: "蛹壳完整，待羽化验证",
  },
  {
    id: "CASE-063-A",
    caseId: "CASE-063",
    location: "仓库木箱缝隙",
    temperature: 25.9,
    exposureStage: "肿胀期",
    species: "丝光绿蝇",
    stage: "幼虫",
    subStage: "三龄",
    sampledAt: "2026-09-21T09:50:00",
    preservation: "乙醇保存（75%）",
    note: "案件复查期间暂缓鉴定",
  },
  {
    id: "CASE-063-B",
    caseId: "CASE-063",
    location: "仓库窗台",
    temperature: 21.7,
    exposureStage: "干化期",
    species: "家蝇",
    stage: "成虫",
    subStage: "羽化后2日",
    sampledAt: "2026-09-23T15:00:00",
    preservation: "干燥保存",
    note: "已针插制片",
  },
]);
