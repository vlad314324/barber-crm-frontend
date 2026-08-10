import { useState } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import { platformAuthApi, PlatformSalon } from '../../api/platformApi';
import { getErrorMessage } from '../../utils/errors';
import { getSalonStatus, daysUntil } from '../../utils/platformSalonStatus';
import Modal from '../Modal';

interface SalonDetailModalProps {
  salon: PlatformSalon;
  onClose: () => void;
  onUpdated: (salon: PlatformSalon) => void;
}

const PRESETS = [
  { days: 30, key: 'presetMonth' },
  { days: 90, key: 'presetQuarter' },
  { days: 180, key: 'presetHalfYear' },
  { days: 365, key: 'presetYear' },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

const SalonDetailModal = ({ salon, onClose, onUpdated }: SalonDetailModalProps) => {
  const { t, lang } = useLocale();

  const [paidAt, setPaidAt] = useState(salon.subscriptionPaidAt ? salon.subscriptionPaidAt.slice(0, 10) : todayStr());
  const [periodDays, setPeriodDays] = useState(salon.subscriptionPeriodDays || 30);
  const [subSaving, setSubSaving] = useState(false);
  const [subError, setSubError] = useState('');

  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  const [showDeactivateForm, setShowDeactivateForm] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  const status = getSalonStatus(salon);
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';

  const handleSaveSubscription = async () => {
    setSubSaving(true);
    setSubError('');
    try {
      const updated = await platformAuthApi.updateSubscription(salon.id, { paidAt, periodDays: Number(periodDays) });
      onUpdated(updated);
    } catch (err) {
      setSubError(getErrorMessage(err) || 'Error');
    } finally {
      setSubSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setCommentSaving(true);
    try {
      const updated = await platformAuthApi.addComment(salon.id, commentText.trim());
      onUpdated(updated);
      setCommentText('');
    } finally {
      setCommentSaving(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    setDeactivateSaving(true);
    try {
      const updated = await platformAuthApi.deactivateSalon(salon.id, deactivateReason.trim() || undefined);
      onUpdated(updated);
      setShowDeactivateForm(false);
      setDeactivateReason('');
    } finally {
      setDeactivateSaving(false);
    }
  };

  const handleReactivate = async () => {
    const updated = await platformAuthApi.reactivateSalon(salon.id);
    onUpdated(updated);
  };

  return (
    <Modal isOpen onClose={onClose} title={t('platformAdmin.modalTitle', { name: salon.name })} size="lg">
      <div className="space-y-6">
        {/* Підписка */}
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">{t('platformAdmin.subscriptionTitle')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('platformAdmin.paidAtLabel')}</label>
              <input type="date" className="field-input py-2.5" value={paidAt} onChange={e => setPaidAt(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{t('platformAdmin.periodLabel')}</label>
              <input type="number" min={1} className="field-input py-2.5" value={periodDays} onChange={e => setPeriodDays(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {PRESETS.map(p => (
              <button
                key={p.days}
                type="button"
                onClick={() => setPeriodDays(p.days)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  periodDays === p.days ? 'bg-brand text-white' : 'bg-canvas-soft text-ink-secondary hover:text-ink'
                }`}
              >
                {t(`platformAdmin.${p.key}`)}
              </button>
            ))}
          </div>

          {salon.subscriptionExpiresAt && (
            <p className="text-sm text-ink-secondary mt-3">
              {t('platformAdmin.expiresOnLabel')}: <span className="font-medium text-ink">{new Date(salon.subscriptionExpiresAt).toLocaleDateString(locale)}</span>
              {status === 'expiringSoon' && <span className="text-amber-600 ml-1">({daysUntil(salon.subscriptionExpiresAt)}d)</span>}
            </p>
          )}
          {!salon.subscriptionExpiresAt && <p className="text-sm text-ink-muted mt-3">{t('platformAdmin.noSubscriptionSet')}</p>}

          {subError && <p className="text-sm text-red-600 mt-2">{subError}</p>}
          <button onClick={handleSaveSubscription} disabled={subSaving} className="btn btn-primary mt-3">
            {subSaving ? t('platformAdmin.saving') : t('platformAdmin.saveBtn')}
          </button>
        </div>

        {/* Коментарі */}
        <div className="pt-5 border-t border-line">
          <h3 className="text-sm font-semibold text-ink mb-3">{t('platformAdmin.commentsTitle')}</h3>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {salon.comments.length === 0 && <p className="text-sm text-ink-muted">{t('platformAdmin.noComments')}</p>}
            {salon.comments.map((c, i) => (
              <div key={i} className="bg-canvas-soft rounded-sm px-3 py-2">
                <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
                  <span className="font-medium text-ink-secondary">{c.authorName}</span>
                  <span>{new Date(c.createdAt).toLocaleString(locale)}</span>
                </div>
                <p className="text-sm text-ink whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              className="field-input flex-1 py-2"
              rows={2}
              placeholder={t('platformAdmin.commentPlaceholder')}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <button onClick={handleAddComment} disabled={commentSaving} className="btn btn-secondary self-end">
              {t('platformAdmin.addCommentBtn')}
            </button>
          </div>
        </div>

        {/* Деактивація */}
        <div className="pt-5 border-t border-line">
          <h3 className="text-sm font-semibold text-ink mb-3">{t('platformAdmin.deactivationTitle')}</h3>
          {salon.isActive ? (
            !showDeactivateForm ? (
              <button onClick={() => setShowDeactivateForm(true)} className="btn btn-danger">
                {t('platformAdmin.deactivateBtn')}
              </button>
            ) : (
              <div className="space-y-2">
                <label className="field-label">{t('platformAdmin.deactivateReasonLabel')}</label>
                <textarea
                  className="field-input py-2"
                  rows={2}
                  placeholder={t('platformAdmin.deactivateReasonPlaceholder')}
                  value={deactivateReason}
                  onChange={e => setDeactivateReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={handleConfirmDeactivate} disabled={deactivateSaving} className="btn btn-danger-solid">
                    {t('platformAdmin.deactivateConfirmBtn')}
                  </button>
                  <button onClick={() => setShowDeactivateForm(false)} className="btn btn-secondary">
                    {t('platformAdmin.cancelBtn')}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 space-y-2">
              <p className="text-sm text-red-600">
                {t('platformAdmin.deactivatedBanner', {
                  date: salon.deactivatedAt ? new Date(salon.deactivatedAt).toLocaleDateString(locale) : '',
                  reason: salon.deactivationReason ? ` — ${salon.deactivationReason}` : '',
                })}
              </p>
              <button onClick={handleReactivate} className="btn btn-secondary">
                {t('platformAdmin.reactivateBtn')}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SalonDetailModal;
