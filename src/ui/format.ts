import type { JointBatch } from "../domain/types";

/** 业务模块三（页面交互）· 展示用工具 */

const pad = (n: number) => String(n).padStart(2, "0");

/** 09-10 08:00 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** 2026-09-10 08:00 */
export function formatFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** 两时刻相距的小时数（保留 1 位小数） */
export function spanHours(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 3_600_000;
}

/** 联检批配色：按列表顺序取色，旧批固定主色，新批依次取辅色 */
const PALETTE = ["#365314", "#a16207", "#2563eb", "#7c3aed", "#0f766e"];

export function batchColor(batches: JointBatch[], batchId: string): string {
  const index = batches.findIndex((b) => b.id === batchId);
  return PALETTE[Math.max(0, index) % PALETTE.length];
}
