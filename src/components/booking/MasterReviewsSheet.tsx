import { useEffect, useState } from 'react';
import type { AxiosInstance } from 'axios';
import { X } from 'lucide-react';
import Stars from '../reviews/Stars';
import type { PublicReview } from '../../api/types';
import type { BookingLang } from '../../i18n/bookingTranslations';
import { tReview } from '../../i18n/reviewTranslations';

const LOCALES: Record<BookingLang, string> = { uk: 'uk-UA', en: 'en-GB', cs: 'cs-CZ', pl: 'pl-PL', de: 'de-DE' };

interface MasterReviewsSheetProps {
  api: AxiosInstance; // клієнт сторінки бронювання, вже з slug салону
  employee: { _id: string; name: string; rating?: number; reviewCount?: number };
  lang: BookingLang;
  onClose: () => void;
}

// Відгуки майстра на сторінці бронювання: знизу на телефоні, по центру на
// десктопі. Показує лише видимі (не приховані адміном) відгуки.
const MasterReviewsSheet = ({ api, employee, lang, onClose }: MasterReviewsSheetProps) => {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [summary, setSummary] = useState({ rating: employee.rating || 0, reviewCount: employee.reviewCount || 0 });

  useEffect(() => {
    api.get(`/booking/employees/${employee._id}/reviews`)
      .then(r => { setReviews(r.data.reviews || []); setSummary({ rating: r.data.rating || 0, reviewCount: r.data.reviewCount || 0 }); })
      .catch(() => setFailed(true));
  }, [api, employee._id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const fmt = (d: string) => new Date(d).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true"
      aria-label={`${employee.name} — ${tReview(lang, 'reviews', { count: summary.reviewCount })}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative w-full sm:max-w-lg max-h-[85vh] flex flex-col bg-surface rounded-t-xl sm:rounded-xl shadow-xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-line">
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink truncate">{employee.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-ink leading-none">{summary.rating.toFixed(1)}</span>
              <Stars rating={summary.rating} size={16}/>
              <span className="text-sm text-ink-muted">{tReview(lang, 'reviews', { count: summary.reviewCount })}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={tReview(lang, 'close')}
            className="p-2 -m-1 rounded-full text-ink-muted hover:text-ink hover:bg-canvas-soft">
            <X size={20}/>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {failed ? <p className="text-sm text-center text-red-600 py-6">{tReview(lang, 'error')}</p>
            : reviews === null ? <p className="text-sm text-center text-ink-muted py-6">{tReview(lang, 'loading')}</p>
            : reviews.length === 0 ? <p className="text-sm text-center text-ink-muted py-6">{tReview(lang, 'noReviews')}</p>
            : reviews.map(r => (
              <div key={r._id} className="pb-4 border-b border-line last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{r.clientName}</span>
                  <span className="text-xs text-ink-muted">{fmt(r.createdAt)}</span>
                </div>
                <div className="mt-1"><Stars rating={r.rating} size={13}/></div>
                {r.text && <p className="text-sm text-ink-secondary mt-1.5 whitespace-pre-line">{r.text}</p>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MasterReviewsSheet;
