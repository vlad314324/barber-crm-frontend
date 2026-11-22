import { useEffect, useState } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import {
  platformAuthApi, MessagingCountry, MessagingKind, PlatformSalon, PlatformSalonMessagingUsage,
} from '../../api/platformApi';
import { getErrorMessage } from '../../utils/errors';

const COUNTRIES: MessagingCountry[] = ['UA', 'CZ', 'PL', 'DE', 'OTHER'];
const KINDS: MessagingKind[] = ['confirmation', 'rescheduled', 'cancelled', 'reminder24', 'reminder2h'];

interface SalonMessagingSectionProps {
  salon: PlatformSalon;
  onUpdated: (salon: PlatformSalon) => void;
}

// Платна опція сповіщень клієнтам: вмикає власник платформи після
// оплати, так само вручну, як і підписку.
const SalonMessagingSection = ({ salon, onUpdated }: SalonMessagingSectionProps) => {
  const { t } = useLocale();
  const [enabled, setEnabled] = useState(salon.messaging.enabled);
  const [country, setCountry] = useState<MessagingCountry | null>(salon.messaging.country);
  const [monthlyLimit, setMonthlyLimit] = useState(salon.messaging.monthlyLimit);
  const [kinds, setKinds] = useState(salon.messaging.kinds);
  const [usage, setUsage] = useState<PlatformSalonMessagingUsage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    platformAuthApi.getSalonMessagingUsage(salon.id)
      .then(data => {
        setUsage(data);
        setCountry(current => current ?? data.suggestedCountry);
      })
      .catch(() => setUsage(null));
  }, [salon.id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      onUpdated(await platformAuthApi.updateMessaging(salon.id, { enabled, country, monthlyLimit, kinds }));
    } catch (err) {
      setError(getErrorMessage(err) || 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-3">{t('platformAdmin.messagingTitle')}</h3>

      <label className="flex items-center gap-2 text-sm text-ink mb-3">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        {t('platformAdmin.messagingEnable')}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label">{t('platformAdmin.messagingCountry')}</label>
          <select className="field-input py-2.5" value={country ?? ''} onChange={e => setCountry(e.target.value as MessagingCountry)}>
            {COUNTRIES.map(c => <option key={c} value={c}>{t(`platformAdmin.messagingCountry_${c}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">{t('platformAdmin.messagingLimit')}</label>
          <input
            type="number"
            min={0}
            step={1}
            className="field-input py-2.5"
            value={monthlyLimit}
            onChange={e => setMonthlyLimit(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
          />
        </div>
      </div>

      <p className="text-xs text-ink-muted mt-2">{t('platformAdmin.messagingProvidersHint')}</p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {KINDS.map(kind => (
          <label key={kind} className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={kinds[kind]}
              onChange={e => setKinds(prev => ({ ...prev, [kind]: e.target.checked }))}
            />
            {t(`platformAdmin.messagingKind_${kind}`)}
          </label>
        ))}
      </div>

      {usage && (
        <div className="bg-canvas-soft rounded-sm px-3 py-2 mt-3 text-sm text-ink-secondary space-y-1">
          <p>
            {t('platformAdmin.messagingUsed', { period: usage.period })}:{' '}
            <span className="font-medium text-ink">{usage.used} / {usage.limit}</span>
          </p>
          <p>{t('platformAdmin.messagingBreakdown', {
            viber: usage.viber, sms: usage.sms, failed: usage.failed, pending: usage.pending,
          })}</p>
          <p>{t('platformAdmin.messagingCost')}:{' '}
            <span className="font-medium text-ink">
              {[usage.cost.UAH ? `${usage.cost.UAH} ₴` : null, usage.cost.EUR ? `€${usage.cost.EUR}` : null].filter(Boolean).join(' + ') || '0'}
            </span>
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button onClick={handleSave} disabled={saving} className="btn btn-primary mt-3">
        {saving ? t('platformAdmin.saving') : t('platformAdmin.saveBtn')}
      </button>
    </div>
  );
};

export default SalonMessagingSection;
