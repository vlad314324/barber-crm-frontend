// "60" коли одне значення, "60–90" коли max більший за min — дзеркалить
// backend'ове utils/range.js, але для UI (без валюти).
export function formatDurationRange(min: number, max?: number): string {
  if (max === undefined || max === null || max <= min) return `${min}`;
  return `${min}–${max}`;
}
