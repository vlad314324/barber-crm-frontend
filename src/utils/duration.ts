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

export type DurationUnit = 'min' | 'hour';

// ── формат показу, керований глобальним налаштуванням закладу ──
// На відміну від formatDuration/formatDurationRange (які самі переходять
// на "1 год 30 хв" з 60 хв), ці версії примусово дотримуються обраної
// одиниці: 'min' завжди показує хвилини одним числом, навіть для довгих
// послуг.
export function formatDurationForUnit(minutes: number, unit: DurationUnit, labels: DurationLabels): string {
  if (unit === 'min') return `${Math.round(minutes)} ${labels.minute}`;
  return formatDuration(minutes, labels);
}

export function formatDurationRangeForUnit(min: number, max: number | undefined | null, unit: DurationUnit, labels: DurationLabels): string {
  if (max === undefined || max === null || max <= min) return formatDurationForUnit(min, unit, labels);
  return `${formatDurationForUnit(min, unit, labels)}–${formatDurationForUnit(max, unit, labels)}`;
}
