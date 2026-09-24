/** 共享类型：判定、资料存取、页面交互三个模块共同依赖 */

export type DevelopmentStage = "卵" | "幼虫" | "蛹" | "成虫";

export const STAGES: DevelopmentStage[] = ["卵", "幼虫", "蛹", "成虫"];

/** 案件档案 */
export interface CaseFile {
  id: string;
  title: string;
  /** 案件是否已封存（封存后其样本不得入批） */
  sealed: boolean;
}

/** 昆虫样本（原名单中的一行） */
export interface Sample {
  id: string;
  caseId: string;
  /** 采样地点 */
  location: string;
  /** 环境温度 ℃ */
  temperature: number;
  /** 尸体暴露阶段 */
  exposureStage: string;
  /** 昆虫种类 */
  species: string;
  /** 发育阶段 */
  stage: DevelopmentStage;
  /** 发育细分（如三龄、蛹期第3日） */
  subStage: string;
  /** 采样时刻，ISO 本地时间 */
  sampledAt: string;
  /** 保存方式 */
  preservation: string;
  /** 鉴定备注 */
  note: string;
}

/** 联检批（一旦建立只读，旧批不被改写） */
export interface JointBatch {
  /** 联检编号，如 LJ-2026-001 */
  id: string;
  sampleIds: string[];
  species: string;
  stage: DevelopmentStage;
  preservation: string;
  /** 批内最早 / 最晚采样时刻 */
  windowStart: string;
  windowEnd: string;
  /** 成批时刻 */
  filedAt: string;
}
