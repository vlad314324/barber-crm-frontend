// Спільний вигляд діаграм recharts: кольори з CSS-токенів (index.css),
// тож світла/темна тема перемикаються без перерендеру логіки.

// Категорійні кольори — у фіксованому порядку (перевірений на
// розрізненність сусідніх пар); 7-й і далі згортаються в "Інші".
export const CATEGORICAL_COLORS = [1, 2, 3, 4, 5, 6].map(i => `var(--chart-${i})`);
export const MAX_CATEGORIES = CATEGORICAL_COLORS.length;

export const BRAND = 'rgb(var(--color-brand))';
export const OTHER_COLOR = 'rgb(var(--color-line-medium))';
export const GRID_STROKE = 'rgb(var(--color-line))';

export const axisTick = { fontSize: 11, fill: 'rgb(var(--color-ink-muted))' };

// Текст підказки — кольором тексту, а не кольором серії.
export const tooltipProps = {
  contentStyle: {
    background: 'rgb(var(--color-surface))',
    border: '1px solid rgb(var(--color-line))',
    borderRadius: 6,
    fontSize: 12,
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
  },
  labelStyle: { color: 'rgb(var(--color-ink))', fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: 'rgb(var(--color-ink-secondary))', padding: 0 },
  cursor: { fill: 'rgb(var(--color-canvas-soft))' },
};

// Компактні підписи осі: 12500 -> 12,5 тис. / 12.5K
export const compactNumber = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
