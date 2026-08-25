import { CURRENCIES, DEFAULT_CURRENCY } from '../constants/currencies';

export function formatPrice(amount: number, currency?: string): string {
  const meta = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES.find(c => c.code === DEFAULT_CURRENCY)!;
  const num = amount.toLocaleString('uk-UA', { maximumFractionDigits: 2 });
  return meta.position === 'before' ? `${meta.symbol}${num}` : `${num} ${meta.symbol}`;
}
