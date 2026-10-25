import { Check, Send } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleContext';
import { BREAK_PATTERN, PREP_PATTERN } from '../schedule/scheduleTime';

// Декоративний колаж для сторінки входу: фрагмент календаря, екран
// бронювання на телефоні й сповіщення Telegram — зверстані з токенів теми
// (працюють і в темній темі), тексти з перекладів. Для скрінрідерів
// прихований: зміст дублює текст поруч.
const LoginShowcase = ({ compact = false }: { compact?: boolean }) => {
  const { t } = useLocale();
  const rows = [
    { time: '10:00', name: t('login.showcaseAppt1'), h: 'h-14', color: 'bg-brand' },
    { prep: true },
    { time: '11:30', name: t('login.showcaseAppt2'), h: 'h-10', color: 'bg-slate-500' },
    { pause: true },
    { time: '14:00', name: t('login.showcaseAppt3'), h: 'h-12', color: 'bg-brand-dark' },
  ];

  return (
    <div aria-hidden="true" className={`relative mx-auto ${compact ? 'h-[330px] w-[330px]' : 'h-[440px] w-[420px]'}`}>
      {/* Календар */}
      <div className={`login-float absolute left-0 top-0 rounded-lg border border-line bg-surface shadow-lg p-4 -rotate-2 ${compact ? 'w-[220px] scale-90 origin-top-left' : 'w-[250px]'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-ink">{t('login.showcaseToday')}</p>
          <span className="w-2 h-2 rounded-full bg-brand" />
        </div>
        <div className="space-y-1.5">
          {rows.map((r, i) => {
            if ('prep' in r) {
              return <div key={i} className="ml-10 h-3 rounded-b border-l-4 border-brand/40" style={{ background: PREP_PATTERN }} />;
            }
            if ('pause' in r) {
              return (
                <div key={i} className="ml-10 h-6 rounded border-l-4 border-line-medium px-1.5 text-[10px] leading-6 text-ink-muted" style={{ background: BREAK_PATTERN }}>
                  {t('login.showcaseBreak')}
                </div>
              );
            }
            return (
              <div key={i} className="flex gap-2">
                <span className="w-8 shrink-0 text-[10px] text-ink-muted pt-0.5">{r.time}</span>
                <div className={`${r.h} ${r.color} flex-1 rounded px-2 py-1 text-white text-[11px] leading-tight font-semibold`}>{r.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Телефон: сторінка бронювання */}
      <div className={`login-float-slow absolute right-0 rounded-[28px] border-[6px] border-neutral-800 dark:border-neutral-600 bg-surface shadow-lg rotate-3 overflow-hidden ${compact ? 'top-6 w-[150px] h-[260px]' : 'top-10 w-[190px] h-[340px]'}`}>
        <div className="h-16 bg-neutral-900 flex items-end justify-center pb-2">
          <span className="text-white text-[11px] font-bold">NOIR Beauty</span>
        </div>
        <div className="p-3 text-center">
          <div className="mx-auto mt-2 mb-2 w-10 h-10 rounded-full bg-brand-extra-soft flex items-center justify-center">
            <Check size={20} strokeWidth={3} className="text-brand" />
          </div>
          <p className="text-xs font-bold text-ink">{t('login.showcaseBooked')}</p>
          <div className="mt-3 rounded-sm bg-canvas-soft p-2 text-left space-y-1">
            <p className="text-[10px] font-semibold text-ink leading-tight">{t('login.showcaseServices')}</p>
            <p className="text-[10px] text-ink-muted">{t('login.showcaseWhen')}</p>
            <p className="text-[11px] font-bold text-brand-dark">930 ₴</p>
          </div>
          {!compact && <div className="mt-3 h-7 rounded-full bg-brand text-white text-[10px] font-semibold leading-7">{t('login.showcaseCalendar')}</div>}
        </div>
      </div>

      {/* Сповіщення Telegram */}
      <div className={`login-float-fast absolute rounded-md border border-line bg-surface shadow-lg p-3 flex gap-2.5 items-start -rotate-1 ${compact ? 'left-2 bottom-2 w-[230px]' : 'left-8 bottom-6 w-[270px]'}`}>
        <span className="w-8 h-8 shrink-0 rounded-full bg-[#2AABEE] flex items-center justify-center">
          <Send size={15} className="text-white -ml-0.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-ink">hirnix</p>
          <p className="text-[11px] text-ink-secondary leading-snug">{t('login.showcaseReminder')}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginShowcase;
