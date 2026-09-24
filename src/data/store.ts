import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { JointBatch, Sample, Stage } from "../domain/types";
import { SEED_BATCHES, SEED_CASES, SEED_SAMPLES } from "./seed";

/** 业务模块二（资料存取）：仓库状态、不可变建批、localStorage 持久化。
 * 不依赖任何后端或第三方库；所有更新走不可变拷贝，旧批与原名单永不被改坏。
 */

export interface Repository {
  cases: typeof SEED_CASES;
  samples: Sample[];
  batches: JointBatch[];
  seq: number; // 联检批流水号
}

const STORAGE_KEY = "hxyfront-62003-joint-bench-v1";

export function freshRepository(): Repository {
  return {
    cases: SEED_CASES,
    samples: SEED_SAMPLES,
    batches: SEED_BATCHES,
    seq: SEED_BATCHES.length,
  };
}

function load(): Repository {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshRepository();
    const parsed = JSON.parse(raw) as Repository;
    if (!Array.isArray(parsed.samples) || !Array.isArray(parsed.batches)) {
      return freshRepository();
    }
    return { ...parsed, cases: SEED_CASES };
  } catch {
    return freshRepository();
  }
}

type Action =
  | { type: "CREATE_BATCH"; batch: JointBatch }
  | { type: "RESET" };

function reducer(state: Repository, action: Action): Repository {
  switch (action.type) {
    case "CREATE_BATCH": {
      const batch = action.batch;
      const accepted = new Set(batch.sampleIds);
      // 原名单逐项克隆：仅给入批样本挂上新批引用，其余（含旧批样本）原样保留
      const samples = state.samples.map((s) =>
        accepted.has(s.id) ? { ...s, batchId: batch.id } : s,
      );
      return {
        ...state,
        samples,
        batches: [...state.batches, batch],
        seq: state.seq + 1,
      };
    }
    case "RESET":
      return freshRepository();
    default:
      return state;
  }
}

export function useRepository() {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* 隐私模式等情况下静默降级为内存态 */
    }
  }, [state]);

  const createBatch = useCallback(
    (accepted: Sample[]): JointBatch => {
      const sorted = [...accepted].sort(
        (a, b) =>
          new Date(a.sampledAt).getTime() - new Date(b.sampledAt).getTime(),
      );
      const first = sorted[0];
      const seq = state.seq + 1;
      const batch: JointBatch = {
        id: `created-${seq}`,
        code: `JCB-2026-${String(seq).padStart(3, "0")}`,
        source: "created",
        sampleIds: sorted.map((s) => s.id),
        caseIds: Array.from(new Set(sorted.map((s) => s.caseId))).sort(),
        species: first.species,
        stage: first.stage,
        preservation: first.preservation,
        startedAt: first.sampledAt,
        endedAt: sorted[sorted.length - 1].sampledAt,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "CREATE_BATCH", batch });
      return batch;
    },
    [state.seq],
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { repo: state, createBatch, reset };
}

/** 派生态：案件 -> 样本 / 联检编号汇总（联检编号同步到各案件） */
export function useCaseIndex(repo: Repository) {
  return useMemo(() => {
    return repo.cases.map((c) => {
      const samples = repo.samples.filter((s) => s.caseId === c.id);
      const batchCodes = Array.from(
        new Set(
          samples
            .map((s) => s.batchId)
            .filter((id): id is string => id !== null)
            .map((id) => repo.batches.find((b) => b.id === id)?.code)
            .filter((code): code is string => Boolean(code)),
        ),
      );
      return { caseFile: c, samples, batchCodes };
    });
  }, [repo]);
}

export const STAGES: Stage[] = ["卵", "幼虫", "蛹", "成虫"];
