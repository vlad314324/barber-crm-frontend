import { formatPriceRange, discounted } from '../../utils/money';

// Ціна на сторінці бронювання. Зі знижкою до дня народження (pct) —
// бейдж "−15%", закреслена звичайна ціна й акційна поруч.

interface Props {
  price: number;
  priceMax?: number;
  currency?: string;
  pct?: number | null;
  className?: string;
}

const PriceTag = ({ price, priceMax, currency, pct, className = '' }: Props) => {
  if (!pct) return <span className={className}>{formatPriceRange(price, priceMax, currency)}</span>;
  return (
    <span className={`inline-flex flex-wrap items-baseline justify-end gap-x-1.5 gap-y-0.5 ${className}`}>
      <span className="self-center rounded-full bg-rose-100 text-rose-700 px-1.5 py-0.5 text-[11px] font-bold leading-none">−{pct}%</span>
      <s className="text-ink-muted font-normal text-[0.85em]">{formatPriceRange(price, priceMax, currency)}</s>
      <span>{formatPriceRange(discounted(price, pct), discounted(priceMax, pct), currency)}</span>
    </span>
  );
};

export default PriceTag;
