import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Cake, Copy, Check, Instagram, Phone, Gift, ArrowLeft } from 'lucide-react';
import { clientApi } from '../../api';
import type { UpcomingBirthday } from '../../api/types';
import { useLocale } from '../../i18n/LocaleContext';
import { instagramUrl } from '../../utils/clientProfile';
import { useAuth } from '../../context/AuthContext';
import BirthdayGreetingModal, { BirthdayGreetingForm } from './BirthdayGreetingModal';

interface Props {
  // Початковий період у днях і чи показувати перемикач 7/30/90.
  initialDays?: number;
  showPeriodSwitch?: boolean;
  // Скільки рядків показати (дашборд) — решта за посиланням "Усі".
  limit?: number;
  // Список уже всередині модалки — форму привітання показуємо на його
  // місці, а не окремою модалкою поверх.
  inlineGreeting?: boolean;
}

const PERIODS = [7, 30, 90];

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

// Найближчі дні народження клієнтів зі швидкими діями для персональної
// пропозиції: Instagram, скопіювати телефон, скопіювати готове привітання.
const UpcomingBirthdays = ({ initialDays = 30, showPeriodSwitch = false, limit, inlineGreeting = false }: Props) => {
  const { t, lang } = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [greetFor, setGreetFor] = useState<UpcomingBirthday | null>(null);
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
  const [days, setDays] = useState(initialDays);
  const [items, setItems] = useState<UpcomingBirthday[] | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setError(false);
    clientApi.birthdays(days)
      .then((r) => { if (!cancelled) setItems(r); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [days]);
  useEffect(() => load(), [load]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      // clipboard недоступний — нічого критичного
    }
  };

  const when = (n: number) => (n === 0 ? t('birthdays.today') : n === 1 ? t('birthdays.tomorrow') : t('birthdays.inDays', { n }));
  const dateLabel = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };
  const shown = items && limit ? items.slice(0, limit) : items;

  const greetingChip = (b: UpcomingBirthday) => {
    const g = b.greeting;
    if (!g) return null;
    const time = new Date(g.sendAt).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const label = g.status === 'sent' && g.promoUsed ? t('birthdays.greet.chipUsed', { pct: g.discountPercent })
      : g.status === 'sent' ? t('birthdays.greet.chipSent', { pct: g.discountPercent })
      : g.status === 'failed' ? t('birthdays.greet.chipFailed')
      : g.status === 'expired' ? t('birthdays.greet.chipExpired')
      : t('birthdays.greet.chipScheduled', { when: time, pct: g.discountPercent });
    const tone = g.status === 'sent' ? 'bg-brand-extra-soft text-brand-dark'
      : g.status === 'failed' || g.status === 'expired' ? 'bg-red-50 text-red-700'
      : 'bg-amber-50 text-amber-800';
    const editable = isAdmin && (g.status === 'scheduled' || g.status === 'failed');
    return (
      <button type="button" disabled={!editable} onClick={() => setGreetFor(b)}
        className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tone} ${editable ? 'hover:opacity-80' : 'cursor-default'}`}>
        <Gift size={11} /> {label}
      </button>
    );
  };

  if (greetFor && inlineGreeting) {
    return (
      <div>
        <button type="button" onClick={() => setGreetFor(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark mb-3">
          <ArrowLeft size={15} /> {t('birthdays.greet.back')}
        </button>
        <h4 className="text-base font-bold text-ink mb-3">{t('birthdays.greet.title', { name: greetFor.name })}</h4>
        <BirthdayGreetingForm birthday={greetFor} onClose={() => setGreetFor(null)} onSaved={load} inline />
      </div>
    );
  }

  return (
    <div>
      {greetFor && !inlineGreeting && (
        <BirthdayGreetingModal birthday={greetFor} onClose={() => setGreetFor(null)} onSaved={load} />
      )}
      {showPeriodSwitch && (
        <div className="flex flex-wrap gap-2 mb-4">
          {PERIODS.map((p) => (
            <button key={p} type="button" aria-pressed={days === p} onClick={() => setDays(p)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${days === p
                ? 'bg-brand text-white border-brand'
                : 'bg-surface text-ink-secondary border-line hover:border-line-medium'}`}>
              {t('birthdays.period', { n: p })}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-600 py-4 text-center">{t('birthdays.loadError')}</p>
      ) : !shown ? (
        <p className="text-sm text-ink-muted py-4 text-center">{t('common.loading')}</p>
      ) : shown.length === 0 ? (
        <div className="py-6 text-center">
          <Cake size={28} className="mx-auto text-ink-muted mb-2" strokeWidth={1.5} />
          <p className="text-sm text-ink-muted max-w-xs mx-auto">{t('birthdays.empty')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((b) => {
            const firstName = b.name.split(/\s+/)[0];
            const isToday = b.daysUntil === 0;
            return (
              <li key={b._id} className="flex items-center gap-3 py-3">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${isToday ? 'bg-brand text-white' : 'bg-brand-soft text-brand-dark'}`}>
                  {isToday ? <Cake size={18} /> : initials(b.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <Link to={`/clients/${b._id}`} className="block text-sm font-semibold text-ink hover:text-brand truncate">{b.name}</Link>
                  <p className="text-xs text-ink-muted mt-0.5">
                    <span className={isToday ? 'font-semibold text-brand-dark' : 'font-medium text-ink-secondary'}>{when(b.daysUntil)}</span>
                    {' · '}{dateLabel(b.date)}
                    {b.age > 0 && b.age < 120 && <> · {t('birthdays.turns', { n: b.age })}</>}
                  </p>
                  {greetingChip(b)}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isAdmin && !b.greeting && (
                    <button type="button" onClick={() => setGreetFor(b)} disabled={!b.hasEmail && !b.telegramLinked}
                      title={!b.hasEmail && !b.telegramLinked ? t('birthdays.greet.noChannel') : t('birthdays.greet.button')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-semibold text-white bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed">
                      <Gift size={14} /> <span className="hidden sm:inline">{t('birthdays.greet.buttonShort')}</span>
                    </button>
                  )}
                  {b.instagram && (
                    <a href={instagramUrl(b.instagram)} target="_blank" rel="noreferrer" title="Instagram"
                      className="p-2 rounded-sm text-ink-muted hover:text-ink hover:bg-canvas-soft">
                      <Instagram size={16} />
                    </a>
                  )}
                  <button type="button" onClick={() => copy(`p${b._id}`, b.phone)} title={t('birthdays.copyPhone')}
                    className="p-2 rounded-sm text-ink-muted hover:text-ink hover:bg-canvas-soft">
                    {copied === `p${b._id}` ? <Check size={16} className="text-brand" /> : <Phone size={16} />}
                  </button>
                  <button type="button" onClick={() => copy(`g${b._id}`, t('birthdays.greeting', { name: firstName }))}
                    title={t('birthdays.copyGreeting')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-medium text-brand-dark bg-brand-extra-soft hover:bg-brand-soft">
                    {copied === `g${b._id}` ? <Check size={14} /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copied === `g${b._id}` ? t('birthdays.copied') : t('birthdays.greetingShort')}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UpcomingBirthdays;
