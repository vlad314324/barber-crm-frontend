// Пропозиції майстра змінити свій опис/фото послуги:
// ProposeChangesModal — форма майстра; ReviewRequestsModal — розгляд адміном.
import { useEffect, useState } from 'react';
import { Check, X, ImageOff } from 'lucide-react';
import Modal from '../Modal';
import ImageCropField, { ImageChange } from '../ImageCropField';
import { useLocale } from '../../i18n/LocaleContext';
import { useShopBookingLanguages, useShopDefaultBookingLanguage } from '../../context/SettingsContext';
import { BookingLang, BOOKING_LANG_LABELS } from '../../i18n/bookingTranslations';
import { getErrorMessage } from '../../utils/errors';
import { MasterService, ServiceChangeRequest, serviceRequestApi } from '../../api/serviceRequests';

const useLangs = () => {
  const bookingLanguages = useShopBookingLanguages();
  const defaultLang = useShopDefaultBookingLanguage();
  return { defaultLang, translationLangs: bookingLanguages.filter(l => l !== defaultLang) };
};

// ── Форма майстра ──────────────────────────────────────────────────────

interface ProposeProps {
  service: MasterService | null;
  request?: ServiceChangeRequest;
  onClose: () => void;
  onSaved: () => void;
}

export const ProposeChangesModal = ({ service, request, onClose, onSaved }: ProposeProps) => {
  const { t } = useLocale();
  const { defaultLang, translationLangs } = useLangs();
  const [description, setDescription] = useState('');
  const [translations, setTranslations] = useState<Partial<Record<string, string>>>({});
  const [imageChange, setImageChange] = useState<ImageChange>(null);
  const [saving, setSaving] = useState(false);

  const pending = request?.status === 'pending' ? request : undefined;
  useEffect(() => {
    if (!service) return;
    // Відкрита пропозиція — її текст; інакше — поточний свій опис.
    const src = pending?.hasText
      ? { description: pending.description, descriptionTranslations: pending.descriptionTranslations || {} }
      : service.own || { description: '', descriptionTranslations: {} };
    setDescription(src.description || '');
    setTranslations({ ...(src.descriptionTranslations || {}) });
    setImageChange(null);
  }, [service, pending]);

  if (!service) return null;
  const ownPhoto = pending?.imageUrl || (pending?.removeImage ? '' : service.own?.imageUrl) || '';

  const save = async () => {
    setSaving(true);
    try {
      await serviceRequestApi.submit(service._id, {
        description, descriptionTranslations: translations, removeImage: imageChange === 'remove' || undefined,
      });
      if (imageChange && imageChange !== 'remove') await serviceRequestApi.uploadImage(service._id, imageChange.blob);
      onSaved();
    } catch (err) {
      alert(getErrorMessage(err) || t('serviceRequests.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const cancelRequest = async () => {
    if (!confirm(t('serviceRequests.cancelConfirm'))) return;
    try {
      await serviceRequestApi.cancel(service._id);
      onSaved();
    } catch (err) {
      alert(getErrorMessage(err) || t('serviceRequests.saveError'));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('serviceRequests.proposeTitle', { name: service.name })}
      subtitle={t('serviceRequests.proposeSubtitle')}
      size="lg"
      footer={<>
        {pending && (
          <button onClick={cancelRequest} className="mr-auto text-sm text-red-500 hover:text-red-700">{t('serviceRequests.cancelRequest')}</button>
        )}
        <button onClick={onClose} className="btn btn-secondary">{t('common.cancel')}</button>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? t('common.saving') : t('serviceRequests.send')}
        </button>
      </>}
    >
      <div className="space-y-4">
        {pending && <p className="text-sm bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-sm px-3 py-2">{t('serviceRequests.pendingNote')}</p>}
        <ImageCropField
          label={t('serviceRequests.photo')}
          hint={t('serviceRequests.photoHint')}
          existingUrl={ownPhoto || undefined}
          value={imageChange}
          onChange={setImageChange}
          aspect={1}
          maxOutputWidth={1000}
          previewClassName="w-24 h-24"
        />
        <div className="space-y-2">
          <label className="field-label">{t('serviceRequests.description')} · {BOOKING_LANG_LABELS[defaultLang as BookingLang] || defaultLang}</label>
          <textarea rows={3} className="field-input" value={description} onChange={e => setDescription(e.target.value)}
            placeholder={service.description || t('serviceRequests.descriptionPlaceholder')} />
          {translationLangs.map(l => (
            <textarea key={l} rows={3} className="field-input" value={translations[l] || ''}
              onChange={e => setTranslations(p => ({ ...p, [l]: e.target.value }))}
              placeholder={`${BOOKING_LANG_LABELS[l as BookingLang] || l} — ${t('serviceRequests.descriptionPlaceholder')}`} />
          ))}
          <p className="text-xs text-ink-muted">{t('serviceRequests.descriptionHint')}</p>
        </div>
      </div>
    </Modal>
  );
};

// ── Розгляд адміном ────────────────────────────────────────────────────

interface ReviewProps {
  isOpen: boolean;
  requests: ServiceChangeRequest[];
  onClose: () => void;
  onChanged: () => void;
}

const Text = ({ value, muted }: { value: string; muted?: boolean }) => (
  <p className={`text-sm whitespace-pre-line ${muted ? 'text-ink-muted' : 'text-ink'}`}>{value || '—'}</p>
);

export const ReviewRequestsModal = ({ isOpen, requests, onClose, onChanged }: ReviewProps) => {
  const { t } = useLocale();
  const { defaultLang, translationLangs } = useLangs();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      setRejecting(null);
      setReason('');
      onChanged();
    } catch (err) {
      alert(getErrorMessage(err) || t('serviceRequests.saveError'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('serviceRequests.reviewTitle')} size="xl"
      footer={<button onClick={onClose} className="btn btn-secondary">{t('common.close')}</button>}>
      {requests.length === 0 ? (
        <p className="text-sm text-ink-muted py-4 text-center">{t('serviceRequests.noRequests')}</p>
      ) : (
        <div className="space-y-4">
          {requests.map(r => {
            const svc = typeof r.service === 'object' ? r.service : null;
            const master = typeof r.employee === 'object' ? r.employee.name : '';
            const current = r.current || { description: '', descriptionTranslations: {}, imageUrl: '' };
            const currentPhoto = current.imageUrl || svc?.imageUrl || '';
            const langs = [defaultLang, ...translationLangs];
            const proposed = (l: string) => (l === defaultLang ? r.description : r.descriptionTranslations?.[l] || '');
            const now = (l: string) => (l === defaultLang
              ? current.description || svc?.description || ''
              : current.descriptionTranslations?.[l] || (current.description ? '' : svc?.translations?.[l as BookingLang]?.description || ''));
            return (
              <div key={r._id} className="border border-line rounded-md p-4 space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="font-semibold text-ink">{svc?.name}</p>
                  <p className="text-sm text-ink-secondary">· {master}</p>
                  <p className="text-xs text-ink-muted ml-auto">{new Date(r.updatedAt).toLocaleString()}</p>
                </div>

                {(r.imageUrl || r.removeImage) && (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[11px] text-ink-muted mb-1">{t('serviceRequests.now')}</p>
                      {currentPhoto ? <img src={currentPhoto} alt="" className="w-20 h-20 rounded-sm object-cover" />
                        : <div className="w-20 h-20 rounded-sm bg-canvas-soft" />}
                    </div>
                    <span className="text-ink-muted">→</span>
                    <div className="text-center">
                      <p className="text-[11px] text-ink-muted mb-1">{t('serviceRequests.proposed')}</p>
                      {r.imageUrl ? <img src={r.imageUrl} alt="" className="w-20 h-20 rounded-sm object-cover ring-2 ring-brand" />
                        : <div className="w-20 h-20 rounded-sm bg-canvas-soft flex flex-col items-center justify-center text-[11px] text-ink-muted gap-1"><ImageOff size={18} />{t('serviceRequests.removePhoto')}</div>}
                    </div>
                  </div>
                )}

                {r.hasText && (
                  <div className="space-y-2">
                    {langs.map(l => (
                      <div key={l} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-[11px] text-ink-muted">{t('serviceRequests.now')} · {BOOKING_LANG_LABELS[l as BookingLang] || l}</p>
                          <Text value={now(l)} muted />
                        </div>
                        <div>
                          <p className="text-[11px] text-ink-muted">{t('serviceRequests.proposed')} · {BOOKING_LANG_LABELS[l as BookingLang] || l}</p>
                          <Text value={proposed(l) || (l === defaultLang ? t('serviceRequests.backToGeneral') : '')} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {rejecting === r._id ? (
                  <div className="space-y-2">
                    <textarea rows={2} className="field-input" autoFocus placeholder={t('serviceRequests.reasonPlaceholder')}
                      value={reason} onChange={e => setReason(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-secondary" onClick={() => { setRejecting(null); setReason(''); }}>{t('common.cancel')}</button>
                      <button className="btn btn-danger" disabled={busy === r._id}
                        onClick={() => act(r._id, () => serviceRequestApi.reject(r._id, reason))}>
                        <X size={16} /> {t('serviceRequests.reject')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-secondary" disabled={busy === r._id} onClick={() => setRejecting(r._id)}>
                      <X size={16} /> {t('serviceRequests.reject')}
                    </button>
                    <button className="btn btn-primary" disabled={busy === r._id}
                      onClick={() => act(r._id, () => serviceRequestApi.approve(r._id))}>
                      <Check size={16} /> {t('serviceRequests.approve')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
