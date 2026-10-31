import type { Appointment, BreakInterval } from '../../api/types';

// Геометрія сітки календаря (08:00–20:00, 30-хвилинні рядки по 32px) і
// спільні хелпери часу для ScheduleGrid / BreaksModal / сторінки записів.
export const SLOT_MIN = 30;
export const START_HOUR = 8;
export const END_HOUR = 20;
export const PX_PER_SLOT = 32;

export const SLOTS = Array.from(
  { length: ((END_HOUR - START_HOUR) * 60) / SLOT_MIN },
  (_, i) => {
    const t = START_HOUR * 60 + i * SLOT_MIN;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  },
);
export const TOTAL_H = SLOTS.length * PX_PER_SLOT;
export const DAY_START = START_HOUR * 60;
export const DAY_END = END_HOUR * 60;

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Набір перерв одного дня: кожна від < до, між собою не перетинаються.
// Повертає i18n-ключ помилки або null.
export const validateBreaks = (rows: Pick<BreakInterval, 'startTime' | 'endTime'>[]): string | null => {
  for (const r of rows) {
    if (!r.startTime || !r.endTime || toMin(r.startTime) >= toMin(r.endTime)) return 'appointments.breakInvalidRange';
  }
  const sorted = [...rows].sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  for (let i = 1; i < sorted.length; i++) {
    if (toMin(sorted[i].startTime) < toMin(sorted[i - 1].endTime)) return 'appointments.breakOverlap';
  }
  return null;
};

export const minToTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Неявка, як і на сервері (utils/appointmentOverlap.js), займає час —
// звільняють слот лише скасовані й перенесені записи.
export const isActive = (a: Appointment) => a.status !== 'Cancelled' && a.status !== 'Rescheduled';

// Хвилини -> px від верху сітки; блок, що виходить за 08:00–20:00, обрізається.
export const place = (start: number, end: number) => {
  const s = Math.max(start, DAY_START);
  const e = Math.min(end, DAY_END);
  if (e <= s) return null;
  return { top: ((s - DAY_START) / SLOT_MIN) * PX_PER_SLOT, height: ((e - s) / SLOT_MIN) * PX_PER_SLOT };
};

// Заштрихований фон для перерв — у тонах теми, тож працює і в темній.
export const BREAK_PATTERN =
  'repeating-linear-gradient(135deg, rgb(var(--color-canvas-soft)) 0 6px, rgb(var(--color-line)) 6px 8px)';

// Час на підготовку після запису — та сама штриховка, але в тонах бренду.
export const PREP_PATTERN =
  'repeating-linear-gradient(135deg, rgb(var(--color-brand) / 0.08) 0 6px, rgb(var(--color-brand) / 0.22) 6px 8px)';

