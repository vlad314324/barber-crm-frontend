import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Clock, Lock, Save, Check, Link2, Palette } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { ShopSettings, WorkingDay } from '../api/types';
import { getErrorMessage } from '../utils/errors';
import BookingLinkCard from '../components/BookingLinkCard';
import { BOOKING_LANGS, BookingLang } from '../i18n/bookingTranslations';
import { CURRENCIES } from '../constants/currencies';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type Tab = 'general' | 'booking' | 'security';

const Settings = () => {
  const { user, salonSlug } = useAuth();
  const { t } = useLocale();
  const DAYS = DAY_KEYS.map(key => ({ key, label: t(`settings.days.${key}`) }));

  const [activeTab, setActiveTab] = useState<Tab>('general');

  const [settings, setSettings] = useState<ShopSettings>({
    shopName: '', address: '', phone: '', email: '',
    coverImageUrl: '', logoUrl: '', tagline: '', accentColor: '',
    latitude: null, longitude: null, websiteUrl: '',
    workingHours: {},
    bookingLanguages: ['uk', 'en'], defaultBookingLanguage: 'uk',
    currency: 'UAH',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [savedInfo, setSavedInfo]   = useState(false);
  const [savedPass, setSavedPass]   = useState(false);
  const [errorPass, setErrorPass]   = useState('');

  useEffect(() => {
    api.get('/settings').then(r => {
      const data = r.data;
      setSettings({
        ...data,
        workingHours: data.workingHours || {},
        bookingLanguages: data.bookingLanguages?.length ? data.bookingLanguages : ['uk', 'en'],
        defaultBookingLanguage: data.defaultBookingLanguage || 'uk',
        currency: data.currency || 'UAH',
      });
      setLoading(false);
    });
  }, []);

  const handleInfoSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setSavedInfo(true);
      setTimeout(() => setSavedInfo(false), 3000);
    } catch {
      alert(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setErrorPass('');
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setErrorPass(t('settings.fillAll')); return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorPass(t('settings.passwordsMismatch')); return;
    }
    if (passwords.newPassword.length < 6) {
      setErrorPass(t('settings.passwordTooShort')); return;
    }
    setSavingPass(true);
    try {
      await api.put('/settings/change-password', {
        userId: user?.id,
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setSavedPass(true);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSavedPass(false), 3000);
    } catch (err) {
      setErrorPass(getErrorMessage(err) || t('settings.changePasswordError'));
    } finally {
      setSavingPass(false);
    }
  };

  const toggleBookingLanguage = (l: BookingLang) => {
    setSettings(prev => {
      const current = prev.bookingLanguages?.length ? prev.bookingLanguages : ['uk', 'en'];
      const isEnabled = current.includes(l);
      if (isEnabled && current.length === 1) return prev; // at least one language must stay enabled
      const next = isEnabled ? current.filter(x => x !== l) : [...current, l];
      const defaultLang = next.includes(prev.defaultBookingLanguage || 'uk') ? prev.defaultBookingLanguage : next[0];
      return { ...prev, bookingLanguages: next, defaultBookingLanguage: defaultLang };
    });
  };

  const updateWorkingHour = (day: string, field: keyof WorkingDay, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], [field]: value },
      },
    }));
  };

  if (loading) return <div className="text-center py-12 text-ink-muted">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
        <SettingsIcon size={24} className="text-brand" />
        {t('settings.title')}
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-canvas-soft p-1 rounded-sm w-fit">
        {([
          ['general', t('settings.tabGeneral')],
          ['booking', t('settings.tabBookingPage')],
          ['security', t('settings.tabSecurity')],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xs text-sm font-medium transition-all
              ${activeTab === tab ? 'bg-surface text-brand-dark shadow-sm' : 'text-ink-secondary hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Заклад: загальна інформація + години роботи */}
      {activeTab === 'general' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Загальна інформація */}
          <div className="ds-card overflow-hidden h-fit">
            <div className="ds-card-header">
              <div>
                <h2 className="text-base font-semibold text-ink">{t('settings.generalInfo')}</h2>
                <p className="text-sm text-ink-muted mt-0.5">{t('settings.generalInfoDesc')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: t('settings.fieldShopName'), key: 'shopName' as const,  type: 'text',  placeholder: 'BarberShop' },
                { label: t('settings.fieldAddress'),        key: 'address' as const,   type: 'text',  placeholder: t('settings.addressPlaceholder') },
                { label: t('settings.fieldPhone'),       key: 'phone' as const,     type: 'tel',   placeholder: '+380671234567' },
                { label: t('settings.fieldEmail'),         key: 'email' as const,     type: 'email', placeholder: 'shop@gmail.com' },
                { label: t('settings.fieldWebsite'),         key: 'websiteUrl' as const,     type: 'text', placeholder: 'https://instagram.com/yourshop' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input
                    type={type}
                    value={settings[key] || ''}
                    onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="field-input"
                  />
                </div>
              ))}
              <div>
                <label className="field-label">{t('settings.fieldCurrency')}</label>
                <select
                  value={settings.currency || 'UAH'}
                  onChange={e => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                  className="field-input"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">{t('settings.fieldCoordinates')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number" step="0.000001"
                    value={settings.latitude ?? ''}
                    onChange={e => setSettings(prev => ({ ...prev, latitude: e.target.value === '' ? null : Number(e.target.value) }))}
                    placeholder={t('settings.fieldLatitude')}
                    className="field-input"
                  />
                  <input
                    type="number" step="0.000001"
                    value={settings.longitude ?? ''}
                    onChange={e => setSettings(prev => ({ ...prev, longitude: e.target.value === '' ? null : Number(e.target.value) }))}
                    placeholder={t('settings.fieldLongitude')}
                    className="field-input"
                  />
                </div>
                <p className="text-xs text-ink-muted mt-1.5">{t('settings.coordinatesHint')}</p>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={handleInfoSave} disabled={saving} className="btn btn-primary">
                  {savedInfo ? <><Check size={16}/> {t('settings.saved')}</> : <><Save size={16}/> {t('common.save')}</>}
                </button>
              </div>
            </div>
          </div>

          {/* Години роботи */}
          <div className="ds-card overflow-hidden h-fit">
            <div className="ds-card-header">
              <div>
                <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                  <Clock size={18} className="text-brand" /> {t('settings.workingHours')}
                </h2>
                <p className="text-sm text-ink-muted mt-0.5">{t('settings.workingHoursDesc')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {DAYS.map(({ key, label }) => {
                const day = settings.workingHours[key] || { isOpen: true, from: '09:00', to: '19:00' };
                return (
                  <div key={key} className="flex flex-wrap items-center gap-3">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={e => updateWorkingHour(key, 'isOpen', e.target.checked)}
                      className="w-4 h-4 text-brand rounded flex-shrink-0 focus:ring-brand"
                    />
                    <span className={`text-sm font-medium w-24 flex-shrink-0 ${day.isOpen ? 'text-ink-secondary' : 'text-ink-muted'}`}>
                      {label}
                    </span>
                    {day.isOpen ? (
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <input
                          type="time"
                          value={day.from}
                          onChange={e => updateWorkingHour(key, 'from', e.target.value)}
                          className="field-input flex-1 py-1.5"
                        />
                        <span className="text-ink-muted text-sm">—</span>
                        <input
                          type="time"
                          value={day.to}
                          onChange={e => updateWorkingHour(key, 'to', e.target.value)}
                          className="field-input flex-1 py-1.5"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-ink-muted italic">{t('settings.dayOff')}</span>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-end pt-4 border-t border-line">
                <button onClick={handleInfoSave} disabled={saving} className="btn btn-primary">
                  {savedInfo ? <><Check size={16}/> {t('settings.saved')}</> : <><Save size={16}/> {t('common.save')}</>}
                </button>
              </div>
            </div>
          </div>

      </div>
      )}

      {/* Сторінка бронювання: посилання/QR + оформлення */}
      {activeTab === 'booking' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Посилання для запису */}
          {salonSlug && (
            <div className="ds-card overflow-hidden h-fit">
              <div className="ds-card-header">
                <div>
                  <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                    <Link2 size={18} className="text-brand" /> {t('settings.bookingLink.title')}
                  </h2>
                  <p className="text-sm text-ink-muted mt-0.5">{t('settings.bookingLink.desc')}</p>
                </div>
              </div>
              <div className="px-6 py-5">
                <BookingLinkCard slug={salonSlug} />
              </div>
            </div>
          )}

          {/* Оформлення сторінки бронювання */}
          <div className="ds-card overflow-hidden h-fit">
            <div className="ds-card-header">
              <div>
                <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                  <Palette size={18} className="text-brand" /> {t('settings.branding.title')}
                </h2>
                <p className="text-sm text-ink-muted mt-0.5">{t('settings.branding.desc')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: t('settings.branding.coverImageUrl'), key: 'coverImageUrl' as const, placeholder: 'https://.../cover.jpg' },
                { label: t('settings.branding.logoUrl'),        key: 'logoUrl' as const,        placeholder: 'https://.../logo.png' },
                { label: t('settings.branding.tagline'),        key: 'tagline' as const,         placeholder: t('settings.branding.taglinePlaceholder') },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input
                    type="text"
                    value={settings[key] || ''}
                    onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="field-input"
                  />
                </div>
              ))}
              <div>
                <label className="field-label">{t('settings.branding.accentColor')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.accentColor || '#c08a34'}
                    onChange={e => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="h-9 w-14 rounded-xs border border-line cursor-pointer bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, accentColor: '' }))}
                    className="text-xs text-ink-muted hover:text-ink"
                  >
                    {t('settings.branding.resetColor')}
                  </button>
                </div>
              </div>
              <div>
                <label className="field-label">{t('settings.branding.languagesTitle')}</label>
                <p className="text-xs text-ink-muted mb-2">{t('settings.branding.languagesDesc')}</p>
                <div className="space-y-2">
                  {BOOKING_LANGS.map(l => {
                    const enabled = (settings.bookingLanguages?.length ? settings.bookingLanguages : ['uk', 'en']).includes(l);
                    const isDefault = (settings.defaultBookingLanguage || 'uk') === l;
                    return (
                      <div key={l} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`lang-${l}`}
                          checked={enabled}
                          onChange={() => toggleBookingLanguage(l)}
                          className="w-4 h-4 text-brand rounded flex-shrink-0 focus:ring-brand"
                        />
                        <label htmlFor={`lang-${l}`} className="text-sm text-ink-secondary flex-1">
                          {t(`settings.branding.language${l[0].toUpperCase()}${l.slice(1)}`)}
                        </label>
                        <label className={`flex items-center gap-1.5 text-xs ${enabled ? 'text-ink-muted' : 'text-line-medium'}`}>
                          <input
                            type="radio"
                            name="defaultBookingLanguage"
                            disabled={!enabled}
                            checked={isDefault}
                            onChange={() => setSettings(prev => ({ ...prev, defaultBookingLanguage: l }))}
                            className="w-3.5 h-3.5 text-brand focus:ring-brand"
                          />
                          {t('settings.branding.defaultLanguageLabel')}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-ink-muted mt-1.5">{t('settings.branding.languagesMinHint')}</p>
              </div>
              {salonSlug && (
                <a href={`${window.location.origin}/book/${salonSlug}`} target="_blank" rel="noreferrer"
                  className="text-xs text-brand hover:text-brand-dark font-medium w-fit block">
                  {t('settings.branding.previewLink')}
                </a>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={handleInfoSave} disabled={saving} className="btn btn-primary">
                  {savedInfo ? <><Check size={16}/> {t('settings.saved')}</> : <><Save size={16}/> {t('common.save')}</>}
                </button>
              </div>
            </div>
          </div>

      </div>
      )}

      {/* Безпека: зміна пароля */}
      {activeTab === 'security' && (
      <div className="max-w-xl">
          <div className="ds-card overflow-hidden">
            <div className="ds-card-header">
              <div>
                <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                  <Lock size={18} className="text-brand" /> {t('settings.changePassword')}
                </h2>
                <p className="text-sm text-ink-muted mt-0.5">{t('settings.changePasswordDesc')}</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: t('settings.fieldCurrentPassword'),          key: 'currentPassword' as const },
                { label: t('settings.fieldNewPassword'),              key: 'newPassword' as const },
                { label: t('settings.fieldConfirmPassword'),  key: 'confirmPassword' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="field-label">{label}</label>
                  <input
                    type="password"
                    value={passwords[key]}
                    onChange={e => setPasswords(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="field-input"
                  />
                </div>
              ))}
              {errorPass && (
                <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                  <p className="text-sm text-red-600">{errorPass}</p>
                </div>
              )}
              {savedPass && (
                <div className="bg-brand-soft border border-brand/20 rounded-sm px-4 py-3">
                  <p className="text-sm text-brand-dark">{t('settings.passwordChanged')}</p>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={handlePasswordSave} disabled={savingPass} className="btn btn-primary">
                  {savedPass ? <><Check size={16}/> {t('settings.changed')}</> : <><Lock size={16}/> {t('settings.changePasswordBtn')}</>}
                </button>
              </div>
            </div>
          </div>

      </div>
      )}
    </div>
  );
};

export default Settings;