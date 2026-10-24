import { useEffect, useState } from 'react';
import { Gift, Mail, Send, Check, Minus } from 'lucide-react';
import Modal from '../Modal';
import { clientApi } from '../../api';
import type { UpcomingBirthday } from '../../api/types';
import { useLocale } from '../../i18n/LocaleContext';
import { getErrorMessage } from '../../utils/errors';

interface Props {
  birthday: UpcomingBirthday;
  onClose: () => void;
  onSaved: () => void;
  // Форма на місці списку (є кнопка "До списку") — без окремої кнопки закриття.
  inline?: boolean;
}

// Форма "Привітати зі знижкою": адмін задає знижку, термін дії й час, а
// система сама надсилає привітання на email і в Telegram рівно в день
// народження о цьому часі (за таймзоною салону). Окремо від модалки — щоб
// усередині іншої модалки (Клієнти → Дні народження) показувати її на місці
// списку, а не модалкою в модалці (спільні Escape і фокус-трап).
export const BirthdayGreetingForm = ({ birthday, onClose, onSaved, inline = false }: Props) => {
  const { t, lang } = useLocale();
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
  const existing = birthday.greeting?.status === 'scheduled' || birthday.greeting?.status === 'failed' ? birthday.greeting : null;

  const [discountPercent, setDiscountPercent] = useState(existing?.discountPercent ?? 15);
  const [validDays, setValidDays] = useState(existing?.validDays ?? 14);
  const [sendTime, setSendTime] = useState(existing?.sendTime ?? '10:00');
  const [message, setMessage] = useState(existing?.message ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Без запланованого привітання — останні використані значення.
  useEffect(() => {
    if (existing) return;
    clientApi.birthdayGreetingDefaults().then((d) => {
      setDiscountPercent(d.discountPercent);
      setValidDays(d.validDays);
      setSendTime(d.sendTime);
      setMessage(d.message);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [y, m, d] = birthday.date.split('-').map(Number);
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  const until = new Date(y, m - 1, d + Math.max(1, validDays) - 1).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
  // Сьогодні й час уже настав (за часом браузера; сервер рахує за таймзоною салону).
  const [hh, mm] = sendTime.split(':').map(Number);
  const sendsNow = birthday.daysUntil === 0 && new Date().getHours() * 60 + new Date().getMinutes() >= hh * 60 + mm;
  const firstName = birthday.name.split(/\s+/)[0];
  const valid = discountPercent >= 1 && discountPercent <= 90 && validDays >= 1 && validDays <= 90 && /^\d{2}:\d{2}$/.test(sendTime);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await clientApi.scheduleBirthdayGreeting(birthday._id, { discountPercent, validDays, sendTime, message });
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err) || t('birthdays.greet.error'));
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    setSaving(true);
    try {
      await clientApi.cancelBirthdayGreeting(birthday._id);
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err) || t('birthdays.greet.error'));
    } finally {
      setSaving(false);
    }
  };

  const channel = (ok: boolean, icon: React.ReactNode, label: string) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ok ? 'bg-brand-extra-soft text-brand-dark' : 'bg-canvas-soft text-ink-muted'}`}>
      {icon} {label} {ok ? <Check size={12} /> : <Minus size={12} />}
    </span>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-secondary">{t('birthdays.greet.intro', { date: dateLabel })}</p>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="field-label">{t('birthdays.greet.discount')}</span>
          <input type="number" min={1} max={90} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">{t('birthdays.greet.validDays')}</span>
          <input type="number" min={1} max={90} value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">{t('birthdays.greet.sendTime')}</span>
          <input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} className="field-input" />
        </label>
      </div>

      <label className="block">
        <span className="field-label">{t('birthdays.greet.message')} <span className="font-normal text-ink-muted">({t('clients.optional')})</span></span>
        <textarea rows={2} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} className="field-input" placeholder={t('birthdays.greet.messagePlaceholder')} />
      </label>

      {/* Прев'ю */}
      <div className="rounded-md border-2 border-dashed border-brand/40 bg-brand-extra-soft/50 p-4 text-center">
        <p className="text-sm font-semibold text-ink">{t('birthdays.greet.previewTitle', { name: firstName })}</p>
        <p className="text-3xl font-extrabold text-brand-dark my-1">−{discountPercent || 0}%</p>
        <p className="text-xs text-ink-secondary">{t('birthdays.greet.previewUntil', { date: until })}</p>
        {message.trim() && <p className="text-xs text-ink-secondary italic mt-2">{message.trim()}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-muted">{t('birthdays.greet.channels')}</span>
        {channel(birthday.hasEmail, <Mail size={12} />, 'Email')}
        {channel(birthday.telegramLinked, <Send size={12} />, 'Telegram')}
      </div>

      <p className="text-sm font-medium text-ink flex items-center gap-2">
        <Gift size={16} className="text-brand" />
        {sendsNow ? t('birthdays.greet.sendsNow') : t('birthdays.greet.sendsAt', { date: dateLabel, time: sendTime })}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {birthday.greeting?.status === 'scheduled' && (
          <button type="button" onClick={cancel} disabled={saving} className="btn btn-secondary text-red-600 mr-auto">
            {t('birthdays.greet.cancelSend')}
          </button>
        )}
        {!inline && <button type="button" onClick={onClose} className="btn btn-secondary">{t('common.close')}</button>}
        <button type="button" onClick={save} disabled={saving || !valid} className="btn btn-primary">
          {sendsNow ? t('birthdays.greet.sendNow') : existing ? t('birthdays.greet.saveChanges') : t('birthdays.greet.schedule')}
        </button>
      </div>
    </div>
  );
};

const BirthdayGreetingModal = (props: Props) => {
  const { t } = useLocale();
  return (
    <Modal isOpen onClose={props.onClose} title={t('birthdays.greet.title', { name: props.birthday.name })} size="md">
      <BirthdayGreetingForm {...props} />
    </Modal>
  );
};

export default BirthdayGreetingModal;
