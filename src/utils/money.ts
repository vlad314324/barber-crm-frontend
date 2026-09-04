import { CURRENCIES, DEFAULT_CURRENCY } from '../constants/currencies';

export function formatPrice(amount: number, currency?: string): string {
  const meta = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES.find(c => c.code === DEFAULT_CURRENCY)!;
  const num = amount.toLocaleString('uk-UA', { maximumFractionDigits: 2 });
  return meta.position === 'before' ? `${meta.symbol}${num}` : `${num} ${meta.symbol}`;
}

// "500 грн" коли одне значення, "500–700 грн" коли max більший за min —
// для послуг з ціновим діапазоном (priceMax).
export function formatPriceRange(min: number, max?: number, currency?: string): string {
  const meta = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES.find(c => c.code === DEFAULT_CURRENCY)!;
  const fmt = (n: number) => n.toLocaleString('uk-UA', { maximumFractionDigits: 2 });
  if (max === undefined || max === null || max <= min) {
    return meta.position === 'before' ? `${meta.symbol}${fmt(min)}` : `${fmt(min)} ${meta.symbol}`;
  }
  const range = `${fmt(min)}–${fmt(max)}`;
  return meta.position === 'before' ? `${meta.symbol}${range}` : `${range} ${meta.symbol}`;
}
