import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import axios from 'axios';
import { Star, CheckCircle2, LinkIcon } from 'lucide-react';
import { API_BASE_URL } from '../api';
import { BOOKING_LANGS, BookingLang } from '../i18n/bookingTranslations';
import { reviewTranslations, tReview } from '../i18n/reviewTranslations';
import { getErrorCode } from '../utils/errors';

interface ReviewInfo {
  shopName: string;
  logoUrl?: string;
  defaultLang?: string;
  lang?: string;
  employeeName: string;
  services: { name: string; translations?: Partial<Record<BookingLang, string>> }[];
  date: string; // YYYY-MM-DD
  startTime: string;
}

const MAX_TEXT = 1000;
const isLang = (l?: string | null): l is BookingLang => !!l && (BOOKING_LANGS as readonly string[]).includes(l);
const formatDate = (iso: string) => iso.split('-').reverse().join('.');

// Публічна сторінка відгуку за одноразовим посиланням з листа / Telegram
// після візиту: /review/:salonSlug/:token[?lang=cs].
const ReviewPage = () => {
  const { salonSlug, token } = useParams<{ salonSlug: string; token: string }>();
  const [searchParams] = useSearchParams();
  const api = useMemo(() => axios.create({ baseURL: `${API_BASE_URL}/${salonSlug}` }), [salonSlug]);

  const [info, setInfo] = useState<ReviewInfo | null>(null);
  const [state, setState] = useState<'loading' | 'form' | 'invalid' | 'done'>('loading');
  const [loadFailed, setLoadFailed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const urlLang = searchParams.get('lang');
  const lang: BookingLang = isLang(urlLang) ? urlLang : isLang(info?.lang) ? info.lang : isLang(info?.defaultLang) ? info.defaultLang : 'uk';
  const t = (key: Parameters<typeof tReview>[1], vars?: Record<string, string | number>) => tReview(lang, key, vars);
  const names = reviewTranslations[lang].ratingNames;

  useEffect(() => {
    if (!salonSlug || !token) { setState('invalid'); return; }
    setLoadFailed(false);
    api.get<ReviewInfo>(`/booking/review/${encodeURIComponent(token)}`)
      .then(r => { setInfo(r.data); setState('form'); })
      .catch(err => {
        if (err?.response?.status === 404) setState('invalid');
        else setLoadFailed(true);
      });
  }, [api, salonSlug, token]);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const submit = async () => {
    if (!rating) { setError(t('chooseRating')); return; }
    setSending(true);
    setError('');
    try {
      await api.post(`/booking/review/${encodeURIComponent(token || '')}`, { rating, text: text.trim() });
      setState('done');
    } catch (err) {
      if (getErrorCode(err) === 'REVIEW_LINK_INVALID') setState('invalid');
      else setError(t('error'));
    } finally {
      setSending(false);
    }
  };

  const serviceNames = (info?.services || []).map(s => s.translations?.[lang]?.trim() || s.name).join(', ');
  const shown = hover || rating;

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center px-4 py-8 sm:py-14">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6 min-h-[44px]">
          {info?.logoUrl
            ? <img src={info.logoUrl} alt={info.shopName} className="h-11 max-w-[180px] object-contain"/>
            : info?.shopName && <span className="text-xl font-bold text-ink">{info.shopName}</span>}
        </div>

        <div className="ds-card p-6 sm:p-8">
          {state === 'loading' && (
            loadFailed
              ? <p className="text-sm text-center text-red-600">{t('error')}</p>
              : <p className="text-sm text-center text-ink-muted py-6">{t('loading')}</p>
          )}

          {state === 'invalid' && (
            <div className="text-center py-4">
              <span className="mx-auto mb-4 w-12 h-12 rounded-full bg-canvas-soft text-ink-muted flex items-center justify-center">
                <LinkIcon size={22}/>
              </span>
              <h1 className="text-lg font-bold text-ink">{t('invalidTitle')}</h1>
              <p className="text-sm text-ink-secondary mt-2">{t('invalidText')}</p>
              {salonSlug && <Link to={`/book/${salonSlug}`} className="btn btn-primary mt-6 inline-flex">{t('bookAgain')}</Link>}
            </div>
          )}

          {state === 'done' && (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-brand"/>
              <h1 className="text-xl font-bold text-ink">{t('thanksTitle')}</h1>
              <p className="text-sm text-ink-secondary mt-2">{t('thanksText')}</p>
              <div className="flex justify-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={22} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-line-medium'}/>
                ))}
              </div>
              {salonSlug && <Link to={`/book/${salonSlug}`} className="btn btn-primary mt-6 inline-flex">{t('bookAgain')}</Link>}
            </div>
          )}

          {state === 'form' && info && (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-ink text-center">{t('title')}</h1>
              <p className="text-sm text-ink-secondary text-center mt-2">
                {t('subtitle', { master: info.employeeName, date: formatDate(info.date) })}
              </p>
              {serviceNames && <p className="text-xs text-ink-muted text-center mt-1">{serviceNames}</p>}

              <fieldset className="mt-6">
                <legend className="sr-only">{t('ratingLabel')}</legend>
                <div className="flex justify-center gap-1 sm:gap-2" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} type="button"
                      onClick={() => { setRating(i); setError(''); }}
                      onMouseEnter={() => setHover(i)}
                      aria-label={`${i} / 5 — ${names[i - 1]}`}
                      aria-pressed={rating === i}
                      className="p-1.5 rounded-md transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                      <Star size={40} strokeWidth={1.5}
                        className={`transition-colors ${i <= shown ? 'text-amber-400 fill-amber-400' : 'text-line-medium'}`}/>
                    </button>
                  ))}
                </div>
                <p className="text-sm font-medium text-center text-ink-secondary h-5 mt-2">{shown ? names[shown - 1] : ''}</p>
              </fieldset>

              <div className="mt-5">
                <label htmlFor="review-text" className="field-label">{t('textLabel')}</label>
                <textarea id="review-text" rows={4} maxLength={MAX_TEXT} value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={t('textPlaceholder')}
                  className="field-input resize-none"/>
              </div>

              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

              <button type="button" onClick={submit} disabled={sending}
                className="btn btn-primary w-full mt-5 py-3">
                {sending ? t('sending') : t('submit')}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">hirnix</p>
      </div>
    </div>
  );
};

export default ReviewPage;
