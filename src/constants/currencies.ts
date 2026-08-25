export interface CurrencyMeta {
  code: string;
  symbol: string;
  position: 'before' | 'after';
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'UAH', symbol: '₴', position: 'after' },
  { code: 'CZK', symbol: 'Kč', position: 'after' },
  { code: 'EUR', symbol: '€', position: 'after' },
  { code: 'PLN', symbol: 'zł', position: 'after' },
  { code: 'USD', symbol: '$', position: 'before' },
  { code: 'GBP', symbol: '£', position: 'before' },
];

export const DEFAULT_CURRENCY = 'UAH';

export function getCurrencySymbol(currency?: string): string {
  return (CURRENCIES.find(c => c.code === currency) ?? CURRENCIES.find(c => c.code === DEFAULT_CURRENCY)!).symbol;
}
