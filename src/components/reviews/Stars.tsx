import { Star } from 'lucide-react';

// Рейтинг зірками (лише показ). Дробові значення округлюються до цілих зірок.
const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5" aria-label={`${rating.toFixed(1)} / 5`}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size}
        className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-line-medium'}/>
    ))}
  </div>
);

export default Stars;
