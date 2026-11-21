import { useCallback, useEffect, useState } from 'react';
import { Tag, Mail, Send, X } from 'lucide-react';
import Modal from '../Modal';
import { clientApi } from '../../api';
import type { DiscountOffer, DiscountOffersInfo } from '../../api/types';
import { useLocale } from '../../i18n/LocaleContext';
import { getErrorMessage } from '../../utils/errors';

interface Props {
  clientId: string;
  clientName: string;
}

const addDaysYmd = (ymd: string, n: number) =>
  new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// Персональні знижки в картці клієнта (лише адмін): кнопка «Запропонувати
// знижку» → форма (відсоток, термін, текст, канали) → повідомлення клієнту
// з одноразовим посиланням на онлайн-запис; нижче — історія з можливістю
// скасувати ще не використану знижку.
const DiscountOffers = ({ clientId, clientName }: Props) => {
  const { t, lang } = useLocale();
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
  const fmt = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' });

  const [info, setInfo] = useState<DiscountOffersInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    clientApi.discountOffers(clientId).then(setInfo).catch(() => setInfo(null));
  }, [clientId]);
  useEffect(load, [load]);

  const cancel = async (offer: DiscountOffer) => {
    if (!window.confirm(t('discountOffer.cancelConfirm'))) return;
    try {
      await clientApi.cancelDiscountOffer(clientId, offer._id);
    } catch (err) {
      window.alert(getErrorMessage(err) || t('discountOffer.error'));
    }
    load();
  };

  const stateBadge = (o: DiscountOffer) => {
    const cls: Record<DiscountOffer['state'], string> = {
      active: 'bg-brand-extra-soft text-brand-dark',
      used: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      expired: 'bg-canvas-soft text-ink-muted',
      cancelled: 'bg-canvas-soft text-ink-muted line-through',
      failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls[o.state]}`}>
        {t(`discountOffer.state.${o.state}`, { date: fmt(o.validUntil) })}
      </span>
    );
  };

  return (
    <div className="ds-card overflow-hidden">
      <div className="ds-card-header">
        <div className="flex items-center">
          <Tag size={18} className="mr-2 text-brand" />
          <h3 className="text-base font-semibold text-ink">{t('discountOffer.title')}</h3>
        </div>
        <button type="button" onClick={() => { setNotice(null); setOpen(true); }} disabled={!info} className="btn btn-primary btn-sm">
          <Tag size={14} /> {t('discountOffer.button')}
        </button>
      </div>
      <div className="px-6 py-4 space-y-3">
        {notice && <p className="text-sm text-brand-dark font-medium">{notice}</p>}
        {info && info.offers.length === 0 && <p className="text-sm text-ink-muted">{t('discountOffer.empty')}</p>}
        {info?.offers.map((o) => (
          <div key={o._id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line last:border-0 pb-3 last:pb-0">
            <span className="text-lg font-extrabold text-brand-dark w-16">−{o.discountPercent}%</span>
            {stateBadge(o)}
            <span className="text-xs text-ink-muted">
              {t('discountOffer.sentOn', { date: new Date(o.sentAt || o.createdAt).toLocaleDateString(locale) })}
              {o.createdBy ? ` · ${t('discountOffer.by', { name: o.createdBy })}` : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-muted">
              {o.channels.email && <Mail size={13} aria-label="Email" />}
              {o.channels.telegram && <Send size={13} aria-label="Telegram" />}
            </span>
            {o.state === 'active' && (
              <button type="button" onClick={() => cancel(o)} className="ml-auto text-xs text-red-600 hover:underline inline-flex items-center gap-1">
                <X size={12} /> {t('discountOffer.cancel')}
              </button>
            )}
            {o.message && <p className="basis-full text-xs text-ink-secondary italic">{o.message}</p>}
          </div>
        ))}
      </div>

      {open && info && (
        <DiscountOfferModal
          clientId={clientId}
          clientName={clientName}
          info={info}
          fmt={fmt}
          onClose={() => setOpen(false)}
          onFailed={load}
          onSent={(ok) => { setOpen(false); setNotice(ok ? t('discountOffer.sentOk') : null); load(); }}
        />
      )}
    </div>
  );
};

interface ModalProps {
  clientId: string;
  clientName: string;
  info: DiscountOffersInfo;
  fmt: (ymd: string) => string;
  onClose: () => void;
  onSent: (ok: boolean) => void;
  // Невдала спроба теж лишається в історії («не доставлено»).
  onFailed: () => void;
}

const DiscountOfferModal = ({ clientId, clientName, info, fmt, onClose, onSent, onFailed }: ModalProps) => {
  const { t } = useLocale();
  const [discountPercent, setDiscountPercent] = useState(info.defaults.discountPercent);
  const [validDays, setValidDays] = useState(info.defaults.validDays);
  const [message, setMessage] = useState(info.defaults.message);
  const [email, setEmail] = useState(info.hasEmail);
  const [telegram, setTelegram] = useState(info.telegramLinked);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const until = fmt(addDaysYmd(todayYmd, Math.max(1, validDays || 1) - 1));
  const firstName = clientName.split(/\s+/)[0];
  const noChannels = !info.hasEmail && !info.telegramLinked;
  const valid = Number.isInteger(discountPercent) && discountPercent >= 1 && discountPercent <= 90
    && Number.isInteger(validDays) && validDays >= 1 && validDays <= 90 && (email || telegram);

  const send = async () => {
    setSaving(true);
    setError(null);
    try {
      const channels = [...(email ? ['email' as const] : []), ...(telegram ? ['telegram' as const] : [])];
      const offer = await clientApi.sendDiscountOffer(clientId, { discountPercent, validDays, message, channels });
      if (offer.state === 'failed') {
        setError(t('discountOffer.sendFailed'));
        onFailed();
        return;
      }
      onSent(true);
    } catch (err) {
      setError(getErrorMessage(err) || t('discountOffer.error'));
    } finally {
      setSaving(false);
    }
  };

  const channelBox = (checked: boolean, available: boolean, onChange: (v: boolean) => void, icon: React.ReactNode, label: string, hint: string) => (
    <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${available ? 'border-line cursor-pointer' : 'border-line opacity-50 cursor-not-allowed'}`}>
      <input type="checkbox" checked={checked && available} disabled={!available} onChange={(e) => onChange(e.target.checked)} />
      {icon} {label}
      {!available && <span className="text-xs text-ink-muted">({hint})</span>}
    </label>
  );

  return (
    <Modal isOpen onClose={onClose} title={t('discountOffer.modalTitle', { name: clientName })} size="md">
      <div className="space-y-4">
        <p className="text-sm text-ink-secondary">{t('discountOffer.intro')}</p>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="field-label">{t('discountOffer.discount')}</span>
            <input type="number" min={1} max={90} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="field-input" />
          </label>
          <label className="block">
            <span className="field-label">{t('discountOffer.validDays')}</span>
            <input type="number" min={1} max={90} value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} className="field-input" />
          </label>
        </div>

        <label className="block">
          <span className="field-label">{t('discountOffer.message')} <span className="font-normal text-ink-muted">({t('clients.optional')})</span></span>
          <textarea rows={2} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} className="field-input" placeholder={t('discountOffer.messagePlaceholder')} />
        </label>

        <div className="rounded-md border-2 border-dashed border-brand/40 bg-brand-extra-soft/50 p-4 text-center">
          <p className="text-sm font-semibold text-ink">{t('discountOffer.previewTitle', { name: firstName })}</p>
          <p className="text-3xl font-extrabold text-brand-dark my-1">−{discountPercent || 0}%</p>
          <p className="text-xs text-ink-secondary">{t('discountOffer.previewUntil', { date: until })}</p>
          {message.trim() && <p className="text-xs text-ink-secondary italic mt-2">{message.trim()}</p>}
        </div>

        <div>
          <span className="field-label">{t('discountOffer.channels')}</span>
          <div className="flex flex-wrap gap-2">
            {channelBox(email, info.hasEmail, setEmail, <Mail size={14} />, 'Email', t('discountOffer.noEmail'))}
            {channelBox(telegram, info.telegramLinked, setTelegram, <Send size={14} />, 'Telegram', t('discountOffer.noTelegram'))}
          </div>
          {noChannels && <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">{t('discountOffer.noChannels')}</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">{t('common.close')}</button>
          <button type="button" onClick={send} disabled={saving || !valid} className="btn btn-primary">
            {saving ? t('discountOffer.sending') : t('discountOffer.send')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscountOffers;
