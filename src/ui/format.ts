/** 展示层格式化工具 */

/** "2026-09-21T08:30:00" -> "09-21 08:30" */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
}

/** "2026-09-21T08:30:00" -> "09-21" */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "2026-09-21T08:30:00" -> "08:30" */
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtHours(hours: number): string {
  return `${(Math.round(hours * 10) / 10).toFixed(1)} 小时`;
}
