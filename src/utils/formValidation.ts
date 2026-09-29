// Спільна логіка "показати, яке саме поле не заповнене" для CRUD-форм
// (клієнти/співробітники/послуги) — замість того, щоб дізнаватись про це
// лише з alert() при спробі зберегти.

// Повертає набір імен полів зі значенням, що не пройшло trim()-перевірку.
export const missingFields = (values: Record<string, string>, required: string[]): Set<string> => {
  const missing = new Set<string>();
  required.forEach(f => { if (!values[f]?.trim()) missing.add(f); });
  return missing;
};

// Той самий візуальний патерн, що вже використовує email-поле на публічній
// сторінці бронювання (BookingPage.tsx) для невалідного email.
export const errorFieldClass = (hasError: boolean): string =>
  hasError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15' : '';
