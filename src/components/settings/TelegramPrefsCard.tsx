import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { authApi } from '../../api';
import { TelegramPrefKey, TelegramPrefs, TelegramPrefsResponse } from '../../api/types';
import { useLocale } from '../../i18n/LocaleContext';
import { getErrorMessage } from '../../utils/errors';

// «Що надсилати в Telegram» — персональні перемикачі типів сповіщень.
// Розділи: «Мої записи» (є картка майстра), «Увесь салон» (адміністратор),
// «Загальні» — для всіх.
const OWN: TelegramPrefKey[] = ['newBooking', 'bookingChanged', 'reminder2h', 'dailyAgenda', 'review'];
const SALON: TelegramPrefKey[] = ['newBookingAll', 'bookingChangedAll', 'reviewAll', 'dailySummary'];
const COMMON: TelegramPrefKey[] = ['birthdays', 'statusNudge'];

const TelegramPrefsCard = () => {
  const { t } = useLocale();
  const [data, setData] = useState<TelegramPrefsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authApi.getTelegramPrefs().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;

  const toggle = async (key: TelegramPrefKey) => {
    const prev = data.prefs;
    const next: TelegramPrefs = { ...prev, [key]: !prev[key] };
    setError('');
    setData({ ...data, prefs: next });
    try {
      const r = await authApi.updateTelegramPrefs({ [key]: next[key] });
      setData((d) => (d ? { ...d, prefs: r.prefs } : d));
    } catch (err) {
      setData((d) => (d ? { ...d, prefs: prev } : d));
      setError(getErrorMessage(err) || t('settings.telegramPrefsError'));
    }
  };

  const section = (title: string, keys: TelegramPrefKey[]) => (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1">{title}</h3>
      <div className="divide-y divide-line">
        {keys.map((key) => {
          const on = data.prefs[key];
          const label = t(`settings.tgPref_${key}`);
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-ink-muted mt-0.5">{t(`settings.tgPrefHint_${key}`)}</p>
              </div>
              <button type="button" role="switch" aria-checked={on} aria-label={label}
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors
                  ${on ? 'bg-brand' : 'bg-line-medium'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                  ${on ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="ds-card overflow-hidden">
      <div className="ds-card-header">
        <div>
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <BellRing size={18} className="text-brand" /> {t('settings.telegramPrefsTitle')}
          </h2>
          <p className="text-sm text-ink-muted mt-0.5">{t('settings.telegramPrefsDesc')}</p>
        </div>
      </div>
      <div className="px-6 py-4 space-y-5">
        {data.sections.own && section(t('settings.telegramPrefsOwn'), OWN)}
        {data.sections.salon && section(t('settings.telegramPrefsSalon'), SALON)}
        {section(t('settings.telegramPrefsCommon'), COMMON)}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramPrefsCard;
