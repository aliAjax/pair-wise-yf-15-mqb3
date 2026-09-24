// 业务模块一（判定）与模块二（资料存取）共用的领域类型

/** 尸体暴露 / 昆虫发育阶段 */
export type Stage = "卵" | "幼虫" | "蛹" | "成虫";

/** 案件档案 */
export interface CaseFile {
  id: string; // 案件编号，如 CASE-042
  name: string; // 案件名称
  location: string; // 采样地点
  sealed: boolean; // 是否封存
  sealedNote?: string; // 封存说明
}

/** 昆虫样本（原名单，建批后只读不改名） */
export interface Sample {
  id: string; // 样本编号，如 CASE-042-A
  caseId: string; // 所属案件
  species: string; // 昆虫种类
  stage: Stage; // 发育阶段
  stageDetail: string; // 阶段细述，如 幼虫三龄
  sampledAt: string; // 采样时刻 ISO
  temperature: number; // 环境温度 ℃
  preservation: string; // 保存方式
  note: string; // 鉴定备注
  batchId: string | null; // 已进入的联检批，null 表示未入批
}

/** 跨案联检批 */
export interface JointBatch {
  id: string;
  code: string; // 联检编号 JCB-2026-001
  source: "seed" | "created"; // 既有旧批 / 本次新建
  sampleIds: string[];
  caseIds: string[]; // 联检编号需同步到的各案件
  species: string;
  stage: Stage;
  preservation: string;
  startedAt: string; // 批内最早采样时刻
  endedAt: string; // 批内最晚采样时刻
  createdAt: string; // 建批时刻
}

/** 退回理由码 */
export type RejectCode =
  | "CASE_SEALED"
  | "IN_OTHER_BATCH"
  | "SPECIES_DIFF"
  | "STAGE_DIFF"
  | "PRESERVATION_DIFF"
  | "TIME_SPAN";

/** 单次勾选审查的结论 */
export interface ReviewResult {
  /** 选中份数（含被退回的） */
  selectedCount: number;
  /** 勾选不足两份 */
  tooFew: boolean;
  /** 允许入批的样本 */
  acceptedIds: string[];
  /** 每个被选中样本的退回理由（无理由即合格） */
  reasonsById: Record<string, RejectCode[]>;
  /** 合格样本达到两份以上，可正式建批 */
  canCreate: boolean;
}
