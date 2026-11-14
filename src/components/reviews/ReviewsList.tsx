import { useState } from 'react';
import { Eye, EyeOff, Trash2, MessageCircleHeart } from 'lucide-react';
import { reviewApi } from '../../api';
import type { Review } from '../../api/types';
import { useLocale } from '../../i18n/LocaleContext';
import { getErrorMessage } from '../../utils/errors';
import Stars from './Stars';

interface ReviewsListProps {
  reviews: Review[];
  // Після приховування/видалення — щоб батько перечитав список і рейтинг.
  onChanged: () => void;
}

// Відгуки майстра в CRM: хто, оцінка, текст, візит; відгук від клієнта
// (за посиланням) позначено окремо; адмін може приховати або видалити.
const ReviewsList = ({ reviews, onChanged }: ReviewsListProps) => {
  const { t, lang } = useLocale();
  const [busyId, setBusyId] = useState<string | null>(null);
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    try { await action(); onChanged(); }
    catch (err) { alert(getErrorMessage(err)); }
    finally { setBusyId(null); }
  };

  if (reviews.length === 0) {
    return <p className="text-sm text-center text-ink-muted py-4">{t('employees.noReviewsYet')}</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.some(r => r.hidden) && <p className="text-xs text-ink-muted">{t('employees.reviewHiddenHint')}</p>}
      {reviews.map(r => {
        const services = r.appointment?.services?.map(s => s.name).join(', ');
        return (
          <div key={r._id} className={`border border-line rounded-sm p-3 ${r.hidden ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium text-ink">
                    {typeof r.client === 'object' && r.client ? r.client.name : t('employees.clientLabel')}
                  </span>
                  <Stars rating={r.rating} size={12}/>
                  {r.source === 'client' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-dark bg-brand-extra-soft rounded-full px-2 py-0.5">
                      <MessageCircleHeart size={11}/> {t('employees.reviewFromClient')}
                    </span>
                  )}
                  {r.hidden && (
                    <span className="text-[11px] font-medium text-ink-muted bg-canvas-soft rounded-full px-2 py-0.5">{t('employees.reviewHiddenBadge')}</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  {r.appointment?.date ? t('employees.reviewVisit', { date: fmt(r.appointment.date) }) : fmt(r.createdAt)}
                  {services ? ` · ${services}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" disabled={busyId === r._id}
                  onClick={() => run(r._id, () => reviewApi.setHidden(r._id, !r.hidden))}
                  title={r.hidden ? t('employees.reviewShow') : t('employees.reviewHide')}
                  aria-label={r.hidden ? t('employees.reviewShow') : t('employees.reviewHide')}
                  className="p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-canvas-soft disabled:opacity-50">
                  {r.hidden ? <Eye size={15}/> : <EyeOff size={15}/>}
                </button>
                <button type="button" disabled={busyId === r._id}
                  onClick={() => { if (confirm(t('employees.reviewDeleteConfirm'))) run(r._id, () => reviewApi.delete(r._id)); }}
                  title={t('employees.reviewDelete')} aria-label={t('employees.reviewDelete')}
                  className="p-1.5 rounded-sm text-ink-muted hover:text-red-600 hover:bg-canvas-soft disabled:opacity-50">
                  <Trash2 size={15}/>
                </button>
              </div>
            </div>
            {r.text && <p className="text-sm text-ink-secondary mt-2 whitespace-pre-line">{r.text}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default ReviewsList;
