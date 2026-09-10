export interface DurationLabels { hour: string; minute: string; }

// "45" -> "45 хв"; "90" -> "1 год 30 хв"; "420" -> "7 год" (без хвилинної
// частини, коли залишок 0).
export function formatDuration(minutes: number, labels: DurationLabels): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} ${labels.minute}`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h} ${labels.hour}` : `${h} ${labels.hour} ${rem} ${labels.minute}`;
}

// "min" коли одне значення, "min–max" коли max більший за min — той самий
// патерн, що й раніше, але тепер кожна сторона йде через formatDuration,
// тож одиниця вбудована в рядок (виклики більше не дописують суфікс самі).
export function formatDurationRange(min: number, max: number | undefined | null, labels: DurationLabels): string {
  if (max === undefined || max === null || max <= min) return formatDuration(min, labels);
  return `${formatDuration(min, labels)}–${formatDuration(max, labels)}`;
}

// ── конвертація для полів вводу (не пов'язано з форматуванням показу вище) ──
export type DurationUnit = 'min' | 'hour';

// Значення для показу всередині number-інпута в обраній одиниці, з хвилин.
// Округлення до 2 знаків у режимі годин — лише щоб уникнути потворних
// "хвостів" на кшталт 1.6666666666666667 (100 хв).
export function minutesToUnitValue(minutes: number, unit: DurationUnit): number {
  return unit === 'hour' ? Math.round((minutes / 60) * 100) / 100 : minutes;
}

// Значення, введене адміном в обраній одиниці, назад у цілі хвилини.
export function unitValueToMinutes(value: number, unit: DurationUnit): number {
  return unit === 'hour' ? Math.round(value * 60) : Math.round(value);
}

export function unitInputProps(unit: DurationUnit): { min: number; step: number } {
  return unit === 'hour' ? { min: 0.25, step: 0.25 } : { min: 5, step: 5 };
}
